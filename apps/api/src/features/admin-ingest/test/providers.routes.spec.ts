// Flow: an admin creates an API key for a provider. The full key is shown once;
// the database keeps only its hash.
import { describe, expect, it } from 'vitest';

import { hashApiKey } from '../../../core/security/api-key';
import { createIngestTestApp } from '../../ingest-api/test/ingest-test-app';

describe('admin API keys', () => {
  it('returns the full key once and stores only its hash', async () => {
    const { app, providers } = createIngestTestApp();
    const provider = await providers.create('Acme Health');

    const res = await app.request(`/api/admin/providers/${provider.id}/keys`, {
      method: 'POST',
      body: JSON.stringify({ label: 'Production' }),
      headers: { 'Content-Type': 'application/json' },
    });

    expect(res.status).toBe(201);
    const { data } = (await res.json()) as { data: { key: string; apiKey: { id: string } } };
    expect(data.key).toMatch(/^ifk_/);
    const stored = await providers.findKeyById(data.apiKey.id);
    expect(stored?.keyHash).toBe(await hashApiKey(data.key));
    expect(Object.values(stored ?? {})).not.toContain(data.key);
    const providerList = await app.request('/api/admin/providers');
    expect(await providerList.text()).not.toContain(data.key);
  });
});
