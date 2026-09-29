import { STEP_NAMES, type StepRunDto } from '@ingest-form/shared';
import { ChevronDown } from 'lucide-react';

import { IBadge } from '@/core/components/IBadge';
import {
  ITable,
  ITableBody,
  ITableCaption,
  ITableCell,
  ITableHead,
  ITableHeaderCell,
  ITableRow,
} from '@/core/components/ITable';

import { STEP_LABELS, STEP_RUN_STATUS_LABELS, STEP_RUN_STATUS_TONES } from '../constants';
import { formatDateTime, formatDuration, pluralise } from '../utils/format';
import { sortStepRuns } from '../utils/latest-step-runs';
import { StepIssueList } from './step-issue-list';

/** "All attempts" disclosure: every step run the submission has had, oldest first. */
export function StepAttempts({ runs }: { runs: StepRunDto[] }) {
  const sorted = sortStepRuns(runs, STEP_NAMES);

  return (
    <details className="group rounded-(--card-radius) border border-border bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-(--card-pad) font-semibold [&::-webkit-details-marker]:hidden">
        All attempts ({pluralise(sorted.length, 'step run')})
        <ChevronDown aria-hidden="true" className="size-5 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-border p-(--card-pad)">
        {sorted.length === 0 ? (
          <p className="text-text-secondary">No steps have run yet.</p>
        ) : (
          <ITable>
            <ITableCaption className="sr-only">All step runs</ITableCaption>
            <ITableHead>
              <ITableRow>
                <ITableHeaderCell>Attempt</ITableHeaderCell>
                <ITableHeaderCell>Step</ITableHeaderCell>
                <ITableHeaderCell>Status</ITableHeaderCell>
                <ITableHeaderCell>Duration</ITableHeaderCell>
                <ITableHeaderCell>Started</ITableHeaderCell>
                <ITableHeaderCell>Issues</ITableHeaderCell>
              </ITableRow>
            </ITableHead>
            <ITableBody>
              {sorted.map((run) => (
                <ITableRow key={run.id}>
                  <ITableCell>{run.attempt}</ITableCell>
                  <ITableCell>{STEP_LABELS[run.step]}</ITableCell>
                  <ITableCell>
                    <IBadge tone={STEP_RUN_STATUS_TONES[run.status]}>{STEP_RUN_STATUS_LABELS[run.status]}</IBadge>
                  </ITableCell>
                  <ITableCell className="whitespace-nowrap">{formatDuration(run.durationMs)}</ITableCell>
                  <ITableCell className="whitespace-nowrap">{formatDateTime(run.startedAt)}</ITableCell>
                  <ITableCell className="min-w-64">
                    {run.issues.length === 0 ? <span className="text-text-secondary">None</span> : <StepIssueList issues={run.issues} />}
                  </ITableCell>
                </ITableRow>
              ))}
            </ITableBody>
          </ITable>
        )}
      </div>
    </details>
  );
}
