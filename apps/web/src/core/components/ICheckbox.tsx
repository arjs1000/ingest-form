import { Check } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';

import { cn } from '@/core/lib/cn';

export interface ICheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  id: string;
  label: string;
  hint?: string;
}

/** Native checkbox with a visible label. Spread `register('field')` onto it for react-hook-form. */
export function ICheckbox({ id, label, hint, className, ...props }: ICheckboxProps) {
  return (
    <div className="flex items-start gap-3">
      <span className="relative inline-flex shrink-0">
        <input
          type="checkbox"
          id={id}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={cn(
            'peer size-(--choice-size) cursor-pointer appearance-none rounded-[4px] border-2 border-text bg-surface',
            className,
          )}
          {...props}
        />
        <Check
          aria-hidden="true"
          strokeWidth={3}
          className="pointer-events-none absolute inset-0 m-auto hidden size-[70%] text-text peer-checked:block"
        />
      </span>
      <div className="flex flex-col self-center">
        <label htmlFor={id} className="cursor-pointer">
          {label}
        </label>
        {hint ? (
          <span id={`${id}-hint`} className="text-text-secondary">
            {hint}
          </span>
        ) : null}
      </div>
    </div>
  );
}
