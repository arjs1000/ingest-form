import type { NotificationSettingsInput } from '@ingest-form/shared';

// The pipeline owns the notifier contract and the submission store; this feature implements the
// contract. Type-only imports, so no ingest code runs from here.
import type { FailedSubmissionEvent, NotifyOutcome, SubmissionNotifier } from '../ingest/pipeline/step.types';
import type { SubmissionRecord, SubmissionRepository } from '../ingest/repositories/ingest.repositories';
import { EmailSendError, type EmailSender } from './email-sender';
import {
  completedSubmissionEmail,
  failedSubmissionEmail,
  type RenderedEmail,
  type SubmissionEmailFacts,
} from './notification-templates';

export interface SubmissionNotifierDeps {
  /** Where to send. Returns the saved addresses (none before the first save). */
  settings: { get(): Promise<NotificationSettingsInput> };
  submissions: Pick<SubmissionRepository, 'findById'>;
  /** null when RESEND_API_KEY or RESEND_FROM_EMAIL is missing: every email is skipped. */
  sender: EmailSender | null;
  /** ADMIN_BASE_URL, used for the deep link in each email. */
  adminBaseUrl: string | undefined;
}

type EmailKind = 'completed' | 'failed';

/**
 * Sends one email per completed submission and one per failed attempt (FEAT-003).
 * Never throws: an email problem must not change a submission's outcome.
 */
export function createSubmissionNotifier(deps: SubmissionNotifierDeps): SubmissionNotifier {
  function adminUrl(submissionId: string): string | null {
    if (!deps.adminBaseUrl) return null;
    const url = new URL('/admin/settings', deps.adminBaseUrl);
    url.searchParams.set('tab', 'ingested');
    url.searchParams.set('submission', submissionId);
    return url.toString();
  }

  function facts(submission: SubmissionRecord): SubmissionEmailFacts {
    return {
      submissionId: submission.id,
      reference: submission.applicationReference,
      source: submission.source,
      attempt: submission.attempts,
      adminUrl: adminUrl(submission.id),
    };
  }

  async function send(
    kind: EmailKind,
    submissionId: string,
    recipient: (settings: NotificationSettingsInput) => string | null,
    render: (submission: SubmissionRecord) => RenderedEmail,
  ): Promise<NotifyOutcome> {
    if (!deps.sender) return { status: 'skipped', code: 'EMAIL_NOT_CONFIGURED' };
    try {
      const to = recipient(await deps.settings.get());
      if (!to) return { status: 'skipped', code: 'EMAIL_NO_RECIPIENT' };
      const submission = await deps.submissions.findById(submissionId);
      if (!submission) return { status: 'failed' };

      const sent = await deps.sender.send({
        to,
        ...render(submission),
        idempotencyKey: `${kind}-${submission.id}-${submission.attempts}`,
      });
      return { status: 'sent', emailId: sent.id };
    } catch (error) {
      // Status and error type only: provider messages and our own can contain the address.
      const detail = error instanceof EmailSendError ? `HTTP ${error.status}` : error instanceof Error ? error.name : typeof error;
      console.error(`[notifications] ${kind} email for ${submissionId} not sent: ${detail}`);
      return { status: 'failed' };
    }
  }

  return {
    notifyCompleted(submissionId) {
      return send('completed', submissionId, (settings) => settings.successEmail, (submission) =>
        completedSubmissionEmail(facts(submission)),
      );
    },

    notifyFailed(event: FailedSubmissionEvent) {
      return send('failed', event.submissionId, (settings) => settings.failureEmail, (submission) =>
        failedSubmissionEmail({
          ...facts(submission),
          failedStep: event.failedStep,
          issueCodes: [...new Set(event.issues.filter((i) => i.severity === 'error').map((i) => i.code))],
        }),
      );
    },
  };
}
