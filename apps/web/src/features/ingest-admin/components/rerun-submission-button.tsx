import type { StepName } from '@ingest-form/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RotateCw } from 'lucide-react';

import { IButton } from '@/core/components/IButton';
import { notify } from '@/core/lib/notify';

import { rerunSubmissionMutationOptions } from '../api/ingest-admin.mutations';
import { STEP_LABELS } from '../constants';
import { pluralise } from '../utils/format';

export interface RerunSubmissionButtonProps {
  submissionId: string;
  failedStep: StepName;
}

/** Re-runs a failed submission from its failed step. The toast reports the outcome, never patient data. */
export function RerunSubmissionButton({ submissionId, failedStep }: RerunSubmissionButtonProps) {
  const queryClient = useQueryClient();
  const rerun = useMutation(rerunSubmissionMutationOptions(queryClient));

  const run = () =>
    rerun.mutate(
      { id: submissionId, fromStep: failedStep },
      {
        onSuccess: (result) => {
          if (result.status === 'completed') {
            notify.success('Re-run completed', { description: 'Every step passed.' });
            return;
          }
          const step = result.failedStep ? STEP_LABELS[result.failedStep] : 'a step';
          notify.warning(`Re-run failed at ${step}`, {
            description: `${pluralise(result.issues.length, 'issue')} recorded. See the step timeline.`,
          });
        },
        onError: (error) => notify.error('Re-run could not start', { description: error.message }),
      },
    );

  return (
    <IButton onClick={run} disabled={rerun.isPending}>
      <RotateCw aria-hidden="true" />
      {rerun.isPending ? 'Re-running…' : `Re-run from ${STEP_LABELS[failedStep]}`}
    </IButton>
  );
}
