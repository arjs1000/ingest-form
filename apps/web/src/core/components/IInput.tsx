import type { InputHTMLAttributes } from 'react';

import { cn } from '@/core/lib/cn';

export type IInputProps = InputHTMLAttributes<HTMLInputElement>;

/** Native input. Text is 16px minimum so iOS does not zoom on focus. */
export function IInput({ className, ...props }: IInputProps) {
  return (
    <input
      className={cn(
        'min-h-(--control-h) w-full rounded-(--control-radius) border-(length:--control-border-w) border-text-secondary bg-surface px-3 text-(length:--control-text) text-text',
        'placeholder:text-text-secondary aria-[invalid=true]:border-error',
        'disabled:cursor-not-allowed disabled:border-border-strong disabled:bg-page',
        className,
      )}
      {...props}
    />
  );
}
