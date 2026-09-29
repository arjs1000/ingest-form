import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/core/lib/cn';

export interface IFormSectionProps {
  title: string;
  description?: string;
  /** Collapsible via native <details>; open by default. */
  collapsible?: boolean;
  children: ReactNode;
}

const SECTION_CLASSES = 'rounded-(--card-radius) border border-border bg-surface shadow-(--card-shadow)';

/** Groups related fields in a card with a title (like PCFormCard). */
export function IFormSection({ title, description, collapsible = false, children }: IFormSectionProps) {
  const heading = (
    <span className="flex flex-col gap-1">
      <span className="text-(length:--h3-size) font-semibold">{title}</span>
      {description ? <span className="text-text-secondary">{description}</span> : null}
    </span>
  );

  if (collapsible) {
    return (
      <details open className={cn('group', SECTION_CLASSES)}>
        <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-(--card-pad) [&::-webkit-details-marker]:hidden">
          {heading}
          <ChevronDown aria-hidden="true" className="mt-1 size-5 shrink-0 transition-transform group-open:rotate-180" />
        </summary>
        <div className="flex flex-col gap-5 border-t border-border p-(--card-pad)">{children}</div>
      </details>
    );
  }

  return (
    <section className={SECTION_CLASSES}>
      <div className="border-b border-border p-(--card-pad)">{heading}</div>
      <div className="flex flex-col gap-5 p-(--card-pad)">{children}</div>
    </section>
  );
}
