#!/usr/bin/env node

/**
 * Sveriges Radio MCP Server
 * stdio transport (for local/direct use)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Sveriges Radio MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
