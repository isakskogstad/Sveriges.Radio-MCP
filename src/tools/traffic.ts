/**
 * Traffic Tools - Sveriges Radio MCP Server
 * 2 tools for accessing traffic messages and areas
 */

import { z } from 'zod';
import { srClient } from '../lib/sr-client.js';
import type { PaginatedResponse, SRTrafficMessage } from '../types/sr-api.js';

// Schemas
const GetTrafficMessagesSchema = z.object({
  trafficAreaName: z.string().optional().describe('Trafikområde (t.ex. "Stockholm", "Uppland")'),
  date: z.string().optional().describe('Datum (YYYY-MM-DD)'),
  page: z.number().min(1).optional(),
  size: z.number().min(1).max(100).optional(),
  format: z.enum(['xml', 'json']).optional().describe('Svarsformat (default: json)'),
});

const GetTrafficAreasSchema = z.object({
  latitude: z.number().optional().describe('Latitud (för GPS-sökning)'),
  longitude: z.number().optional().describe('Longitud (för GPS-sökning)'),
  page: z.number().min(1).optional().describe('Sidnummer (endast vid hämtning av alla områden)'),
  size: z.number().min(1).max(100).optional().describe('Sidstorlek (endast vid hämtning av alla områden)'),
  format: z.enum(['xml', 'json']).optional().describe('Svarsformat (default: json)'),
});

// Tool handlers
export async function getTrafficMessages(params: z.infer<typeof GetTrafficMessagesSchema>) {
  const { trafficAreaName, date, page, size, format } = params;

  const queryParams: any = { page, size };
  if (trafficAreaName) queryParams.trafficareaname = trafficAreaName;
  if (date) queryParams.date = date;
  if (format) queryParams.format = format;

  const response = await srClient.fetch<PaginatedResponse<SRTrafficMessage>>('traffic/messages', queryParams);

  return {
    messages: (response as any).messages || [],
    pagination: response.pagination,
  };
}

export async function getTrafficAreas(params: z.infer<typeof GetTrafficAreasSchema>) {
  const { latitude, longitude, page, size, format } = params;

  const queryParams: any = {};
  if (latitude !== undefined) queryParams.latitude = latitude;
  if (longitude !== undefined) queryParams.longitude = longitude;
  if (page !== undefined) queryParams.page = page;
  if (size !== undefined) queryParams.size = size;
  if (format) queryParams.format = format;

  const response = await srClient.fetch<any>('traffic/areas', queryParams);

  // If GPS coordinates provided, returns single area
  if (latitude !== undefined && longitude !== undefined) {
    return {
      area: (response as any).area || response,
    };
  }

  // Otherwise returns all areas
  return {
    areas: (response as any).areas || [],
    pagination: response.pagination,
  };
}

// Export tool definitions
export const trafficTools = [
  {
    name: 'get_traffic_messages',
    description: 'Hämta trafikmeddelanden (olyckor, köer, störningar) från Sveriges Radio. Kan filtrera på område och datum. Priority: 1=Mycket allvarlig, 5=Mindre störning.',
    schema: GetTrafficMessagesSchema,
    inputSchema: {
      type: 'object',
      properties: {
        trafficAreaName: {
          type: 'string',
          description: 'Trafikområde, t.ex. "Stockholm", "Uppland", "Norrbotten"',
        },
        date: {
          type: 'string',
          description: 'Datum för meddelanden (YYYY-MM-DD)',
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
    handler: getTrafficMessages,
  },
  {
    name: 'get_traffic_areas',
    description: 'Hämta trafikområden. Kan användas med GPS-koordinater för att hitta vilket område en position tillhör, eller utan parametrar för att lista alla områden.',
    schema: GetTrafficAreasSchema,
    inputSchema: {
      type: 'object',
      properties: {
        latitude: {
          type: 'number',
          description: 'Latitud (för GPS-sökning)',
        },
        longitude: {
          type: 'number',
          description: 'Longitud (för GPS-sökning)',
        },
        page: {
          type: 'number',
          description: 'Sidnummer (endast vid hämtning av alla områden)',
        },
        size: {
          type: 'number',
          description: 'Sidstorlek (endast vid hämtning av alla områden)',
        },
        format: {
          type: 'string',
          enum: ['xml', 'json'],
          description: 'Svarsformat (default: json)',
        },
      },
    },
    handler: getTrafficAreas,
  },
];
