import type { StepIssue, StepName } from '@ingest-form/shared';
import type { z } from 'zod';

import type { PostcodeLookup } from '../providers/postcode-lookup.types';
import type { ApplicationRepository } from '../repositories/ingest.repositories';

export type { StepIssue, StepName };

/**
 * What a step returns. `success` / `warning` / `skipped` carry an output for the next step;
 * `error` stops the pipeline. Warnings never stop it.
 */
export type StepResult<T> =
  | { status: 'success' | 'warning' | 'skipped'; output: T; issues: StepIssue[] }
  | { status: 'error'; issues: StepIssue[] };

/** Everything a step may use besides its input. Injected, so tests pass fakes. */
export interface StepDeps {
  submissionId: string;
  lookupPostcode: PostcodeLookup;
  applications: ApplicationRepository;
  /** Injected clock so date rules (age, future dates) are testable. */
  now: () => Date;
  /** Success and failure emails (FEAT-003). Implemented by features/notifications. */
  notifier: SubmissionNotifier;
}

/** What happened to one notification email. The notifier never throws. */
export type NotifyOutcome =
  | { status: 'sent'; emailId: string }
  /** EMAIL_NOT_CONFIGURED: no Resend key or sender. EMAIL_NO_RECIPIENT: no address saved in Admin → General. */
  | { status: 'skipped'; code: 'EMAIL_NOT_CONFIGURED' | 'EMAIL_NO_RECIPIENT' }
  | { status: 'failed' };

export interface FailedSubmissionEvent {
  submissionId: string;
  failedStep: StepName;
  /** The failed step's issues. Only their codes go into the email. */
  issues: StepIssue[];
}

/** The pipeline's view of email notifications: one email per completed submission, one per failed attempt. */
export interface SubmissionNotifier {
  notifyCompleted(submissionId: string): Promise<NotifyOutcome>;
  notifyFailed(event: FailedSubmissionEvent): Promise<NotifyOutcome>;
}

/**
 * One pipeline step: a plain async function plus the schema of its input.
 * The runner re-validates stored input with `input` when re-running, so a step never
 * receives a shape it does not expect, even after its predecessor's code changed.
 * Outputs must be JSON-safe (no Date objects): they are stored as JSON between runs.
 */
export interface IngestStep<In, Out> {
  name: StepName;
  input: z.ZodType<In>;
  run(input: In, deps: StepDeps): Promise<StepResult<Out>>;
}

/** Helpers so every step builds results the same way. */
export function success<T>(output: T, issues: StepIssue[] = []): StepResult<T> {
  return issues.some((issue) => issue.severity === 'warning')
    ? { status: 'warning', output, issues }
    : { status: 'success', output, issues };
}

export function skipped<T>(output: T, issue: StepIssue): StepResult<T> {
  return { status: 'skipped', output, issues: [issue] };
}

export function failure<T>(issues: StepIssue[]): StepResult<T> {
  return { status: 'error', issues };
}

export function issue(path: string, code: string, message: string, severity: StepIssue['severity'] = 'error'): StepIssue {
  return { path, code, message, severity };
}
