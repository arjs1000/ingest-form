import { useEffect, useRef } from 'react';

export interface IErrorSummaryItem {
  /** id of the invalid control; the link jumps to it. */
  fieldId: string;
  message: string;
}

export interface IErrorSummaryProps {
  errors: IErrorSummaryItem[];
  title?: string;
  /** Focus on mount (default). Off only for static previews such as the component library. */
  autoFocus?: boolean;
}

/**
 * NHS error summary: shown at the top of the form after a failed submit, focused on mount so
 * screen readers announce it, with a link to each invalid field.
 */
export function IErrorSummary({ errors, title = 'There is a problem', autoFocus = true }: IErrorSummaryProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Moving focus is a side effect on the DOM, which is what effects are for.
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  if (errors.length === 0) return null;

  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      aria-labelledby="error-summary-title"
      className="flex flex-col gap-3 rounded-(--card-radius) border-4 border-error bg-surface p-(--card-pad)"
    >
      <h2 id="error-summary-title" className="text-(length:--h3-size) font-semibold">
        {title}
      </h2>
      <ul className="flex flex-col gap-2">
        {errors.map((error) => (
          <li key={error.fieldId}>
            <a href={`#${error.fieldId}`} className="font-semibold text-error visited:text-error hover:text-error focus-visible:text-text">
              {error.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
