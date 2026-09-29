import {
  transformedFormSchema,
  type BulkRerunResultDto,
  type IngestResultDto,
  type StepIssue,
  type StepName,
} from '@ingest-form/shared';
import { z } from 'zod';

import { ConflictError, NotFoundError } from '../../../core/errors/app-error';
import type { StepRunRecord, SubmissionPatch, SubmissionRecord } from '../repositories/ingest.repositories';
import { PIPELINE_STEPS, stepIndex } from './pipeline';
import type { PipelineStep } from './pipeline';
import type { PipelineRunner, PipelineRunnerDeps } from './pipeline.types';
import { failure, issue } from './step.types';
import type { FailedSubmissionEvent, StepDeps, StepResult } from './step.types';

/** The two fields the runner copies onto the submission after validate, for search and duplicates. */
const identitySchema = z.object({ application_reference: z.string(), session_id: z.string() });

/** Latest non-error run of `step`: highest attempt, and the later one on a tie. */
function latestUsableRun(runs: readonly StepRunRecord[], step: StepName): StepRunRecord | null {
  let latest: StepRunRecord | null = null;
  // Runs come oldest first, so `>=` lets a later run win a tie on attempt.
  for (const run of runs) {
    if (run.step === step && run.status !== 'error' && (!latest || run.attempt >= latest.attempt)) latest = run;
  }
  return latest;
}

/** Error type plus stack frames, without the message line (which may contain input values). */
function describeCrash(error: unknown): string {
  if (!(error instanceof Error)) return typeof error;
  const frames = (error.stack ?? '').split('\n').slice(1).join('\n');
  return frames ? `${error.name}\n${frames}` : error.name;
}

export function createPipelineRunner(deps: PipelineRunnerDeps): PipelineRunner {
  const { submissions, stepDeps } = deps;

  async function load(submissionId: string): Promise<SubmissionRecord> {
    const submission = await submissions.findById(submissionId);
    if (!submission) throw new NotFoundError(`Submission ${submissionId} not found`);
    return submission;
  }

  /** Validates the input, then runs the step. Never throws: a crash becomes an error result. */
  async function runStep(step: PipelineStep, input: unknown, runDeps: StepDeps): Promise<StepResult<unknown>> {
    const parsed = step.input.safeParse(input);
    if (!parsed.success) {
      return failure(
        parsed.error.issues.map((zodIssue) =>
          issue(zodIssue.path.map(String).join('.'), 'STEP_INPUT_INVALID', `Input for ${step.name}: ${zodIssue.message}`),
        ),
      );
    }
    try {
      return await step.run(parsed.data, runDeps);
    } catch (error) {
      // Log where it crashed, never what it was processing. Error messages can echo input values
      // (patient data), so only the error type and stack frames are logged, not the message.
      console.error(`[ingest] step ${step.name} crashed for ${runDeps.submissionId}: ${describeCrash(error)}`);
      return failure([issue('', 'STEP_CRASHED', `The ${step.name} step failed unexpectedly`)]);
    }
  }

  /** Extra fields to record once validate has produced a payload. */
  async function identityPatch(submissionId: string, output: unknown): Promise<SubmissionPatch> {
    const identity = identitySchema.safeParse(output);
    if (!identity.success) return {};
    const reference = identity.data.application_reference;
    const earliest = await submissions.findEarliestByReference(reference, submissionId);
    return {
      applicationReference: reference,
      sessionId: identity.data.session_id,
      duplicateOfId: earliest?.id ?? null,
      duplicateReason: earliest ? 'same_reference' : null,
    };
  }

  /**
   * After persist: link to the earliest saved application for the same person (duplicate-rules.ts),
   * unless the submission is already linked by the stronger same-reference rule.
   */
  async function samePersonPatch(submissionId: string, persistedForm: unknown): Promise<SubmissionPatch> {
    const current = await submissions.findById(submissionId);
    if (current?.duplicateOfId && current.duplicateReason === 'same_reference') return {};
    const form = transformedFormSchema.safeParse(persistedForm);
    if (!form.success) return {};
    const match = await stepDeps.applications.findEarliestSamePerson(submissionId, form.data);
    return { duplicateOfId: match?.submissionId ?? null, duplicateReason: match?.reason ?? null };
  }

  /**
   * One failure email per failed attempt. The notify step never runs on failure, so the runner
   * sends it. Guarded twice: the notifier does not throw, and an email must never change the result.
   */
  async function notifyFailure(event: FailedSubmissionEvent): Promise<void> {
    try {
      await stepDeps.notifier.notifyFailed(event);
    } catch (error) {
      console.error(`[ingest] failure email for ${event.submissionId} crashed: ${describeCrash(error)}`);
    }
  }

  /** Runs PIPELINE_STEPS from `startIndex`, recording every step, and stops at the first error. */
  async function execute(submission: SubmissionRecord, startIndex: number, firstInput: unknown): Promise<IngestResultDto> {
    const submissionId = submission.id;
    const attempt = submission.attempts;
    const runDeps: StepDeps = { ...stepDeps, submissionId };
    const issues: StepIssue[] = [];
    let input = firstInput;

    await submissions.update(submissionId, { status: 'processing', failedStep: null });

    for (const step of PIPELINE_STEPS.slice(startIndex)) {
      const startedAt = stepDeps.now();
      const started = performance.now();
      const result = await runStep(step, input, runDeps);
      const durationMs = Math.round(performance.now() - started);

      await submissions.recordStepRun({
        submissionId,
        step: step.name,
        attempt,
        status: result.status,
        output: result.status === 'error' ? null : result.output,
        issues: result.issues,
        durationMs,
        startedAt,
      });
      issues.push(...result.issues);

      if (result.status === 'error') {
        await submissions.update(submissionId, { status: 'failed', lastStep: step.name, failedStep: step.name });
        await notifyFailure({ submissionId, failedStep: step.name, issues: result.issues });
        return { submissionId, status: 'failed', failedStep: step.name, issues };
      }

      const extra =
        step.name === 'validate'
          ? await identityPatch(submissionId, result.output)
          : step.name === 'persist'
            ? await samePersonPatch(submissionId, input)
            : {};
      await submissions.update(submissionId, { lastStep: step.name, ...extra });
      input = result.output;
    }

    await submissions.update(submissionId, { status: 'completed', failedStep: null });
    return { submissionId, status: 'completed', failedStep: null, issues };
  }

  /** Input for a re-run from `startIndex`: the raw body, or the stored output of the step before. */
  async function rerunInput(submission: SubmissionRecord, startIndex: number, startStep: StepName): Promise<unknown> {
    const previous = PIPELINE_STEPS[startIndex - 1];
    if (!previous) return submission.rawBody;
    const run = latestUsableRun(await submissions.listStepRuns(submission.id), previous.name);
    if (!run) {
      throw new ConflictError(
        `Cannot re-run from ${startStep}: the ${previous.name} step has not succeeded yet. Re-run from ${previous.name} first.`,
      );
    }
    return run.output;
  }

  async function rerun(submissionId: string, fromStep?: StepName): Promise<IngestResultDto> {
    const submission = await load(submissionId);
    if (submission.status === 'completed') throw new ConflictError('Submission already completed');

    const startStep = fromStep ?? submission.failedStep ?? 'validate';
    const startIndex = stepIndex(startStep);
    const input = await rerunInput(submission, startIndex, startStep);

    const updated = await submissions.update(submissionId, { attempts: submission.attempts + 1 });
    return execute(updated, startIndex, input);
  }

  return {
    async run(submissionId) {
      const submission = await load(submissionId);
      return execute(submission, 0, submission.rawBody);
    },

    rerun,

    async rerunFailedAt(step) {
      const ids = await submissions.listIdsFailedAt(step);
      let completed = 0;
      let failed = 0;
      // Sequential on purpose: keeps load on the geocoder and database predictable.
      for (const id of ids) {
        try {
          const result = await rerun(id);
          if (result.status === 'completed') completed += 1;
          else failed += 1;
        } catch (error) {
          // One bad submission (e.g. completed meanwhile) must not stop the batch.
          console.error(`[ingest] bulk re-run failed for ${id}`, error instanceof Error ? error.message : 'unknown');
          failed += 1;
        }
      }
      return { requested: ids.length, completed, failed } satisfies BulkRerunResultDto;
    },
  };
}
