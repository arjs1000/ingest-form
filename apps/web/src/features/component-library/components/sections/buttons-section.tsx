import { ArrowRight, Plus, Trash2 } from 'lucide-react';

import { IButton } from '@/core/components/IButton';

import { ShowcaseItem, ShowcaseSection } from '../showcase';

export function ButtonsSection() {
  return (
    <ShowcaseSection id="buttons" title="Buttons" description="One primary per screen. Links that look like buttons use asChild.">
      <ShowcaseItem name="IButton" usage="variant: primary | secondary | reverse | warning | ghost" wide>
        <div className="flex flex-wrap gap-3">
          <IButton className="md:w-auto">
            Continue
            <ArrowRight aria-hidden="true" />
          </IButton>
          <IButton variant="secondary">Secondary</IButton>
          <IButton variant="reverse">
            <Plus aria-hidden="true" />
            Reverse
          </IButton>
          <IButton variant="warning">
            <Trash2 aria-hidden="true" />
            Warning
          </IButton>
          <IButton variant="ghost">Ghost</IButton>
          <IButton disabled>Disabled</IButton>
        </div>
      </ShowcaseItem>
      <ShowcaseItem name="IButton asChild" usage="Renders the child link with button styling">
        <IButton asChild>
          <a href="#buttons">Link styled as a button</a>
        </IButton>
      </ShowcaseItem>
      <ShowcaseItem name="IButton fullWidth" usage="Full width at every size">
        <IButton fullWidth>Full width</IButton>
      </ShowcaseItem>
    </ShowcaseSection>
  );
}
