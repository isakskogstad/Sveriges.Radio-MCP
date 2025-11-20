/**
 * Sveriges Radio API Constants
 * Based on sverigesradio-api-js library and official docs
 */

export const SR_API_BASE = 'https://api.sr.se/api/v2';

export const DEFAULT_PARAMS = {
  format: 'json' as const,
  audioquality: 'hi' as const,
  pagination: true,
  size: 10,
  page: 1,
  liveaudiotemplateid: 2, // MP3 stream (compatible)
  ondemandaudiotemplateid: 1,
  indent: false,
};

export const AUDIO_QUALITY = {
  LOW: 'low',
  NORMAL: 'normal',
  HI: 'hi',
} as const;

export const CACHE_TTL = {
  VERY_SHORT: 60 * 1000,        // <1 min
  SHORT: 5 * 60 * 1000,         // ~5 min
  MEDIUM: 30 * 60 * 1000,       // ~30 min
  LONG: 2 * 60 * 60 * 1000,     // ~2 hours
  VERY_LONG: 12 * 60 * 60 * 1000, // ~12 hours
} as const;

export const ERROR_CODES = {
  NOT_FOUND: 'NOT_FOUND',
  INVALID_PARAMS: 'INVALID_PARAMS',
  API_ERROR: 'API_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;
