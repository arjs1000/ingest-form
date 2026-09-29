import type { ApiKeyDto } from '@ingest-form/shared';

import { IBadge } from '@/core/components/IBadge';
import {
  ITable,
  ITableBody,
  ITableCaption,
  ITableCell,
  ITableHead,
  ITableHeaderCell,
  ITableRow,
} from '@/core/components/ITable';

import { apiKeyDisplayStatus } from '../utils/api-key-display-status';
import { formatDate, formatDateTime } from '../utils/format';
import { RevokeKeyDialog } from './revoke-key-dialog';

export interface ApiKeyTableProps {
  providerName: string;
  keys: ApiKeyDto[];
}

export function ApiKeyTable({ providerName, keys }: ApiKeyTableProps) {
  const now = new Date();

  return (
    <ITable>
      <ITableCaption className="sr-only">API keys for {providerName}</ITableCaption>
      <ITableHead>
        <ITableRow>
          <ITableHeaderCell>Key</ITableHeaderCell>
          <ITableHeaderCell>Label</ITableHeaderCell>
          <ITableHeaderCell>Status</ITableHeaderCell>
          <ITableHeaderCell>Created</ITableHeaderCell>
          <ITableHeaderCell>Expires</ITableHeaderCell>
          <ITableHeaderCell>Last used</ITableHeaderCell>
          <ITableHeaderCell>
            <span className="sr-only">Actions</span>
          </ITableHeaderCell>
        </ITableRow>
      </ITableHead>
      <ITableBody>
        {keys.map((key) => {
          const status = apiKeyDisplayStatus(key, now);
          return (
            <ITableRow key={key.id}>
              <ITableCell className="whitespace-nowrap font-mono">{key.prefix}…</ITableCell>
              <ITableCell>{key.label ?? <span className="text-text-secondary">None</span>}</ITableCell>
              <ITableCell>
                <IBadge tone={status.tone} className="whitespace-nowrap">
                  {status.label}
                </IBadge>
              </ITableCell>
              <ITableCell className="whitespace-nowrap">{formatDate(key.createdAt)}</ITableCell>
              <ITableCell className="whitespace-nowrap">{formatDate(key.expiresAt)}</ITableCell>
              <ITableCell className="whitespace-nowrap">
                {key.lastUsedAt ? formatDateTime(key.lastUsedAt) : <span className="text-text-secondary">Never</span>}
              </ITableCell>
              <ITableCell className="text-right">{status.usable ? <RevokeKeyDialog apiKey={key} /> : null}</ITableCell>
            </ITableRow>
          );
        })}
      </ITableBody>
    </ITable>
  );
}
