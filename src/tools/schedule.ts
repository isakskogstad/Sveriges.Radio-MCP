/**
 * Schedule Tools - Sveriges Radio MCP Server
 * 3 tools for accessing radio schedules and TV guide-style information
 */

import { z } from 'zod';
import { srClient } from '../lib/sr-client.js';
import type { PaginatedResponse, SRScheduleChannel } from '../types/sr-api.js';

// Schemas
const GetChannelScheduleSchema = z.object({
  channelId: z.number().describe('Kanal-ID'),
  date: z.string().optional().describe('Datum (YYYY-MM-DD), default=idag'),
  page: z.number().min(1).optional(),
  size: z.number().min(1).max(100).optional(),
  format: z.enum(['xml', 'json']).optional().describe('Svarsformat (default: json)'),
});

const GetProgramBroadcastsSchema = z.object({
  programId: z.number().describe('Program-ID'),
  fromDate: z.string().optional().describe('Från datum (YYYY-MM-DD)'),
  toDate: z.string().optional().describe('Till datum (YYYY-MM-DD)'),
  page: z.number().min(1).optional(),
  size: z.number().min(1).max(100).optional(),
  format: z.enum(['xml', 'json']).optional().describe('Svarsformat (default: json)'),
});

const GetAllRightNowSchema = z.object({
  channelId: z.number().optional().describe('Kanal-ID (valfri) - om angiven returneras endast den kanalen'),
  sortBy: z.enum(['channel.name']).optional().describe('Sortera efter kanalnamn'),
  page: z.number().min(1).optional(),
  size: z.number().min(1).max(100).optional(),
  format: z.enum(['xml', 'json']).optional().describe('Svarsformat (default: json)'),
});

// Tool handlers
export async function getChannelSchedule(params: z.infer<typeof GetChannelScheduleSchema>) {
  const { channelId, date, page, size, format } = params;

  const queryParams: any = {
    channelid: channelId,
    page,
    size,
  };

  if (date) queryParams.date = date;
  if (format) queryParams.format = format;

  const response = await srClient.fetch<any>('scheduledepisodes', queryParams);

  return {
    schedule: (response as any).schedule || [],
    pagination: response.pagination,
    channelId,
    date: date || new Date().toISOString().split('T')[0],
  };
}

export async function getProgramBroadcasts(params: z.infer<typeof GetProgramBroadcastsSchema>) {
  const { programId, fromDate, toDate, page, size, format } = params;

  const queryParams: any = {
    programid: programId,
    page,
    size,
  };

  if (fromDate) queryParams.fromdate = fromDate;
  if (toDate) queryParams.todate = toDate;
  if (format) queryParams.format = format;

  const response = await srClient.fetch<any>('scheduledepisodes', queryParams);

  return {
    broadcasts: (response as any).schedule || [],
    pagination: response.pagination,
    programId,
  };
}

export async function getAllRightNow(params: z.infer<typeof GetAllRightNowSchema>) {
  const { channelId, sortBy, page, size, format } = params;

  const queryParams: any = { page, size };
  if (channelId !== undefined) queryParams.channelid = channelId;
  if (sortBy) queryParams.sort = sortBy;
  if (format) queryParams.format = format;

  const response = await srClient.fetch<PaginatedResponse<SRScheduleChannel>>('scheduledepisodes/rightnow', queryParams);

  // If single channel requested, return single channel
  if (channelId !== undefined) {
    return {
      channel: (response as any).channel || null,
      timestamp: new Date().toISOString(),
    };
  }

  // Otherwise return all channels
  return {
    channels: (response as any).channels || [],
    pagination: response.pagination,
    timestamp: new Date().toISOString(),
  };
}

// Export tool definitions
export const scheduleTools = [
  {
    name: 'get_channel_schedule',
    description: 'Hämta tablå (TV guide-style) för en radiokanal på ett specifikt datum. Visar kronologiskt vad som sänds hela dagen.',
    schema: GetChannelScheduleSchema,
    inputSchema: {
      type: 'object',
      properties: {
        channelId: {
          type: 'number',
          description: 'Kanal-ID (t.ex. 132 för P1, 164 för P3)',
        },
        date: {
          type: 'string',
          description: 'Datum (YYYY-MM-DD). Om inte angivet = dagens datum.',
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
      required: ['channelId'],
    },
    handler: getChannelSchedule,
  },
  {
    name: 'get_program_broadcasts',
    description: 'Hämta kommande sändningar för ett specifikt program. Se när programmet sänds framöver.',
    schema: GetProgramBroadcastsSchema,
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
    handler: getProgramBroadcasts,
  },
  {
    name: 'get_all_rightnow',
    description: 'Översikt av vad som sänds JUST NU på ALLA Sveriges Radio-kanaler samtidigt (eller en specifik kanal). Perfekt för att se vad som finns att lyssna på.',
    schema: GetAllRightNowSchema,
    inputSchema: {
      type: 'object',
      properties: {
        channelId: {
          type: 'number',
          description: 'Kanal-ID (valfri) - om angiven returneras endast den kanalen istället för alla',
        },
        sortBy: {
          type: 'string',
          enum: ['channel.name'],
          description: 'Sortera alfabetiskt efter kanalnamn',
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
    },
    handler: getAllRightNow,
  },
];
