import { queryOptions } from '@tanstack/react-query';

import { fetchProviders } from './providers.api';

export const providerKeys = {
  all: ['admin-providers'] as const,
};

export const providersQueryOptions = queryOptions({
  queryKey: providerKeys.all,
  queryFn: fetchProviders,
});
