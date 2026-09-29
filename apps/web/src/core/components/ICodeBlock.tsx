import { cn } from '@/core/lib/cn';

import { ICopyButton } from './ICopyButton';

export interface ICodeBlockProps {
  /** The text shown, exactly as it would be copied. */
  code: string;
  /** Accessible name of the scrollable region, e.g. "Ingest JSON". Also names the copy button. */
  label: string;
  /** Show a copy button in the top-right corner (default true). */
  copyable?: boolean;
  /** Cap the height; longer code scrolls inside the block. */
  maxHeightClassName?: string;
  className?: string;
}

/**
 * Monospace code or JSON in a bordered block. Long lines wrap, tall content scrolls inside the
 * block (the region is focusable so keyboard users can scroll it), optional copy button.
 */
export function ICodeBlock({ code, label, copyable = true, maxHeightClassName = 'max-h-96', className }: ICodeBlockProps) {
  return (
    <div className={cn('relative min-w-0 rounded-(--control-radius) border border-border bg-page', className)}>
      <pre
        tabIndex={0}
        role="region"
        aria-label={label}
        className={cn(
          'overflow-auto whitespace-pre-wrap break-words p-3 font-mono text-[0.8125rem] leading-relaxed text-text',
          copyable && 'pr-12',
          maxHeightClassName,
        )}
      >
        <code>{code}</code>
      </pre>
      {copyable ? <ICopyButton value={code} label={`Copy ${label}`} className="absolute right-1 top-1 bg-page" /> : null}
    </div>
  );
}
