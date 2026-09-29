import { z } from 'zod';

import { issue, skipped, success } from '../pipeline/step.types';
import type { IngestStep } from '../pipeline/step.types';
import { persistedApplicationSchema } from './05-persist.step';
import type { PersistedApplication } from './05-persist.step';

export const notifiedApplicationSchema = persistedApplicationSchema.extend({
  /** Resend message id, when the success email was sent. */
  emailId: z.string().optional(),
});

export type NotifiedApplication = z.infer<typeof notifiedApplicationSchema>;

const SKIP_MESSAGES = {
  EMAIL_NOT_CONFIGURED: 'Email is not configured (RESEND_API_KEY and RESEND_FROM_EMAIL)',
  EMAIL_NO_RECIPIENT: 'No success email address is set in Admin → General',
} as const;

/**
 * Success email (FEAT-003). Never fails the submission: not configured is `skipped`, and a
 * provider error is a warning, because the application is already saved.
 * The failure email is sent by the runner, since this step never runs after an error.
 */
export const notifyStep: IngestStep<PersistedApplication, NotifiedApplication> = {
  name: 'notify',
  input: persistedApplicationSchema,
  async run(input, deps) {
    const outcome = await deps.notifier.notifyCompleted(deps.submissionId);
    switch (outcome.status) {
      case 'sent':
        return success({ ...input, emailId: outcome.emailId });
      case 'skipped':
        return skipped(input, issue('', outcome.code, SKIP_MESSAGES[outcome.code], 'warning'));
      case 'failed':
        return success(input, [issue('', 'EMAIL_SEND_FAILED', 'The success email could not be sent', 'warning')]);
    }
  },
};
