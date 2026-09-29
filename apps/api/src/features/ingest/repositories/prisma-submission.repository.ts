import { stepIssueSchema, type StepName, type SubmissionListQuery } from '@ingest-form/shared';
import { z } from 'zod';

import { Prisma, type PrismaClient } from '#prisma';

import { NotFoundError } from '../../../core/errors/app-error';
import type {
  DuplicateCandidateRecord,
  NewStepRun,
  NewSubmission,
  StepRunRecord,
  SubmissionListResult,
  SubmissionPatch,
  SubmissionRecord,
  SubmissionRepository,
} from './ingest.repositories';

const WITH_PROVIDER_NAME = { provider: { select: { name: true } } } as const;
const OLDEST_FIRST = [{ receivedAt: 'asc' }, { id: 'asc' }] as const satisfies Prisma.IngestSubmissionOrderByWithRelationInput[];
const NEWEST_FIRST = [{ receivedAt: 'desc' }, { id: 'desc' }] as const satisfies Prisma.IngestSubmissionOrderByWithRelationInput[];

type SubmissionWithProvider = Prisma.IngestSubmissionGetPayload<{ include: typeof WITH_PROVIDER_NAME }>;

const storedIssuesSchema = z.array(stepIssueSchema);

function toSubmissionRecord(row: SubmissionWithProvider): SubmissionRecord {
  return {
    id: row.id,
    source: row.source,
    providerId: row.providerId,
    providerName: row.provider?.name ?? null,
    apiKeyId: row.apiKeyId,
    status: row.status,
    lastStep: row.lastStep,
    failedStep: row.failedStep,
    rawBody: row.rawBody,
    applicationReference: row.applicationReference,
    sessionId: row.sessionId,
    duplicateOfId: row.duplicateOfId,
    duplicateReason: row.duplicateReason,
    attempts: row.attempts,
    receivedAt: row.receivedAt,
    updatedAt: row.updatedAt,
  };
}

function toStepRunRecord(row: Prisma.IngestStepRunModel): StepRunRecord {
  return {
    id: row.id,
    submissionId: row.submissionId,
    step: row.step,
    attempt: row.attempt,
    status: row.status,
    output: row.output,
    // Issues are written by this repository from typed StepIssue[]; parsing guards against hand edits.
    issues: storedIssuesSchema.parse(row.issues),
    durationMs: row.durationMs,
    startedAt: row.startedAt,
  };
}

/** Step outputs are JSON-safe by contract (step.types.ts). A missing output is stored as SQL NULL. */
function toJsonInput(value: unknown): Prisma.InputJsonValue | typeof Prisma.DbNull {
  return value === null || value === undefined ? Prisma.DbNull : (value as Prisma.InputJsonValue);
}

export class PrismaSubmissionRepository implements SubmissionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: NewSubmission): Promise<SubmissionRecord> {
    const row = await this.prisma.ingestSubmission.create({ data: input, include: WITH_PROVIDER_NAME });
    return toSubmissionRecord(row);
  }

  async findById(id: string): Promise<SubmissionRecord | null> {
    const row = await this.prisma.ingestSubmission.findUnique({ where: { id }, include: WITH_PROVIDER_NAME });
    return row ? toSubmissionRecord(row) : null;
  }

  async update(id: string, patch: SubmissionPatch): Promise<SubmissionRecord> {
    try {
      const row = await this.prisma.ingestSubmission.update({ where: { id }, data: patch, include: WITH_PROVIDER_NAME });
      return toSubmissionRecord(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundError(`Submission ${id} not found`);
      }
      throw error;
    }
  }

  async findEarliestByReference(applicationReference: string, excludeId: string): Promise<SubmissionRecord | null> {
    const row = await this.prisma.ingestSubmission.findFirst({
      where: { applicationReference, id: { not: excludeId } },
      orderBy: [...OLDEST_FIRST],
      include: WITH_PROVIDER_NAME,
    });
    return row ? toSubmissionRecord(row) : null;
  }

  async recordStepRun(run: NewStepRun): Promise<StepRunRecord> {
    const row = await this.prisma.ingestStepRun.create({
      data: {
        ...run,
        output: toJsonInput(run.output),
        issues: run.issues as unknown as Prisma.InputJsonValue,
      },
    });
    return toStepRunRecord(row);
  }

  async listStepRuns(submissionId: string): Promise<StepRunRecord[]> {
    const rows = await this.prisma.ingestStepRun.findMany({
      where: { submissionId },
      // Fast steps can share a millisecond; the step enum's declaration order is pipeline order,
      // so it breaks ties deterministically.
      orderBy: [{ attempt: 'asc' }, { startedAt: 'asc' }, { step: 'asc' }],
    });
    return rows.map(toStepRunRecord);
  }

  async list(query: SubmissionListQuery): Promise<SubmissionListResult> {
    const where: Prisma.IngestSubmissionWhereInput = {
      status: query.status,
      source: query.source,
      failedStep: query.failedStep,
    };
    const [rows, total] = await Promise.all([
      this.prisma.ingestSubmission.findMany({
        where,
        orderBy: [...NEWEST_FIRST],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: WITH_PROVIDER_NAME,
      }),
      this.prisma.ingestSubmission.count({ where }),
    ]);
    return { items: rows.map(toSubmissionRecord), total };
  }

  async listIdsFailedAt(step: StepName): Promise<string[]> {
    const rows = await this.prisma.ingestSubmission.findMany({
      where: { status: 'failed', failedStep: step },
      orderBy: [...OLDEST_FIRST],
      select: { id: true },
    });
    return rows.map((row) => row.id);
  }

  async listDuplicateCandidates(): Promise<DuplicateCandidateRecord[]> {
    const rows = await this.prisma.ingestSubmission.findMany({
      where: { OR: [{ applicationReference: { not: null } }, { application: { isNot: null } }] },
      orderBy: [...OLDEST_FIRST],
      include: {
        ...WITH_PROVIDER_NAME,
        application: { select: { firstName: true, lastName: true, email: true, mobileNumber: true } },
      },
    });
    return rows.map((row) => ({ submission: toSubmissionRecord(row), person: row.application ?? null }));
  }
}
