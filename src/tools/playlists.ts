/**
 * Playlist Tools - Sveriges Radio MCP Server
 * Komplett implementering av SR:s Musik API enligt officiell dokumentation
 *
 * API-metoder:
 * 1. "Just nu" - Låtlista per kanal (rightnow)
 * 2. Kanals låtlista för tidsintervall (getplaylistbychannelid)
 * 3. Programs låtlista för tidsintervall (getplaylistbyprogramid)
 * 4. Ett programavsnitts låtlista (getplaylistbyepisodeid)
 */

import { z } from 'zod';
import { srClient } from '../lib/sr-client.js';
import type { SRPlaylist, SRSongList } from '../types/sr-api.js';

// ========================================
// Schemas
// ========================================

/**
 * Schema för "Just nu" - låtlista per kanal
 * URL: /api/v2/playlists/rightnow?channelid={id}
 */
const GetPlaylistRightNowSchema = z.object({
  channelId: z.number().describe('Kanal-ID (obligatorisk). Hämta kanaler med get_channels'),
  format: z.enum(['xml', 'json']).optional().describe('Svarsformat (default: json)'),
});

/**
 * Schema för kanals låtlista för tidsintervall
 * URL: /api/v2/playlists/getplaylistbychannelid
 */
const GetChannelPlaylistSchema = z.object({
  channelId: z.number().describe('Kanal-ID (obligatorisk)'),
  startDateTime: z.string().optional().describe('Startdatum och tid (format: YYYY-MM-DD eller YYYY-MM-DDTHH:MM:SS). Default: dagens datum'),
  endDateTime: z.string().optional().describe('Slutdatum och tid (format: YYYY-MM-DD eller YYYY-MM-DDTHH:MM:SS). Default: startDateTime + 1 dag'),
  size: z.number().min(1).max(100).optional().describe('Sidstorlek (default: 20, max: 100)'),
  page: z.number().min(1).optional().describe('Sidnummer för paginering'),
  format: z.enum(['xml', 'json']).optional().describe('Svarsformat (default: json)'),
});

/**
 * Schema för programs låtlista för tidsintervall
 * URL: /api/v2/playlists/getplaylistbyprogramid
 */
const GetProgramPlaylistSchema = z.object({
  programId: z.number().describe('Program-ID (obligatorisk)'),
  startDateTime: z.string().optional().describe('Startdatum och tid (format: YYYY-MM-DD eller YYYY-MM-DDTHH:MM:SS). Default: dagens datum'),
  endDateTime: z.string().optional().describe('Slutdatum och tid (format: YYYY-MM-DD eller YYYY-MM-DDTHH:MM:SS). Default: startDateTime + 1 dag'),
  size: z.number().min(1).max(100).optional().describe('Sidstorlek (default: 20, max: 100)'),
  page: z.number().min(1).optional().describe('Sidnummer för paginering'),
  format: z.enum(['xml', 'json']).optional().describe('Svarsformat (default: json)'),
});

/**
 * Schema för ett programavsnitts låtlista
 * URL: /api/v2/playlists/getplaylistbyepisodeid
 */
const GetEpisodePlaylistSchema = z.object({
  episodeId: z.number().describe('Avsnitt-ID (obligatorisk)'),
  format: z.enum(['xml', 'json']).optional().describe('Svarsformat (default: json)'),
});

// ========================================
// Tool Handlers
// ========================================

/**
 * 1. "Just nu" - Låtlista per kanal
 *
 * Listar den låt som spelas just nu i angiven kanal samt föregående och nästkommande låt.
 * Returnerar fullständig information om varje låt inklusive:
 * - title, description, artist, composer, conductor
 * - albumname, recordlabel, lyricist, producer
 * - starttimeutc, stoptimeutc
 */
export async function getPlaylistRightNow(params: z.infer<typeof GetPlaylistRightNowSchema>) {
  const { channelId, format } = params;

  const queryParams: any = {
    channelid: channelId,
  };

  if (format) {
    queryParams.format = format;
  }

  const response = await srClient.fetch<SRPlaylist>('playlists/rightnow', queryParams);

  // Determine if music metadata is available
  const hasMusicMetadata = !!(response.song || response.nextsong || response.previoussong);

  // Provide clear metadata about content type
  const metadata: any = {
    hasMusicMetadata,
  };

  if (!hasMusicMetadata) {
    metadata.reason = response.channel ? 'speech_channel' : 'no_metadata_available';
    metadata.contentType = 'speech';
  } else {
    metadata.contentType = 'music';
  }

  return {
    copyright: response.copyright,
    currentSong: response.song || null,
    nextSong: response.nextsong || null,
    previousSong: response.previoussong || null,
    channel: response.channel || { id: channelId, name: 'Unknown' },
    metadata,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 2. Kanals låtlista för tidsintervall
 *
 * Listar låtar som spelats i en kanal i angivet tidsintervall.
 * Varje låt innehåller: title, description, artist, composer, conductor,
 * albumname, recordlabel, lyricist, producer, starttimeutc, stoptimeutc
 */
export async function getChannelPlaylist(params: z.infer<typeof GetChannelPlaylistSchema>) {
  const { channelId, startDateTime, endDateTime, size, page, format } = params;

  const queryParams: any = {
    id: channelId,
  };

  if (startDateTime) {
    queryParams.startdatetime = startDateTime;
  }

  if (endDateTime) {
    queryParams.enddatetime = endDateTime;
  }

  if (size) {
    queryParams.size = size;
  }

  if (page) {
    queryParams.page = page;
  }

  if (format) {
    queryParams.format = format;
  }

  try {
    const response = await srClient.fetch<SRSongList>('playlists/getplaylistbychannelid', queryParams);
    const songs = response.song || [];

    return {
      copyright: response.copyright,
      songs,
      metadata: {
        hasMusicMetadata: songs.length > 0,
        count: songs.length,
      },
      channelId,
      startDateTime: startDateTime || 'today',
      endDateTime: endDateTime || 'startDateTime + 1 day',
    };
  } catch (error: any) {
    // If 404, return empty result instead of error (no playlist data for interval)
    if (error.code === 'NOT_FOUND') {
      return {
        copyright: 'Sveriges Radio',
        songs: [],
        metadata: {
          hasMusicMetadata: false,
          count: 0,
          reason: 'no_data_for_interval',
          note: 'Channel may be speech-only or no songs played in specified time range',
        },
        channelId,
        startDateTime: startDateTime || 'today',
        endDateTime: endDateTime || 'startDateTime + 1 day',
      };
    }
    throw error;
  }
}

/**
 * 3. Programs låtlista för tidsintervall
 *
 * Listar låtar som spelats i ett program i angivet tidsintervall.
 * Inkluderar alla låtfält enligt SR:s API-specifikation.
 */
export async function getProgramPlaylist(params: z.infer<typeof GetProgramPlaylistSchema>) {
  const { programId, startDateTime, endDateTime, size, page, format } = params;

  const queryParams: any = {
    id: programId,
  };

  if (startDateTime) {
    queryParams.startdatetime = startDateTime;
  }

  if (endDateTime) {
    queryParams.enddatetime = endDateTime;
  }

  if (size) {
    queryParams.size = size;
  }

  if (page) {
    queryParams.page = page;
  }

  if (format) {
    queryParams.format = format;
  }

  try {
    const response = await srClient.fetch<SRSongList>('playlists/getplaylistbyprogramid', queryParams);
    const songs = response.song || [];

    return {
      copyright: response.copyright,
      songs,
      metadata: {
        hasMusicMetadata: songs.length > 0,
        count: songs.length,
      },
      programId,
      startDateTime: startDateTime || 'today',
      endDateTime: endDateTime || 'startDateTime + 1 day',
    };
  } catch (error: any) {
    // If 404, return empty result instead of error (speech program or no data)
    if (error.code === 'NOT_FOUND') {
      return {
        copyright: 'Sveriges Radio',
        songs: [],
        metadata: {
          hasMusicMetadata: false,
          count: 0,
          reason: 'no_data_for_interval',
          note: 'Program may be speech-only or no songs played in specified time range',
        },
        programId,
        startDateTime: startDateTime || 'today',
        endDateTime: endDateTime || 'startDateTime + 1 day',
      };
    }
    throw error;
  }
}

/**
 * 4. Ett programavsnitts låtlista
 *
 * Listar låtar som spelats i ett specifikt programavsnitt (episode).
 * Returnerar komplett spellista med alla tillgängliga fält.
 */
export async function getEpisodePlaylist(params: z.infer<typeof GetEpisodePlaylistSchema>) {
  const { episodeId, format } = params;

  const queryParams: any = {
    id: episodeId,
  };

  if (format) {
    queryParams.format = format;
  }

  try {
    const response = await srClient.fetch<SRSongList>('playlists/getplaylistbyepisodeid', queryParams);
    const songs = response.song || [];

    return {
      copyright: response.copyright,
      songs,
      metadata: {
        hasMusicMetadata: songs.length > 0,
        count: songs.length,
      },
      episodeId,
    };
  } catch (error: any) {
    // If 404, return empty result instead of error (speech episode)
    if (error.code === 'NOT_FOUND') {
      return {
        copyright: 'Sveriges Radio',
        songs: [],
        metadata: {
          hasMusicMetadata: false,
          count: 0,
          reason: 'speech_episode',
          note: 'Episode does not contain music metadata',
        },
        episodeId,
      };
    }
    throw error;
  }
}

// ========================================
// Tool Definitions
// ========================================

export const playlistTools = [
  {
    name: 'get_playlist_rightnow',
    description: 'Hämta låt som spelas JUST NU på en kanal. Returnerar föregående låt, nuvarande låt och nästkommande låt med fullständig information (artist, titel, album, skivbolag, kompositör, producent, textförfattare, tidsstämplar).',
    schema: GetPlaylistRightNowSchema,
    inputSchema: {
      type: 'object',
      properties: {
        channelId: {
          type: 'number',
          description: 'Kanal-ID (t.ex. 163 för P2 musik, 2576 för Din gata, 132 för P1)',
        },
        format: {
          type: 'string',
          enum: ['xml', 'json'],
          description: 'Svarsformat (default: json)',
        },
      },
      required: ['channelId'],
    },
    handler: getPlaylistRightNow,
  },
  {
    name: 'get_channel_playlist',
    description: 'Hämta alla låtar som spelats i en kanal under ett tidsintervall. Perfekt för att se musikhistorik på en kanal mellan två datum. Returnerar titel, artist, kompositör, album, skivbolag, och tidsstämplar för varje låt.',
    schema: GetChannelPlaylistSchema,
    inputSchema: {
      type: 'object',
      properties: {
        channelId: {
          type: 'number',
          description: 'Kanal-ID',
        },
        startDateTime: {
          type: 'string',
          description: 'Startdatum och tid (format: YYYY-MM-DD eller YYYY-MM-DDTHH:MM:SS). Default: dagens datum',
        },
        endDateTime: {
          type: 'string',
          description: 'Slutdatum och tid (format: YYYY-MM-DD eller YYYY-MM-DDTHH:MM:SS). Default: startDateTime + 1 dag',
        },
        size: {
          type: 'number',
          description: 'Sidstorlek (default: 20, max: 100)',
        },
        page: {
          type: 'number',
          description: 'Sidnummer för paginering',
        },
        format: {
          type: 'string',
          enum: ['xml', 'json'],
          description: 'Svarsformat (default: json)',
        },
      },
      required: ['channelId'],
    },
    handler: getChannelPlaylist,
  },
  {
    name: 'get_program_playlist',
    description: 'Hämta alla låtar som spelats i ett program under ett tidsintervall. Använd detta för att få musikhistorik för ett specifikt program mellan två datum. Inkluderar alla låtdetaljer.',
    schema: GetProgramPlaylistSchema,
    inputSchema: {
      type: 'object',
      properties: {
        programId: {
          type: 'number',
          description: 'Program-ID',
        },
        startDateTime: {
          type: 'string',
          description: 'Startdatum och tid (format: YYYY-MM-DD eller YYYY-MM-DDTHH:MM:SS). Default: dagens datum',
        },
        endDateTime: {
          type: 'string',
          description: 'Slutdatum och tid (format: YYYY-MM-DD eller YYYY-MM-DDTHH:MM:SS). Default: startDateTime + 1 dag',
        },
        size: {
          type: 'number',
          description: 'Sidstorlek (default: 20, max: 100)',
        },
        page: {
          type: 'number',
          description: 'Sidnummer för paginering',
        },
        format: {
          type: 'string',
          enum: ['xml', 'json'],
          description: 'Svarsformat (default: json)',
        },
      },
      required: ['programId'],
    },
    handler: getProgramPlaylist,
  },
  {
    name: 'get_episode_playlist',
    description: 'Hämta komplett spellista för ett specifikt programavsnitt (episode). Listar alla låtar som spelades i avsnittet med fullständiga detaljer och tidsstämplar.',
    schema: GetEpisodePlaylistSchema,
    inputSchema: {
      type: 'object',
      properties: {
        episodeId: {
          type: 'number',
          description: 'Avsnitt-ID',
        },
        format: {
          type: 'string',
          enum: ['xml', 'json'],
          description: 'Svarsformat (default: json)',
        },
      },
      required: ['episodeId'],
    },
    handler: getEpisodePlaylist,
  },
];
