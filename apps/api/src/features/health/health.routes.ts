import { Hono } from 'hono';

import { ok } from '../../core/http/envelope';
import type { HealthService } from './health.service';

export function createHealthRoutes(healthService: HealthService): Hono {
  return new Hono().get('/', (c) => ok(c, healthService.getStatus()));
}
