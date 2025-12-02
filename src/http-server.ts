#!/usr/bin/env node

/**
 * Sveriges Radio MCP Server - Express HTTP Transport
 *
 * Simple Express-based HTTP server for remote deployment.
 * Uses the same pattern as SCB-MCP and Riksdag-Regering-MCP.
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { marked } from 'marked';
import { allTools } from './tools/index.js';
import { allResources, resourceContents } from './resources/index.js';
import { allPrompts, promptMessages } from './prompts/index.js';
import { parseArgs, asJsonContent, formatErrorPayload } from './lib/tool-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// Configuration
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}));
app.use(express.json({ limit: '10mb' }));

// Trust proxy for Render.com
app.set('trust proxy', 1);

// Handle JSON parse errors
app.use((err: any, _req: any, res: any, next: any) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32700,
        message: 'Parse error: Invalid JSON',
      },
    });
  }
  next();
});

/**
 * Call tool handler
 */
async function callTool(name: string, args: any) {
  const tool = allTools.find((t) => t.name === name);
  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }

  const parsedArgs = parseArgs((tool as any).schema, args);
  const result = await tool.handler(parsedArgs as any);
  return {
    content: asJsonContent(result),
  };
}

/**
 * Get resource content
 */
function getResource(uri: string) {
  const contentGenerator = resourceContents[uri];
  if (!contentGenerator) {
    return null;
  }
  return contentGenerator();
}

/**
 * Get prompt messages
 */
function getPrompt(name: string, args: Record<string, string>) {
  const prompt = allPrompts.find((p) => p.name === name);
  if (!prompt) {
    return null;
  }

  const messageGenerator = promptMessages[name];
  if (!messageGenerator) {
    return null;
  }

  return {
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: messageGenerator(args || {}),
        },
      },
    ],
  };
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'sverigesradio-mcp',
    version: '1.3.0',
    timestamp: new Date().toISOString(),
    tools: allTools.length,
    resources: allResources.length,
    prompts: allPrompts.length,
  });
});

// GET /mcp - Server information
app.get('/mcp', (_req, res) => {
  res.json({
    protocol: 'mcp',
    version: '1.3.0',
    name: 'Sveriges Radio MCP Server',
    description: 'Access Swedish Radio programs, podcasts, live streams, schedules, news and traffic',
    authentication: 'none',
    transport: 'http',
    capabilities: {
      tools: true,
      resources: true,
      prompts: true,
    },
    tools: allTools.length,
    resources: allResources.length,
    prompts: allPrompts.length,
    connection: {
      method: 'POST',
      endpoint: '/mcp',
      content_type: 'application/json',
      format: 'MCP JSON-RPC 2.0',
    },
  });
});

// OPTIONS for CORS preflight
app.options('/mcp', (_req, res) => {
  res.status(204).end();
});

// Main MCP endpoint - JSON-RPC 2.0
app.post('/mcp', async (req, res) => {
  try {
    const { jsonrpc, id, method, params } = req.body;

    // Validate JSON-RPC version
    if (jsonrpc !== '2.0') {
      return res.status(200).json({
        jsonrpc: '2.0',
        id: id || null,
        error: {
          code: -32600,
          message: 'Invalid Request: jsonrpc must be "2.0"',
        },
      });
    }

    // Handle initialize
    if (method === 'initialize') {
      return res.status(200).json({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
            resources: {},
            prompts: {},
          },
          serverInfo: {
            name: 'sverigesradio-mcp',
            version: '1.3.0',
            description: 'MCP Server för Sveriges Radio - program, podcasts, nyheter och trafik',
          },
        },
      });
    }

    // Handle notifications/initialized (no response needed)
    if (method === 'notifications/initialized') {
      return res.status(204).end();
    }

    // Handle ping
    if (method === 'ping') {
      return res.status(200).json({
        jsonrpc: '2.0',
        id,
        result: {},
      });
    }

    // Handle tools/list
    if (method === 'tools/list') {
      const tools = allTools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      }));
      return res.status(200).json({
        jsonrpc: '2.0',
        id,
        result: { tools },
      });
    }

    // Handle tools/call
    if (method === 'tools/call') {
      try {
        const { name, arguments: args } = params;
        const result = await callTool(name, args);
        return res.status(200).json({
          jsonrpc: '2.0',
          id,
          result,
        });
      } catch (error: any) {
        return res.status(200).json({
          jsonrpc: '2.0',
          id,
          result: {
            content: asJsonContent(formatErrorPayload(error)),
            isError: true,
          },
        });
      }
    }

    // Handle resources/list
    if (method === 'resources/list') {
      return res.status(200).json({
        jsonrpc: '2.0',
        id,
        result: { resources: allResources },
      });
    }

    // Handle resources/read
    if (method === 'resources/read') {
      const { uri } = params;
      const content = getResource(uri);

      if (!content) {
        return res.status(200).json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32602,
            message: `Resource not found: ${uri}`,
          },
        });
      }

      return res.status(200).json({
        jsonrpc: '2.0',
        id,
        result: {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(content, null, 2),
            },
          ],
        },
      });
    }

    // Handle prompts/list
    if (method === 'prompts/list') {
      return res.status(200).json({
        jsonrpc: '2.0',
        id,
        result: { prompts: allPrompts },
      });
    }

    // Handle prompts/get
    if (method === 'prompts/get') {
      const { name, arguments: args } = params;
      const result = getPrompt(name, args || {});

      if (!result) {
        return res.status(200).json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32602,
            message: `Prompt not found: ${name}`,
          },
        });
      }

      return res.status(200).json({
        jsonrpc: '2.0',
        id,
        result,
      });
    }

    // Method not found
    return res.status(200).json({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32601,
        message: `Method not found: ${method}`,
      },
    });
  } catch (error) {
    console.error('Error handling MCP request:', error);
    return res.status(200).json({
      jsonrpc: '2.0',
      id: req.body?.id || null,
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : 'Internal error',
      },
    });
  }
});

// Root endpoint - serve README as HTML
app.get('/', async (_req, res) => {
  try {
    const readmePath = join(PROJECT_ROOT, 'README.md');
    const markdown = await readFile(readmePath, 'utf-8');
    const html = await marked.parse(markdown);

    res.send(`<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sveriges Radio MCP Server</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #24292f;
      background: #f6f8fa;
      padding: 20px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12);
    }
    h1 { font-size: 2em; border-bottom: 1px solid #d0d7de; padding-bottom: 0.3em; margin-bottom: 16px; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #d0d7de; padding-bottom: 0.3em; margin-top: 24px; margin-bottom: 16px; }
    h3 { font-size: 1.25em; margin-top: 24px; margin-bottom: 16px; }
    p { margin-bottom: 16px; }
    a { color: #0366d6; text-decoration: none; }
    a:hover { text-decoration: underline; }
    code {
      background: #f6f8fa;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 85%;
    }
    pre {
      background: #f6f8fa;
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;
      margin-bottom: 16px;
    }
    pre code { background: none; padding: 0; font-size: 100%; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
    th, td { padding: 6px 13px; border: 1px solid #d0d7de; }
    th { background: #f6f8fa; font-weight: 600; }
    ul, ol { margin-bottom: 16px; padding-left: 2em; }
    li { margin-bottom: 4px; }
    img { max-width: 100%; height: auto; }
    .header-links {
      margin-bottom: 24px;
      padding: 12px;
      background: #ddf4ff;
      border: 1px solid #54aeff;
      border-radius: 6px;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      background: #0366d6;
      color: white;
      border-radius: 3px;
      font-size: 12px;
      margin-right: 8px;
    }
    @media (max-width: 768px) {
      .container { padding: 20px; }
      body { padding: 10px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-links">
      <span class="badge">v1.3.0</span>
      <a href="/mcp">API Endpoint</a> |
      <a href="/health">Health Check</a> |
      <a href="https://github.com/isakskogstad/Sveriges.Radio-MCP">GitHub</a>
    </div>
    ${html}
  </div>
</body>
</html>`);
  } catch (error) {
    res.status(500).send(`
<!DOCTYPE html>
<html>
<head><title>Error</title></head>
<body>
  <h1>Error loading documentation</h1>
  <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
</body>
</html>`);
  }
});

// Start server
app.listen(PORT, () => {
  console.log('========================================');
  console.log('Sveriges Radio MCP Server');
  console.log('========================================');
  console.log(`Version: 1.3.0`);
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log('');
  console.log('Endpoints:');
  console.log(`  GET  /        - Documentation`);
  console.log(`  GET  /health  - Health check`);
  console.log(`  GET  /mcp     - Server info`);
  console.log(`  POST /mcp     - MCP JSON-RPC endpoint`);
  console.log('');
  console.log(`Tools: ${allTools.length} | Resources: ${allResources.length} | Prompts: ${allPrompts.length}`);
  console.log('========================================');
});
