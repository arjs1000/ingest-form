import { mutationOptions, type QueryClient } from '@tanstack/react-query';

import { createApiKey, createProvider, revokeApiKey } from './providers.api';
import { providerKeys } from './providers.queries';

function refreshProviders(queryClient: QueryClient) {
  return () => queryClient.invalidateQueries({ queryKey: providerKeys.all });
}

export function createProviderMutationOptions(queryClient: QueryClient) {
  return mutationOptions({
    mutationKey: [...providerKeys.all, 'create'],
    mutationFn: createProvider,
    onSuccess: refreshProviders(queryClient),
  });
}

export function createApiKeyMutationOptions(queryClient: QueryClient) {
  return mutationOptions({
    mutationKey: [...providerKeys.all, 'create-key'],
    mutationFn: createApiKey,
    onSuccess: refreshProviders(queryClient),
  });
}

export function revokeApiKeyMutationOptions(queryClient: QueryClient) {
  return mutationOptions({
    mutationKey: [...providerKeys.all, 'revoke-key'],
    mutationFn: revokeApiKey,
    onSuccess: refreshProviders(queryClient),
  });
}
