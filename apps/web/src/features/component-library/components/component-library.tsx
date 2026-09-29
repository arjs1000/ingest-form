import { useState } from 'react';

import { IText } from '@/core/components/IText';
import { cn } from '@/core/lib/cn';

import { ButtonsSection } from './sections/buttons-section';
import { ColoursSection } from './sections/colours-section';
import { DisplaySection } from './sections/display-section';
import { FeedbackSection } from './sections/feedback-section';
import { FormsSection } from './sections/forms-section';
import { LayoutSection } from './sections/layout-section';
import { NavigationSection } from './sections/navigation-section';
import { OverlaySection } from './sections/overlay-section';
import { TypographySection } from './sections/typography-section';

type PreviewSurface = 'patient' | 'admin';

const SECTIONS = [
  { id: 'typography', label: 'Typography' },
  { id: 'colours', label: 'Colours' },
  { id: 'buttons', label: 'Buttons' },
  { id: 'forms', label: 'Forms' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'overlay', label: 'Overlay' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'display', label: 'Display' },
  { id: 'layout', label: 'Layout' },
] as const;

/** Living catalogue of every core/components I* component, rendered on either surface. */
export function ComponentLibrary() {
  const [surface, setSurface] = useState<PreviewSurface>('admin');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-(--card-radius) border border-border bg-surface p-(--card-pad) md:flex-row md:items-center md:justify-between">
        <nav aria-label="Component categories">
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div role="radiogroup" aria-label="Preview surface" className="inline-flex shrink-0 rounded-[8px] border border-border bg-page p-1">
          {(['patient', 'admin'] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={surface === option}
              onClick={() => setSurface(option)}
              className={cn(
                'min-h-8 rounded-[6px] px-3 font-semibold capitalize text-text-secondary',
                surface === option && 'bg-surface text-text shadow-sm',
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <IText as="p" size="sm" tone="secondary">
        Previewing the {surface} surface. Components read surface variables from styles.css, so the same code renders
        at patient (NHS) or admin (dashboard) density.
      </IText>

      <div data-surface={surface} className="flex flex-col gap-12">
        <TypographySection />
        <ColoursSection />
        <ButtonsSection />
        <FormsSection />
        <FeedbackSection />
        <OverlaySection />
        <NavigationSection />
        <DisplaySection />
        <LayoutSection />
      </div>
    </div>
  );
}
