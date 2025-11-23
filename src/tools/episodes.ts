/**
 * Episode Tools - Sveriges Radio MCP Server
 * 5 tools for accessing radio episodes and podcasts
 */

import { z } from 'zod';
import { srClient } from '../lib/sr-client.js';
import type { PaginatedResponse, SREpisode } from '../types/sr-api.js';
import {
  programIdSchema,
  episodeIdSchema,
  iso8601DateSchema,
  audioQualitySchema,
  formatSchema,
  paginationSchema,
  searchQuerySchema,
  channelIdSchema,
} from '../lib/validation.js';

// Schemas
const ListEpisodesSchema = z
  .object({
    programId: programIdSchema.describe('Program-ID'),
    fromDate: iso8601DateSchema.optional().describe('Från datum (YYYY-MM-DD)'),
    toDate: iso8601DateSchema.optional().describe('Till datum (YYYY-MM-DD)'),
    audioQuality: audioQualitySchema.optional().describe('Ljudkvalitet'),
    page: paginationSchema.page,
    size: paginationSchema.size,
    format: formatSchema.optional().describe('Svarsformat (default: json)'),
  })
  .refine(
    (data) => {
      if (data.fromDate && data.toDate) {
        return new Date(data.fromDate) <= new Date(data.toDate);
      }
      return true;
    },
    {
      message: 'fromDate must be before or equal to toDate',
      path: ['toDate'],
    }
  );

const SearchEpisodesSchema = z.object({
  query: searchQuerySchema.describe('Sökterm'),
  channelId: channelIdSchema.optional().describe('Filtrera på kanal'),
  programId: programIdSchema.optional().describe('Filtrera på program'),
  page: paginationSchema.page,
  size: paginationSchema.size,
  format: formatSchema.optional().describe('Svarsformat (default: json)'),
});

const GetEpisodeSchema = z.object({
  episodeId: episodeIdSchema.describe('Avsnitt-ID'),
  audioQuality: audioQualitySchema.optional().describe('Ljudkvalitet'),
  format: formatSchema.optional().describe('Svarsformat (default: json)'),
});

const GetEpisodesBatchSchema = z.object({
  episodeIds: z
    .string()
    .describe('Kommaseparerade avsnitt-ID (t.ex. "123,456,789"). Max 50 ID per anrop')
    .refine(
      (val) => {
        const ids = val.split(',').map((id) => id.trim()).filter(Boolean);
        return ids.length > 0 && ids.length <= 50;
      },
      {
        message: 'episodeIds must contain between 1 and 50 comma-separated IDs',
      }
    )
    .refine(
      (val) => {
        const ids = val.split(',').map((id) => id.trim()).filter(Boolean);
        return ids.every((id) => /^\d+$/.test(id));
      },
      {
        message: 'All episode IDs must be valid positive integers',
      }
    ),
  audioQuality: audioQualitySchema.optional(),
  format: formatSchema.optional().describe('Svarsformat (default: json)'),
});

const GetLatestEpisodeSchema = z.object({
  programId: programIdSchema.describe('Program-ID'),
  audioQuality: audioQualitySchema.optional(),
  format: formatSchema.optional().describe('Svarsformat (default: json)'),
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

  // Parse and validate individual IDs
  const ids = episodeIds
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => parseInt(id, 10));

  const results: Array<{ id: number; data: any }> = [];
  const errors: Array<{ id: number; error: string }> = [];

  // Fetch each episode individually to support partial success
  for (const id of ids) {
    try {
      const queryParams: any = { id };
      if (audioQuality) queryParams.audioquality = audioQuality;
      if (format) queryParams.format = format;

      const response = await srClient.fetch<any>('episodes/get', queryParams);
      results.push({
        id,
        data: response.episode || response,
      });
    } catch (error: any) {
      errors.push({
        id,
        error: error.message || 'Episode not found',
      });
    }
  }

  return {
    success: errors.length === 0,
    results,
    errors,
    metadata: {
      total: ids.length,
      successful: results.length,
      failed: errors.length,
      maxBatchSize: 50,
    },
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
    description: 'Hämta flera avsnitt samtidigt med partial success support. Returnerar både lyckade resultat och fel för varje ID. Max 50 ID per anrop.',
    schema: GetEpisodesBatchSchema,
    inputSchema: {
      type: 'object',
      properties: {
        episodeIds: {
          type: 'string',
          description: 'Kommaseparerade avsnitt-ID, t.ex. "12345,67890,11111". Max 50 ID.',
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
