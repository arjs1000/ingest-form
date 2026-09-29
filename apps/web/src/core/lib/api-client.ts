import { apiErrorSchema } from '@ingest-form/shared';
import type { z } from 'zod';

// Empty in local dev: requests go to /api on the same origin and Vite proxies them.
const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

/** Codes the web client creates itself, when there is no API error envelope to read. */
export const CLIENT_ERROR_CODES = ['NETWORK_ERROR', 'GATEWAY_ERROR', 'HTTP_ERROR', 'INVALID_RESPONSE'] as const;

const GATEWAY_STATUSES = new Set([502, 503, 504]);

/** Every API failure the web app can see. `code` is either from the API envelope or a CLIENT_ERROR_CODES entry. */
export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

/**
 * Absolute URL of an API path, for text shown to people (e.g. a curl example). Uses the
 * configured API origin, or this page's origin when the API is proxied on the same origin.
 */
export function apiUrl(path: string): string {
  return `${API_BASE_URL || window.location.origin}${path}`;
}

/**
 * Sends a request and validates the body against a Zod schema. The response is a boundary:
 * nothing reaches a component without passing its schema.
 */
async function request<Schema extends z.ZodType>(path: string, init: RequestInit, schema: Schema): Promise<z.infer<Schema>> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { credentials: 'include', ...init });
  } catch {
    throw new ApiRequestError(0, 'NETWORK_ERROR', 'No response from API');
  }

  const body: unknown = await res.json().catch(() => undefined);

  if (!res.ok) {
    const parsed = apiErrorSchema.safeParse(body);
    if (parsed.success) {
      throw new ApiRequestError(res.status, parsed.data.error.code, parsed.data.error.message);
    }
    // No envelope: a proxy or the edge answered because the API itself did not.
    throw GATEWAY_STATUSES.has(res.status)
      ? new ApiRequestError(res.status, 'GATEWAY_ERROR', `No response from API (HTTP ${res.status})`)
      : new ApiRequestError(res.status, 'HTTP_ERROR', `Request failed (HTTP ${res.status})`);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ApiRequestError(res.status, 'INVALID_RESPONSE', 'Unexpected response from API');
  }
  return parsed.data;
}

/** GETs a path and validates the body against a Zod schema. */
export function apiGet<Schema extends z.ZodType>(path: string, schema: Schema): Promise<z.infer<Schema>> {
  return request(path, {}, schema);
}

/** POSTs a JSON body (an empty object when omitted) and validates the response against a Zod schema. */
export function apiPost<Schema extends z.ZodType>(path: string, body: unknown, schema: Schema): Promise<z.infer<Schema>> {
  return request(
    path,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) },
    schema,
  );
}

/** PUTs a JSON body and validates the response against a Zod schema. */
export function apiPut<Schema extends z.ZodType>(path: string, body: unknown, schema: Schema): Promise<z.infer<Schema>> {
  return request(path, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, schema);
}

/**
 * POSTs multipart/form-data (file uploads) and validates the response against a Zod schema.
 * No Content-Type header: the browser sets it, with the multipart boundary.
 */
export function apiPostForm<Schema extends z.ZodType>(path: string, formData: FormData, schema: Schema): Promise<z.infer<Schema>> {
  return request(path, { method: 'POST', body: formData }, schema);
}
