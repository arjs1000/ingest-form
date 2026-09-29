import { z } from 'zod';

/** `KEY=` in a .env file means "not set", not an empty secret. */
const optionalSecret = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().min(1).optional(),
);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  BE_PORT: z.coerce.number().int().positive().default(8300),
  // Pipe-separated, e.g. "http://localhost:8301|https://app.example.com"
  ALLOWED_ORIGINS: z.string().default(''),
  // Optional: without it /api/health still works and the ingest + admin routes answer 503.
  DATABASE_URL: z.url().optional(),
  POSTCODES_IO_BASE_URL: z.url().default('https://api.postcodes.io'),
  // Optional, FEAT-003: emails are skipped unless both the key and the sender are set.
  RESEND_API_KEY: optionalSecret,
  // A sender on a domain verified in Resend, e.g. "Bookable <notifications@example.com>".
  // Resend's shared onboarding@resend.dev only delivers to the Resend account's own address.
  RESEND_FROM_EMAIL: optionalSecret,
  // Origin of the admin panel, for the link in each email, e.g. http://localhost:8301.
  ADMIN_BASE_URL: z.preprocess((value) => (value === '' ? undefined : value), z.url().optional()),
  // Optional: the local PaddleOCR sidecar (services/ocr-sidecar). Without it, only PDFs with their
  // own text are read; images and scanned PDFs return no fields.
  OCR_SIDECAR_URL: z.preprocess((value) => (value === '' ? undefined : value), z.url().optional()),
  // One page takes about 40s on an M2 CPU; allow for a cold start.
  OCR_SIDECAR_TIMEOUT_MS: z.coerce.number().int().positive().default(120_000),
});

export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  allowedOrigins: string[];
  databaseUrl: string | undefined;
  postcodesIoBaseUrl: string;
  resendApiKey: string | undefined;
  resendFromEmail: string | undefined;
  adminBaseUrl: string | undefined;
  ocrSidecarUrl: string | undefined;
  ocrSidecarTimeoutMs: number;
}

/**
 * Validates raw env into typed config. Takes the source as an argument so the same
 * code works for `process.env` (Node) and Worker bindings (Cloudflare).
 * Throws on invalid input: a bad config should stop the app at startup, not mid-request.
 */
export function loadConfig(source: Record<string, unknown>): AppConfig {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(result.error)}`);
  }
  const env = result.data;
  return {
    nodeEnv: env.NODE_ENV,
    port: env.BE_PORT,
    allowedOrigins: env.ALLOWED_ORIGINS.split('|').map((origin) => origin.trim()).filter(Boolean),
    databaseUrl: env.DATABASE_URL,
    postcodesIoBaseUrl: env.POSTCODES_IO_BASE_URL,
    resendApiKey: env.RESEND_API_KEY,
    resendFromEmail: env.RESEND_FROM_EMAIL,
    adminBaseUrl: env.ADMIN_BASE_URL,
    ocrSidecarUrl: env.OCR_SIDECAR_URL,
    ocrSidecarTimeoutMs: env.OCR_SIDECAR_TIMEOUT_MS,
  };
}
