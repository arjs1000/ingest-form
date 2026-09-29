import type { DuplicateGroupDto } from '@ingest-form/shared';

import { IBadge } from '@/core/components/IBadge';
import { IButton } from '@/core/components/IButton';
import { ICopyButton } from '@/core/components/ICopyButton';
import { IFormSection } from '@/core/components/IFormSection';
import {
  ITable,
  ITableBody,
  ITableCaption,
  ITableCell,
  ITableHead,
  ITableHeaderCell,
  ITableRow,
} from '@/core/components/ITable';

import { DUPLICATE_REASON_LABELS } from '../constants';
import { formatDateTime, pluralise } from '../utils/format';
import { SubmissionStatusBadge } from './submission-status-badge';

export interface DuplicateGroupSectionProps {
  group: DuplicateGroupDto;
  onOpenSubmission: (id: string) => void;
}

/** Title: the person's name when a saved application exists, else the shared reference. */
function groupTitle(group: DuplicateGroupDto): string {
  const person = group.submissions.find((submission) => submission.person)?.person;
  if (person) return `${person.firstName} ${person.lastName}`;
  return group.submissions[0]?.applicationReference ?? 'Unknown submission';
}

/**
 * One set of submissions that look like the same application or the same person, oldest first,
 * with each submission's full ID and why it matched the first one.
 */
export function DuplicateGroupSection({ group, onOpenSubmission }: DuplicateGroupSectionProps) {
  const title = groupTitle(group);
  const matchedOn = group.matchedOn.map((reason) => DUPLICATE_REASON_LABELS[reason].toLowerCase()).join(', ');

  return (
    <IFormSection title={title} description={`${pluralise(group.submissions.length, 'submission')}. Matched on: ${matchedOn}.`}>
      <ITable>
        <ITableCaption className="sr-only">Possible duplicate submissions for {title}</ITableCaption>
        <ITableHead>
          <ITableRow>
            <ITableHeaderCell>Submission ID</ITableHeaderCell>
            <ITableHeaderCell>Match</ITableHeaderCell>
            <ITableHeaderCell>Email and mobile</ITableHeaderCell>
            <ITableHeaderCell>Reference</ITableHeaderCell>
            <ITableHeaderCell>Received</ITableHeaderCell>
            <ITableHeaderCell>Status</ITableHeaderCell>
            <ITableHeaderCell>Source</ITableHeaderCell>
            <ITableHeaderCell>
              <span className="sr-only">Actions</span>
            </ITableHeaderCell>
          </ITableRow>
        </ITableHead>
        <ITableBody>
          {group.submissions.map((submission) => (
            <ITableRow key={submission.id}>
              <ITableCell>
                <div className="flex items-center gap-1">
                  <code className="whitespace-nowrap font-mono text-[0.8125em]">{submission.id}</code>
                  <ICopyButton value={submission.id} label={`Copy submission ID ${submission.id}`} />
                </div>
              </ITableCell>
              <ITableCell>
                {submission.matchReason ? (
                  <IBadge tone="warning" className="whitespace-nowrap">{DUPLICATE_REASON_LABELS[submission.matchReason]}</IBadge>
                ) : (
                  <IBadge className="whitespace-nowrap">First received</IBadge>
                )}
              </ITableCell>
              <ITableCell>
                {submission.person ? (
                  <div className="flex flex-col whitespace-nowrap">
                    <span>{submission.person.email}</span>
                    <span className="text-text-secondary">{submission.person.mobileNumber}</span>
                  </div>
                ) : (
                  <span className="text-text-secondary">Not saved yet</span>
                )}
              </ITableCell>
              <ITableCell className="whitespace-nowrap font-mono text-[0.8125em]">
                {submission.applicationReference ?? '—'}
              </ITableCell>
              <ITableCell className="whitespace-nowrap">{formatDateTime(submission.receivedAt)}</ITableCell>
              <ITableCell>
                <SubmissionStatusBadge status={submission.status} />
              </ITableCell>
              <ITableCell className="whitespace-nowrap">{submission.providerName ?? 'Patient flow (UI)'}</ITableCell>
              <ITableCell className="text-right">
                <IButton
                  variant="ghost"
                  className="w-auto text-brand"
                  aria-label={`View submission ${submission.id}`}
                  onClick={() => onOpenSubmission(submission.id)}
                >
                  View
                </IButton>
              </ITableCell>
            </ITableRow>
          ))}
        </ITableBody>
      </ITable>
    </IFormSection>
  );
}
