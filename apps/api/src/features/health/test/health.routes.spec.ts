// Flow: the web app's "API OK" pill depends on GET /api/health answering with status ok.
import { describe, expect, it } from 'vitest';

import { buildDeps, createApp } from '../../../app';
import { loadConfig } from '../../../core/config/env';

describe('GET /api/health', () => {
  it('returns status ok', async () => {
    const app = createApp(buildDeps(loadConfig({ NODE_ENV: 'test' })));

    const res = await app.request('/api/health');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: { status: 'ok' } });
  });
});
