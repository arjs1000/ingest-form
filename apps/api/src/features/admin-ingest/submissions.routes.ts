import { bulkRerunInputSchema, STEP_NAMES, submissionListQuerySchema } from '@ingest-form/shared';
import { Hono } from 'hono';
import { z } from 'zod';

import { ok } from '../../core/http/envelope';
import { validate } from '../../core/http/validate';
import type { SubmissionsService } from './submissions.service';

const idParamSchema = z.object({ id: z.string().min(1) });
/** Body is optional: without `fromStep` the runner resumes from the failed step. */
const rerunInputSchema = z.object({ fromStep: z.enum(STEP_NAMES).optional() });

/** Ingested submissions: list, detail, duplicates and re-runs. Mounted under /api/admin. */
export function createSubmissionsRoutes(submissionsService: SubmissionsService): Hono {
  return (
    new Hono()
      .get('/submissions', validate('query', submissionListQuerySchema), async (c) =>
        ok(c, await submissionsService.list(c.req.valid('query'))),
      )
      // Registered before /:id so "duplicates" is never read as an id.
      .get('/submissions/duplicates', async (c) => ok(c, await submissionsService.listDuplicates()))
      .post('/submissions/rerun-failed', validate('json', bulkRerunInputSchema), async (c) =>
        ok(c, await submissionsService.rerunFailedAt(c.req.valid('json').step)),
      )
      .get('/submissions/:id', validate('param', idParamSchema), async (c) =>
        ok(c, await submissionsService.get(c.req.valid('param').id)),
      )
      .post(
        '/submissions/:id/rerun',
        validate('param', idParamSchema),
        validate('json', rerunInputSchema),
        async (c) => ok(c, await submissionsService.rerun(c.req.valid('param').id, c.req.valid('json').fromStep)),
      )
  );
}
