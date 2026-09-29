import { Check, Copy } from 'lucide-react';
import { useEffect, useState, type ButtonHTMLAttributes } from 'react';

import { cn } from '@/core/lib/cn';
import { notify } from '@/core/lib/notify';

const COPIED_RESET_MS = 2000;

export interface ICopyButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value' | 'onClick' | 'children'> {
  /** The text written to the clipboard. */
  value: string;
  /** Accessible name, e.g. "Copy submission ID". Required: the button shows only an icon. */
  label: string;
}

/**
 * Icon button that copies `value` to the clipboard and confirms with a toast. The icon turns
 * into a tick for two seconds; the toast carries the confirmation, never the copied value.
 */
export function ICopyButton({ value, label, className, ...props }: ICopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Timer to revert the tick: a side effect outside React's render.
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), COPIED_RESET_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      notify.success('Copied');
    } catch {
      notify.error('Could not copy', { description: 'Select the text and copy it manually.' });
    }
  };

  const Icon = copied ? Check : Copy;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => void copy()}
      className={cn(
        'inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-(--control-radius) text-text-secondary transition-colors md:min-h-8 md:min-w-8',
        'hover:bg-page hover:text-text focus-visible:bg-focus focus-visible:text-text focus-visible:outline-none',
        className,
      )}
      {...props}
    >
      <Icon aria-hidden="true" className="size-4" />
    </button>
  );
}
