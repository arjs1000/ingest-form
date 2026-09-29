import type { StepName, SubmissionListQuery, TransformedForm } from '@ingest-form/shared';

import { ConflictError, NotFoundError } from '../../../core/errors/app-error';
import { matchPerson } from '../duplicates/duplicate-rules';
import type {
  ApiKeyRecord,
  ApiKeyWithProvider,
  ApplicationRecord,
  ApplicationRepository,
  DuplicateCandidateRecord,
  NewApiKey,
  NewStepRun,
  NewSubmission,
  ProviderRecord,
  ProviderRepository,
  StepRunRecord,
  SubmissionListResult,
  SubmissionPatch,
  SubmissionRecord,
  SubmissionRepository,
} from './ingest.repositories';

/*
 * In-memory implementations of the ingest repositories. Used by unit and route tests (fakes over
 * mocks, see .claude/rules/testing.md). Behaviour must match the Prisma implementations.
 */

let sequence = 0;
function nextId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${String(sequence).padStart(6, '0')}`;
}

export class InMemorySubmissionRepository implements SubmissionRepository {
  readonly submissions = new Map<string, SubmissionRecord>();
  readonly stepRuns: StepRunRecord[] = [];

  constructor(
    private readonly now: () => Date = () => new Date(),
    private readonly providerNames: (providerId: string) => string | null = () => null,
    /** Saved-application details for a submission; tests wire this to an InMemoryApplicationRepository. */
    private readonly personFor: (submissionId: string) => DuplicateCandidateRecord['person'] = () => null,
  ) {}

  async create(input: NewSubmission): Promise<SubmissionRecord> {
    const at = this.now();
    const record: SubmissionRecord = {
      id: nextId('sub'),
      source: input.source,
      providerId: input.providerId,
      providerName: input.providerId ? this.providerNames(input.providerId) : null,
      apiKeyId: input.apiKeyId,
      status: 'received',
      lastStep: null,
      failedStep: null,
      rawBody: input.rawBody,
      applicationReference: null,
      sessionId: null,
      duplicateOfId: null,
      duplicateReason: null,
      attempts: 1,
      receivedAt: at,
      updatedAt: at,
    };
    this.submissions.set(record.id, record);
    return { ...record };
  }

  async findById(id: string): Promise<SubmissionRecord | null> {
    const record = this.submissions.get(id);
    return record ? { ...record } : null;
  }

  async update(id: string, patch: SubmissionPatch): Promise<SubmissionRecord> {
    const record = this.submissions.get(id);
    if (!record) throw new NotFoundError(`Submission ${id} not found`);
    const updated = { ...record, ...patch, updatedAt: this.now() };
    this.submissions.set(id, updated);
    return { ...updated };
  }

  async findEarliestByReference(applicationReference: string, excludeId: string): Promise<SubmissionRecord | null> {
    const matches = [...this.submissions.values()]
      .filter((s) => s.applicationReference === applicationReference && s.id !== excludeId)
      .sort((a, b) => a.receivedAt.getTime() - b.receivedAt.getTime() || a.id.localeCompare(b.id));
    return matches[0] ? { ...matches[0] } : null;
  }

  async recordStepRun(run: NewStepRun): Promise<StepRunRecord> {
    const record: StepRunRecord = { ...run, id: nextId('run') };
    this.stepRuns.push(record);
    return { ...record };
  }

  async listStepRuns(submissionId: string): Promise<StepRunRecord[]> {
    return this.stepRuns.filter((run) => run.submissionId === submissionId).map((run) => ({ ...run }));
  }

  async list(query: SubmissionListQuery): Promise<SubmissionListResult> {
    const filtered = [...this.submissions.values()]
      .filter((s) => (query.status ? s.status === query.status : true))
      .filter((s) => (query.source ? s.source === query.source : true))
      .filter((s) => (query.failedStep ? s.failedStep === query.failedStep : true))
      .sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime() || b.id.localeCompare(a.id));
    const start = (query.page - 1) * query.pageSize;
    return { items: filtered.slice(start, start + query.pageSize).map((s) => ({ ...s })), total: filtered.length };
  }

  async listIdsFailedAt(step: StepName): Promise<string[]> {
    return [...this.submissions.values()]
      .filter((s) => s.status === 'failed' && s.failedStep === step)
      .sort((a, b) => a.receivedAt.getTime() - b.receivedAt.getTime())
      .map((s) => s.id);
  }

  async listDuplicateCandidates(): Promise<DuplicateCandidateRecord[]> {
    return [...this.submissions.values()]
      .map((submission) => ({ submission: { ...submission }, person: this.personFor(submission.id) }))
      .filter(({ submission, person }) => submission.applicationReference !== null || person !== null);
  }
}

export class InMemoryApplicationRepository implements ApplicationRepository {
  readonly applications = new Map<string, ApplicationRecord>();

  constructor(
    private readonly now: () => Date = () => new Date(),
    /** Orders matches like Prisma does (by the submission's receivedAt); defaults to the application's createdAt. */
    private readonly receivedAtOf: (submissionId: string) => Date | null = () => null,
  ) {}

  async upsertForSubmission(submissionId: string, form: TransformedForm): Promise<{ id: string }> {
    const existing = this.applications.get(submissionId);
    const id = existing?.id ?? nextId('app');
    this.applications.set(submissionId, { ...form, id, submissionId, createdAt: existing?.createdAt ?? this.now() });
    return { id };
  }

  async findBySubmissionId(submissionId: string): Promise<ApplicationRecord | null> {
    const record = this.applications.get(submissionId);
    return record ? { ...record } : null;
  }

  async findEarliestSamePerson(
    submissionId: string,
    form: TransformedForm,
  ): Promise<{ submissionId: string; reason: 'same_person_email' | 'same_person_mobile' } | null> {
    const time = (record: ApplicationRecord): number => (this.receivedAtOf(record.submissionId) ?? record.createdAt).getTime();
    const matches = [...this.applications.values()]
      .filter((record) => record.submissionId !== submissionId)
      .map((record) => ({ record, reason: matchPerson(record, form) }))
      .filter((match): match is { record: ApplicationRecord; reason: 'same_person_email' | 'same_person_mobile' } => match.reason !== null)
      .sort((a, b) => time(a.record) - time(b.record));
    const first = matches[0];
    return first ? { submissionId: first.record.submissionId, reason: first.reason } : null;
  }

  /** The person fields duplicate detection compares, for InMemorySubmissionRepository's personFor. */
  personFor(submissionId: string): DuplicateCandidateRecord['person'] {
    const record = this.applications.get(submissionId);
    return record
      ? { firstName: record.firstName, lastName: record.lastName, email: record.email, mobileNumber: record.mobileNumber }
      : null;
  }
}

export class InMemoryProviderRepository implements ProviderRepository {
  readonly providers = new Map<string, Omit<ProviderRecord, 'keys'>>();
  readonly keys = new Map<string, ApiKeyRecord>();

  constructor(private readonly now: () => Date = () => new Date()) {}

  providerName(providerId: string): string | null {
    return this.providers.get(providerId)?.name ?? null;
  }

  async list(): Promise<ProviderRecord[]> {
    return [...this.providers.values()]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((provider) => this.withKeys(provider));
  }

  async findById(id: string): Promise<ProviderRecord | null> {
    const provider = this.providers.get(id);
    return provider ? this.withKeys(provider) : null;
  }

  async create(name: string): Promise<ProviderRecord> {
    if ([...this.providers.values()].some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      throw new ConflictError(`A provider named "${name}" already exists`);
    }
    const provider = { id: nextId('prov'), name, createdAt: this.now() };
    this.providers.set(provider.id, provider);
    return this.withKeys(provider);
  }

  async createKey(input: NewApiKey): Promise<ApiKeyRecord> {
    if (!this.providers.has(input.providerId)) throw new NotFoundError(`Provider ${input.providerId} not found`);
    const key: ApiKeyRecord = { ...input, id: nextId('key'), createdAt: this.now(), lastUsedAt: null, revokedAt: null };
    this.keys.set(key.id, key);
    return { ...key };
  }

  async findKeyByHash(keyHash: string): Promise<ApiKeyWithProvider | null> {
    const key = [...this.keys.values()].find((k) => k.keyHash === keyHash);
    if (!key) return null;
    return { ...key, providerName: this.providerName(key.providerId) ?? '' };
  }

  async findKeyById(id: string): Promise<ApiKeyRecord | null> {
    const key = this.keys.get(id);
    return key ? { ...key } : null;
  }

  async touchKey(id: string, usedAt: Date): Promise<void> {
    const key = this.keys.get(id);
    if (key) this.keys.set(id, { ...key, lastUsedAt: usedAt });
  }

  async revokeKey(id: string, revokedAt: Date): Promise<ApiKeyRecord> {
    const key = this.keys.get(id);
    if (!key) throw new NotFoundError(`API key ${id} not found`);
    const revoked = { ...key, revokedAt: key.revokedAt ?? revokedAt };
    this.keys.set(id, revoked);
    return { ...revoked };
  }

  private withKeys(provider: Omit<ProviderRecord, 'keys'>): ProviderRecord {
    const keys = [...this.keys.values()]
      .filter((key) => key.providerId === provider.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((key) => ({ ...key }));
    return { ...provider, keys };
  }
}
