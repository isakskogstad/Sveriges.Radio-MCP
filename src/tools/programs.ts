/**
 * Program Tools - Sveriges Radio MCP Server
 * 4 tools for searching and accessing radio programs
 */

import { z } from 'zod';
import { srClient } from '../lib/sr-client.js';
import type { PaginatedResponse, SRProgram, SRProgramCategory } from '../types/sr-api.js';

// Schemas
const SearchProgramsSchema = z.object({
  query: z.string().optional().describe('Textsökning i programnamn'),
  programCategoryId: z.number().optional().describe('Filtrera på kategori-ID'),
  channelId: z.number().optional().describe('Filtrera på kanal'),
  hasOnDemand: z.boolean().optional().describe('Endast program med podd'),
  isArchived: z.boolean().optional().describe('Visa arkiverade program'),
  filter: z.string().optional().describe('Filterfält (t.ex. "program.name")'),
  filterValue: z.string().optional().describe('Filtervärde'),
  sort: z.string().optional().describe('Sortering (t.ex. "name", "name+desc")'),
  page: z.number().min(1).optional(),
  size: z.number().min(1).max(100).optional(),
  format: z.enum(['xml', 'json']).optional().describe('Svarsformat (default: json)'),
});

const GetProgramSchema = z.object({
  programId: z.number().describe('Program-ID'),
  format: z.enum(['xml', 'json']).optional().describe('Svarsformat (default: json)'),
});

const ListProgramCategoriesSchema = z.object({
  categoryId: z.number().optional().describe('Hämta specifik kategori med detta ID'),
  page: z.number().min(1).optional(),
  size: z.number().min(1).max(100).optional(),
  format: z.enum(['xml', 'json']).optional().describe('Svarsformat (default: json)'),
});

const GetProgramScheduleSchema = z.object({
  programId: z.number().describe('Program-ID'),
  fromDate: z.string().optional().describe('Från datum (YYYY-MM-DD)'),
  toDate: z.string().optional().describe('Till datum (YYYY-MM-DD)'),
  page: z.number().min(1).optional(),
  size: z.number().min(1).max(100).optional(),
  format: z.enum(['xml', 'json']).optional().describe('Svarsformat (default: json)'),
});

const ListBroadcastsSchema = z.object({
  programId: z.number().describe('Program-ID'),
  page: z.number().min(1).optional(),
  size: z.number().min(1).max(100).optional(),
  format: z.enum(['xml', 'json']).optional().describe('Svarsformat (default: json)'),
});

const ListPodfilesSchema = z.object({
  programId: z.number().describe('Program-ID'),
  page: z.number().min(1).optional(),
  size: z.number().min(1).max(100).optional(),
  format: z.enum(['xml', 'json']).optional().describe('Svarsformat (default: json)'),
});

const GetPodfileSchema = z.object({
  podfileId: z.number().describe('Poddfil-ID'),
  format: z.enum(['xml', 'json']).optional().describe('Svarsformat (default: json)'),
});

// Tool handlers
export async function searchPrograms(params: z.infer<typeof SearchProgramsSchema>) {
  const { query, programCategoryId, channelId, hasOnDemand, isArchived, filter, filterValue, sort, page, size, format } = params;

  const queryParams: any = {};

  // SR API:s filter-parameter fungerar inte korrekt för textsökning.
  // Vi hämtar alla program och filtrerar klient-side istället.
  // Om användaren angett egna filter, använd dem.
  if (filter && filterValue) {
    queryParams.filter = filter;
    queryParams.filtervalue = filterValue;
  }

  // Lägg till övriga parametrar
  if (programCategoryId !== undefined) queryParams.programcategoryid = programCategoryId;
  if (channelId !== undefined) queryParams.channelid = channelId;
  if (hasOnDemand !== undefined) queryParams.hasondemand = hasOnDemand;
  if (isArchived !== undefined) queryParams.isarchived = isArchived;
  if (sort && !query) queryParams.sort = sort; // Endast om ingen query (vi sorterar själva)

  // Om textsökning: hämta fler resultat för klient-side filtrering
  if (query) {
    queryParams.size = 200; // Hämta fler för bättre sökresultat
    queryParams.page = 1;
  } else {
    if (page !== undefined) queryParams.page = page;
    if (size !== undefined) queryParams.size = size;
  }

  if (format) queryParams.format = format;

  const response = await srClient.fetch<PaginatedResponse<SRProgram>>('programs', queryParams);

  let programs = (response as any).programs || [];

  // Klient-side filtrering för bättre sökträffar om query angavs
  if (query) {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);

    // Sortera program efter relevans (hur väl de matchar söktermen)
    const scoredPrograms: Array<{ program: SRProgram; score: number }> = programs
      .map((program: SRProgram) => {
        const nameLower = program.name.toLowerCase();
        const descLower = (program.description || '').toLowerCase();

        // Beräkna relevanspoäng
        let score = 0;

        // Exakt match i namn = högst poäng
        if (nameLower === queryLower) score += 100;
        // Namn börjar med söktermen
        else if (nameLower.startsWith(queryLower)) score += 50;
        // Namn innehåller söktermen
        else if (nameLower.includes(queryLower)) score += 30;

        // Bonus för varje ord som matchar
        for (const word of queryWords) {
          if (nameLower.includes(word)) score += 10;
          if (descLower.includes(word)) score += 5;
        }

        return { program, score };
      });

    programs = scoredPrograms
      .filter((item: { program: SRProgram; score: number }) => item.score > 0)
      .sort((a: { program: SRProgram; score: number }, b: { program: SRProgram; score: number }) => b.score - a.score)
      .map((item: { program: SRProgram; score: number }) => item.program);

    // Begränsa antalet resultat om size angavs
    if (size) {
      programs = programs.slice(0, size);
    }
  }

  return {
    programs,
    pagination: query ? {
      ...response.pagination,
      totalhits: programs.length,
      note: 'Klient-side filtrering använd för bättre sökresultat',
    } : response.pagination,
    searchInfo: query ? {
      method: 'client_side_relevance_ranking',
      note: 'SR API har begränsad sökfunktion. Resultat hämtade och sorterade efter relevans lokalt.',
    } : undefined,
  };
}

export async function getProgram(params: z.infer<typeof GetProgramSchema>) {
  const { programId, format } = params;

  const queryParams: any = {};
  if (format) queryParams.format = format;

  const response = await srClient.fetch<any>(`programs/${programId}`, queryParams);

  return {
    program: response.program || response,
  };
}

export async function listProgramCategories(params: z.infer<typeof ListProgramCategoriesSchema>) {
  const { categoryId, page, size, format } = params;

  // If specific category requested
  if (categoryId !== undefined) {
    const queryParams: any = {};
    if (format) queryParams.format = format;

    const response = await srClient.fetch<any>(`programcategories/${categoryId}`, queryParams);
    return {
      category: response.programcategory || response,
    };
  }

  // Otherwise list all categories
  const queryParams: any = {};
  if (page !== undefined) queryParams.page = page;
  if (size !== undefined) queryParams.size = size;
  if (format) queryParams.format = format;

  const response = await srClient.fetch<PaginatedResponse<SRProgramCategory>>('programcategories', queryParams);

  return {
    categories: (response as any).programcategories || [],
    pagination: response.pagination,
  };
}

export async function getProgramSchedule(params: z.infer<typeof GetProgramScheduleSchema>) {
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
    schedule: (response as any).schedule || [],
    pagination: response.pagination,
  };
}

export async function listBroadcasts(params: z.infer<typeof ListBroadcastsSchema>) {
  const { programId, page, size, format } = params;

  const queryParams: any = {
    programid: programId,
    page,
    size,
  };

  if (format) queryParams.format = format;

  const response = await srClient.fetch<any>('broadcasts', queryParams);

  return {
    broadcasts: (response as any).broadcasts || [],
    pagination: response.pagination,
    programName: (response as any).name,
  };
}

export async function listPodfiles(params: z.infer<typeof ListPodfilesSchema>) {
  const { programId, page, size, format } = params;

  const queryParams: any = {
    programid: programId,
    page,
    size,
  };

  if (format) queryParams.format = format;

  const response = await srClient.fetch<any>('podfiles', queryParams);

  return {
    podfiles: (response as any).podfiles || [],
    pagination: response.pagination,
  };
}

export async function getPodfile(params: z.infer<typeof GetPodfileSchema>) {
  const { podfileId, format } = params;

  const queryParams: any = {};
  if (format) queryParams.format = format;

  const response = await srClient.fetch<any>(`podfiles/${podfileId}`, queryParams);

  return {
    podfile: response.podfile || response,
  };
}

// Export tool definitions
export const programTools = [
  {
    name: 'search_programs',
    description: 'Sök efter radioprogram i Sveriges Radio. Söker i programnamn med relevansranking. TIPS: För bättre resultat, använd programCategoryId eller channelId som filter. Exempel: channelId=164 för P3-program, programCategoryId=82 för dokumentärer.',
    schema: SearchProgramsSchema,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Textsökning i programnamn (resultaten sorteras efter relevans)',
        },
        programCategoryId: {
          type: 'number',
          description: 'Filtrera på kategori-ID (använd list_program_categories för att se alla)',
        },
        channelId: {
          type: 'number',
          description: 'Filtrera på kanal-ID',
        },
        hasOnDemand: {
          type: 'boolean',
          description: 'Endast program som finns som podd/on-demand',
        },
        isArchived: {
          type: 'boolean',
          description: 'Inkludera arkiverade program',
        },
        sort: {
          type: 'string',
          description: 'Sortering, t.ex. "name" eller "name+desc"',
        },
        page: {
          type: 'number',
          description: 'Sidnummer',
        },
        size: {
          type: 'number',
          description: 'Antal per sida (max 100)',
        },
        format: {
          type: 'string',
          enum: ['xml', 'json'],
          description: 'Svarsformat (default: json)',
        },
      },
    },
    handler: searchPrograms,
  },
  {
    name: 'get_program',
    description: 'Hämta detaljerad information om ett specifikt radioprogram inklusive beskrivning, kanal, kontaktinfo och poddgrupper.',
    schema: GetProgramSchema,
    inputSchema: {
      type: 'object',
      properties: {
        programId: {
          type: 'number',
          description: 'Program-ID',
        },
        format: {
          type: 'string',
          enum: ['xml', 'json'],
          description: 'Svarsformat (default: json)',
        },
      },
      required: ['programId'],
    },
    handler: getProgram,
  },
  {
    name: 'list_program_categories',
    description: 'Lista alla programkategorier i Sveriges Radio (t.ex. Nyheter, Musik, Sport, Kultur, Samhälle) eller hämta en specifik kategori.',
    schema: ListProgramCategoriesSchema,
    inputSchema: {
      type: 'object',
      properties: {
        categoryId: {
          type: 'number',
          description: 'Hämta specifik kategori med detta ID (valfri)',
        },
        page: {
          type: 'number',
          description: 'Sidnummer',
        },
        size: {
          type: 'number',
          description: 'Antal per sida',
        },
        format: {
          type: 'string',
          enum: ['xml', 'json'],
          description: 'Svarsformat (default: json)',
        },
      },
    },
    handler: listProgramCategories,
  },
  {
    name: 'get_program_schedule',
    description: 'Hämta tablå/schema för ett specifikt program - när det sänds och på vilka kanaler.',
    schema: GetProgramScheduleSchema,
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
          description: 'Sidnummer',
        },
        size: {
          type: 'number',
          description: 'Antal per sida',
        },
        format: {
          type: 'string',
          enum: ['xml', 'json'],
          description: 'Svarsformat (default: json)',
        },
      },
      required: ['programId'],
    },
    handler: getProgramSchedule,
  },
  {
    name: 'list_broadcasts',
    description: 'Lista alla tillgängliga sändningar för ett specifikt program. Sändningar är tillgängliga i 30 dagar efter publicering.',
    schema: ListBroadcastsSchema,
    inputSchema: {
      type: 'object',
      properties: {
        programId: {
          type: 'number',
          description: 'Program-ID',
        },
        page: {
          type: 'number',
          description: 'Sidnummer',
        },
        size: {
          type: 'number',
          description: 'Antal per sida',
        },
        format: {
          type: 'string',
          enum: ['xml', 'json'],
          description: 'Svarsformat (default: json)',
        },
      },
      required: ['programId'],
    },
    handler: listBroadcasts,
  },
  {
    name: 'list_podfiles',
    description: 'Lista alla tillgängliga poddfiler för ett specifikt program. Returnerar poddfilernas metadata inklusive URL för nedladdning.',
    schema: ListPodfilesSchema,
    inputSchema: {
      type: 'object',
      properties: {
        programId: {
          type: 'number',
          description: 'Program-ID',
        },
        page: {
          type: 'number',
          description: 'Sidnummer',
        },
        size: {
          type: 'number',
          description: 'Antal per sida',
        },
        format: {
          type: 'string',
          enum: ['xml', 'json'],
          description: 'Svarsformat (default: json)',
        },
      },
      required: ['programId'],
    },
    handler: listPodfiles,
  },
  {
    name: 'get_podfile',
    description: 'Hämta en specifik poddfil med fullständig information inklusive URL, storlek, längd och publiceringsdatum.',
    schema: GetPodfileSchema,
    inputSchema: {
      type: 'object',
      properties: {
        podfileId: {
          type: 'number',
          description: 'Poddfil-ID',
        },
        format: {
          type: 'string',
          enum: ['xml', 'json'],
          description: 'Svarsformat (default: json)',
        },
      },
      required: ['podfileId'],
    },
    handler: getPodfile,
  },
];
