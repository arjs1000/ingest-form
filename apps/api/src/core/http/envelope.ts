import type { ApiError } from '@ingest-form/shared';
import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

/** Success response: `{ data: T }`. */
export function ok<T>(c: Context, data: T, status: ContentfulStatusCode = 200): Response {
  return c.json({ data }, status);
}

/** Error response: `{ error: { code, message, details? } }`. */
export function fail(
  c: Context,
  status: ContentfulStatusCode,
  code: string,
  message: string,
  details?: unknown,
): Response {
  const body: ApiError = { error: { code, message, ...(details === undefined ? {} : { details }) } };
  return c.json(body, status);
}
