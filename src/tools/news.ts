/**
 * News Tools - Sveriges Radio MCP Server
 * 2 tools for accessing news programs and episodes
 */

import { z } from 'zod';
import { srClient } from '../lib/sr-client.js';
import type { PaginatedResponse, SRProgram, SREpisode } from '../types/sr-api.js';

// Schemas
const ListNewsProgramsSchema = z.object({
  page: z.number().min(1).optional(),
  size: z.number().min(1).max(100).optional(),
  format: z.enum(['xml', 'json']).optional().describe('Svarsformat (default: json)'),
});

const GetLatestNewsEpisodesSchema = z.object({
  page: z.number().min(1).optional(),
  size: z.number().min(1).max(100).optional(),
  format: z.enum(['xml', 'json']).optional().describe('Svarsformat (default: json)'),
});

// Tool handlers
export async function listNewsPrograms(params: z.infer<typeof ListNewsProgramsSchema>) {
  const { page, size, format } = params;

  const queryParams: any = {};
  if (page !== undefined) queryParams.page = page;
  if (size !== undefined) queryParams.size = size;
  if (format) queryParams.format = format;

  const response = await srClient.fetch<PaginatedResponse<SRProgram>>('news', queryParams);

  return {
    programs: (response as any).programs || [],
    pagination: response.pagination,
  };
}

export async function getLatestNewsEpisodes(params: z.infer<typeof GetLatestNewsEpisodesSchema>) {
  const { page, size, format } = params;

  const queryParams: any = {};
  if (page !== undefined) queryParams.page = page;
  if (size !== undefined) queryParams.size = size;
  if (format) queryParams.format = format;

  const response = await srClient.fetch<PaginatedResponse<SREpisode>>('news/episodes', queryParams);

  return {
    episodes: (response as any).episodes || [],
    pagination: response.pagination,
    timestamp: new Date().toISOString(),
  };
}

// Export tool definitions
export const newsTools = [
  {
    name: 'list_news_programs',
    description: 'Lista alla nyhetsprogram från Sveriges Radio (Ekot, Ekonomiekot, Kulturnytt, P4 Nyheter, etc.).',
    schema: ListNewsProgramsSchema,
    inputSchema: {
      type: 'object',
      properties: {
        page: {
          type: 'number',
          description: 'Sidnummer för paginering',
        },
        size: {
          type: 'number',
          description: 'Sidstorlek (antal resultat per sida)',
        },
        format: {
          type: 'string',
          enum: ['xml', 'json'],
          description: 'Svarsformat (default: json)',
        },
      },
    },
    handler: listNewsPrograms,
  },
  {
    name: 'get_latest_news_episodes',
    description: 'Hämta senaste nyhetsavsnitt från alla nyhetsprogram (max 1 dag gamla). Perfekt för en snabb nyhetsöversikt!',
    schema: GetLatestNewsEpisodesSchema,
    inputSchema: {
      type: 'object',
      properties: {
        page: {
          type: 'number',
          description: 'Sidnummer för paginering',
        },
        size: {
          type: 'number',
          description: 'Sidstorlek (antal resultat per sida)',
        },
        format: {
          type: 'string',
          enum: ['xml', 'json'],
          description: 'Svarsformat (default: json)',
        },
      },
    },
    handler: getLatestNewsEpisodes,
  },
];
