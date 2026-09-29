import { z } from 'zod';

/** Ingest API keys expire this many days after creation and must be rotated. */
export const API_KEY_TTL_DAYS = 30;
/** Admin UI warns when a key expires within this many days. */
export const API_KEY_EXPIRY_WARNING_DAYS = 7;

export const API_KEY_STATUSES = ['active', 'expired', 'revoked'] as const;
export type ApiKeyStatus = (typeof API_KEY_STATUSES)[number];

export const apiKeyDtoSchema = z.object({
  id: z.string(),
  label: z.string().nullable(),
  /** First characters of the key, safe to display. The full key is never returned again. */
  prefix: z.string(),
  status: z.enum(API_KEY_STATUSES),
  createdAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  lastUsedAt: z.iso.datetime().nullable(),
  revokedAt: z.iso.datetime().nullable(),
});

export type ApiKeyDto = z.infer<typeof apiKeyDtoSchema>;

export const providerDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.iso.datetime(),
  keys: z.array(apiKeyDtoSchema),
});

export type ProviderDto = z.infer<typeof providerDtoSchema>;

export const createProviderInputSchema = z.object({
  name: z.string().trim().min(2, 'Enter the provider name').max(80, 'Provider name must be 80 characters or fewer'),
});

export type CreateProviderInput = z.infer<typeof createProviderInputSchema>;

export const createApiKeyInputSchema = z.object({
  label: z.string().trim().max(60, 'Label must be 60 characters or fewer').optional(),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeyInputSchema>;

/** Returned once, on creation. `key` is the only time the full secret is visible. */
export const createdApiKeyDtoSchema = z.object({
  key: z.string(),
  apiKey: apiKeyDtoSchema,
});

export type CreatedApiKeyDto = z.infer<typeof createdApiKeyDtoSchema>;
