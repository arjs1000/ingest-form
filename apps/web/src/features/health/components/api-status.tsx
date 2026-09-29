import { useQuery } from '@tanstack/react-query';

import { IStatusPill } from '@/core/components/IStatusPill';
import { ApiRequestError, CLIENT_ERROR_CODES } from '@/core/lib/api-client';

import { healthQueryOptions } from '../api/health.queries';

function describeFailure(error: Error): string {
  if (!(error instanceof ApiRequestError)) return 'Unknown error';
  // Client-side messages already read as a sentence; API codes help when debugging.
  const isClientCode = (CLIENT_ERROR_CODES as readonly string[]).includes(error.code);
  return isClientCode ? error.message : `${error.message} (${error.code})`;
}

export function ApiStatus() {
  const { data, error, isPending } = useQuery(healthQueryOptions);

  if (isPending) return <IStatusPill status="checking" label="Checking API" />;
  if (error) return <IStatusPill status="offline" label="API offline" detail={describeFailure(error)} />;
  return <IStatusPill status="ok" label={data.status === 'ok' ? 'API OK' : 'API degraded'} />;
}
