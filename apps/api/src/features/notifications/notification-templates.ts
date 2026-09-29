import type { StepName, SubmissionSource } from '@ingest-form/shared';

/**
 * What an email may say about a submission. Deliberately no names, dates of birth, contact
 * details or addresses: emails sit in inboxes, so they carry identifiers and codes only.
 */
export interface SubmissionEmailFacts {
  submissionId: string;
  reference: string | null;
  source: SubmissionSource;
  attempt: number;
  /** Deep link to the submission in the admin panel, or null when ADMIN_BASE_URL is not set. */
  adminUrl: string | null;
}

export interface FailedSubmissionEmailFacts extends SubmissionEmailFacts {
  failedStep: StepName;
  issueCodes: string[];
}

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

const SUBJECT_PREFIX = '[Bookable ingest]';
const MAX_REFERENCE_LENGTH = 80;

const SOURCE_LABELS: Record<SubmissionSource, string> = {
  api: 'Supplier API',
  ui: 'Patient web form',
};

/** The reference comes from the submitted body: strip line breaks (header injection) and cap it. */
function referenceLabel(facts: SubmissionEmailFacts): string {
  const reference = facts.reference?.replace(/[\r\n\t]+/g, ' ').trim().slice(0, MAX_REFERENCE_LENGTH);
  return reference || `submission ${facts.submissionId}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function render(subject: string, heading: string, rows: [string, string][], adminUrl: string | null): RenderedEmail {
  const linkText = adminUrl ? `Open in the admin panel: ${adminUrl}` : 'Open Admin → Ingested forms to see the details.';
  const text = [heading, '', ...rows.map(([label, value]) => `${label}: ${value}`), '', linkText].join('\n');

  const htmlRows = rows
    .map(([label, value]) => `<tr><th align="left" style="padding:4px 12px 4px 0">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`)
    .join('');
  const htmlLink = adminUrl
    ? `<p><a href="${escapeHtml(adminUrl)}">Open in the admin panel</a></p>`
    : '<p>Open Admin → Ingested forms to see the details.</p>';
  const html = `<p>${escapeHtml(heading)}</p><table>${htmlRows}</table>${htmlLink}`;

  return { subject, text, html };
}

export function completedSubmissionEmail(facts: SubmissionEmailFacts): RenderedEmail {
  const label = referenceLabel(facts);
  return render(
    `${SUBJECT_PREFIX} Completed ${label}`,
    'A submission completed the ingest pipeline and its application was saved.',
    [
      ['Reference', label],
      ['Status', 'Completed'],
      ['Source', SOURCE_LABELS[facts.source]],
      ['Attempt', String(facts.attempt)],
      ['Submission ID', facts.submissionId],
    ],
    facts.adminUrl,
  );
}

export function failedSubmissionEmail(facts: FailedSubmissionEmailFacts): RenderedEmail {
  const label = referenceLabel(facts);
  return render(
    `${SUBJECT_PREFIX} Failed at ${facts.failedStep}: ${label}`,
    'A submission stopped in the ingest pipeline. Fix the cause, then re-run it from the admin panel.',
    [
      ['Reference', label],
      ['Status', 'Failed'],
      ['Failed step', facts.failedStep],
      ['Issue codes', facts.issueCodes.join(', ') || 'none'],
      ['Source', SOURCE_LABELS[facts.source]],
      ['Attempt', String(facts.attempt)],
      ['Submission ID', facts.submissionId],
    ],
    facts.adminUrl,
  );
}
