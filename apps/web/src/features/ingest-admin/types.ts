import type { StepName, SubmissionSource, SubmissionStatus } from '@ingest-form/shared';

/** "Ingested forms" list filters. Held in the URL by the settings route; `page` is 1-based. */
export interface SubmissionFilters {
  status?: SubmissionStatus;
  source?: SubmissionSource;
  failedStep?: StepName;
  page?: number;
}
