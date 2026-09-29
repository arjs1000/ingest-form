import { ChevronDown } from 'lucide-react';
import type { SelectHTMLAttributes } from 'react';

import { cn } from '@/core/lib/cn';

export type ISelectProps = SelectHTMLAttributes<HTMLSelectElement>;

/** Native select: phones open their own picker, which is the most accessible option. */
export function ISelect({ className, children, ...props }: ISelectProps) {
  return (
    <div className="relative w-full md:max-w-sm">
      <select
        className={cn(
          'min-h-(--control-h) w-full appearance-none rounded-(--control-radius) border-(length:--control-border-w) border-text-secondary bg-surface py-2 pl-3 pr-10',
          'text-(length:--control-text) text-text aria-[invalid=true]:border-error',
          'disabled:cursor-not-allowed disabled:border-border-strong disabled:bg-page disabled:text-text-secondary',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-text" />
    </div>
  );
}
