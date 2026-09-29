// Flow: a third-party provider POSTs a form to /api/v1/ingest with its API key.
// Accepted bodies are stored as received; bad keys, oversized bodies and bursts are turned away.
import { describe, expect, it } from 'vitest';

import { createIngestTestApp, type IngestTestApp } from './ingest-test-app';

const BODY = JSON.stringify({ session_id: 'f1d2d2f9-0000-4000-8000-000000000000', name: 'Jo Bloggs' });

function postIngest(testApp: IngestTestApp, body: string, apiKey?: string): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  return Promise.resolve(testApp.app.request('/api/v1/ingest', { method: 'POST', body, headers }));
}

describe('POST /api/v1/ingest', () => {
  it('accepts a request with a valid key, returns 202 and stores the raw body', async () => {
    const testApp = createIngestTestApp();
    const apiKey = await testApp.issueKey();

    const res = await postIngest(testApp, BODY, apiKey);

    expect(res.status).toBe(202);
    const { data } = (await res.json()) as { data: { submissionId: string } };
    expect((await testApp.submissions.findById(data.submissionId))?.rawBody).toBe(BODY);
  });

  it('rejects a missing key with UNAUTHENTICATED and an expired key with API_KEY_EXPIRED', async () => {
    const testApp = createIngestTestApp();
    const apiKey = await testApp.issueKey();

    const noKey = await postIngest(testApp, BODY);
    testApp.advanceDays(30);
    const expiredKey = await postIngest(testApp, BODY, apiKey);

    expect(noKey.status).toBe(401);
    expect(await noKey.json()).toMatchObject({ error: { code: 'UNAUTHENTICATED' } });
    expect(expiredKey.status).toBe(401);
    expect(await expiredKey.json()).toMatchObject({ error: { code: 'API_KEY_EXPIRED' } });
  });

  it('returns 413 for a body over 64 KB', async () => {
    const testApp = createIngestTestApp();
    const apiKey = await testApp.issueKey();

    const res = await postIngest(testApp, 'x'.repeat(64 * 1024 + 1), apiKey);

    expect(res.status).toBe(413);
    expect(await res.json()).toMatchObject({ error: { code: 'PAYLOAD_TOO_LARGE' } });
  });

  it('returns 429 once a caller goes over the rate limit', async () => {
    const testApp = createIngestTestApp({ requestsPerMinute: 2 });
    const apiKey = await testApp.issueKey();

    const first = await postIngest(testApp, BODY, apiKey);
    const second = await postIngest(testApp, BODY, apiKey);
    const third = await postIngest(testApp, BODY, apiKey);

    expect([first.status, second.status, third.status]).toEqual([202, 202, 429]);
    expect(await third.json()).toMatchObject({ error: { code: 'RATE_LIMITED' } });
  });
});
