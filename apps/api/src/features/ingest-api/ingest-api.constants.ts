import type { WorkersRateLimitPeriod } from '../../core/security/rate-limiter';

/** Largest request body POST /api/v1/ingest accepts. A real form is a few KB. */
export const MAX_INGEST_BODY_BYTES = 64 * 1024;
/** Requests per period per client IP, checked before auth. Matches INGEST_IP_LIMITER in wrangler.jsonc. */
export const INGEST_IP_LIMIT = 20;
/** Requests per period per API key. Matches INGEST_KEY_LIMITER in wrangler.jsonc. */
export const INGEST_KEY_LIMIT = 60;
export const INGEST_RATE_LIMIT_PERIOD_SECONDS: WorkersRateLimitPeriod = 60;
