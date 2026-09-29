import {
  apiKeyDtoSchema,
  apiSuccessSchema,
  createdApiKeyDtoSchema,
  providerDtoSchema,
  type ApiKeyDto,
  type CreateApiKeyInput,
  type CreatedApiKeyDto,
  type CreateProviderInput,
  type ProviderDto,
} from '@ingest-form/shared';
import { z } from 'zod';

import { apiGet, apiPost } from '@/core/lib/api-client';

const providersEnvelope = apiSuccessSchema(z.array(providerDtoSchema));
const providerEnvelope = apiSuccessSchema(providerDtoSchema);
const createdKeyEnvelope = apiSuccessSchema(createdApiKeyDtoSchema);
const apiKeyEnvelope = apiSuccessSchema(apiKeyDtoSchema);

export async function fetchProviders(): Promise<ProviderDto[]> {
  return (await apiGet('/api/admin/providers', providersEnvelope)).data;
}

export async function createProvider(input: CreateProviderInput): Promise<ProviderDto> {
  return (await apiPost('/api/admin/providers', input, providerEnvelope)).data;
}

export interface CreateApiKeyVariables {
  providerId: string;
  input: CreateApiKeyInput;
}

export async function createApiKey({ providerId, input }: CreateApiKeyVariables): Promise<CreatedApiKeyDto> {
  return (await apiPost(`/api/admin/providers/${encodeURIComponent(providerId)}/keys`, input, createdKeyEnvelope)).data;
}

export async function revokeApiKey(keyId: string): Promise<ApiKeyDto> {
  return (await apiPost(`/api/admin/keys/${encodeURIComponent(keyId)}/revoke`, {}, apiKeyEnvelope)).data;
}
