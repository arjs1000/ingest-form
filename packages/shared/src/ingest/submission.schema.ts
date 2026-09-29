import { z } from 'zod';

import { applicationDtoSchema } from './transformed-form.schema';

export const SUBMISSION_SOURCES = ['api', 'ui'] as const;
export const SUBMISSION_STATUSES = ['received', 'processing', 'completed', 'failed'] as const;
/** Pipeline order. The receive stage (auth, store raw body) happens in the route, before these. */
export const STEP_NAMES = ['validate', 'normalise', 'geocode', 'transform', 'persist', 'notify'] as const;
export const STEP_RUN_STATUSES = ['success', 'warning', 'error', 'skipped'] as const;
/**
 * Why a submission is a duplicate of an earlier one, strongest first:
 * same application reference; same first + last name and email; same first + last name and mobile.
 */
export const DUPLICATE_REASONS = ['same_reference', 'same_person_email', 'same_person_mobile'] as const;

export type SubmissionSource = (typeof SUBMISSION_SOURCES)[number];
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];
export type StepName = (typeof STEP_NAMES)[number];
export type StepRunStatus = (typeof STEP_RUN_STATUSES)[number];
export type DuplicateReason = (typeof DUPLICATE_REASONS)[number];

export const stepIssueSchema = z.object({
  /** Dot path into the payload, e.g. "address.postcode"; empty for whole-payload issues. */
  path: z.string(),
  /** Stable SCREAMING_SNAKE code, e.g. "INVALID_MOBILE". */
  code: z.string(),
  message: z.string(),
  severity: z.enum(['error', 'warning']),
});

export type StepIssue = z.infer<typeof stepIssueSchema>;

export const stepRunDtoSchema = z.object({
  id: z.string(),
  step: z.enum(STEP_NAMES),
  attempt: z.number().int(),
  status: z.enum(STEP_RUN_STATUSES),
  output: z.unknown(),
  issues: z.array(stepIssueSchema),
  durationMs: z.number().int(),
  startedAt: z.iso.datetime(),
});

export type StepRunDto = z.infer<typeof stepRunDtoSchema>;

export const submissionSummaryDtoSchema = z.object({
  id: z.string(),
  source: z.enum(SUBMISSION_SOURCES),
  providerName: z.string().nullable(),
  status: z.enum(SUBMISSION_STATUSES),
  lastStep: z.enum(STEP_NAMES).nullable(),
  failedStep: z.enum(STEP_NAMES).nullable(),
  applicationReference: z.string().nullable(),
  sessionId: z.string().nullable(),
  duplicateOfId: z.string().nullable(),
  duplicateReason: z.enum(DUPLICATE_REASONS).nullable(),
  attempts: z.number().int(),
  receivedAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type SubmissionSummaryDto = z.infer<typeof submissionSummaryDtoSchema>;

export const submissionDetailDtoSchema = submissionSummaryDtoSchema.extend({
  rawBody: z.string(),
  steps: z.array(stepRunDtoSchema),
  application: applicationDtoSchema.nullable(),
});

export type SubmissionDetailDto = z.infer<typeof submissionDetailDtoSchema>;

export const submissionListDtoSchema = z.object({
  items: z.array(submissionSummaryDtoSchema),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
});

export type SubmissionListDto = z.infer<typeof submissionListDtoSchema>;

/** Query params for GET /api/admin/submissions. */
export const submissionListQuerySchema = z.object({
  status: z.enum(SUBMISSION_STATUSES).optional(),
  source: z.enum(SUBMISSION_SOURCES).optional(),
  failedStep: z.enum(STEP_NAMES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type SubmissionListQuery = z.infer<typeof submissionListQuerySchema>;

/** Outcome returned by POST /api/v1/ingest and by a single re-run. */
export const ingestResultDtoSchema = z.object({
  submissionId: z.string(),
  status: z.enum(['completed', 'failed']),
  failedStep: z.enum(STEP_NAMES).nullable(),
  issues: z.array(stepIssueSchema),
});

export type IngestResultDto = z.infer<typeof ingestResultDtoSchema>;

export const bulkRerunInputSchema = z.object({ step: z.enum(STEP_NAMES) });

export type BulkRerunInput = z.infer<typeof bulkRerunInputSchema>;

export const bulkRerunResultDtoSchema = z.object({
  requested: z.number().int(),
  completed: z.number().int(),
  failed: z.number().int(),
});

export type BulkRerunResultDto = z.infer<typeof bulkRerunResultDtoSchema>;

/** Contact details the admin needs to judge a duplicate. Null when the submission has no saved application. */
export const duplicatePersonDtoSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  mobileNumber: z.string(),
});

export const duplicateMemberDtoSchema = submissionSummaryDtoSchema.extend({
  person: duplicatePersonDtoSchema.nullable(),
  /** How this member matches the group's first submission; null for the first submission itself. */
  matchReason: z.enum(DUPLICATE_REASONS).nullable(),
});

export const duplicateGroupDtoSchema = z.object({
  /** Stable key: the id of the group's first (oldest) submission. */
  key: z.string(),
  /** Every rule that links members of this group, strongest first. */
  matchedOn: z.array(z.enum(DUPLICATE_REASONS)),
  /** Oldest first. */
  submissions: z.array(duplicateMemberDtoSchema),
});

export type DuplicateMemberDto = z.infer<typeof duplicateMemberDtoSchema>;

export type DuplicateGroupDto = z.infer<typeof duplicateGroupDtoSchema>;
