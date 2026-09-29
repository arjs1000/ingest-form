import { UnauthenticatedError } from '../../core/errors/app-error';
import { apiKeyStatus, hashApiKey } from '../../core/security/api-key';
import type { ProviderRepository } from '../ingest/repositories/ingest.repositories';

export interface AuthenticatedApiKey {
  id: string;
  providerId: string;
  providerName: string;
}

export interface ApiKeyAuthService {
  /** Resolves the `Authorization` header to an active key, or throws a 401 AppError. */
  authenticate(authorizationHeader: string | undefined): Promise<AuthenticatedApiKey>;
}

export interface ApiKeyAuthDeps {
  providers: Pick<ProviderRepository, 'findKeyByHash' | 'touchKey'>;
  now: () => Date;
}

const BEARER_PATTERN = /^Bearer\s+(\S+)$/i;

export function createApiKeyAuthService(deps: ApiKeyAuthDeps): ApiKeyAuthService {
  return {
    async authenticate(authorizationHeader) {
      const token = authorizationHeader?.trim().match(BEARER_PATTERN)?.[1];
      if (!token) throw new UnauthenticatedError();

      const key = await deps.providers.findKeyByHash(await hashApiKey(token));
      if (!key) throw new UnauthenticatedError();

      const now = deps.now();
      const status = apiKeyStatus(key, now);
      if (status === 'revoked') throw new UnauthenticatedError('API_KEY_REVOKED', 'This API key has been revoked');
      if (status === 'expired') throw new UnauthenticatedError('API_KEY_EXPIRED', 'This API key has expired');

      await deps.providers.touchKey(key.id, now);
      return { id: key.id, providerId: key.providerId, providerName: key.providerName };
    },
  };
}
