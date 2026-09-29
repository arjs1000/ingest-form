import { Slot } from '@radix-ui/react-slot';
import type { HTMLAttributes, ReactElement } from 'react';

import { cn } from '@/core/lib/cn';

export interface ICardProps extends HTMLAttributes<HTMLElement> {
  /** Whole card is one link target. Put an `ICardLink` in the heading. */
  clickable?: boolean;
}

export function ICard({ clickable = false, className, ...props }: ICardProps) {
  return (
    <section
      className={cn(
        'relative flex flex-col gap-4 rounded-(--card-radius) border border-border bg-surface p-(--card-pad) shadow-(--card-shadow)',
        clickable && 'border-b-4 transition-colors hover:border-border-strong hover:bg-page/40',
        className,
      )}
      {...props}
    />
  );
}

export function ICardHeading({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-(length:--h3-size)', className)} {...props} />;
}

export function ICardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-3 text-text-secondary', className)} {...props} />;
}

export interface ICardLinkProps {
  /** A single link element, e.g. `<Link to="/x">Title</Link>`. Its hit area is stretched over the card. */
  children: ReactElement;
}

export function ICardLink({ children }: ICardLinkProps) {
  return (
    <Slot className="text-brand after:absolute after:inset-0 after:rounded-(--card-radius) after:content-[''] visited:text-brand focus-visible:text-text">
      {children}
    </Slot>
  );
}
