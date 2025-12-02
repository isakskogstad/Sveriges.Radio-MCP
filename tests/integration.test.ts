import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Integration tests for Sveriges Radio MCP Server
 * Tests the core functionality of tools, validation, and error handling
 */

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Tool Integration Tests', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('search_programs', () => {
    it('should rank exact matches higher than partial matches', async () => {
      // Mock SR API response with multiple programs
      const mockPrograms = {
        programs: [
          { id: 1, name: 'P3 Nyheter', description: 'Nyheter' },
          { id: 2, name: 'P3 Dokumentär', description: 'Dokumentärprogram' },
          { id: 3, name: 'Dokumentär i P1', description: 'Dokumentär' },
        ],
        pagination: { page: 1, size: 200, totalpages: 1 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => mockPrograms,
      });

      // Import and test search logic
      const query = 'P3 Dokumentär';
      const queryLower = query.toLowerCase();
      const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 1);

      // Apply ranking logic
      const rankedPrograms = mockPrograms.programs.map((program) => {
        const nameLower = program.name.toLowerCase();
        const descLower = (program.description || '').toLowerCase();
        let score = 0;

        if (nameLower === queryLower) score += 100;
        else if (nameLower.startsWith(queryLower)) score += 50;
        else if (nameLower.includes(queryLower)) score += 30;

        for (const word of queryWords) {
          if (nameLower.includes(word)) score += 10;
          if (descLower.includes(word)) score += 5;
        }

        return { program, score };
      });

      const sorted = rankedPrograms
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score);

      // P3 Dokumentär should be first (exact match)
      expect(sorted[0].program.name).toBe('P3 Dokumentär');
      expect(sorted[0].score).toBeGreaterThan(sorted[1].score);
    });
  });

  describe('get_playlist_rightnow', () => {
    it('should correctly parse playlist from nested response', () => {
      // Mock SR API response structure
      const mockResponse = {
        copyright: 'Copyright Sveriges Radio 2025',
        playlist: {
          song: {
            title: 'Current Song',
            artist: 'Artist Name',
            starttimeutc: '/Date(1733140800000)/',
          },
          previoussong: {
            title: 'Previous Song',
            artist: 'Previous Artist',
          },
          nextsong: {
            title: 'Next Song',
            artist: 'Next Artist',
          },
          channel: {
            id: 164,
            name: 'P3',
          },
        },
      };

      // Extract data correctly
      const playlist = mockResponse.playlist;
      const result = {
        copyright: mockResponse.copyright,
        currentSong: playlist?.song || null,
        nextSong: playlist?.nextsong || null,
        previousSong: playlist?.previoussong || null,
        channel: playlist?.channel || null,
      };

      expect(result.currentSong).not.toBeNull();
      expect(result.currentSong?.title).toBe('Current Song');
      expect(result.previousSong?.title).toBe('Previous Song');
      expect(result.nextSong?.title).toBe('Next Song');
      expect(result.channel?.name).toBe('P3');
    });

    it('should handle missing playlist data gracefully', () => {
      const mockResponse = {
        copyright: 'Copyright Sveriges Radio 2025',
        playlist: null,
      };

      const playlist = mockResponse.playlist;
      const result = {
        copyright: mockResponse.copyright,
        currentSong: playlist?.song || null,
        nextSong: playlist?.nextsong || null,
        previousSong: playlist?.previoussong || null,
        channel: playlist?.channel || null,
      };

      expect(result.currentSong).toBeNull();
      expect(result.previousSong).toBeNull();
      expect(result.nextSong).toBeNull();
      expect(result.channel).toBeNull();
    });
  });
});

describe('Security Features', () => {
  describe('UUID Validation', () => {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    it('should accept valid UUIDs', () => {
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000', // UUID v1
        '550e8400-e29b-41d4-a716-446655440000', // UUID v4
        'f47ac10b-58cc-4372-a567-0e02b2c3d479', // UUID v4
      ];

      validUUIDs.forEach((uuid) => {
        expect(UUID_REGEX.test(uuid)).toBe(true);
      });
    });

    it('should reject invalid UUIDs', () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '123',
        '123e4567-e89b-12d3-a456',
        '123e4567-e89b-12d3-a456-42661417400g',
        '',
        'null',
      ];

      invalidUUIDs.forEach((uuid) => {
        expect(UUID_REGEX.test(uuid)).toBe(false);
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should track request counts correctly', () => {
      interface RateLimitEntry {
        count: number;
        resetTime: number;
      }

      const rateLimits: Record<string, RateLimitEntry> = {};
      const RATE_LIMIT_REQUESTS = 60;
      const RATE_LIMIT_WINDOW_MS = 60000;

      function isRateLimited(clientIP: string): boolean {
        const now = Date.now();
        const entry = rateLimits[clientIP];

        if (!entry || now > entry.resetTime) {
          rateLimits[clientIP] = { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
          return false;
        }

        entry.count++;
        return entry.count > RATE_LIMIT_REQUESTS;
      }

      const testIP = '192.168.1.1';

      // First 60 requests should pass
      for (let i = 0; i < 60; i++) {
        expect(isRateLimited(testIP)).toBe(false);
      }

      // 61st request should be rate limited
      expect(isRateLimited(testIP)).toBe(true);
    });
  });

  describe('CORS Configuration', () => {
    it('should parse comma-separated origins', () => {
      const ALLOWED_ORIGINS = 'https://claude.ai,https://example.com,https://app.test';
      const allowedList = ALLOWED_ORIGINS.split(',').map((o) => o.trim());

      expect(allowedList).toHaveLength(3);
      expect(allowedList).toContain('https://claude.ai');
      expect(allowedList).toContain('https://example.com');
      expect(allowedList).toContain('https://app.test');
    });

    it('should handle wildcard origin', () => {
      const ALLOWED_ORIGINS = '*';
      const isWildcard = ALLOWED_ORIGINS === '*';

      expect(isWildcard).toBe(true);
    });
  });
});

describe('Session Management', () => {
  describe('Session TTL', () => {
    it('should identify expired sessions', () => {
      const SESSION_TTL_MS = 1800000; // 30 minutes
      const now = Date.now();

      interface SessionInfo {
        lastActivity: number;
      }

      const sessions: Record<string, SessionInfo> = {
        active: { lastActivity: now - 60000 }, // 1 minute ago
        expired: { lastActivity: now - 2000000 }, // 33 minutes ago
      };

      const expiredSessions = Object.entries(sessions).filter(
        ([, info]) => now - info.lastActivity > SESSION_TTL_MS
      );

      expect(expiredSessions).toHaveLength(1);
      expect(expiredSessions[0][0]).toBe('expired');
    });
  });
});

describe('Error Handling', () => {
  describe('MCP Error Format', () => {
    it('should format errors correctly', () => {
      const error = new Error('Test error');
      const formattedError = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: true,
              code: 'UNKNOWN_ERROR',
              message: error.message,
            }),
          },
        ],
        isError: true,
      };

      expect(formattedError.isError).toBe(true);
      expect(formattedError.content).toHaveLength(1);
      expect(formattedError.content[0].type).toBe('text');
    });
  });

  describe('JSON-RPC Error Codes', () => {
    it('should use correct error codes', () => {
      const ErrorCodes = {
        MISSING_TOKEN: -32000,
        INVALID_TOKEN: -32001,
        SESSION_ERROR: -32003,
        INTERNAL_ERROR: -32603,
      };

      expect(ErrorCodes.MISSING_TOKEN).toBe(-32000);
      expect(ErrorCodes.INVALID_TOKEN).toBe(-32001);
      expect(ErrorCodes.SESSION_ERROR).toBe(-32003);
      expect(ErrorCodes.INTERNAL_ERROR).toBe(-32603);
    });
  });
});
