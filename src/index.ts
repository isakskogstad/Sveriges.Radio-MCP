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
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { allTools } from './tools/index.js';
import { allResources, resourceContents } from './resources/index.js';
import { allPrompts, promptMessages } from './prompts/index.js';

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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Sveriges Radio MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
