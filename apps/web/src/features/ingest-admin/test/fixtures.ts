import type { SubmissionDetailDto, SubmissionSummaryDto } from '@ingest-form/shared';

const RECEIVED_AT = '2026-09-27T09:14:00.000Z';

/** A completed API submission. Pass overrides to change any field. */
export function submissionSummary(overrides: Partial<SubmissionSummaryDto> = {}): SubmissionSummaryDto {
  return {
    id: 'sub_1',
    source: 'api',
    providerName: 'Acme Health',
    status: 'completed',
    lastStep: 'notify',
    failedStep: null,
    applicationReference: 'ABC-123456-0001',
    sessionId: '3f1c2a4e-9d8b-4c7a-8e6f-1a2b3c4d5e6f',
    duplicateOfId: null,
    duplicateReason: null,
    attempts: 1,
    receivedAt: RECEIVED_AT,
    updatedAt: RECEIVED_AT,
    ...overrides,
  };
}

/** A submission that failed at geocode because the postcode was not found. */
export const FAILED_AT_GEOCODE: SubmissionDetailDto = {
  ...submissionSummary({ id: 'sub_failed', status: 'failed', lastStep: 'geocode', failedStep: 'geocode' }),
  rawBody: '{"postcode":"ZZ9 9ZZ"}',
  application: null,
  steps: [
    { id: 'run_1', step: 'validate', attempt: 1, status: 'success', output: null, issues: [], durationMs: 5, startedAt: RECEIVED_AT },
    { id: 'run_2', step: 'normalise', attempt: 1, status: 'success', output: null, issues: [], durationMs: 5, startedAt: RECEIVED_AT },
    {
      id: 'run_3',
      step: 'geocode',
      attempt: 1,
      status: 'error',
      output: null,
      issues: [{ path: 'address.postcode', code: 'POSTCODE_NOT_FOUND', message: 'Postcode not found', severity: 'error' }],
      durationMs: 120,
      startedAt: RECEIVED_AT,
    },
  ],
};
