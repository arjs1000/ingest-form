import type { WorkersRateLimitPeriod } from '../../core/security/rate-limiter';

/** Requests per period per client IP, shared by /intake and /intake/extract. Matches INTAKE_IP_LIMITER in wrangler.jsonc. */
export const INTAKE_IP_LIMIT = 10;
export const INTAKE_RATE_LIMIT_PERIOD_SECONDS: WorkersRateLimitPeriod = 60;

/** Largest JSON body POST /api/v1/intake accepts. Same cap as /api/v1/ingest. */
export const MAX_INTAKE_BODY_BYTES = 64 * 1024;

/** Room for multipart boundaries, part headers and the documentType field on top of the file itself. */
export const MULTIPART_OVERHEAD_BYTES = 16 * 1024;

/** Prefix of server-generated application references: `UIF-<6 digits>-<year>`. */
export const UI_REFERENCE_PREFIX = 'UIF';
