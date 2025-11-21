/**
 * Episode Tools - Sveriges Radio MCP Server
 * 5 tools for accessing radio episodes and podcasts
 */

import { z } from 'zod';
import { srClient } from '../lib/sr-client.js';
import type { PaginatedResponse, SREpisode } from '../types/sr-api.js';

// Schemas
const ListEpisodesSchema = z.object({
  programId: z.number().describe('Program-ID'),
  fromDate: z.string().optional().describe('Från datum (YYYY-MM-DD)'),
  toDate: z.string().optional().describe('Till datum (YYYY-MM-DD)'),
  audioQuality: z.enum(['low', 'normal', 'hi']).optional().describe('Ljudkvalitet'),
  page: z.number().min(1).optional(),
  size: z.number().min(1).max(100).optional(),
  format: z.enum(['xml', 'json']).optional().describe('Svarsformat (default: json)'),
});

const SearchEpisodesSchema = z.object({
  query: z.string().describe('Sökterm'),
  channelId: z.number().optional().describe('Filtrera på kanal'),
  programId: z.number().optional().describe('Filtrera på program'),
  page: z.number().min(1).optional(),
  size: z.number().min(1).max(100).optional(),
  format: z.enum(['xml', 'json']).optional().describe('Svarsformat (default: json)'),
});

const GetEpisodeSchema = z.object({
  episodeId: z.number().describe('Avsnitt-ID'),
  audioQuality: z.enum(['low', 'normal', 'hi']).optional().describe('Ljudkvalitet'),
  format: z.enum(['xml', 'json']).optional().describe('Svarsformat (default: json)'),
});

const GetEpisodesBatchSchema = z.object({
  episodeIds: z.string().describe('Kommaseparerade avsnitt-ID (t.ex. "123,456,789")'),
  audioQuality: z.enum(['low', 'normal', 'hi']).optional(),
  format: z.enum(['xml', 'json']).optional().describe('Svarsformat (default: json)'),
});

const GetLatestEpisodeSchema = z.object({
  programId: z.number().describe('Program-ID'),
  audioQuality: z.enum(['low', 'normal', 'hi']).optional(),
  format: z.enum(['xml', 'json']).optional().describe('Svarsformat (default: json)'),
});

// Tool handlers
export async function listEpisodes(params: z.infer<typeof ListEpisodesSchema>) {
  const { programId, fromDate, toDate, audioQuality, page, size, format } = params;

  const queryParams: any = {
    programid: programId,
    page,
    size,
  };

  if (fromDate) queryParams.fromdate = fromDate;
  if (toDate) queryParams.todate = toDate;
  if (audioQuality) queryParams.audioquality = audioQuality;
  if (format) queryParams.format = format;

  const response = await srClient.fetch<PaginatedResponse<SREpisode>>('episodes/index', queryParams);

  return {
    episodes: (response as any).episodes || [],
    pagination: response.pagination,
  };
}

export async function searchEpisodes(params: z.infer<typeof SearchEpisodesSchema>) {
  const { query, channelId, programId, page, size, format } = params;

  const queryParams: any = {
    query,
    page,
    size,
  };

  if (channelId) queryParams.channelid = channelId;
  if (programId) queryParams.programid = programId;
  if (format) queryParams.format = format;

  const response = await srClient.fetch<PaginatedResponse<SREpisode>>('episodes/search', queryParams);

  return {
    episodes: (response as any).episodes || [],
    pagination: response.pagination,
  };
}

export async function getEpisode(params: z.infer<typeof GetEpisodeSchema>) {
  const { episodeId, audioQuality, format } = params;

  const queryParams: any = { id: episodeId };
  if (audioQuality) queryParams.audioquality = audioQuality;
  if (format) queryParams.format = format;

  const response = await srClient.fetch<any>('episodes/get', queryParams);

  return {
    episode: response.episode || response,
  };
}

export async function getEpisodesBatch(params: z.infer<typeof GetEpisodesBatchSchema>) {
  const { episodeIds, audioQuality, format } = params;

  const queryParams: any = { ids: episodeIds };
  if (audioQuality) queryParams.audioquality = audioQuality;
  if (format) queryParams.format = format;

  const response = await srClient.fetch<PaginatedResponse<SREpisode>>('episodes/getlist', queryParams);

  return {
    episodes: (response as any).episodes || [],
  };
}

export async function getLatestEpisode(params: z.infer<typeof GetLatestEpisodeSchema>) {
  const { programId, audioQuality, format } = params;

  const queryParams: any = { programid: programId };
  if (audioQuality) queryParams.audioquality = audioQuality;
  if (format) queryParams.format = format;

  const response = await srClient.fetch<any>('episodes/getlatest', queryParams);

  return {
    episode: response.episode || response,
  };
}

// Export tool definitions
export const episodeTools = [
  {
    name: 'list_episodes',
    description: 'Lista alla avsnitt för ett radioprogram. Kan filtrera på datumintervall och välja ljudkvalitet.',
    schema: ListEpisodesSchema,
    inputSchema: {
      type: 'object',
      properties: {
        programId: {
          type: 'number',
          description: 'Program-ID',
        },
        fromDate: {
          type: 'string',
          description: 'Från datum (YYYY-MM-DD)',
        },
        toDate: {
          type: 'string',
          description: 'Till datum (YYYY-MM-DD)',
        },
        audioQuality: {
          type: 'string',
          enum: ['low', 'normal', 'hi'],
          description: 'Ljudkvalitet (default: hi)',
        },
        page: {
          type: 'number',
        },
        size: {
          type: 'number',
        },
        format: {
          type: 'string',
          enum: ['xml', 'json'],
          description: 'Svarsformat (default: json)',
        },
      },
      required: ['programId'],
    },
    handler: listEpisodes,
  },
  {
    name: 'search_episodes',
    description: 'Fulltextsök i avsnitt från Sveriges Radio. Sök i titlar, beskrivningar och innehåll.',
    schema: SearchEpisodesSchema,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Sökterm',
        },
        channelId: {
          type: 'number',
          description: 'Filtrera på kanal-ID',
        },
        programId: {
          type: 'number',
          description: 'Filtrera på program-ID',
        },
        page: {
          type: 'number',
        },
        size: {
          type: 'number',
        },
        format: {
          type: 'string',
          enum: ['xml', 'json'],
          description: 'Svarsformat (default: json)',
        },
      },
      required: ['query'],
    },
    handler: searchEpisodes,
  },
  {
    name: 'get_episode',
    description: 'Hämta ett specifikt avsnitt med fullständig information inklusive ljudfiler för streaming och nedladdning.',
    schema: GetEpisodeSchema,
    inputSchema: {
      type: 'object',
      properties: {
        episodeId: {
          type: 'number',
          description: 'Avsnitt-ID',
        },
        audioQuality: {
          type: 'string',
          enum: ['low', 'normal', 'hi'],
          description: 'Ljudkvalitet',
        },
        format: {
          type: 'string',
          enum: ['xml', 'json'],
          description: 'Svarsformat (default: json)',
        },
      },
      required: ['episodeId'],
    },
    handler: getEpisode,
  },
  {
    name: 'get_episodes_batch',
    description: 'Hämta flera avsnitt samtidigt i ett anrop (effektivt för att hämta flera episoder).',
    schema: GetEpisodesBatchSchema,
    inputSchema: {
      type: 'object',
      properties: {
        episodeIds: {
          type: 'string',
          description: 'Kommaseparerade avsnitt-ID, t.ex. "12345,67890,11111"',
        },
        audioQuality: {
          type: 'string',
          enum: ['low', 'normal', 'hi'],
        },
        format: {
          type: 'string',
          enum: ['xml', 'json'],
          description: 'Svarsformat (default: json)',
        },
      },
      required: ['episodeIds'],
    },
    handler: getEpisodesBatch,
  },
  {
    name: 'get_latest_episode',
    description: 'Hämta det senaste avsnittet för ett program (användbart för att alltid få det nyaste).',
    schema: GetLatestEpisodeSchema,
    inputSchema: {
      type: 'object',
      properties: {
        programId: {
          type: 'number',
          description: 'Program-ID',
        },
        audioQuality: {
          type: 'string',
          enum: ['low', 'normal', 'hi'],
        },
        format: {
          type: 'string',
          enum: ['xml', 'json'],
          description: 'Svarsformat (default: json)',
        },
      },
      required: ['programId'],
    },
    handler: getLatestEpisode,
  },
];
