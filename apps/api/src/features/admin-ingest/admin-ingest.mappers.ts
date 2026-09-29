import type {
  ApiKeyDto,
  ApplicationDto,
  ProviderDto,
  StepRunDto,
  SubmissionSummaryDto,
} from '@ingest-form/shared';

import { apiKeyStatus } from '../../core/security/api-key';
import type {
  ApiKeyRecord,
  ApplicationRecord,
  ProviderRecord,
  StepRunRecord,
  SubmissionRecord,
} from '../ingest/repositories/ingest.repositories';

/* Repository records → shared wire DTOs. Dates become ISO strings; missing optionals become null. */

function iso(date: Date): string {
  return date.toISOString();
}

function isoOrNull(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

/** Status depends on the clock, so it is computed per request with the injected `now`. */
export function toApiKeyDto(key: ApiKeyRecord, now: Date): ApiKeyDto {
  return {
    id: key.id,
    label: key.label,
    prefix: key.prefix,
    status: apiKeyStatus(key, now),
    createdAt: iso(key.createdAt),
    expiresAt: iso(key.expiresAt),
    lastUsedAt: isoOrNull(key.lastUsedAt),
    revokedAt: isoOrNull(key.revokedAt),
  };
}

export function toProviderDto(provider: ProviderRecord, now: Date): ProviderDto {
  return {
    id: provider.id,
    name: provider.name,
    createdAt: iso(provider.createdAt),
    keys: provider.keys.map((key) => toApiKeyDto(key, now)),
  };
}

export function toSubmissionSummaryDto(submission: SubmissionRecord): SubmissionSummaryDto {
  return {
    id: submission.id,
    source: submission.source,
    providerName: submission.providerName,
    status: submission.status,
    lastStep: submission.lastStep,
    failedStep: submission.failedStep,
    applicationReference: submission.applicationReference,
    sessionId: submission.sessionId,
    duplicateOfId: submission.duplicateOfId,
    // The FK clears duplicateOfId when the linked submission is deleted but cannot clear the reason,
    // so a reason without a link is stale and is not reported.
    duplicateReason: submission.duplicateOfId ? submission.duplicateReason : null,
    attempts: submission.attempts,
    receivedAt: iso(submission.receivedAt),
    updatedAt: iso(submission.updatedAt),
  };
}

export function toStepRunDto(run: StepRunRecord): StepRunDto {
  return {
    id: run.id,
    step: run.step,
    attempt: run.attempt,
    status: run.status,
    output: run.output ?? null,
    issues: run.issues,
    durationMs: run.durationMs,
    startedAt: iso(run.startedAt),
  };
}

export function toApplicationDto(application: ApplicationRecord): ApplicationDto {
  return {
    ...application,
    phoneNumber: application.phoneNumber ?? null,
    addressLine3: application.addressLine3 ?? null,
    createdAt: iso(application.createdAt),
  };
}
