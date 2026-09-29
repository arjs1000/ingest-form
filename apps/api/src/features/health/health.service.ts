import type { HealthStatus } from '@ingest-form/shared';

export interface HealthService {
  getStatus(): HealthStatus;
}

/** Liveness only. A readiness check (database ping) comes with the first data feature. */
export function createHealthService(): HealthService {
  return {
    getStatus: () => ({ status: 'ok' }),
  };
}
