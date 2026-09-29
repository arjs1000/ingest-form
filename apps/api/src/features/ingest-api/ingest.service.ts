import type { IngestResultDto } from '@ingest-form/shared';

import type { PipelineRunner } from '../ingest/pipeline/pipeline.types';
import type { SubmissionRepository } from '../ingest/repositories/ingest.repositories';

export interface ReceiveInput {
  /** The request body exactly as received. Never parsed here: invalid JSON is stored too. */
  rawBody: string;
  providerId: string;
  apiKeyId: string;
}

export interface IngestService {
  receive(input: ReceiveInput): Promise<IngestResultDto>;
}

export interface IngestServiceDeps {
  submissions: Pick<SubmissionRepository, 'create'>;
  pipeline: Pick<PipelineRunner, 'run'>;
}

/** Stores the raw body first, so the record exists (and can be re-run) whatever the pipeline does. */
export function createIngestService(deps: IngestServiceDeps): IngestService {
  return {
    async receive(input) {
      const submission = await deps.submissions.create({
        source: 'api',
        providerId: input.providerId,
        apiKeyId: input.apiKeyId,
        rawBody: input.rawBody,
      });
      return deps.pipeline.run(submission.id);
    },
  };
}
