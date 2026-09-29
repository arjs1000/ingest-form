import type { ReactNode } from 'react';

import { cn } from '@/core/lib/cn';

import { IHeading, type IHeadingLevel } from './IHeading';

export interface IConfirmationPanelProps {
  /** Usually the page's h1, e.g. "Thanks for your submission". */
  title: string;
  /** One or two short sentences under the title. */
  children?: ReactNode;
  /** Shown last, e.g. { label: 'Your reference', value: 'UIF-123456-2026' }. */
  reference?: { label: string; value: string };
  level?: IHeadingLevel;
  className?: string;
}

/**
 * NHS confirmation panel: green `action` background, white text, shown once at the end of a
 * flow. White on `action` is 5.12:1. The reference is semibold and wraps, so long ones never overflow.
 */
export function IConfirmationPanel({ title, children, reference, level = 1, className }: IConfirmationPanelProps) {
  return (
    <div className={cn('flex flex-col gap-3 rounded-(--card-radius) bg-action p-(--card-pad) text-center text-white', className)}>
      <IHeading level={level} className="text-white">
        {title}
      </IHeading>
      {children ? <div className="flex flex-col gap-2">{children}</div> : null}
      {reference ? (
        <p className="break-words">
          {reference.label}:
          <br />
          <strong className="text-(length:--h3-size) font-semibold">{reference.value}</strong>
        </p>
      ) : null}
    </div>
  );
}
