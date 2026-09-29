import { z } from 'zod';

import type { HttpResponse, HttpResponseError } from './http-response';
import type { Coordinates, PostcodeLookup } from './postcode-lookup.types';

export interface PostcodeLookupOptions {
  /** e.g. https://api.postcodes.io (no trailing slash needed). */
  baseUrl: string;
  /** Injected in tests. Defaults to the global fetch, which exists on Node and Workers. */
  fetch?: typeof fetch;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 5000;

/** Status used when no HTTP response arrived at all (network error, timeout). */
const NO_RESPONSE = 0;

/**
 * postcodes.io 200 body. Some real postcodes (e.g. Channel Islands, new builds) come back with
 * null coordinates, so they are nullable here and handled as "not found" below.
 */
const lookupBodySchema = z.object({
  result: z.object({
    longitude: z.number().nullable(),
    latitude: z.number().nullable(),
  }),
});

const UNAVAILABLE_MESSAGE = 'The postcode lookup service is unavailable. Re-run later.';

function lookupError(status: number, code: string, message: string, retryable: boolean): HttpResponse<Coordinates> {
  const error: HttpResponseError = { code, message, retryable };
  return { ok: false, status, error };
}

function unavailable(status: number): HttpResponse<Coordinates> {
  return lookupError(status, 'GEOCODER_UNAVAILABLE', UNAVAILABLE_MESSAGE, true);
}

/**
 * postcodes.io client. Never throws: every failure becomes `ok: false` with a stable code.
 * Plain fetch only, so it runs unchanged on Node and Cloudflare Workers.
 */
export function createPostcodeLookup(options: PostcodeLookupOptions): PostcodeLookup {
  const baseUrl = options.baseUrl.replace(/\/+$/, '');
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  // Late-bound: Workers reject a detached `fetch` reference, and tests may stub the global.
  const doFetch: typeof fetch = options.fetch ?? ((input, init) => globalThis.fetch(input, init));

  async function get(path: string): Promise<Response | null> {
    try {
      return await doFetch(`${baseUrl}${path}`, { signal: AbortSignal.timeout(timeoutMs) });
    } catch {
      // Network failure or timeout. The caller maps null to GEOCODER_UNAVAILABLE.
      return null;
    }
  }

  async function isTerminated(encoded: string): Promise<boolean> {
    const response = await get(`/terminated_postcodes/${encoded}`);
    return response?.status === 200;
  }

  return async function lookupPostcode(postcode: string): Promise<HttpResponse<Coordinates>> {
    const encoded = encodeURIComponent(postcode);
    const response = await get(`/postcodes/${encoded}`);
    if (!response) return unavailable(NO_RESPONSE);

    if (response.status === 404) {
      return (await isTerminated(encoded))
        ? lookupError(404, 'POSTCODE_TERMINATED', 'Postcode is no longer in use', false)
        : lookupError(404, 'POSTCODE_NOT_FOUND', 'Postcode not found', false);
    }
    if (response.status !== 200) return unavailable(response.status);

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return unavailable(response.status);
    }
    const parsed = lookupBodySchema.safeParse(body);
    if (!parsed.success) return unavailable(response.status);

    const { longitude, latitude } = parsed.data.result;
    if (longitude === null || latitude === null) {
      return lookupError(200, 'POSTCODE_NOT_FOUND', 'Postcode has no coordinates', false);
    }
    return { ok: true, status: 200, data: { longitude, latitude } };
  };
}

/** Default client against the public postcodes.io API. The app builds its own from config. */
export const lookupPostcode: PostcodeLookup = createPostcodeLookup({ baseUrl: 'https://api.postcodes.io' });
