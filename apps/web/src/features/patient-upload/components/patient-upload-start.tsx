import { Link } from '@tanstack/react-router';

import { IBackBar } from '@/core/components/IBackBar';
import { IButton } from '@/core/components/IButton';
import { ICard, ICardHeading } from '@/core/components/ICard';
import { IContainer } from '@/core/components/IContainer';
import { IList } from '@/core/components/IList';

const FLOW_STEPS = [
  'Tell us which document you have and upload it (a PDF or a photo)',
  'Check the details we found and correct anything that is wrong',
  'Send them to your GP practice and get a reference',
];

export interface PatientUploadStartProps {
  /** Starts a fresh intake draft; runs just before "Start now" navigates to the first step. */
  onStart: () => void;
}

export function PatientUploadStart({ onStart }: PatientUploadStartProps) {
  return (
    <>
      <IBackBar>
        <Link to="/">Back</Link>
      </IBackBar>
      <IContainer className="flex flex-col gap-8 pt-8 md:pt-12">
        <div className="flex max-w-2xl flex-col gap-3">
          <h1>Upload your documents</h1>
          <p className="text-text-secondary">It takes about 5 minutes. You can upload photos from your phone.</p>
        </div>

        <ICard className="max-w-2xl">
          <ICardHeading>What happens next</ICardHeading>
          <IList variant="number" items={FLOW_STEPS} />
        </ICard>

        <div className="flex max-w-2xl flex-col gap-2">
          <IButton asChild className="self-start">
            <Link to="/patient-upload/document" onClick={onStart}>
              Start now
            </Link>
          </IButton>
        </div>
      </IContainer>
    </>
  );
}
