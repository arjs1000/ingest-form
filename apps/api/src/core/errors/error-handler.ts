import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

import { fail } from '../http/envelope';
import { AppError } from './app-error';

/** Hono `onError` handler. Known errors pass through; unknown ones are logged and hidden. */
export function handleError(err: Error, c: Context): Response {
  if (err instanceof AppError) {
    return fail(c, err.status, err.code, err.message, err.details);
  }
  // Hono's own 4xx errors, e.g. a malformed JSON body rejected by the json validator.
  if (err instanceof HTTPException && err.status < 500) {
    return fail(c, err.status, err.status === 400 ? 'VALIDATION_ERROR' : 'REQUEST_ERROR', err.message || 'Invalid request');
  }
  // Log method + path only. Bodies and query strings may carry patient data.
  console.error(`[api] unhandled error on ${c.req.method} ${c.req.path}`, err);
  return fail(c, 500, 'INTERNAL_ERROR', 'Something went wrong');
}

export function handleNotFound(c: Context): Response {
  return fail(c, 404, 'NOT_FOUND', `No route for ${c.req.method} ${c.req.path}`);
}
