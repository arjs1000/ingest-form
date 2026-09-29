import type { SubmissionSummaryDto } from '@ingest-form/shared';

import { IBadge } from '@/core/components/IBadge';
import { IButton } from '@/core/components/IButton';
import {
  ITable,
  ITableBody,
  ITableCaption,
  ITableCell,
  ITableHead,
  ITableHeaderCell,
  ITableRow,
} from '@/core/components/ITable';

import { DUPLICATE_REASON_LABELS, STEP_LABELS } from '../constants';
import { formatDateTime } from '../utils/format';
import { SubmissionSourceBadge } from './submission-source-badge';
import { SubmissionStatusBadge } from './submission-status-badge';

export interface SubmissionTableProps {
  submissions: SubmissionSummaryDto[];
  onOpenSubmission: (id: string) => void;
}

export function SubmissionTable({ submissions, onOpenSubmission }: SubmissionTableProps) {
  return (
    <ITable>
      <ITableCaption className="sr-only">Ingested forms</ITableCaption>
      <ITableHead>
        <ITableRow>
          <ITableHeaderCell>Received</ITableHeaderCell>
          <ITableHeaderCell>Application reference</ITableHeaderCell>
          <ITableHeaderCell>Source</ITableHeaderCell>
          <ITableHeaderCell>Status</ITableHeaderCell>
          <ITableHeaderCell>Failed step</ITableHeaderCell>
          <ITableHeaderCell>Attempts</ITableHeaderCell>
          <ITableHeaderCell>
            <span className="sr-only">Actions</span>
          </ITableHeaderCell>
        </ITableRow>
      </ITableHead>
      <ITableBody>
        {submissions.map((submission) => {
          const reference = submission.applicationReference ?? 'No reference';
          return (
            // Row click is a mouse shortcut; the View button is the keyboard and screen reader path.
            <ITableRow key={submission.id} clickable onClick={() => onOpenSubmission(submission.id)}>
              <ITableCell className="whitespace-nowrap">{formatDateTime(submission.receivedAt)}</ITableCell>
              <ITableCell>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={submission.applicationReference ? 'font-mono' : 'text-text-secondary'}>{reference}</span>
                  {submission.duplicateReason ? (
                    <IBadge tone="warning">Duplicate · {DUPLICATE_REASON_LABELS[submission.duplicateReason]}</IBadge>
                  ) : null}
                </div>
              </ITableCell>
              <ITableCell>
                <SubmissionSourceBadge source={submission.source} providerName={submission.providerName} />
              </ITableCell>
              <ITableCell>
                <SubmissionStatusBadge status={submission.status} />
              </ITableCell>
              <ITableCell className="whitespace-nowrap">
                {submission.failedStep ? STEP_LABELS[submission.failedStep] : <span className="text-text-secondary">None</span>}
              </ITableCell>
              <ITableCell>{submission.attempts}</ITableCell>
              <ITableCell className="text-right">
                <IButton
                  variant="ghost"
                  className="w-auto text-brand"
                  aria-label={`View submission ${reference}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenSubmission(submission.id);
                  }}
                >
                  View
                </IButton>
              </ITableCell>
            </ITableRow>
          );
        })}
      </ITableBody>
    </ITable>
  );
}
