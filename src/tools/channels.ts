/**
 * Channel Tools - Sveriges Radio MCP Server
 * 2 tools for accessing radio channels and live broadcasts
 */

import { z } from 'zod';
import { srClient } from '../lib/sr-client.js';
import type { PaginatedResponse, SRChannel, SRScheduleChannel } from '../types/sr-api.js';

// Schemas
const ListChannelsSchema = z.object({
  channelId: z.number().optional().describe('Specifikt kanal-ID (valfritt)'),
  channelType: z.enum(['Rikskanal', 'Lokal kanal']).optional().describe('Filtrera på kanaltyp'),
  audioQuality: z.enum(['low', 'normal', 'hi']).optional().describe('Ljudkvalitet (default: hi)'),
  pagination: z.boolean().optional().describe('Aktivera paginering'),
  page: z.number().min(1).optional().describe('Sidnummer'),
  size: z.number().min(1).max(100).optional().describe('Antal per sida'),
});

const GetChannelRightNowSchema = z.object({
  channelId: z.number().optional().describe('Specifik kanal (om null = alla kanaler)'),
  sortBy: z.enum(['channel.name']).optional().describe('Sortering'),
});

// Tool handlers
export async function listChannels(params: z.infer<typeof ListChannelsSchema>) {
  const { channelId, channelType, ...rest } = params;

  const endpoint = channelId ? `channels/${channelId}` : 'channels';

  const queryParams: any = { ...rest };
  if (channelType) {
    queryParams.filter = 'channel.channeltype';
    queryParams.filtervalue = channelType;
  }

  const response = await srClient.fetch<PaginatedResponse<SRChannel>>(endpoint, queryParams);

  if (channelId) {
    // Single channel response
    return {
      channel: (response as any).channel || response,
    };
  }

  return {
    channels: (response as any).channels || [],
    pagination: response.pagination,
  };
}

export async function getChannelRightNow(params: z.infer<typeof GetChannelRightNowSchema>) {
  const { channelId, sortBy } = params;

  const endpoint = 'scheduledepisodes/rightnow';
  const queryParams: any = {};

  if (channelId) {
    queryParams.channelid = channelId;
  }
  if (sortBy) {
    queryParams.sort = sortBy;
  }

  const response = await srClient.fetch<PaginatedResponse<SRScheduleChannel>>(endpoint, queryParams);

  if (channelId) {
    return {
      channel: (response as any).channel || (response as any).channels?.[0],
    };
  }

  return {
    channels: (response as any).channels || [],
    pagination: response.pagination,
  };
}

// Export tool definitions for MCP server
export const channelTools = [
  {
    name: 'list_channels',
    description: 'Lista alla radiokanaler från Sveriges Radio (P1, P2, P3, P4, lokala kanaler). Inkluderar live stream-länkar och kanalinformation.',
    inputSchema: {
      type: 'object',
      properties: {
        channelId: {
          type: 'number',
          description: 'Specifikt kanal-ID (valfritt). Exempel: 132 (P1), 163 (P2), 164 (P3)',
        },
        channelType: {
          type: 'string',
          enum: ['Rikskanal', 'Lokal kanal'],
          description: 'Filtrera på kanaltyp',
        },
        audioQuality: {
          type: 'string',
          enum: ['low', 'normal', 'hi'],
          description: 'Ljudkvalitet (default: hi)',
        },
        pagination: {
          type: 'boolean',
          description: 'Aktivera paginering (default: true)',
        },
        page: {
          type: 'number',
          description: 'Sidnummer',
        },
        size: {
          type: 'number',
          description: 'Antal resultat per sida (max 100)',
        },
      },
    },
    handler: listChannels,
  },
  {
    name: 'get_channel_rightnow',
    description: 'Visa vad som sänds JUST NU på Sveriges Radio. Kan visa en specifik kanal eller alla kanaler samtidigt med föregående, nuvarande och nästa program.',
    inputSchema: {
      type: 'object',
      properties: {
        channelId: {
          type: 'number',
          description: 'Specifik kanal (om inte angiven = alla kanaler). Exempel: 132 (P1), 164 (P3)',
        },
        sortBy: {
          type: 'string',
          enum: ['channel.name'],
          description: 'Sortera efter kanalnamn',
        },
      },
    },
    handler: getChannelRightNow,
  },
];
