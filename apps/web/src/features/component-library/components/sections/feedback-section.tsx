import { IButton } from '@/core/components/IButton';
import { IConfirmationPanel } from '@/core/components/IConfirmationPanel';
import { IErrorSummary } from '@/core/components/IErrorSummary';
import { ISkeleton } from '@/core/components/ISkeleton';
import { IStatusPill } from '@/core/components/IStatusPill';
import { notify } from '@/core/lib/notify';

import { ShowcaseItem, ShowcaseSection } from '../showcase';

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function FeedbackSection() {
  return (
    <ShowcaseSection id="feedback" title="Feedback" description="Toasts through notify only. Status is never colour alone.">
      <ShowcaseItem name="notify (IToaster)" usage="notify.success | info | warning | error | promise" wide>
        <div className="flex flex-wrap gap-3">
          <IButton variant="reverse" onClick={() => notify.success('Settings saved', { description: 'Changes apply to new uploads.' })}>
            Success
          </IButton>
          <IButton variant="reverse" onClick={() => notify.info('Upload queued')}>
            Info
          </IButton>
          <IButton variant="reverse" onClick={() => notify.warning('File is large', { description: 'It may take a minute.' })}>
            Warning
          </IButton>
          <IButton variant="reverse" onClick={() => notify.error('Upload failed', { description: 'The file type is not allowed.' })}>
            Error
          </IButton>
          <IButton
            variant="reverse"
            onClick={() => void notify.promise(wait(1500), { loading: 'Saving', success: 'Saved', error: 'Could not save' })}
          >
            Promise
          </IButton>
        </div>
      </ShowcaseItem>
      <ShowcaseItem name="IStatusPill" usage="ok | offline | checking, optional detail">
        <div className="flex flex-wrap gap-2">
          <IStatusPill status="ok" label="API OK" />
          <IStatusPill status="checking" label="Checking API" />
          <IStatusPill status="offline" label="API offline" detail="No response from API" />
        </div>
      </ShowcaseItem>
      <ShowcaseItem name="ISkeleton" usage="Loading states">
        <div className="flex flex-col gap-2">
          <ISkeleton className="h-4 w-3/4" />
          <ISkeleton className="h-4 w-1/2" />
          <ISkeleton className="h-24 w-full" />
        </div>
      </ShowcaseItem>
      <ShowcaseItem name="IErrorSummary" usage="Top of a form after a failed submit, takes focus" wide>
        <IErrorSummary
          autoFocus={false}
          errors={[
            { fieldId: 'demo-postcode', message: 'Enter a real postcode' },
            { fieldId: 'demo-radios-yes', message: 'Select if you have had this before' },
          ]}
        />
      </ShowcaseItem>
      <ShowcaseItem name="IConfirmationPanel" usage="End of a patient flow: green panel with the reference" wide>
        <IConfirmationPanel level={3} title="Thanks for your submission" reference={{ label: 'Your reference', value: 'UIF-123456-2026' }}>
          <p>We&apos;ll be in touch with your GP practice.</p>
        </IConfirmationPanel>
      </ShowcaseItem>
    </ShowcaseSection>
  );
}
