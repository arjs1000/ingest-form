import { intakeSettingsDtoSchema } from '@ingest-form/shared';
import { Hono } from 'hono';

import { ok } from '../../core/http/envelope';
import { validate } from '../../core/http/validate';
import type { IntakeSettingsService } from './intake-settings.service';

/**
 * /api/admin/settings/intake: read and save Admin → General.
 * Unauthenticated for the POC, like the rest of /api/admin (see admin-ingest.routes.ts).
 */
export function createIntakeSettingsRoutes(service: IntakeSettingsService): Hono {
  return new Hono()
    .get('/', async (c) => ok(c, await service.get()))
    .put('/', validate('json', intakeSettingsDtoSchema), async (c) => ok(c, await service.update(c.req.valid('json'))));
}
