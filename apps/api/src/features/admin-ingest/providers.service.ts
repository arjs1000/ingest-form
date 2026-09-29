import type {
  ApiKeyDto,
  CreateApiKeyInput,
  CreatedApiKeyDto,
  CreateProviderInput,
  ProviderDto,
} from '@ingest-form/shared';

import { NotFoundError } from '../../core/errors/app-error';
import { apiKeyExpiry, generateApiKey } from '../../core/security/api-key';
import type { ProviderRepository } from '../ingest/repositories/ingest.repositories';
import { toApiKeyDto, toProviderDto } from './admin-ingest.mappers';

export interface ProvidersService {
  list(): Promise<ProviderDto[]>;
  create(input: CreateProviderInput): Promise<ProviderDto>;
  /** Issues a new key. The full key is in the result once and never stored. Rotating = calling this again. */
  createKey(providerId: string, input: CreateApiKeyInput): Promise<CreatedApiKeyDto>;
  revokeKey(keyId: string): Promise<ApiKeyDto>;
}

export interface ProvidersServiceDeps {
  providers: ProviderRepository;
  now: () => Date;
}

export function createProvidersService(deps: ProvidersServiceDeps): ProvidersService {
  const { providers, now } = deps;

  return {
    async list() {
      const at = now();
      return (await providers.list()).map((provider) => toProviderDto(provider, at));
    },

    async create(input) {
      return toProviderDto(await providers.create(input.name), now());
    },

    async createKey(providerId, input) {
      const provider = await providers.findById(providerId);
      if (!provider) throw new NotFoundError(`Provider ${providerId} not found`);

      const generated = await generateApiKey();
      const at = now();
      const record = await providers.createKey({
        providerId,
        label: input.label || null,
        prefix: generated.prefix,
        keyHash: generated.hash,
        expiresAt: apiKeyExpiry(at),
      });
      return { key: generated.key, apiKey: toApiKeyDto(record, at) };
    },

    async revokeKey(keyId) {
      const at = now();
      return toApiKeyDto(await providers.revokeKey(keyId, at), at);
    },
  };
}
