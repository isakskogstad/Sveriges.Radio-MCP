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
import { allTools } from './tools/index.js';
import { allResources, resourceContents } from './resources/index.js';
import { allPrompts, promptMessages } from './prompts/index.js';
import { asJsonContent, formatErrorPayload, parseArgs } from './lib/tool-utils.js';

const PORT = process.env.PORT || 3000;
const AUTH_TOKEN = process.env.MCP_AUTH_TOKEN; // Optional token authentication
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Session management for modern StreamableHTTP transport
const transports: Record<string, StreamableHTTPServerTransport> = {};
const pendingTransports: Record<string, StreamableHTTPServerTransport> = {};

// Legacy SSE transport sessions
const sseTransports: Record<string, SSEServerTransport> = {};

/**
 * Create MCP Server with enhanced instructions
 */
const server = new Server(
  {
    name: 'sverigesradio-mcp',
    version: '1.0.0',
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
- Hämta komplett spellista för ett avsnitt med \`get_episode_playlist\`
- Sök efter låtar, artister och album med \`search_playlists\`

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
  if (pendingTransports[sessionId] || transports[sessionId]) {
    return pendingTransports[sessionId] || transports[sessionId];
  }

  console.log(`${logPrefix}Creating new transport for session: ${sessionId}`);

  // Create new StreamableHTTP transport with session management
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => sessionId, // Use pre-generated session ID
    enableJsonResponse: true, // Support both JSON and SSE responses
    onsessioninitialized: (actualId) => {
      console.log(`Session initialized: ${actualId}`);
      delete pendingTransports[actualId];
    },
    onsessionclosed: (closedId) => {
      console.log(`Session closed: ${closedId}`);
      if (transports[closedId]) {
        delete transports[closedId];
      }
    },
  });

  // Track pending transport
  pendingTransports[sessionId] = transport;
  transports[sessionId] = transport;

  // Set cleanup handler
  transport.onclose = () => {
    console.log(`Transport closed for session: ${sessionId}`);
    if (transports[sessionId]) {
      delete transports[sessionId];
    }
  };

  // Connect transport to MCP server
  try {
    await server.connect(transport);
    console.log(`${logPrefix}Transport connected successfully`);
  } catch (error) {
    console.error(`${logPrefix}Failed to connect transport:`, error);
    delete pendingTransports[sessionId];
    delete transports[sessionId];
    throw error;
  }

  return transport;
}

/**
 * HTTP Server with support for both modern and legacy transports
 */
const httpServer = http.createServer(async (req, res) => {
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Mcp-Session-Id');
  res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id, WWW-Authenticate');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint (no auth required)
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'healthy',
        service: 'sverigesradio-mcp',
        version: '1.0.0',
        transport: 'StreamableHTTP + SSE (legacy)',
        tools: allTools.length,
        resources: allResources.length,
        prompts: allPrompts.length,
        authRequired: !!AUTH_TOKEN,
        activeSessions: Object.keys(transports).length,
        activeLegacySessions: Object.keys(sseTransports).length,
      })
    );
    return;
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
        console.log(`Initialize request - creating new session: ${effectiveSessionId}`);
        transport = await createAndConnectTransport(effectiveSessionId, 'Initialize: ');
      } else if (clientSessionId && transports[clientSessionId]) {
        // Existing session: reuse transport
        effectiveSessionId = clientSessionId;
        transport = transports[clientSessionId];
        console.log(`Reusing existing session: ${effectiveSessionId}`);
      } else if (clientSessionId && pendingTransports[clientSessionId]) {
        // Pending session: wait for transport
        effectiveSessionId = clientSessionId;
        transport = await pendingTransports[clientSessionId];
        console.log(`Using pending session: ${effectiveSessionId}`);
      } else if (clientSessionId) {
        // Unknown session: create new transport with provided ID
        effectiveSessionId = clientSessionId;
        console.log(`Unknown session ID, creating new: ${effectiveSessionId}`);
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
        console.error(`Error handling POST request:`, error);
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
        console.error(`Error handling GET request:`, error);
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

      if (sessionId && transports[sessionId]) {
        console.log(`Closing session via DELETE: ${sessionId}`);
        try {
          await transports[sessionId].close();
          delete transports[sessionId];
        } catch (error) {
          console.error(`Error closing session:`, error);
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

    console.log('Legacy SSE connection established');

    // Create legacy SSE transport
    const transport = new SSEServerTransport('/messages', res);
    sseTransports[transport.sessionId] = transport;

    // Set cleanup handler
    const cleanup = () => {
      console.log(`Legacy SSE transport closed: ${transport.sessionId}`);
      if (sseTransports[transport.sessionId]) {
        delete sseTransports[transport.sessionId];
      }
    };

    res.on('close', cleanup);
    res.on('error', cleanup);

    try {
      await server.connect(transport);
    } catch (error) {
      console.error('Error connecting legacy SSE transport:', error);
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
      console.error('Error handling legacy POST message:', error);
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
  console.log('========================================');
  console.log('Sveriges Radio MCP Server');
  console.log('========================================');
  console.log(`Version: 1.0.0`);
  console.log(`Port: ${PORT}`);
  console.log(`Auth: ${AUTH_TOKEN ? 'Enabled (Bearer token required)' : 'Disabled'}`);
  console.log('');
  console.log('Endpoints:');
  console.log(`  Health:  http://localhost:${PORT}/health`);
  console.log(`  Modern:  http://localhost:${PORT}/mcp (StreamableHTTP)`);
  console.log(`  Legacy:  http://localhost:${PORT}/sse (SSE)`);
  console.log('');
  console.log(`Tools: ${allTools.length} | Resources: ${allResources.length} | Prompts: ${allPrompts.length}`);
  console.log('========================================');
});
