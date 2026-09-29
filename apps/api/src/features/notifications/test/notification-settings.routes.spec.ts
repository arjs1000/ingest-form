// Flow: an admin saves the success and failure addresses on Admin → General; they are stored and
// read back, and an address that is not an email is refused.
import { describe, expect, it } from 'vitest';

import { createIngestTestApp } from '../../ingest-api/test/ingest-test-app';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

describe('notification addresses from Admin → General', () => {
  it('are saved and read back with the email status, and an invalid address gets 400', async () => {
    const { app } = createIngestTestApp();

    const saved = await app.request('/api/admin/settings/notifications', {
      method: 'PUT',
      body: JSON.stringify({ successEmail: 'ops@example.test', failureEmail: null }),
      headers: JSON_HEADERS,
    });
    expect(saved.status).toBe(200);

    const read = await app.request('/api/admin/settings/notifications');
    expect(await read.json()).toEqual({
      data: { successEmail: 'ops@example.test', failureEmail: null, emailConfigured: false },
    });

    const invalid = await app.request('/api/admin/settings/notifications', {
      method: 'PUT',
      body: JSON.stringify({ successEmail: 'not-an-email', failureEmail: null }),
      headers: JSON_HEADERS,
    });
    expect(invalid.status).toBe(400);
  });
});
