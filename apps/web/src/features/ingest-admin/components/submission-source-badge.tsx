import type { SubmissionSource } from '@ingest-form/shared';

import { IBadge } from '@/core/components/IBadge';

import { SUBMISSION_SOURCE_LABELS } from '../constants';

export interface SubmissionSourceBadgeProps {
  source: SubmissionSource;
  providerName: string | null;
}

/** "API · Acme Health" for third-party submissions, "UI" for the patient flow. */
export function SubmissionSourceBadge({ source, providerName }: SubmissionSourceBadgeProps) {
  const label = SUBMISSION_SOURCE_LABELS[source];
  return (
    <IBadge tone={source === 'api' ? 'info' : 'neutral'} className="whitespace-nowrap">
      {source === 'api' && providerName ? `${label} · ${providerName}` : label}
    </IBadge>
  );
}
