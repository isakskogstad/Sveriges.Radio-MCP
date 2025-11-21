/**
 * Miscellaneous Tools - Sveriges Radio MCP Server
 * Toplists (2), Extra broadcasts (1), Groups (1), Search all (1), Audio templates (2) = 7 tools
 */

import { z } from 'zod';
import { srClient } from '../lib/sr-client.js';
import type { PaginatedResponse, SRTopStory, SRExtraBroadcast } from '../types/sr-api.js';

// Schemas
const GetRecentlyPublishedSchema = z.object({
  audioQuality: z.enum(['low', 'normal', 'hi']).optional(),
  page: z.number().min(1).optional(),
  size: z.number().min(1).max(100).optional(),
});

const GetTopStoriesSchema = z.object({
  programId: z.number().optional().describe('Program-ID (om null = SR förstasida)'),
});

const ListExtraBroadcastsSchema = z.object({
  date: z.string().optional().describe('Datum (YYYY-MM-DD)'),
  sort: z.enum(['localstarttime', 'channel']).optional(),
  page: z.number().min(1).optional(),
  size: z.number().min(1).max(100).optional(),
});

const GetEpisodeGroupSchema = z.object({
  groupId: z.number().describe('Grupp-ID'),
  page: z.number().min(1).optional(),
  size: z.number().min(1).max(100).optional(),
});

const SearchAllSchema = z.object({
  query: z.string().describe('Sökterm'),
  searchIn: z.enum(['programs', 'episodes', 'channels', 'all']).optional().describe('Var ska det sökas'),
  limit: z.number().min(1).max(50).optional().describe('Max antal resultat per kategori'),
});

const ListOnDemandAudioTemplatesSchema = z.object({});

const ListLiveAudioTemplatesSchema = z.object({});

// Tool handlers
export async function getRecentlyPublished(params: z.infer<typeof GetRecentlyPublishedSchema>) {
  const { audioQuality, page, size } = params;

  const queryParams: any = { page, size };
  if (audioQuality) queryParams.audioquality = audioQuality;

  const response = await srClient.fetch<any>('lastpublished', queryParams);

  return {
    shows: (response as any).shows || [],
    pagination: response.pagination,
  };
}

export async function getTopStories(params: z.infer<typeof GetTopStoriesSchema>) {
  const { programId } = params;

  const queryParams: any = {};
  if (programId) queryParams.programid = programId;

  const response = await srClient.fetch<PaginatedResponse<SRTopStory>>('topstories', queryParams);

  return {
    topstories: (response as any).shows || (response as any).topstories || [],
    pagination: response.pagination,
  };
}

export async function listExtraBroadcasts(params: z.infer<typeof ListExtraBroadcastsSchema>) {
  const { date, sort, page, size } = params;

  const queryParams: any = { page, size };
  if (date) queryParams.date = date;
  if (sort) queryParams.sort = sort;

  const response = await srClient.fetch<PaginatedResponse<SRExtraBroadcast>>('extra/broadcasts', queryParams);

  return {
    broadcasts: (response as any).broadcasts || [],
    pagination: response.pagination,
  };
}

export async function getEpisodeGroup(params: z.infer<typeof GetEpisodeGroupSchema>) {
  const { groupId, page, size } = params;

  const queryParams: any = { id: groupId, page, size };

  const response = await srClient.fetch<any>('episodes/group', queryParams);

  return {
    group: {
      id: (response as any).episodegroup?.id || groupId,
      title: (response as any).episodegroup?.title,
      description: (response as any).episodegroup?.description,
      episodes: (response as any).episodegroup?.episodes || [],
    },
    pagination: response.pagination,
  };
}

export async function searchAll(params: z.infer<typeof SearchAllSchema>) {
  const { query, searchIn = 'all', limit = 10 } = params;

  const results: any = {};

  // Search programs
  if (searchIn === 'all' || searchIn === 'programs') {
    try {
      const programsResponse = await srClient.fetch<any>('programs', {
        filter: 'program.name',
        filtervalue: query,
        size: limit,
      });
      results.programs = (programsResponse as any).programs || [];
    } catch (error) {
      results.programs = [];
    }
  }

  // Search episodes
  if (searchIn === 'all' || searchIn === 'episodes') {
    try {
      const episodesResponse = await srClient.fetch<any>('episodes/search', {
        query,
        size: limit,
      });
      results.episodes = (episodesResponse as any).episodes || [];
    } catch (error) {
      results.episodes = [];
    }
  }

  // Search channels
  if (searchIn === 'all' || searchIn === 'channels') {
    try {
      const channelsResponse = await srClient.fetch<any>('channels', {
        filter: 'channel.name',
        filtervalue: query,
        size: limit,
      });
      results.channels = (channelsResponse as any).channels || [];
    } catch (error) {
      results.channels = [];
    }
  }

  return {
    query,
    searchIn,
    results,
    totalResults:
      (results.programs?.length || 0) +
      (results.episodes?.length || 0) +
      (results.channels?.length || 0),
  };
}

export async function listOnDemandAudioTemplates(_params: z.infer<typeof ListOnDemandAudioTemplatesSchema>) {
  const response = await srClient.fetch<any>('audiourltemplates/ondemandaudiotypes', {});

  return {
    templates: (response as any).audiourltemplates || [],
    description: 'URL-mallar för on-demand-ljud. Använd [quality]=hi/normal/lo, [audioId]=avsnitt-ID',
  };
}

export async function listLiveAudioTemplates(_params: z.infer<typeof ListLiveAudioTemplatesSchema>) {
  const response = await srClient.fetch<any>('audiourltemplates/liveaudiotypes', {});

  return {
    templates: (response as any).audiourltemplates || [],
    description: 'URL-mallar för live-ljud. Använd [quality]=hi/normal/lo, [channelid]=kanal-ID',
  };
}

// Export tool definitions
export const miscTools = [
  {
    name: 'get_recently_published',
    description: 'Hämta senast publicerade sändningar och poddar från Sveriges Radio. Perfekt för att se vad som är nytt!',
    schema: GetRecentlyPublishedSchema,
    inputSchema: {
      type: 'object',
      properties: {
        audioQuality: {
          type: 'string',
          enum: ['low', 'normal', 'hi'],
        },
        page: {
          type: 'number',
        },
        size: {
          type: 'number',
        },
      },
    },
    handler: getRecentlyPublished,
  },
  {
    name: 'get_top_stories',
    description: 'Hämta toppuffar (featured content) från Sveriges Radio. Kan hämta från SR:s förstasida eller ett specifikt program.',
    schema: GetTopStoriesSchema,
    inputSchema: {
      type: 'object',
      properties: {
        programId: {
          type: 'number',
          description: 'Program-ID (om inte angiven = SR:s förstasida)',
        },
      },
    },
    handler: getTopStories,
  },
  {
    name: 'list_extra_broadcasts',
    description: 'Lista extrasändningar (sport, special events) från Sveriges Radio.',
    schema: ListExtraBroadcastsSchema,
    inputSchema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Datum (YYYY-MM-DD)',
        },
        sort: {
          type: 'string',
          enum: ['localstarttime', 'channel'],
          description: 'Sortera efter starttid eller kanal',
        },
        page: {
          type: 'number',
        },
        size: {
          type: 'number',
        },
      },
    },
    handler: listExtraBroadcasts,
  },
  {
    name: 'get_episode_group',
    description: 'Hämta en grupp/samling av avsnitt (t.ex. "Kända kriminalfall", "Sommarens bästa dokumentärer").',
    schema: GetEpisodeGroupSchema,
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'number',
          description: 'Grupp-ID',
        },
        page: {
          type: 'number',
        },
        size: {
          type: 'number',
        },
      },
      required: ['groupId'],
    },
    handler: getEpisodeGroup,
  },
  {
    name: 'search_all',
    description: 'Global sökning över program, avsnitt och kanaler samtidigt. Perfekt för att hitta innehåll när du inte vet exakt var det finns!',
    schema: SearchAllSchema,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Sökterm',
        },
        searchIn: {
          type: 'string',
          enum: ['programs', 'episodes', 'channels', 'all'],
          description: 'Var ska det sökas (default: all)',
        },
        limit: {
          type: 'number',
          description: 'Max antal resultat per kategori (max 50)',
        },
      },
      required: ['query'],
    },
    handler: searchAll,
  },
  {
    name: 'list_ondemand_audio_templates',
    description: 'Hämta URL-mallar för on-demand-ljud (podcast/avsnitt). Mallarna visar hur ljudlänkar är uppbyggda med platshållare som [quality] och [audioId].',
    schema: ListOnDemandAudioTemplatesSchema,
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: listOnDemandAudioTemplates,
  },
  {
    name: 'list_live_audio_templates',
    description: 'Hämta URL-mallar för live-ljud (direktsändning). Mallarna visar hur ljudlänkar är uppbyggda med platshållare som [quality] och [channelid].',
    schema: ListLiveAudioTemplatesSchema,
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: listLiveAudioTemplates,
  },
];
