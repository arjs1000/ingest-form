import { vi } from 'vitest';

/**
 * Replaces `fetch` with a fake API for one test. `routes` maps "METHOD /path" to the JSON
 * body to send back, e.g. { 'GET /api/admin/providers': { data: [] } }. Any other request gets
 * a 404 error envelope. Returns the list of "METHOD /path" requests made, in order.
 * Call `vi.unstubAllGlobals()` after the test.
 */
export function stubApi(routes: Record<string, unknown>): string[] {
  const requests: string[] = [];
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const request = `${init?.method ?? 'GET'} ${new URL(String(input), 'http://localhost').pathname}`;
    requests.push(request);
    if (request in routes) return new Response(JSON.stringify(routes[request]), { status: 200 });
    return new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: `No stub for ${request}` } }), { status: 404 });
  });
  return requests;
}
