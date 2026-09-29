import type { StepRunStatus } from '@ingest-form/shared';
import { CircleCheck, CircleDashed, CircleMinus, CircleX, TriangleAlert, type LucideIcon } from 'lucide-react';

import { cn } from '@/core/lib/cn';

const ICONS: Record<StepRunStatus, LucideIcon> = {
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleX,
  skipped: CircleMinus,
};

const ICON_TONES: Record<StepRunStatus, string> = {
  success: 'text-action',
  warning: 'text-warning',
  error: 'text-error',
  skipped: 'text-text-secondary',
};

/** Decorative status icon for a step. Always paired with a text badge. `undefined` = not run yet. */
export function StepRunIcon({ status }: { status: StepRunStatus | undefined }) {
  const Icon = status ? ICONS[status] : CircleDashed;
  return (
    <Icon
      aria-hidden="true"
      className={cn('size-5 shrink-0', status ? ICON_TONES[status] : 'text-border-strong')}
    />
  );
}
