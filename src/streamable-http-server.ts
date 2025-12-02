#!/usr/bin/env node

/**
 * Sveriges Radio MCP Server
 * Modern HTTP transport with session management (for remote deployment)
 *
 * Supports:
 * - StreamableHTTPServerTransport (2025-03-26 spec) for modern clients
 * - SSEServerTransport (2024-11-05 spec) for legacy clients
 * - Session management for stateful conversations
 * - Bearer token authentication
 */

import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import http from 'http';
import { randomUUID } from 'crypto';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { marked } from 'marked';
import { allTools } from './tools/index.js';
import { allResources, resourceContents } from './resources/index.js';
import { allPrompts, promptMessages } from './prompts/index.js';
import { asJsonContent, formatErrorPayload, parseArgs } from './lib/tool-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// ===========================================
// CONFIGURATION
// ===========================================
const PORT = process.env.PORT || 3000;
const AUTH_TOKEN = process.env.MCP_AUTH_TOKEN; // Optional token authentication
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS) || 1800000; // 30 minutes default
const RATE_LIMIT_REQUESTS = Number(process.env.RATE_LIMIT_REQUESTS) || 60; // 60 requests per minute
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute window
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || '*'; // CORS origins
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// ===========================================
// LOGGING UTILITIES
// ===========================================
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
const LOG_LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

function log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
  if (LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL as LogLevel]) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data,
    };
    console.error(JSON.stringify(logEntry));
  }
}

// ===========================================
// SESSION MANAGEMENT
// ===========================================
interface SessionInfo {
  transport: StreamableHTTPServerTransport;
  lastActivity: number;
  requestCount: number;
}

// Session management for modern StreamableHTTP transport
const sessions: Record<string, SessionInfo> = {};
const pendingTransports: Record<string, StreamableHTTPServerTransport> = {};

// Legacy SSE transport sessions
const sseTransports: Record<string, SSEServerTransport> = {};

// Backwards compatibility aliases
const transports: Record<string, StreamableHTTPServerTransport> = {};

// ===========================================
// RATE LIMITING
// ===========================================
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimits: Record<string, RateLimitEntry> = {};

function getClientIP(req: http.IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ips.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

function isRateLimited(clientIP: string): boolean {
  const now = Date.now();
  const entry = rateLimits[clientIP];

  if (!entry || now > entry.resetTime) {
    rateLimits[clientIP] = { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_REQUESTS) {
    log('warn', 'Rate limit exceeded', { clientIP, count: entry.count });
    return true;
  }

  return false;
}

function getRateLimitHeaders(clientIP: string): Record<string, string> {
  const entry = rateLimits[clientIP];
  const remaining = entry ? Math.max(0, RATE_LIMIT_REQUESTS - entry.count) : RATE_LIMIT_REQUESTS;
  const reset = entry ? Math.ceil((entry.resetTime - Date.now()) / 1000) : RATE_LIMIT_WINDOW_MS / 1000;

  return {
    'X-RateLimit-Limit': String(RATE_LIMIT_REQUESTS),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(reset),
  };
}

// ===========================================
// SESSION TTL CLEANUP
// ===========================================
function cleanupExpiredSessions(): void {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [sessionId, info] of Object.entries(sessions)) {
    if (now - info.lastActivity > SESSION_TTL_MS) {
      log('info', 'Cleaning up expired session', { sessionId, inactiveMs: now - info.lastActivity });
      try {
        info.transport.close();
      } catch (error) {
        log('error', 'Error closing expired session', { sessionId, error: String(error) });
      }
      delete sessions[sessionId];
      delete transports[sessionId];
      cleanedCount++;
    }
  }

  // Also clean up old rate limit entries
  for (const [ip, entry] of Object.entries(rateLimits)) {
    if (now > entry.resetTime + RATE_LIMIT_WINDOW_MS) {
      delete rateLimits[ip];
    }
  }

  if (cleanedCount > 0) {
    log('info', 'Session cleanup completed', { cleanedSessions: cleanedCount, activeSessions: Object.keys(sessions).length });
  }
}

// Run cleanup every minute
setInterval(cleanupExpiredSessions, 60000);

// ===========================================
// UUID VALIDATION
// ===========================================
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

// ===========================================
// CORS CONFIGURATION
// ===========================================
function getCorsHeaders(req: http.IncomingMessage): Record<string, string> {
  const origin = req.headers.origin || '*';

  // If ALLOWED_ORIGINS is *, allow all
  if (ALLOWED_ORIGINS === '*') {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Mcp-Session-Id',
      'Access-Control-Expose-Headers': 'Mcp-Session-Id, WWW-Authenticate, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset',
    };
  }

  // Check if origin is in allowed list
  const allowedList = ALLOWED_ORIGINS.split(',').map((o) => o.trim());
  const isAllowed = allowedList.includes(origin);

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedList[0],
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Mcp-Session-Id',
    'Access-Control-Expose-Headers': 'Mcp-Session-Id, WWW-Authenticate, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset',
    'Vary': 'Origin',
  };
}

/**
 * Create MCP Server with enhanced instructions
 */
const server = new Server(
  {
    name: 'sverigesradio-mcp',
    version: '1.2.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
    instructions: `# Sveriges Radio MCP Server

Detta är en MCP-server för Sveriges Radios öppna API. Du kan använda dessa verktyg för att:

## 🎙️ Tillgängliga Funktioner

### Program & Poddar
- Sök efter radioprogram och poddar med \`search_programs\`
- Hämta detaljerad programinformation med \`get_program\`
- Lista alla programkategorier (Nyheter, Musik, Sport, etc.) med \`list_program_categories\`

### Avsnitt & Ljudfiler
- Bläddra bland avsnitten för ett program med \`list_episodes\`
- Sök i avsnittstext med \`search_episodes\`
- Hämta ljudfiler för streaming/nedladdning med \`get_episode\`
- Få senaste avsnittet med \`get_latest_episode\`

### Tablå & Schema
- Se vad som sänds JUST NU på alla kanaler med \`get_all_rightnow\`
- Kolla tablån för en specifik kanal med \`get_channel_schedule\`
- Se när ett program sänds med \`get_program_broadcasts\`

### Kanaler
- Lista alla P1, P2, P3, P4 och lokalradiostationer med \`list_channels\`
- Se vad som spelas just nu på en kanal med \`get_channel_rightnow\`

### Spellistor 🎵
- Se vilken låt som spelas just nu med \`get_playlist_rightnow\`
- Hämta musikhistorik för en kanal med \`get_channel_playlist\`
- Hämta komplett spellista för ett avsnitt med \`get_episode_playlist\`

### Nyheter & Trafik
- Hämta senaste nyheterna från Ekot med \`get_latest_news_episodes\`
- Se trafikstörningar och vägarbeten med \`get_traffic_messages\`

## 💡 Tips för Användning

1. **Börja brett, förfina sedan**: Använd \`search_programs\` först för att hitta rätt program, sedan \`list_episodes\` för specifika avsnitt.

2. **Använd Resources**: Hämta referensdata snabbt via resources:
   - \`sr://channels/all\` - Alla kanal-ID:n
   - \`sr://categories/programs\` - Alla kategori-ID:n
   - \`sr://audio/quality-guide\` - Ljudkvaliteter

3. **Använd Prompts**: Förbyggda workflows för vanliga uppgifter:
   - \`find-podcast\` - Hitta poddar efter ämne
   - \`whats-on-now\` - Se vad som sänds nu
   - \`traffic-nearby\` - Kolla trafiken
   - \`news-briefing\` - Få senaste nyheterna

4. **Paginering**: Många endpoints stödjer \`page\` och \`size\` parametrar för stora resultat.

## 🔍 Exempel på Användning

**Hitta historia-poddar:**
\`\`\`
search_programs(query="historia", hasOnDemand=true)
\`\`\`

**Se vad som spelas just nu på P3:**
\`\`\`
get_channel_rightnow(channelId=164)  // P3 = 164
\`\`\`

**Få senaste nyheterna från Ekot:**
\`\`\`
get_latest_news_episodes(programId=4916)  // Ekot = 4916
\`\`\`

Sveriges Radios API är publikt och kräver ingen autentisering.`,
  }
);

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: allTools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const tool = allTools.find((t) => t.name === name);
  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }

  try {
    const parsedArgs = parseArgs((tool as any).schema, args);
    const result = await tool.handler(parsedArgs as any);
    return {
      content: asJsonContent(result),
    };
  } catch (error: any) {
    return {
      content: asJsonContent(formatErrorPayload(error)),
      isError: true,
    };
  }
});

// List resources handler
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: allResources,
  };
});

// Read resource handler
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  const contentGenerator = resourceContents[uri];
  if (!contentGenerator) {
    throw new Error(`Unknown resource: ${uri}`);
  }

  const content = contentGenerator();
  return {
    contents: [
      {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(content, null, 2),
      },
    ],
  };
});

// List prompts handler
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: allPrompts,
  };
});

// Get prompt handler
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const prompt = allPrompts.find((p) => p.name === name);
  if (!prompt) {
    throw new Error(`Unknown prompt: ${name}`);
  }

  const messageGenerator = promptMessages[name];
  if (!messageGenerator) {
    throw new Error(`No message generator for prompt: ${name}`);
  }

  const message = messageGenerator(args || {});
  return {
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: message,
        },
      },
    ],
  };
});

/**
 * JSON-RPC Error Codes (following best practices)
 */
const ErrorCodes = {
  MISSING_TOKEN: -32000,
  INVALID_TOKEN: -32001,
  SESSION_ERROR: -32003,
  INTERNAL_ERROR: -32603,
} as const;

/**
 * Authentication middleware with JSON-RPC error responses
 */
function authenticate(
  req: http.IncomingMessage,
  res: http.ServerResponse
): { success: true } | { success: false; handled: boolean } {
  // If no token is configured, allow all requests
  if (!AUTH_TOKEN) {
    return { success: true };
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    // Return 401 with WWW-Authenticate header
    res.writeHead(401, {
      'Content-Type': 'application/json',
      'WWW-Authenticate': `Bearer realm="MCP Server", resource_metadata_uri="${BASE_URL}/.well-known/oauth-protected-resource"`,
    });
    res.end(
      JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: ErrorCodes.MISSING_TOKEN,
          message: 'Missing Bearer token. Include Authorization header with "Bearer YOUR_TOKEN"',
        },
        id: null,
      })
    );
    return { success: false, handled: true };
  }

  // Support "Bearer TOKEN" format
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : authHeader;

  if (token !== AUTH_TOKEN) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: ErrorCodes.INVALID_TOKEN,
          message: 'Invalid or expired token',
        },
        id: null,
      })
    );
    return { success: false, handled: true };
  }

  return { success: true };
}

/**
 * Helper to create and connect a StreamableHTTP transport with session management
 */
async function createAndConnectTransport(
  sessionId: string,
  logPrefix: string = ''
): Promise<StreamableHTTPServerTransport> {
  // Check if transport already exists (avoid duplicates)
  if (pendingTransports[sessionId]) {
    return pendingTransports[sessionId];
  }
  if (sessions[sessionId]) {
    sessions[sessionId].lastActivity = Date.now();
    return sessions[sessionId].transport;
  }
  if (transports[sessionId]) {
    return transports[sessionId];
  }

  log('info', 'Creating new transport', { sessionId, logPrefix });

  // Create new StreamableHTTP transport with session management
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => sessionId, // Use pre-generated session ID
    enableJsonResponse: true, // Support both JSON and SSE responses
    onsessioninitialized: (actualId) => {
      log('info', 'Session initialized', { sessionId: actualId });
      delete pendingTransports[actualId];
    },
    onsessionclosed: (closedId) => {
      log('info', 'Session closed', { sessionId: closedId });
      delete sessions[closedId];
      delete transports[closedId];
    },
  });

  // Track pending transport
  pendingTransports[sessionId] = transport;
  transports[sessionId] = transport;
  sessions[sessionId] = {
    transport,
    lastActivity: Date.now(),
    requestCount: 0,
  };

  // Set cleanup handler
  transport.onclose = () => {
    log('info', 'Transport closed', { sessionId });
    delete sessions[sessionId];
    delete transports[sessionId];
  };

  // Connect transport to MCP server
  try {
    await server.connect(transport);
    log('info', 'Transport connected', { sessionId, logPrefix });
  } catch (error) {
    log('error', 'Failed to connect transport', { sessionId, error: String(error) });
    delete pendingTransports[sessionId];
    delete sessions[sessionId];
    delete transports[sessionId];
    throw error;
  }

  return transport;
}

/**
 * Render README.md as HTML
 */
async function renderReadme(): Promise<string> {
  try {
    const readmePath = join(PROJECT_ROOT, 'README.md');
    const markdown = await readFile(readmePath, 'utf-8');
    const html = await marked.parse(markdown);

    return `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sveriges Radio MCP Server</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #24292f;
      background: #ffffff;
      padding: 2rem 1rem;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      padding: 2rem;
      border-radius: 8px;
    }
    h1 {
      font-size: 2rem;
      border-bottom: 1px solid #d0d7de;
      padding-bottom: 0.3rem;
      margin-bottom: 1rem;
    }
    h2 {
      font-size: 1.5rem;
      border-bottom: 1px solid #d0d7de;
      padding-bottom: 0.3rem;
      margin-top: 2rem;
      margin-bottom: 1rem;
    }
    h3 {
      font-size: 1.25rem;
      margin-top: 1.5rem;
      margin-bottom: 0.5rem;
    }
    p {
      margin-bottom: 1rem;
    }
    ul, ol {
      margin-bottom: 1rem;
      padding-left: 2rem;
    }
    li {
      margin-bottom: 0.25rem;
    }
    code {
      background: #f6f8fa;
      padding: 0.2em 0.4em;
      border-radius: 6px;
      font-size: 85%;
      font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
    }
    pre {
      background: #f6f8fa;
      padding: 1rem;
      border-radius: 6px;
      overflow-x: auto;
      margin-bottom: 1rem;
    }
    pre code {
      background: none;
      padding: 0;
      font-size: 100%;
    }
    a {
      color: #0969da;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    blockquote {
      border-left: 4px solid #d0d7de;
      padding-left: 1rem;
      margin-bottom: 1rem;
      color: #57606a;
    }
    hr {
      border: none;
      border-top: 1px solid #d0d7de;
      margin: 2rem 0;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 1rem;
    }
    th, td {
      border: 1px solid #d0d7de;
      padding: 0.5rem;
      text-align: left;
    }
    th {
      background: #f6f8fa;
      font-weight: 600;
    }
    .badge {
      display: inline-block;
      margin-right: 0.5rem;
    }
    @media (max-width: 768px) {
      body {
        padding: 1rem 0.5rem;
      }
      .container {
        padding: 1rem;
      }
      h1 {
        font-size: 1.5rem;
      }
      h2 {
        font-size: 1.25rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    ${html}
  </div>
</body>
</html>`;
  } catch (error) {
    console.error('Error rendering README:', error);
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Error</title>
</head>
<body>
  <h1>Error Loading README</h1>
  <p>Could not load README.md</p>
</body>
</html>`;
  }
}

/**
 * HTTP Server with support for both modern and legacy transports
 */
const httpServer = http.createServer(async (req, res) => {
  const clientIP = getClientIP(req);

  // Set CORS headers for all responses
  const corsHeaders = getCorsHeaders(req);
  for (const [key, value] of Object.entries(corsHeaders)) {
    res.setHeader(key, value);
  }

  // Handle preflight requests (no rate limiting for OPTIONS)
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Root endpoint - serve README as HTML (no auth required, no rate limiting)
  if (req.url === '/' && req.method === 'GET') {
    const html = await renderReadme();
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // Health check endpoint (no auth required, no rate limiting)
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'healthy',
        service: 'sverigesradio-mcp',
        version: '1.2.0',
        transport: 'StreamableHTTP + SSE (legacy)',
        tools: allTools.length,
        resources: allResources.length,
        prompts: allPrompts.length,
        authRequired: !!AUTH_TOKEN,
        activeSessions: Object.keys(sessions).length,
        activeLegacySessions: Object.keys(sseTransports).length,
        config: {
          sessionTtlMs: SESSION_TTL_MS,
          rateLimitRequests: RATE_LIMIT_REQUESTS,
          corsOrigins: ALLOWED_ORIGINS === '*' ? 'all' : ALLOWED_ORIGINS.split(',').length,
        },
      })
    );
    return;
  }

  // Rate limiting for MCP endpoints
  if (isRateLimited(clientIP)) {
    const rateLimitHeaders = getRateLimitHeaders(clientIP);
    res.writeHead(429, {
      'Content-Type': 'application/json',
      'Retry-After': '60',
      ...rateLimitHeaders,
    });
    res.end(
      JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: `Rate limit exceeded. Maximum ${RATE_LIMIT_REQUESTS} requests per minute.`,
        },
        id: null,
      })
    );
    return;
  }

  // Add rate limit headers to all subsequent responses
  const rateLimitHeaders = getRateLimitHeaders(clientIP);
  for (const [key, value] of Object.entries(rateLimitHeaders)) {
    res.setHeader(key, value);
  }

  // ========================================
  // MODERN TRANSPORT: /mcp endpoint
  // Streamable HTTP (2025-03-26 spec)
  // ========================================
  if (req.url === '/mcp' || req.url?.startsWith('/mcp?')) {
    // Authenticate request
    const authResult = authenticate(req, res);
    if (!authResult.success) {
      return; // Response already sent by authenticate()
    }

    // Modern transport uses POST for requests, GET for SSE streams, DELETE for cleanup
    if (req.method === 'POST') {
      // Parse request body
      let body = '';
      for await (const chunk of req) {
        body += chunk;
      }

      let parsedBody: any;
      try {
        parsedBody = body ? JSON.parse(body) : {};
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            jsonrpc: '2.0',
            error: {
              code: ErrorCodes.INTERNAL_ERROR,
              message: 'Invalid JSON in request body',
            },
            id: null,
          })
        );
        return;
      }

      const rpcId = parsedBody?.id;

      // Get session ID from header
      const sessionIdHeader = req.headers['mcp-session-id'];
      const clientSessionId = Array.isArray(sessionIdHeader)
        ? sessionIdHeader[0]
        : sessionIdHeader;

      // Check if this is an initialize request
      const isInitRequest = parsedBody?.method === 'initialize';

      let transport: StreamableHTTPServerTransport;
      let effectiveSessionId: string;

      if (isInitRequest) {
        // Initialize: create new session
        effectiveSessionId = randomUUID();
        log('info', 'Initialize request - creating new session', { sessionId: effectiveSessionId, clientIP });
        transport = await createAndConnectTransport(effectiveSessionId, 'Initialize: ');
      } else if (clientSessionId && !isValidUUID(clientSessionId)) {
        // Invalid UUID format
        log('warn', 'Invalid session ID format', { clientSessionId, clientIP });
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            jsonrpc: '2.0',
            error: {
              code: ErrorCodes.SESSION_ERROR,
              message: 'Invalid session ID format. Must be a valid UUID.',
            },
            id: rpcId,
          })
        );
        return;
      } else if (clientSessionId && sessions[clientSessionId]) {
        // Existing session: reuse transport and update activity
        effectiveSessionId = clientSessionId;
        sessions[clientSessionId].lastActivity = Date.now();
        sessions[clientSessionId].requestCount++;
        transport = sessions[clientSessionId].transport;
        log('debug', 'Reusing existing session', { sessionId: effectiveSessionId, requestCount: sessions[clientSessionId].requestCount });
      } else if (clientSessionId && transports[clientSessionId]) {
        // Fallback to transports map
        effectiveSessionId = clientSessionId;
        transport = transports[clientSessionId];
        log('debug', 'Reusing transport from legacy map', { sessionId: effectiveSessionId });
      } else if (clientSessionId && pendingTransports[clientSessionId]) {
        // Pending session: wait for transport
        effectiveSessionId = clientSessionId;
        transport = await pendingTransports[clientSessionId];
        log('debug', 'Using pending session', { sessionId: effectiveSessionId });
      } else if (clientSessionId) {
        // Unknown but valid UUID session: create new transport with provided ID
        effectiveSessionId = clientSessionId;
        log('info', 'Unknown session ID, creating new', { sessionId: effectiveSessionId, clientIP });
        transport = await createAndConnectTransport(effectiveSessionId, 'Unknown Session: ');
      } else {
        // No session ID for non-initialize request: error
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            jsonrpc: '2.0',
            error: {
              code: ErrorCodes.SESSION_ERROR,
              message: 'Bad Request: No session ID provided for non-initialize request',
            },
            id: rpcId,
          })
        );
        return;
      }

      // Set session ID in response header
      res.setHeader('Mcp-Session-Id', effectiveSessionId);

      // Handle request using transport
      try {
        await transport.handleRequest(req, res, parsedBody);
      } catch (error) {
        log('error', 'Error handling POST request', { sessionId: effectiveSessionId, error: String(error) });
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              jsonrpc: '2.0',
              error: {
                code: ErrorCodes.INTERNAL_ERROR,
                message: 'Internal server error during MCP request handling',
              },
              id: rpcId,
            })
          );
        }
      }
      return;
    } else if (req.method === 'GET') {
      // GET request for SSE stream (modern StreamableHTTP also supports this)
      const sessionIdHeader = req.headers['mcp-session-id'];
      const clientSessionId = Array.isArray(sessionIdHeader)
        ? sessionIdHeader[0]
        : sessionIdHeader;

      let transport: StreamableHTTPServerTransport;
      let effectiveSessionId: string;

      if (clientSessionId && transports[clientSessionId]) {
        // Existing session
        effectiveSessionId = clientSessionId;
        transport = transports[clientSessionId];
      } else {
        // Create new session for GET
        effectiveSessionId = randomUUID();
        transport = await createAndConnectTransport(effectiveSessionId, 'GET SSE: ');
      }

      res.setHeader('Mcp-Session-Id', effectiveSessionId);

      try {
        await transport.handleRequest(req, res, undefined);
      } catch (error) {
        log('error', 'Error handling GET request', { sessionId: effectiveSessionId, error: String(error) });
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              jsonrpc: '2.0',
              error: {
                code: ErrorCodes.INTERNAL_ERROR,
                message: 'Internal server error during SSE setup',
              },
              id: null,
            })
          );
        }
      }
      return;
    } else if (req.method === 'DELETE') {
      // DELETE request to close session
      const sessionIdHeader = req.headers['mcp-session-id'];
      const sessionId = Array.isArray(sessionIdHeader) ? sessionIdHeader[0] : sessionIdHeader;

      if (sessionId && (sessions[sessionId] || transports[sessionId])) {
        log('info', 'Closing session via DELETE', { sessionId });
        try {
          if (sessions[sessionId]) {
            await sessions[sessionId].transport.close();
            delete sessions[sessionId];
          }
          if (transports[sessionId]) {
            await transports[sessionId].close();
            delete transports[sessionId];
          }
        } catch (error) {
          log('error', 'Error closing session', { sessionId, error: String(error) });
        }
        res.writeHead(204);
        res.end();
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            jsonrpc: '2.0',
            error: {
              code: ErrorCodes.SESSION_ERROR,
              message: 'Session not found',
            },
            id: null,
          })
        );
      }
      return;
    }
  }

  // ========================================
  // LEGACY TRANSPORT: /sse endpoint
  // SSE (2024-11-05 spec) for backward compatibility
  // ========================================
  if (req.url === '/sse' && req.method === 'GET') {
    // Authenticate request
    const authResult = authenticate(req, res);
    if (!authResult.success) {
      return; // Response already sent
    }

    log('info', 'Legacy SSE connection established', { clientIP });

    // Create legacy SSE transport
    const transport = new SSEServerTransport('/messages', res);
    sseTransports[transport.sessionId] = transport;

    // Set cleanup handler
    const cleanup = () => {
      log('info', 'Legacy SSE transport closed', { sessionId: transport.sessionId });
      if (sseTransports[transport.sessionId]) {
        delete sseTransports[transport.sessionId];
      }
    };

    res.on('close', cleanup);
    res.on('error', cleanup);

    try {
      await server.connect(transport);
    } catch (error) {
      log('error', 'Error connecting legacy SSE transport', { error: String(error) });
      cleanup();
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: 'Internal server error during SSE setup',
          })
        );
      }
    }
    return;
  }

  // Legacy POST /messages endpoint for SSE transport
  if (req.url?.startsWith('/messages?')) {
    // Authenticate request
    const authResult = authenticate(req, res);
    if (!authResult.success) {
      return;
    }

    // Extract session ID from query string
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: ErrorCodes.SESSION_ERROR,
            message: 'Missing sessionId in query parameters',
          },
          id: null,
        })
      );
      return;
    }

    const transport = sseTransports[sessionId];
    if (!transport) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: ErrorCodes.SESSION_ERROR,
            message: 'Session not found or not an SSE session',
          },
          id: null,
        })
      );
      return;
    }

    // Parse body
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }

    let parsedBody: any;
    try {
      parsedBody = body ? JSON.parse(body) : {};
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: ErrorCodes.INTERNAL_ERROR,
            message: 'Invalid JSON in request body',
          },
          id: null,
        })
      );
      return;
    }

    try {
      await transport.handlePostMessage(req, res, parsedBody);
    } catch (error) {
      log('error', 'Error handling legacy POST message', { sessionId, error: String(error) });
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            jsonrpc: '2.0',
            error: {
              code: ErrorCodes.INTERNAL_ERROR,
              message: 'Internal server error handling message',
            },
            id: parsedBody?.id || null,
          })
        );
      }
    }
    return;
  }

  // Default: 404 Not Found
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      error: 'Not Found',
      endpoints: {
        health: 'GET /health - Health check (no auth)',
        mcp: 'POST/GET/DELETE /mcp - Modern MCP endpoint (StreamableHTTP)' + (AUTH_TOKEN ? ' (Bearer token required)' : ''),
        sse: 'GET /sse - Legacy SSE endpoint' + (AUTH_TOKEN ? ' (Bearer token required)' : ''),
      },
    })
  );
});

/**
 * Start HTTP server
 */
httpServer.listen(PORT, () => {
  // Use console.log for startup banner (human-readable)
  console.log('========================================');
  console.log('Sveriges Radio MCP Server');
  console.log('========================================');
  console.log(`Version: 1.2.0`);
  console.log(`Port: ${PORT}`);
  console.log(`Auth: ${AUTH_TOKEN ? 'Enabled (Bearer token required)' : 'Disabled'}`);
  console.log(`CORS: ${ALLOWED_ORIGINS === '*' ? 'All origins' : ALLOWED_ORIGINS}`);
  console.log(`Session TTL: ${SESSION_TTL_MS / 1000 / 60} minutes`);
  console.log(`Rate Limit: ${RATE_LIMIT_REQUESTS} requests/minute`);
  console.log('');
  console.log('Endpoints:');
  console.log(`  Health:  http://localhost:${PORT}/health`);
  console.log(`  Modern:  http://localhost:${PORT}/mcp (StreamableHTTP)`);
  console.log(`  Legacy:  http://localhost:${PORT}/sse (SSE)`);
  console.log('');
  console.log(`Tools: ${allTools.length} | Resources: ${allResources.length} | Prompts: ${allPrompts.length}`);
  console.log('========================================');

  // Structured log for monitoring
  log('info', 'Server started', {
    version: '1.2.0',
    port: PORT,
    authEnabled: !!AUTH_TOKEN,
    corsOrigins: ALLOWED_ORIGINS,
    sessionTtlMs: SESSION_TTL_MS,
    rateLimitRequests: RATE_LIMIT_REQUESTS,
    tools: allTools.length,
    resources: allResources.length,
    prompts: allPrompts.length,
  });
});
