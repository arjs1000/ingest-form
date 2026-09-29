import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';

import { fail, ok } from '../../core/http/envelope';
import { clientIp, rateLimit } from '../../core/http/rate-limit';
import type { RateLimiter } from '../../core/security/rate-limiter';
import type { ApiKeyAuthService, AuthenticatedApiKey } from './api-key-auth.service';
import { MAX_INGEST_BODY_BYTES } from './ingest-api.constants';
import type { IngestService } from './ingest.service';

interface IngestEnv {
  Variables: { apiKey: AuthenticatedApiKey };
}

export interface IngestRouteDeps {
  ingestService: IngestService;
  apiKeyAuth: ApiKeyAuthService;
  /** Counts per client IP, before auth. */
  ipLimiter: RateLimiter;
  /** Counts per API key id, after auth. */
  keyLimiter: RateLimiter;
}

/**
 * POST /api/v1/ingest. Order matters: body limit → IP limit → key auth → key limit → store + run.
 * The body is read as text and never parsed here, so a malformed payload is still stored and
 * fails visibly at the validate step. Logs carry method, path and submission id only.
 */
export function createIngestRoutes(deps: IngestRouteDeps): Hono<IngestEnv> {
  return new Hono<IngestEnv>().post(
    '/',
    bodyLimit({
      maxSize: MAX_INGEST_BODY_BYTES,
      onError: (c) => fail(c, 413, 'PAYLOAD_TOO_LARGE', 'Request body must be 64 KB or smaller'),
    }),
    rateLimit<IngestEnv>(deps.ipLimiter, (c) => `ip:${clientIp(c)}`),
    async (c, next) => {
      c.set('apiKey', await deps.apiKeyAuth.authenticate(c.req.header('Authorization')));
      await next();
    },
    rateLimit<IngestEnv>(deps.keyLimiter, (c) => `key:${c.get('apiKey').id}`),
    async (c) => {
      const apiKey = c.get('apiKey');
      const result = await deps.ingestService.receive({
        rawBody: await c.req.text(),
        providerId: apiKey.providerId,
        apiKeyId: apiKey.id,
      });
      console.info(`[api] ${c.req.method} ${c.req.path} submission ${result.submissionId} ${result.status}`);
      return ok(c, result, 202);
    },
  );
}
