/**
 * Error handling for Sveriges Radio API
 */

import { ERROR_CODES } from '../constants.js';

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Standard error interface following testrapport recommendations
 * Provides machine-readable code, human-readable message, and context
 */
export interface StandardErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, any>;
    httpStatus?: number;
    timestamp: string;
  };
}

export class SRAPIError extends Error {
  public httpStatus?: number;
  public timestamp: string;

  constructor(
    public code: ErrorCode,
    message: string,
    public details?: any,
    httpStatus?: number
  ) {
    super(message);
    this.name = 'SRAPIError';
    this.httpStatus = httpStatus;
    this.timestamp = new Date().toISOString();

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON(): StandardErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        httpStatus: this.httpStatus,
        timestamp: this.timestamp,
      },
    };
  }
}

export function handleAPIError(error: any): never {
  if (error instanceof SRAPIError) {
    throw error;
  }

  if (error.response) {
    const status = error.response.status;
    const url = error.config?.url;

    if (status === 404) {
      throw new SRAPIError(
        ERROR_CODES.NOT_FOUND,
        'The requested resource was not found. This may indicate an invalid ID or unavailable data.',
        {
          url,
          suggestion: 'Verify that the ID exists and is accessible. For playlists, check if the channel/program has music metadata.',
        },
        status
      );
    }

    if (status === 400) {
      throw new SRAPIError(
        ERROR_CODES.INVALID_PARAMS,
        'Invalid request parameters. Check parameter format and values.',
        {
          url,
          suggestion: 'Ensure date/time parameters use ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)',
        },
        status
      );
    }

    if (status === 429) {
      throw new SRAPIError(
        ERROR_CODES.RATE_LIMIT,
        'Rate limit exceeded. Please wait before making more requests.',
        {
          retryAfter: error.response.headers?.['retry-after'],
          suggestion: 'Implement exponential backoff or respect the Retry-After header',
        },
        status
      );
    }

    if (status >= 500) {
      throw new SRAPIError(
        ERROR_CODES.API_ERROR,
        'Sveriges Radio API server error. The service may be temporarily unavailable.',
        {
          message: error.response.data,
          suggestion: 'Retry after a short delay. If the problem persists, check SR API status.',
        },
        status
      );
    }
  }

  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    throw new SRAPIError(
      ERROR_CODES.NETWORK_ERROR,
      'Network error: Unable to connect to Sveriges Radio API',
      {
        networkCode: error.code,
        suggestion: 'Check internet connection and DNS settings',
      }
    );
  }

  if (error.name === 'AbortError') {
    throw new SRAPIError(
      ERROR_CODES.NETWORK_ERROR,
      'Request timeout: Sveriges Radio API did not respond in time',
      {
        suggestion: 'Try again or increase timeout value',
      }
    );
  }

  throw new SRAPIError(
    ERROR_CODES.API_ERROR,
    error.message || 'An unknown error occurred',
    { originalError: error }
  );
}
