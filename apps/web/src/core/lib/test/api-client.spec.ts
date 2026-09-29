// Flow: every screen talks to the API through api-client, which unwraps { data } and
// turns { error } into an ApiRequestError the UI can show.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { stubApi } from '@/core/testing/stub-api';

import { apiGet, ApiRequestError } from '../api-client';

const providerSchema = z.object({ data: z.object({ id: z.string() }) });

describe('api-client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses a success envelope and turns an error envelope into ApiRequestError with the API code', async () => {
    stubApi({ 'GET /api/admin/providers/p1': { data: { id: 'p1' } } });

    const success = await apiGet('/api/admin/providers/p1', providerSchema);
    const failure = await apiGet('/api/admin/providers/missing', providerSchema).catch((error: unknown) => error);

    expect(success).toEqual({ data: { id: 'p1' } });
    expect(failure).toBeInstanceOf(ApiRequestError);
    expect(failure).toMatchObject({ status: 404, code: 'NOT_FOUND' });
  });
});
