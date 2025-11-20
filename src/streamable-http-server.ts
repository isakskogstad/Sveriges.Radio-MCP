#!/usr/bin/env node

/**
 * Sveriges Radio MCP Server
 * HTTP transport (for remote/Render deployment)
 */

import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
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
import { allTools } from './tools/index.js';
import { allResources, resourceContents } from './resources/index.js';
import { allPrompts, promptMessages } from './prompts/index.js';

const PORT = process.env.PORT || 3000;
const AUTH_TOKEN = process.env.MCP_AUTH_TOKEN; // Optional token authentication

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
    const result = await tool.handler(args as any);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              error: error.message || 'Unknown error',
              code: error.code || 'UNKNOWN',
              details: error.details,
            },
            null,
            2
          ),
        },
      ],
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

// Authentication middleware
function authenticate(req: http.IncomingMessage): boolean {
  // If no token is configured, allow all requests
  if (!AUTH_TOKEN) {
    return true;
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return false;
  }

  // Support "Bearer TOKEN" format
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : authHeader;

  return token === AUTH_TOKEN;
}

const httpServer = http.createServer(async (req, res) => {
  // Health check endpoint (no auth required)
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'sverigesradio-mcp',
      version: '1.0.0',
      tools: allTools.length,
      resources: allResources.length,
      prompts: allPrompts.length,
      authRequired: !!AUTH_TOKEN,
    }));
    return;
  }

  // MCP endpoint - requires auth if token is set
  if (req.url === '/sse' || req.url === '/mcp') {
    // Check authentication
    if (!authenticate(req)) {
      res.writeHead(401, {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Bearer realm="MCP Server"',
      });
      res.end(JSON.stringify({
        error: 'Unauthorized',
        message: 'Valid Bearer token required. Set Authorization header with "Bearer YOUR_TOKEN"',
      }));
      return;
    }

    const transport = new SSEServerTransport('/sse', res);
    await server.connect(transport);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: 'Not Found',
    endpoints: {
      health: '/health - Health check (no auth)',
      mcp: '/sse - MCP Server connection' + (AUTH_TOKEN ? ' (Bearer token required)' : ''),
    },
  }));
});

httpServer.listen(PORT, () => {
  console.log(`Sveriges Radio MCP Server listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`MCP SSE endpoint: http://localhost:${PORT}/sse`);
});
