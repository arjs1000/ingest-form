import type {
  DuplicateReason,
  StepIssue,
  StepName,
  StepRunStatus,
  SubmissionListQuery,
  SubmissionSource,
  SubmissionStatus,
  TransformedForm,
} from '@ingest-form/shared';

/*
 * Repository interfaces for the ingest feature. Services, steps and routes depend on these,
 * never on Prisma. Implementations: prisma-*.repository.ts (runtime) and
 * in-memory.repositories.ts (tests).
 */

export interface SubmissionRecord {
  id: string;
  source: SubmissionSource;
  providerId: string | null;
  providerName: string | null;
  apiKeyId: string | null;
  status: SubmissionStatus;
  lastStep: StepName | null;
  failedStep: StepName | null;
  rawBody: string;
  applicationReference: string | null;
  sessionId: string | null;
  duplicateOfId: string | null;
  duplicateReason: DuplicateReason | null;
  attempts: number;
  receivedAt: Date;
  updatedAt: Date;
}

export interface NewSubmission {
  source: SubmissionSource;
  providerId: string | null;
  apiKeyId: string | null;
  rawBody: string;
}

export type SubmissionPatch = Partial<
  Pick<
    SubmissionRecord,
    | 'status'
    | 'lastStep'
    | 'failedStep'
    | 'applicationReference'
    | 'sessionId'
    | 'duplicateOfId'
    | 'duplicateReason'
    | 'attempts'
  >
>;

export interface StepRunRecord {
  id: string;
  submissionId: string;
  step: StepName;
  attempt: number;
  status: StepRunStatus;
  /** JSON-safe step output; null for errors. */
  output: unknown;
  issues: StepIssue[];
  durationMs: number;
  startedAt: Date;
}

export type NewStepRun = Omit<StepRunRecord, 'id'>;

export interface SubmissionListResult {
  items: SubmissionRecord[];
  total: number;
}

/** A submission that could be a duplicate: it has a reference, a saved application, or both. */
export interface DuplicateCandidateRecord {
  submission: SubmissionRecord;
  /** From the saved application; null when the submission never reached persist. */
  person: { firstName: string; lastName: string; email: string; mobileNumber: string } | null;
}

export interface SubmissionRepository {
  create(input: NewSubmission): Promise<SubmissionRecord>;
  findById(id: string): Promise<SubmissionRecord | null>;
  update(id: string, patch: SubmissionPatch): Promise<SubmissionRecord>;
  /** Earliest submission with this reference, other than `excludeId`. Used to link duplicates. */
  findEarliestByReference(applicationReference: string, excludeId: string): Promise<SubmissionRecord | null>;
  recordStepRun(run: NewStepRun): Promise<StepRunRecord>;
  /** All runs for a submission, oldest first. */
  listStepRuns(submissionId: string): Promise<StepRunRecord[]>;
  list(query: SubmissionListQuery): Promise<SubmissionListResult>;
  /** IDs of failed submissions whose failedStep is `step`, oldest first. */
  listIdsFailedAt(step: StepName): Promise<string[]>;
  /** Every submission with a reference or a saved application. Grouping is done by duplicate-rules.ts. */
  listDuplicateCandidates(): Promise<DuplicateCandidateRecord[]>;
}

export interface ApplicationRecord extends Omit<TransformedForm, 'dateOfBirth'> {
  id: string;
  submissionId: string;
  /** YYYY-MM-DD */
  dateOfBirth: string;
  createdAt: Date;
}

export interface ApplicationRepository {
  /** Create or replace the application for a submission, so a re-run of persist is idempotent. */
  upsertForSubmission(submissionId: string, form: TransformedForm): Promise<{ id: string }>;
  findBySubmissionId(submissionId: string): Promise<ApplicationRecord | null>;
  /**
   * Earliest other saved application for the same person (duplicate-rules.ts: same first + last
   * name and the same email, else the same mobile), or null.
   */
  findEarliestSamePerson(
    submissionId: string,
    form: TransformedForm,
  ): Promise<{ submissionId: string; reason: 'same_person_email' | 'same_person_mobile' } | null>;
}

export interface ProviderRecord {
  id: string;
  name: string;
  createdAt: Date;
  keys: ApiKeyRecord[];
}

export interface ApiKeyRecord {
  id: string;
  providerId: string;
  label: string | null;
  prefix: string;
  keyHash: string;
  createdAt: Date;
  expiresAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
}

export interface NewApiKey {
  providerId: string;
  label: string | null;
  prefix: string;
  keyHash: string;
  expiresAt: Date;
}

export interface ApiKeyWithProvider extends ApiKeyRecord {
  providerName: string;
}

export interface ProviderRepository {
  /** Providers with all their keys, newest provider first. */
  list(): Promise<ProviderRecord[]>;
  findById(id: string): Promise<ProviderRecord | null>;
  /** Throws a ConflictError when the name is taken. */
  create(name: string): Promise<ProviderRecord>;
  createKey(input: NewApiKey): Promise<ApiKeyRecord>;
  findKeyByHash(keyHash: string): Promise<ApiKeyWithProvider | null>;
  findKeyById(id: string): Promise<ApiKeyRecord | null>;
  touchKey(id: string, usedAt: Date): Promise<void>;
  revokeKey(id: string, revokedAt: Date): Promise<ApiKeyRecord>;
}
