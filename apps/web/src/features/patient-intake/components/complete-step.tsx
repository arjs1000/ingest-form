import { Link, Navigate } from '@tanstack/react-router';

import { ICard, ICardHeading } from '@/core/components/ICard';
import { IConfirmationPanel } from '@/core/components/IConfirmationPanel';
import { IContainer } from '@/core/components/IContainer';
import { IList } from '@/core/components/IList';
import { IText } from '@/core/components/IText';

import { useIntakeDraftStore } from '../store/intake-draft.store';

const NEXT_STEPS = [
  'Your GP practice checks your details.',
  'They contact you if they need anything else.',
  'Keep your reference in case you need to get in touch.',
];

/** Confirmation after a submission reached the pipeline. No back bar: going back would resend. */
export function CompleteStep() {
  const result = useIntakeDraftStore((s) => s.result);
  const reset = useIntakeDraftStore((s) => s.reset);

  // "Start again" clears the draft; leave for the start page instead of rendering an empty panel.
  if (!result) return <Navigate to="/patient-upload" />;

  return (
    <IContainer className="flex flex-col gap-8 pt-8 md:pt-12">
      <IConfirmationPanel
        title="Thanks for your submission"
        className="max-w-2xl"
        reference={result.applicationReference ? { label: 'Your reference', value: result.applicationReference } : undefined}
      >
        <p>We&apos;ll be in touch with your GP practice.</p>
      </IConfirmationPanel>

      <ICard className="max-w-2xl">
        <ICardHeading>What happens next</ICardHeading>
        <IList variant="number" items={NEXT_STEPS} />
      </ICard>

      <IText as="p">
        <Link to="/patient-upload" onClick={reset}>
          Start again
        </Link>
      </IText>
    </IContainer>
  );
}
