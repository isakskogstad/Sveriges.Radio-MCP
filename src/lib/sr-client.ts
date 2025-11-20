/**
 * Sveriges Radio API Client
 * Handles HTTP requests, caching (ETags), and error handling
 */

import { SR_API_BASE, DEFAULT_PARAMS } from '../constants.js';
import { handleAPIError } from './errors.js';

interface CacheEntry {
  data: any;
  etag: string | null;
  expiresAt: number;
}

interface RequestParams {
  [key: string]: string | number | boolean | undefined;
}

export class SRClient {
  private cache: Map<string, CacheEntry> = new Map();

  /**
   * Build full URL with query parameters
   */
  private buildURL(endpoint: string, params?: RequestParams): string {
    const url = new URL(endpoint.startsWith('/') ? endpoint : `/${endpoint}`, SR_API_BASE);

    const finalParams = { ...DEFAULT_PARAMS, ...params };

    Object.entries(finalParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    return url.toString();
  }

  /**
   * Generate cache key from URL
   */
  private getCacheKey(url: string): string {
    return url;
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.expiresAt;
  }

  /**
   * Calculate cache expiry based on response headers
   * Default to 5 minutes if no cache headers present
   */
  private calculateExpiry(headers: Headers): number {
    const cacheControl = headers.get('cache-control');
    if (cacheControl) {
      const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
      if (maxAgeMatch) {
        return Date.now() + parseInt(maxAgeMatch[1]) * 1000;
      }
    }

    // Default: 5 minutes
    return Date.now() + 5 * 60 * 1000;
  }

  /**
   * Fetch data from SR API with caching support
   */
  async fetch<T = any>(endpoint: string, params?: RequestParams): Promise<T> {
    const url = this.buildURL(endpoint, params);
    const cacheKey = this.getCacheKey(url);
    const cached = this.cache.get(cacheKey);

    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'User-Agent': 'sverigesradio-mcp/1.0.0',
      };

      // Add If-None-Match header if we have cached ETag
      if (cached && !this.isExpired(cached) && cached.etag) {
        headers['If-None-Match'] = cached.etag;
      }

      const response = await fetch(url, { headers });

      // 304 Not Modified - return cached data
      if (response.status === 304 && cached) {
        // Refresh expiry
        cached.expiresAt = this.calculateExpiry(response.headers);
        return cached.data;
      }

      // Handle errors
      if (!response.ok) {
        handleAPIError({
          response: {
            status: response.status,
            data: await response.text(),
          },
          config: { url },
        });
      }

      const data = (await response.json()) as T;

      // Update cache
      this.cache.set(cacheKey, {
        data,
        etag: response.headers.get('etag'),
        expiresAt: this.calculateExpiry(response.headers),
      });

      return data;
    } catch (error) {
      // If we have expired cache, return it as fallback
      if (cached) {
        console.warn('API request failed, returning expired cache', error);
        return cached.data;
      }

      handleAPIError(error);
    }
  }

  /**
   * Fetch paginated data
   */
  async fetchPaginated<T = any>(
    endpoint: string,
    params?: RequestParams & { page?: number; size?: number }
  ): Promise<T> {
    return this.fetch<T>(endpoint, {
      ...params,
      pagination: true,
    }) as Promise<T>;
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    let expired = 0;
    let valid = 0;

    this.cache.forEach((entry) => {
      if (this.isExpired(entry)) {
        expired++;
      } else {
        valid++;
      }
    });

    return {
      total: this.cache.size,
      valid,
      expired,
    };
  }
}

// Singleton instance
export const srClient = new SRClient();
