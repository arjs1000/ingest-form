import type { SubmissionDetailDto } from '@ingest-form/shared';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';

import { IBadge } from '@/core/components/IBadge';
import { IButton } from '@/core/components/IButton';
import { ICopyButton } from '@/core/components/ICopyButton';
import { IFormSection } from '@/core/components/IFormSection';
import { IHeading } from '@/core/components/IHeading';
import { IText } from '@/core/components/IText';

import { submissionDetailQueryOptions } from '../api/ingest-admin.queries';
import { DUPLICATE_REASON_LABELS, STEP_LABELS } from '../constants';
import { formatDateTime } from '../utils/format';
import { ApplicationDetails } from './application-details';
import { LoadError } from './load-error';
import { RerunSubmissionButton } from './rerun-submission-button';
import { StepAttempts } from './step-attempts';
import { StepTimeline } from './step-timeline';
import { SubmissionSourceBadge } from './submission-source-badge';
import { SubmissionStatusBadge } from './submission-status-badge';
import { TableSkeleton } from './table-skeleton';

export interface SubmissionDetailProps {
  submissionId: string;
  onBack: () => void;
}

export function SubmissionDetail({ submissionId, onBack }: SubmissionDetailProps) {
  const query = useQuery(submissionDetailQueryOptions(submissionId));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <IButton variant="ghost" className="w-auto" onClick={onBack}>
          <ArrowLeft aria-hidden="true" />
          Back to ingested forms
        </IButton>
      </div>
      {query.isPending ? <TableSkeleton label="Loading submission" /> : null}
      {query.isError ? (
        <LoadError title="Could not load this submission" error={query.error} onRetry={() => void query.refetch()} />
      ) : null}
      {query.data ? <SubmissionDetailBody submission={query.data} /> : null}
    </div>
  );
}

function SubmissionDetailBody({ submission }: { submission: SubmissionDetailDto }) {
  const meta: Array<{ label: string; value: string }> = [
    { label: 'Received', value: formatDateTime(submission.receivedAt) },
    { label: 'Updated', value: formatDateTime(submission.updatedAt) },
    { label: 'Attempts', value: String(submission.attempts) },
    { label: 'Last step', value: submission.lastStep ? STEP_LABELS[submission.lastStep] : 'None' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <IHeading level={2} className={submission.applicationReference ? 'font-mono' : undefined}>
              {submission.applicationReference ?? 'No application reference'}
            </IHeading>
            <SubmissionStatusBadge status={submission.status} />
            <SubmissionSourceBadge source={submission.source} providerName={submission.providerName} />
            {submission.duplicateReason ? (
                    <IBadge tone="warning">Duplicate · {DUPLICATE_REASON_LABELS[submission.duplicateReason]}</IBadge>
                  ) : null}
          </div>
          <div className="flex min-w-0 items-center gap-1">
            <IText size="sm" tone="secondary">
              Submission ID
            </IText>
            <code className="min-w-0 break-all font-mono text-[0.8125em]">{submission.id}</code>
            <ICopyButton value={submission.id} label="Copy submission ID" />
          </div>
        </div>
        {submission.status === 'failed' && submission.failedStep ? (
          <RerunSubmissionButton submissionId={submission.id} failedStep={submission.failedStep} />
        ) : null}
      </div>

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {meta.map((item) => (
          <div key={item.label} className="flex flex-col gap-0.5">
            <dt className="text-text-secondary">{item.label}</dt>
            <dd className="font-semibold">{item.value}</dd>
          </div>
        ))}
      </dl>

      <IFormSection title="Steps" description="The latest attempt of each step, in pipeline order.">
        <StepTimeline runs={submission.steps} />
      </IFormSection>

      <StepAttempts runs={submission.steps} />

      <IFormSection title="Raw body" description="Exactly as received. Contains patient data: do not copy it anywhere else.">
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-all rounded-(--control-radius) border border-border bg-page p-3 font-mono text-[0.8125em]">
          {submission.rawBody}
        </pre>
      </IFormSection>

      {submission.application ? <ApplicationDetails application={submission.application} /> : null}
    </div>
  );
}
