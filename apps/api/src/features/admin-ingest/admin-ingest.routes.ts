import { Hono } from 'hono';

import { createProvidersRoutes } from './providers.routes';
import type { ProvidersService } from './providers.service';
import { createSubmissionsRoutes } from './submissions.routes';
import type { SubmissionsService } from './submissions.service';

export interface AdminIngestRouteDeps {
  providersService: ProvidersService;
  submissionsService: SubmissionsService;
}

/**
 * /api/admin: providers, keys and submissions.
 *
 * Intentionally unauthenticated for this POC (POC decision, FEAT-001 "Admin auth").
 * Known risk: anyone who can reach the API can issue keys and read raw patient bodies.
 * TODO(FEAT-001): add admin auth before deploying with real patient data.
 */
export function createAdminIngestRoutes(deps: AdminIngestRouteDeps): Hono {
  return new Hono()
    .route('/', createProvidersRoutes(deps.providersService))
    .route('/', createSubmissionsRoutes(deps.submissionsService));
}
