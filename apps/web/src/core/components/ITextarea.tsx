import { useState, type TextareaHTMLAttributes } from 'react';

import { cn } from '@/core/lib/cn';

export interface ITextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Shows "You have N characters remaining" (NHS character count). Does not block typing past it. */
  maxChars?: number;
}

export function ITextarea({ maxChars, className, onChange, id, 'aria-describedby': describedBy, ...props }: ITextareaProps) {
  const [length, setLength] = useState(() => String(props.defaultValue ?? props.value ?? '').length);
  const remaining = maxChars === undefined ? undefined : maxChars - length;
  const countId = id ? `${id}-count` : undefined;

  return (
    <div className="flex flex-col gap-1">
      <textarea
        id={id}
        rows={5}
        aria-describedby={[describedBy, maxChars === undefined ? undefined : countId].filter(Boolean).join(' ') || undefined}
        className={cn(
          'w-full rounded-(--control-radius) border-(length:--control-border-w) border-text-secondary bg-surface px-3 py-2',
          'text-(length:--control-text) text-text aria-[invalid=true]:border-error',
          'disabled:cursor-not-allowed disabled:border-border-strong disabled:bg-page',
          className,
        )}
        onChange={(event) => {
          setLength(event.target.value.length);
          onChange?.(event);
        }}
        {...props}
      />
      {remaining !== undefined ? (
        <p id={countId} aria-live="polite" className={cn('text-[0.875em]', remaining < 0 ? 'font-semibold text-error' : 'text-text-secondary')}>
          {remaining >= 0
            ? `You have ${remaining} character${remaining === 1 ? '' : 's'} remaining`
            : `You have ${-remaining} character${remaining === -1 ? '' : 's'} too many`}
        </p>
      ) : null}
    </div>
  );
}
