import { healthResponseSchema } from '@ingest-form/shared';
import { queryOptions } from '@tanstack/react-query';

import { apiGet } from '@/core/lib/api-client';

const HEALTH_REFETCH_MS = 30_000;

export const healthQueryOptions = queryOptions({
  queryKey: ['health'],
  queryFn: async () => (await apiGet('/api/health', healthResponseSchema)).data,
  refetchInterval: HEALTH_REFETCH_MS,
});
