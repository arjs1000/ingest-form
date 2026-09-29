import type { IntakeResultDto } from '@ingest-form/shared';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { Circle, CircleCheck, LoaderCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { IBackBar } from '@/core/components/IBackBar';
import { IButton } from '@/core/components/IButton';
import { ICard } from '@/core/components/ICard';
import { IContainer } from '@/core/components/IContainer';
import { IPageHeader } from '@/core/components/IPageHeader';
import { IStepProgress } from '@/core/components/IStepProgress';
import { IText } from '@/core/components/IText';
import { cn } from '@/core/lib/cn';

import { submitIntakeMutationOptions } from '../api/intake.mutations';
import { CRITICAL_FAILED_STEPS, INTAKE_TOTAL_STEPS } from '../constants';
import { useIntakeDraftStore } from '../store/intake-draft.store';
import { toIngestPayload } from '../utils/to-ingest-payload';

const PIPELINE_ROWS = ['Uploading your document', 'Checking your details', 'Sending to your GP practice'] as const;

/** Each row ticks after this long, so the progress is readable even when the API is instant. */
const ROW_TICK_MS = 400;

type RowStatus = 'done' | 'active' | 'waiting';

const ROW_STATUS_TEXT: Record<RowStatus, string> = { done: 'Done', active: 'In progress', waiting: 'Waiting' };

/**
 * A submission the person must retry: the pipeline rejected the payload itself. Anything later
 * (geocode, duplicates, notify) is handled by admins in the admin tabs, so the patient is done.
 */
function isCriticalResult(result: IntakeResultDto): boolean {
  return result.failedStep !== null && (CRITICAL_FAILED_STEPS as readonly string[]).includes(result.failedStep);
}

/** Step 3: sends the details and shows the pipeline ticking through, then moves to the confirmation. */
export function SubmittingStep() {
  const navigate = useNavigate();
  const sessionId = useIntakeDraftStore((s) => s.sessionId);
  const details = useIntakeDraftStore((s) => s.details);
  const extraction = useIntakeDraftStore((s) => s.extraction);
  const setResult = useIntakeDraftStore((s) => s.setResult);
  const submit = useMutation(submitIntakeMutationOptions());
  const [ticked, setTicked] = useState(0);
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    // Sends once per visit to this page. The ref survives StrictMode's double effect run in dev.
    if (started.current || !sessionId || !details) return;
    started.current = true;
    submit.mutate(toIngestPayload(details, { sessionId, applicationReference: extraction?.fields.application_reference }), {
      onSuccess: (result) => {
        if (isCriticalResult(result)) {
          setFailed(true);
          return;
        }
        setResult(result);
      },
      onError: () => setFailed(true),
    });
  }, [sessionId, details, extraction, submit, setResult]);

  const succeeded = submit.isSuccess && !failed;

  useEffect(() => {
    // Timer-driven ticks: a visual pacing concern outside React's data flow.
    if (failed) return undefined;
    const last = succeeded ? PIPELINE_ROWS.length : PIPELINE_ROWS.length - 1;
    if (ticked >= last) {
      if (succeeded) {
        const done = setTimeout(() => void navigate({ to: '/patient-upload/complete' }), ROW_TICK_MS);
        return () => clearTimeout(done);
      }
      return undefined;
    }
    const timer = setTimeout(() => setTicked((n) => n + 1), ROW_TICK_MS);
    return () => clearTimeout(timer);
  }, [ticked, succeeded, failed, navigate]);

  if (failed) {
    return (
      <>
        <IBackBar>
          <Link to="/patient-upload/details">Back</Link>
        </IBackBar>
        <IContainer className="flex flex-col gap-8 pt-8 md:pt-12">
          <div role="alert" className="flex max-w-2xl flex-col gap-4">
            <IPageHeader
              title="Sorry, there's been an error. Please try again."
              description="Your details have not been sent. We've kept what you entered."
            />
          </div>
          <IButton asChild className="self-start">
            <Link to="/patient-upload/details">Try again</Link>
          </IButton>
        </IContainer>
      </>
    );
  }

  const statusOf = (index: number): RowStatus => (index < ticked ? 'done' : index === ticked ? 'active' : 'waiting');

  return (
    <>
      <IBackBar>
        <Link to="/patient-upload/details">Back</Link>
      </IBackBar>
      <IContainer className="flex flex-col gap-8 pt-8 md:pt-12">
        <IPageHeader
          eyebrow={<IStepProgress current={3} total={INTAKE_TOTAL_STEPS} label="Sending" />}
          title="Sending your details"
          description="This usually takes a few seconds. Please don't close this page."
        />
        <ICard className="max-w-2xl">
          <ol aria-live="polite" className="flex flex-col gap-4">
            {PIPELINE_ROWS.map((row, index) => {
              const status = statusOf(index);
              const Icon = status === 'done' ? CircleCheck : status === 'active' ? LoaderCircle : Circle;
              return (
                <li key={row} className="flex items-center gap-3">
                  <Icon
                    aria-hidden="true"
                    className={cn(
                      'size-6 shrink-0',
                      status === 'done' && 'text-action',
                      status === 'active' && 'animate-spin text-brand',
                      status === 'waiting' && 'text-border-strong',
                    )}
                  />
                  <IText weight={status === 'waiting' ? 'regular' : 'semibold'} tone={status === 'waiting' ? 'secondary' : 'default'}>
                    {row}
                  </IText>
                  <IText size="sm" tone="secondary" className="ml-auto">
                    {ROW_STATUS_TEXT[status]}
                  </IText>
                </li>
              );
            })}
          </ol>
        </ICard>
      </IContainer>
    </>
  );
}
