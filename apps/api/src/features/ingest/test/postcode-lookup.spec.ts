// Flow: the geocode step turns a postcode into coordinates by calling postcodes.io.
// fetch is stubbed, so no network call is made.
import { describe, expect, it } from 'vitest';

import { createPostcodeLookup } from '../providers/postcode-lookup';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

/** Knows one postcode, E15 4BZ. Everything else is a 404, like postcodes.io. */
const stubFetch = (async (input: string | URL | Request): Promise<Response> => {
  if (String(input).endsWith('/postcodes/E15%204BZ')) {
    return jsonResponse(200, { status: 200, result: { postcode: 'E15 4BZ', latitude: 51.542097, longitude: 0.006388 } });
  }
  return jsonResponse(404, { status: 404, error: 'Postcode not found' });
}) as typeof fetch;

describe('postcode lookup', () => {
  it('maps a 200 to coordinates and a 404 to POSTCODE_NOT_FOUND', async () => {
    const lookup = createPostcodeLookup({ baseUrl: 'https://postcodes.test', fetch: stubFetch });

    const found = await lookup('E15 4BZ');
    const missing = await lookup('ZZ9 9ZZ');

    expect(found).toEqual({ ok: true, status: 200, data: { latitude: 51.542097, longitude: 0.006388 } });
    expect(missing.ok).toBe(false);
    expect(missing.ok ? null : missing.error.code).toBe('POSTCODE_NOT_FOUND');
  });
});
