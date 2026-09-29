import type { SubmissionStatus } from '@ingest-form/shared';

import { IBadge } from '@/core/components/IBadge';

import { SUBMISSION_STATUS_LABELS, SUBMISSION_STATUS_TONES } from '../constants';

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  return <IBadge tone={SUBMISSION_STATUS_TONES[status]}>{SUBMISSION_STATUS_LABELS[status]}</IBadge>;
}
