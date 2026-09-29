import { useQuery } from '@tanstack/react-query';
import { KeyRound, RefreshCw } from 'lucide-react';

import { IBadge } from '@/core/components/IBadge';
import { IButton } from '@/core/components/IButton';
import { ISkeleton } from '@/core/components/ISkeleton';
import { IText } from '@/core/components/IText';

import { providersQueryOptions } from '../api/providers.queries';
import { CreateProviderForm } from './create-provider-form';
import { ProviderSection } from './provider-section';

/** "API providers" settings tab: add providers, create, rotate and revoke their keys. */
export function ProvidersTab() {
  const query = useQuery(providersQueryOptions);

  return (
    <div className="flex flex-col gap-6">
      <CreateProviderForm />

      {query.isPending ? (
        <div role="status" className="flex flex-col gap-3">
          <span className="sr-only">Loading providers</span>
          <ISkeleton className="h-32 w-full" />
          <ISkeleton className="h-32 w-full" />
        </div>
      ) : null}

      {query.isError ? (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-(--card-radius) border border-border bg-surface p-(--card-pad)">
          <div className="flex flex-wrap items-center gap-2">
            <IBadge tone="error">Error</IBadge>
            <IText weight="semibold">Could not load providers</IText>
          </div>
          <IText as="p" tone="secondary">
            {query.error.message}
          </IText>
          <IButton variant="reverse" onClick={() => void query.refetch()}>
            <RefreshCw aria-hidden="true" />
            Try again
          </IButton>
        </div>
      ) : null}

      {query.data && query.data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-(--card-radius) border border-dashed border-border-strong bg-surface p-8 text-center">
          <KeyRound aria-hidden="true" className="size-6 text-text-secondary" />
          <IText as="p" weight="semibold">
            No providers yet
          </IText>
          <IText as="p" tone="secondary" className="max-w-md">
            Add one above, then create an API key for it to send forms to the ingest API.
          </IText>
        </div>
      ) : null}

      {query.data?.map((provider) => <ProviderSection key={provider.id} provider={provider} />)}
    </div>
  );
}
