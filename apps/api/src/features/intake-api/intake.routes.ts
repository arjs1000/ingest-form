import { DOCUMENT_TYPES, INTAKE_UPLOAD_HARD_MAX_BYTES } from '@ingest-form/shared';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { z } from 'zod';

import { ServiceUnavailableError } from '../../core/errors/app-error';
import { fail, ok } from '../../core/http/envelope';
import { clientIp, rateLimit } from '../../core/http/rate-limit';
import { validate } from '../../core/http/validate';
import type { RateLimiter } from '../../core/security/rate-limiter';
import type { IntakeSettingsService } from '../intake-settings/intake-settings.service';
import type { DocumentExtractService } from './document-extract.service';
import { MAX_INTAKE_BODY_BYTES, MULTIPART_OVERHEAD_BYTES } from './intake-api.constants';
import type { IntakeService } from './intake.service';

export interface IntakeRouteDeps {
  /** Counts per client IP across both intake endpoints. */
  intakeIpLimiter: RateLimiter;
  documentExtractService: DocumentExtractService;
  /** Upload limits from Admin → General, for the patient document step. */
  settings: Pick<IntakeSettingsService, 'get'>;
  /** null when no database is configured: POST /intake answers 503, extract still works. */
  intakeService: IntakeService | null;
}

const extractFormSchema = z.object({
  file: z.instanceof(File, { error: 'file is required' }),
  documentType: z.enum(DOCUMENT_TYPES, { error: `documentType must be one of ${DOCUMENT_TYPES.join(', ')}` }),
});

/**
 * Public patient intake (no API key: a browser cannot keep one secret).
 * GET /settings: the upload types and size limit set on Admin → General.
 * POST /extract: rate limit → 25 MB transport cap → form validation → the admin's size limit and
 *   types (magic bytes) → extractor. The file is read into memory, used and dropped; it is never
 *   stored or logged.
 * POST /: rate limit → 64 KB cap → store the body (source `ui`) → pipeline. Same contract as
 *   /api/v1/ingest, plus a generated reference when the form has none.
 * Logs carry method, path, submission id and status only.
 */
export function createIntakeRoutes(deps: IntakeRouteDeps): Hono {
  const limitByIp = rateLimit(deps.intakeIpLimiter, (c) => `intake-ip:${clientIp(c)}`);

  return new Hono()
    .get('/settings', async (c) => ok(c, await deps.settings.get()))
    .post(
      '/extract',
      limitByIp,
      bodyLimit({
        // The largest limit an admin can choose; the service applies the chosen one.
        maxSize: INTAKE_UPLOAD_HARD_MAX_BYTES + MULTIPART_OVERHEAD_BYTES,
        onError: (c) => fail(c, 413, 'PAYLOAD_TOO_LARGE', 'The file is too large'),
      }),
      validate('form', extractFormSchema),
      async (c) => {
        const { file, documentType } = c.req.valid('form');
        const bytes = new Uint8Array(await file.arrayBuffer());
        return ok(c, await deps.documentExtractService.extract({ bytes, documentType }));
      },
    )
    .post(
      '/',
      limitByIp,
      bodyLimit({
        maxSize: MAX_INTAKE_BODY_BYTES,
        onError: (c) => fail(c, 413, 'PAYLOAD_TOO_LARGE', 'Request body must be 64 KB or smaller'),
      }),
      async (c) => {
        if (!deps.intakeService) {
          throw new ServiceUnavailableError('DATABASE_UNAVAILABLE', 'The database is not configured');
        }
        const result = await deps.intakeService.submit(await c.req.text());
        console.info(`[api] ${c.req.method} ${c.req.path} submission ${result.submissionId} ${result.status}`);
        return ok(c, result, 202);
      },
    );
}
