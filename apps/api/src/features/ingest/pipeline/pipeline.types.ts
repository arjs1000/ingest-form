import type { BulkRerunResultDto, IngestResultDto, StepName } from '@ingest-form/shared';

import type { SubmissionRepository } from '../repositories/ingest.repositories';
import type { StepDeps } from './step.types';

/**
 * Runs the ingest steps for a stored submission. Routes depend on this interface only;
 * the implementation is createPipelineRunner() in run-pipeline.ts.
 */
export interface PipelineRunner {
  /** First run of a freshly received submission, from `validate`. */
  run(submissionId: string): Promise<IngestResultDto>;
  /**
   * Re-run a failed submission from its failed step (or from `fromStep` if given), reusing
   * the stored output of the step before it. Increments `attempts`.
   * Throws NotFoundError for an unknown id and ConflictError for a completed submission.
   */
  rerun(submissionId: string, fromStep?: StepName): Promise<IngestResultDto>;
  /** Re-run every submission that failed at `step`. */
  rerunFailedAt(step: StepName): Promise<BulkRerunResultDto>;
}

export interface PipelineRunnerDeps {
  submissions: SubmissionRepository;
  /** Everything steps need except the per-run submission id. */
  stepDeps: Omit<StepDeps, 'submissionId'>;
}
