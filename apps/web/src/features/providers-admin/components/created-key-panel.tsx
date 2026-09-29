import type { CreatedApiKeyDto } from '@ingest-form/shared';
import { TriangleAlert } from 'lucide-react';

import { ICopyButton } from '@/core/components/ICopyButton';
import { IText } from '@/core/components/IText';
import { apiUrl } from '@/core/lib/api-client';

import { INGEST_PATH } from '../constants';
import { curlExample, formatDate } from '../utils/format';

/** The one and only time the full key is visible, with a ready-to-run curl example. */
export function CreatedKeyPanel({ created }: { created: CreatedApiKeyDto }) {
  const curl = curlExample(apiUrl(INGEST_PATH), created.key);

  return (
    <div className="flex flex-col gap-4">
      <div role="alert" className="flex gap-2 rounded-(--control-radius) border border-warning-tint border-l-4 border-l-warning bg-warning-tint p-3">
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
        <IText as="p" weight="semibold" className="text-warning">
          You won&apos;t see this key again. Copy it now and send it to the provider securely.
        </IText>
      </div>

      <div className="flex flex-col gap-1">
        <IText as="p" weight="semibold" id="created-key-label">
          API key
        </IText>
        <div className="flex items-start gap-1">
          <code
            aria-labelledby="created-key-label"
            data-testid="created-api-key"
            className="min-w-0 flex-1 break-all rounded-(--control-radius) border border-border bg-page p-2 font-mono text-[0.8125em]"
          >
            {created.key}
          </code>
          <ICopyButton value={created.key} label="Copy API key" />
        </div>
        <IText size="sm" tone="secondary">
          Expires on {formatDate(created.apiKey.expiresAt)}.
        </IText>
      </div>

      <div className="flex flex-col gap-1">
        <IText as="p" weight="semibold">
          Example request
        </IText>
        <div className="flex items-start gap-1">
          <pre className="min-w-0 flex-1 overflow-x-auto rounded-(--control-radius) border border-border bg-page p-2 font-mono text-[0.8125em]">
            {curl}
          </pre>
          <ICopyButton value={curl} label="Copy curl example" />
        </div>
      </div>
    </div>
  );
}
