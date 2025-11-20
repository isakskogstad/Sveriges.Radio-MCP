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
import { asJsonContent, formatErrorPayload, parseArgs } from './lib/tool-utils.js';

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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Sveriges Radio MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
