import type { HTMLAttributes } from 'react';

import { cn } from '@/core/lib/cn';

export type IBadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'error';

export interface IBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: IBadgeTone;
}

// Tint background + dark text of the same hue. Every pair is measured >= 4.5:1 (design-patterns.md).
const TONE_CLASSES: Record<IBadgeTone, string> = {
  neutral: 'bg-page text-text border-border',
  info: 'bg-brand-tint text-brand-dark border-brand-tint',
  success: 'bg-action-tint text-action-edge border-action-tint',
  warning: 'bg-warning-tint text-warning border-warning-tint',
  error: 'bg-error-tint text-error-edge border-error-tint',
};

/** Short status label (NHS "tag"). Text is the meaning; colour only reinforces it. */
export function IBadge({ tone = 'neutral', className, ...props }: IBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.8125em] font-semibold leading-snug',
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    />
  );
}
