/**
 * Error handling for Sveriges Radio API
 */

import { ERROR_CODES } from '../constants.js';

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export class SRAPIError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SRAPIError';
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

export function handleAPIError(error: any): never {
  if (error instanceof SRAPIError) {
    throw error;
  }

  if (error.response) {
    const status = error.response.status;

    if (status === 404) {
      throw new SRAPIError(
        ERROR_CODES.NOT_FOUND,
        'Resource not found',
        { status, url: error.config?.url }
      );
    }

    if (status === 429) {
      throw new SRAPIError(
        ERROR_CODES.RATE_LIMIT,
        'Rate limit exceeded',
        { status, retryAfter: error.response.headers?.['retry-after'] }
      );
    }

    if (status >= 500) {
      throw new SRAPIError(
        ERROR_CODES.API_ERROR,
        'Sveriges Radio API error',
        { status, message: error.response.data }
      );
    }
  }

  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    throw new SRAPIError(
      ERROR_CODES.NETWORK_ERROR,
      'Network error connecting to Sveriges Radio API',
      { code: error.code }
    );
  }

  throw new SRAPIError(
    ERROR_CODES.API_ERROR,
    error.message || 'Unknown error',
    { originalError: error }
  );
}
