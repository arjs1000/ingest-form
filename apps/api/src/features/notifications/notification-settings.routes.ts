import { notificationSettingsInputSchema } from '@ingest-form/shared';
import { Hono } from 'hono';

import { ok } from '../../core/http/envelope';
import { validate } from '../../core/http/validate';
import type { NotificationSettingsService } from './notification-settings.service';

/**
 * /api/admin/settings/notifications: read and save the success and failure addresses.
 * Unauthenticated for the POC, like the rest of /api/admin (see admin-ingest.routes.ts).
 */
export function createNotificationSettingsRoutes(service: NotificationSettingsService): Hono {
  return new Hono()
    .get('/', async (c) => ok(c, await service.get()))
    .put('/', validate('json', notificationSettingsInputSchema), async (c) =>
      ok(c, await service.update(c.req.valid('json'))),
    );
}
