import { transformedFormSchema } from '@ingest-form/shared';
import type { TransformedForm } from '@ingest-form/shared';
import { z } from 'zod';

import { failure, issue, success } from '../pipeline/step.types';
import type { IngestStep } from '../pipeline/step.types';

export const persistedApplicationSchema = z.object({ applicationId: z.string() });

export type PersistedApplication = z.infer<typeof persistedApplicationSchema>;

/** Saves the Application row. Upsert, so re-running persist never creates a second row. */
export const persistStep: IngestStep<TransformedForm, PersistedApplication> = {
  name: 'persist',
  input: transformedFormSchema,
  async run(form, deps) {
    try {
      const { id } = await deps.applications.upsertForSubmission(deps.submissionId, form);
      return success({ applicationId: id });
    } catch (error) {
      // Database errors can echo row values; log only the error type, never the form.
      console.error(`[ingest] persist failed for ${deps.submissionId}`, error instanceof Error ? error.name : 'unknown');
      return failure([issue('', 'PERSIST_FAILED', 'Could not save the application')]);
    }
  },
};
