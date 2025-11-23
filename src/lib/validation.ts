/**
 * Validation helpers for Sveriges Radio MCP
 * Following TESTING_REPORT.md and DATETIME_FORMAT.md recommendations
 */

import { z } from 'zod';

/**
 * ISO 8601 date validation (YYYY-MM-DD)
 */
export const iso8601DateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in ISO 8601 format (YYYY-MM-DD)',
  })
  .refine(
    (date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    },
    {
      message: 'Date must be a valid date',
    }
  );

/**
 * ISO 8601 datetime validation (YYYY-MM-DDTHH:MM:SS or YYYY-MM-DDTHH:MM:SSZ)
 */
export const iso8601DateTimeSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$/, {
    message:
      'DateTime must be in ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS or YYYY-MM-DDTHH:MM:SSZ)',
  })
  .refine(
    (datetime) => {
      const parsed = new Date(datetime);
      return !isNaN(parsed.getTime());
    },
    {
      message: 'DateTime must be a valid date/time',
    }
  );

/**
 * Flexible datetime: accepts both date and datetime
 */
export const flexibleDateTimeSchema = z
  .string()
  .refine(
    (val) => {
      // ISO 8601 date or datetime
      const iso8601Pattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$/;
      return iso8601Pattern.test(val);
    },
    {
      message:
        'Must be ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS or YYYY-MM-DDTHH:MM:SSZ',
    }
  )
  .refine(
    (val) => {
      const parsed = new Date(val);
      return !isNaN(parsed.getTime());
    },
    {
      message: 'Must be a valid date/time',
    }
  );

/**
 * Channel ID validation (positive integer)
 */
export const channelIdSchema = z
  .number()
  .int()
  .positive({
    message: 'Channel ID must be a positive integer',
  });

/**
 * Program ID validation (positive integer)
 */
export const programIdSchema = z
  .number()
  .int()
  .positive({
    message: 'Program ID must be a positive integer',
  });

/**
 * Episode ID validation (positive integer)
 */
export const episodeIdSchema = z
  .number()
  .int()
  .positive({
    message: 'Episode ID must be a positive integer',
  });

/**
 * Pagination parameters
 */
export const paginationSchema = {
  page: z
    .number()
    .int()
    .min(1, { message: 'Page must be at least 1' })
    .optional(),
  size: z
    .number()
    .int()
    .min(1, { message: 'Size must be at least 1' })
    .max(100, { message: 'Size cannot exceed 100' })
    .optional(),
};

/**
 * Audio quality validation
 */
export const audioQualitySchema = z.enum(['low', 'normal', 'hi'], {
  errorMap: () => ({
    message: 'Audio quality must be one of: low, normal, hi',
  }),
});

/**
 * Format validation
 */
export const formatSchema = z.enum(['xml', 'json'], {
  errorMap: () => ({
    message: 'Format must be either xml or json',
  }),
});

/**
 * Category ID validation (0 or positive integer, where 0 means "all categories")
 */
export const categoryIdSchema = z
  .number()
  .int()
  .min(0, {
    message: 'Category ID must be 0 (all categories) or a positive integer',
  });

/**
 * Search query validation
 */
export const searchQuerySchema = z
  .string()
  .min(1, { message: 'Search query cannot be empty' })
  .max(200, { message: 'Search query cannot exceed 200 characters' });

/**
 * Validate date range (startDate should be before or equal to endDate)
 */
export function validateDateRange(startDate: string, endDate: string): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start <= end;
}

/**
 * Helper to create better error messages for Zod validation
 */
export function formatZodError(error: z.ZodError): string {
  const issues = error.issues.map((issue) => {
    const path = issue.path.join('.');
    return `${path}: ${issue.message}`;
  });
  return `Validation failed:\n${issues.join('\n')}`;
}
