import type { ReactNode } from 'react';

export interface IFormFieldControlProps {
  id: string;
  'aria-describedby': string | undefined;
  'aria-invalid': boolean;
}

export interface IFormFieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  /** Receives the ids and ARIA wiring to spread onto the control. */
  children: (control: IFormFieldControlProps) => ReactNode;
}

/** Label, hint and error around one control, in NHS order: label, hint, error, control. */
export function IFormField({ id, label, hint, error, children }: IFormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={error ? 'flex flex-col gap-2 border-l-4 border-error pl-4' : 'flex flex-col gap-2'}>
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
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
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': Boolean(error) })}
    </div>
  );
}
