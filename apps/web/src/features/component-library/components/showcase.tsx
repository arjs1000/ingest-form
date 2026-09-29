import type { ReactNode } from 'react';

import { IHeading } from '@/core/components/IHeading';
import { IText } from '@/core/components/IText';

export interface ShowcaseSectionProps {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}

/** One category of the library: heading, one-line purpose, demos. */
export function ShowcaseSection({ id, title, description, children }: ShowcaseSectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="flex scroll-mt-24 flex-col gap-4">
      <div className="flex flex-col gap-1 border-b border-border pb-3">
        <IHeading level={2} id={`${id}-title`}>
          {title}
        </IHeading>
        <IText as="p" tone="secondary">
          {description}
        </IText>
      </div>
      {/* minmax(0,1fr): grid columns may shrink below their content, so wide demos scroll inside instead of widening the page. */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-2">{children}</div>
    </section>
  );
}

export interface ShowcaseItemProps {
  /** Component name as imported, e.g. "IButton". */
  name: string;
  usage?: string;
  wide?: boolean;
  children: ReactNode;
}

export function ShowcaseItem({ name, usage, wide = false, children }: ShowcaseItemProps) {
  return (
    <div className={wide ? 'flex min-w-0 flex-col gap-3 rounded-(--card-radius) border border-border bg-surface p-(--card-pad) xl:col-span-2' : 'flex min-w-0 flex-col gap-3 rounded-(--card-radius) border border-border bg-surface p-(--card-pad)'}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <code className="font-mono text-[0.8125rem] font-semibold text-brand-dark">{name}</code>
        {usage ? <IText size="sm" tone="secondary">{usage}</IText> : null}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}
