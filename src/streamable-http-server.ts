#!/usr/bin/env node

/**
 * Sveriges Radio MCP Server
 * HTTP transport (for remote/Render deployment)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import http from 'http';

const PORT = process.env.PORT || 3000;

const server = new Server(
  {
    name: 'sverigesradio-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_channels',
        description: 'Lista alla radiokanaler från Sveriges Radio (P1, P2, P3, P4, etc.)',
        inputSchema: {
          type: 'object',
          properties: {
            channelId: {
              type: 'number',
              description: 'Specifikt kanal-ID (valfritt)',
            },
          },
        },
      },
    ],
  };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'list_channels') {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            message: 'Tool implementation coming soon!',
            tool: name,
            args,
          }, null, 2),
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

const httpServer = http.createServer(async (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', service: 'sverigesradio-mcp' }));
    return;
  }

  if (req.url === '/sse') {
    const transport = new SSEServerTransport('/sse', res);
    await server.connect(transport);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found - Use /sse for MCP connection');
});

httpServer.listen(PORT, () => {
  console.log(`Sveriges Radio MCP Server listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`MCP SSE endpoint: http://localhost:${PORT}/sse`);
});
