import type { StepName } from '@ingest-form/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RotateCw } from 'lucide-react';
import { useState } from 'react';

import { IButton } from '@/core/components/IButton';
import {
  IDialog,
  IDialogClose,
  IDialogContent,
  IDialogDescription,
  IDialogFooter,
  IDialogTitle,
  IDialogTrigger,
} from '@/core/components/IDialog';
import { notify } from '@/core/lib/notify';

import { rerunFailedMutationOptions } from '../api/ingest-admin.mutations';
import { STEP_LABELS } from '../constants';
import { pluralise } from '../utils/format';

export interface BulkRerunDialogProps {
  /** The failed-step filter. The trigger is disabled until one is chosen. */
  step: StepName | undefined;
}

export function BulkRerunDialog({ step }: BulkRerunDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const rerun = useMutation(rerunFailedMutationOptions(queryClient));
  const stepLabel = step ? STEP_LABELS[step] : undefined;

  const confirm = () => {
    if (!step || !stepLabel) return;
    rerun.mutate(step, {
      onSuccess: (result) => {
        setOpen(false);
        if (result.requested === 0) {
          notify.info(`No submissions had failed at ${stepLabel}`);
          return;
        }
        notify.success(`Re-ran ${pluralise(result.requested, 'submission')}`, {
          description: `${result.completed} completed, ${result.failed} failed.`,
        });
      },
      onError: (error) => notify.error('Bulk re-run failed', { description: error.message }),
    });
  };

  return (
    <IDialog open={open} onOpenChange={setOpen}>
      <IDialogTrigger asChild>
        <IButton
          variant="reverse"
          disabled={!step}
          title={step ? undefined : 'Choose a failed step to re-run in bulk'}
        >
          <RotateCw aria-hidden="true" />
          {stepLabel ? `Re-run all failed at ${stepLabel}` : 'Re-run all failed at step'}
        </IButton>
      </IDialogTrigger>
      <IDialogContent>
        <IDialogTitle>Re-run all failed at {stepLabel}?</IDialogTitle>
        <IDialogDescription>
          Every submission that failed at {stepLabel} runs again from that step, with its attempt count increased.
          Use this after a fix has been deployed.
        </IDialogDescription>
        <IDialogFooter>
          <IDialogClose asChild>
            <IButton variant="reverse">Cancel</IButton>
          </IDialogClose>
          <IButton onClick={confirm} disabled={rerun.isPending}>
            <RotateCw aria-hidden="true" />
            {rerun.isPending ? 'Re-running…' : 'Re-run all'}
          </IButton>
        </IDialogFooter>
      </IDialogContent>
    </IDialog>
  );
}
