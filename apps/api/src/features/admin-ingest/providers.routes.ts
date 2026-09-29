import { createApiKeyInputSchema, createProviderInputSchema } from '@ingest-form/shared';
import { Hono } from 'hono';
import { z } from 'zod';

import { ok } from '../../core/http/envelope';
import { validate } from '../../core/http/validate';
import type { ProvidersService } from './providers.service';

const idParamSchema = z.object({ id: z.string().min(1) });

/** Providers and their API keys. Mounted under /api/admin. */
export function createProvidersRoutes(providersService: ProvidersService): Hono {
  return new Hono()
    .get('/providers', async (c) => ok(c, await providersService.list()))
    .post('/providers', validate('json', createProviderInputSchema), async (c) =>
      ok(c, await providersService.create(c.req.valid('json')), 201),
    )
    .post(
      '/providers/:id/keys',
      validate('param', idParamSchema),
      validate('json', createApiKeyInputSchema),
      async (c) => ok(c, await providersService.createKey(c.req.valid('param').id, c.req.valid('json')), 201),
    )
    .post('/keys/:id/revoke', validate('param', idParamSchema), async (c) =>
      ok(c, await providersService.revokeKey(c.req.valid('param').id)),
    );
}
