import type { InputHTMLAttributes, Ref } from 'react';

import { cn } from '@/core/lib/cn';

export interface IRadioOption {
  value: string;
  label: string;
  hint?: string;
}

export interface IRadiosProps {
  /** Used for ids: `${name}-${value}`. The first option's id is the error-summary target. */
  name: string;
  legend: string;
  options: IRadioOption[];
  hint?: string;
  error?: string;
  inline?: boolean;
  /** Props spread onto every radio, e.g. `register('field')` from react-hook-form. */
  inputProps?: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> };
}

/** Native radios in a fieldset. NHS large targets on patient pages, compact in admin. */
export function IRadios({ name, legend, options, hint, error, inline = false, inputProps }: IRadiosProps) {
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;

  return (
    <fieldset
      aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
      className={cn('flex flex-col gap-2', error && 'border-l-4 border-error pl-4')}
    >
      <legend className="mb-2 font-semibold">{legend}</legend>
      {hint ? (
        <p id={hintId} className="text-text-secondary">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="font-semibold text-error">
          <span className="sr-only">Error: </span>
          {error}
        </p>
      ) : null}
      <div className={cn('flex gap-3', inline ? 'flex-row flex-wrap gap-x-6' : 'flex-col')}>
        {options.map((option) => {
          const id = `${name}-${option.value}`;
          return (
            <div key={option.value} className="flex items-start gap-3">
              <input
                type="radio"
                id={id}
                value={option.value}
                aria-describedby={option.hint ? `${id}-hint` : undefined}
                aria-invalid={Boolean(error)}
                className={cn(
                  'size-(--choice-size) shrink-0 cursor-pointer appearance-none rounded-full border-2 border-text bg-surface',
                  'checked:bg-[radial-gradient(circle,var(--color-text)_38%,transparent_42%)]',
                )}
                {...inputProps}
                name={inputProps?.name ?? name}
              />
              <div className="flex flex-col self-center">
                <label htmlFor={id} className="cursor-pointer">
                  {option.label}
                </label>
                {option.hint ? (
                  <span id={`${id}-hint`} className="text-text-secondary">
                    {option.hint}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
