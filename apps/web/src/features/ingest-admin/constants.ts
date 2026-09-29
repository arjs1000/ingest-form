import type { DuplicateReason, StepName, StepRunStatus, SubmissionSource, SubmissionStatus } from '@ingest-form/shared';

import type { IBadgeTone } from '@/core/components/IBadge';

export const SUBMISSIONS_PAGE_SIZE = 25;

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  received: 'Received',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
};

export const SUBMISSION_STATUS_TONES: Record<SubmissionStatus, IBadgeTone> = {
  received: 'info',
  processing: 'info',
  completed: 'success',
  failed: 'error',
};

export const SUBMISSION_SOURCE_LABELS: Record<SubmissionSource, string> = {
  api: 'API',
  ui: 'UI',
};

export const STEP_LABELS: Record<StepName, string> = {
  validate: 'Validate',
  normalise: 'Normalise',
  geocode: 'Geocode',
  transform: 'Transform',
  persist: 'Persist',
  notify: 'Notify',
};

export const STEP_RUN_STATUS_LABELS: Record<StepRunStatus, string> = {
  success: 'Success',
  warning: 'Warning',
  error: 'Error',
  skipped: 'Skipped',
};

export const STEP_RUN_STATUS_TONES: Record<StepRunStatus, IBadgeTone> = {
  success: 'success',
  warning: 'warning',
  error: 'error',
  skipped: 'neutral',
};

/** Placeholder used in the manual-deletion instructions. */
/** Short labels for why a submission is flagged as a duplicate (rules: api duplicate-rules.ts). */
export const DUPLICATE_REASON_LABELS: Record<DuplicateReason, string> = {
  same_reference: 'Same reference',
  same_person_email: 'Same name and email',
  same_person_mobile: 'Same name and mobile',
};

export const SUBMISSION_ID_PLACEHOLDER = '<submission-id>';

/** Duplicates are removed by hand, never from the UI (FEAT-001 "Removing a duplicate"). */
export function deleteSubmissionSql(id: string): string {
  return `DELETE FROM "IngestSubmission" WHERE id = '${id}';`;
}
