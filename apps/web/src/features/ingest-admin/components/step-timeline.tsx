import { STEP_NAMES, type StepRunDto } from '@ingest-form/shared';

import { IBadge } from '@/core/components/IBadge';
import { IText } from '@/core/components/IText';

import { STEP_LABELS, STEP_RUN_STATUS_LABELS, STEP_RUN_STATUS_TONES } from '../constants';
import { formatDuration } from '../utils/format';
import { latestStepRuns } from '../utils/latest-step-runs';
import { StepIssueList } from './step-issue-list';
import { StepRunIcon } from './step-run-icon';

/** The six pipeline steps in order, each showing its latest attempt and that attempt's issues. */
export function StepTimeline({ runs }: { runs: StepRunDto[] }) {
  const latest = latestStepRuns(runs);

  return (
    <ol aria-label="Pipeline steps" className="flex flex-col">
      {STEP_NAMES.map((step, index) => {
        const run = latest.get(step);
        const isLast = index === STEP_NAMES.length - 1;
        return (
          <li key={step} aria-label={`${STEP_LABELS[step]} step`} className="relative flex gap-3 pb-4 last:pb-0">
            {/* Connector line between step icons. */}
            {isLast ? null : <span aria-hidden="true" className="absolute bottom-0 left-2.5 top-6 w-px -translate-x-1/2 bg-border" />}
            <StepRunIcon status={run?.status} />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <IText weight="semibold">
                  {index + 1}. {STEP_LABELS[step]}
                </IText>
                {run ? (
                  <IBadge tone={STEP_RUN_STATUS_TONES[run.status]}>{STEP_RUN_STATUS_LABELS[run.status]}</IBadge>
                ) : (
                  <IBadge>Not run</IBadge>
                )}
                {run ? (
                  <IText size="sm" tone="secondary">
                    Attempt {run.attempt} · {formatDuration(run.durationMs)}
                  </IText>
                ) : null}
              </div>
              {run ? <StepIssueList issues={run.issues} /> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
