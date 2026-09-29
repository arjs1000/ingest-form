import type { ProviderDto } from '@ingest-form/shared';

import { IFormSection } from '@/core/components/IFormSection';
import { IText } from '@/core/components/IText';

import { apiKeyDisplayStatus } from '../utils/api-key-display-status';
import { formatDate } from '../utils/format';
import { ApiKeyTable } from './api-key-table';
import { CreateKeyDialog } from './create-key-dialog';

/** One provider: its keys, and create or rotate. */
export function ProviderSection({ provider }: { provider: ProviderDto }) {
  const hasUsableKey = provider.keys.some((key) => apiKeyDisplayStatus(key).usable);
  const keyCount = provider.keys.length;

  return (
    <IFormSection
      title={provider.name}
      description={`Added ${formatDate(provider.createdAt)} · ${keyCount} ${keyCount === 1 ? 'key' : 'keys'}`}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <IText as="p" tone="secondary">
          {hasUsableKey
            ? 'Rotate before a key expires: the old key keeps working until it expires or is revoked.'
            : 'This provider has no working key. Create one to let it send forms.'}
        </IText>
        <CreateKeyDialog providerId={provider.id} providerName={provider.name} intent={hasUsableKey ? 'rotate' : 'create'} />
      </div>
      {keyCount > 0 ? <ApiKeyTable providerName={provider.name} keys={provider.keys} /> : null}
    </IFormSection>
  );
}
