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
import { ICodeBlock } from '@/core/components/ICodeBlock';
import { ISheet, ISheetContent, ISheetDescription, ISheetTitle, ISheetTrigger } from '@/core/components/ISheet';

import { ShowcaseItem, ShowcaseSection } from '../showcase';

export function OverlaySection() {
  return (
    <ShowcaseSection id="overlay" title="Overlay" description="Radix primitives, restyled. Admin surface only: patient flows never use modals (except the developer-tool ISheet).">
      <ShowcaseItem name="IDialog" usage="Trigger, Content, Title, Description, Footer, Close">
        <IDialog>
          <IDialogTrigger asChild>
            <IButton variant="reverse">Open dialog</IButton>
          </IDialogTrigger>
          <IDialogContent>
            <IDialogTitle>Archive this upload?</IDialogTitle>
            <IDialogDescription>Archived uploads are hidden from the queue but kept for audit.</IDialogDescription>
            <IDialogFooter>
              <IDialogClose asChild>
                <IButton variant="reverse">Cancel</IButton>
              </IDialogClose>
              <IDialogClose asChild>
                <IButton>Archive</IButton>
              </IDialogClose>
            </IDialogFooter>
          </IDialogContent>
        </IDialog>
      </ShowcaseItem>
      <ShowcaseItem name="ISheet" usage="Right side sheet: developer tools, detail panels">
        <ISheet>
          <ISheetTrigger asChild>
            <IButton variant="reverse">Open sheet</IButton>
          </ISheetTrigger>
          <ISheetContent>
            <ISheetTitle>Developer data</ISheetTitle>
            <ISheetDescription>Full width on phones, 32rem from md. Closes with Escape or the X.</ISheetDescription>
            <ICodeBlock label="example request" code="POST /api/v1/intake" />
          </ISheetContent>
        </ISheet>
      </ShowcaseItem>
    </ShowcaseSection>
  );
}
