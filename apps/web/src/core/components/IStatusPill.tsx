import { cn } from '@/core/lib/cn';

export type IStatusPillStatus = 'ok' | 'offline' | 'checking';

export interface IStatusPillProps {
  status: IStatusPillStatus;
  label: string;
  /** Extra context, e.g. why something is offline. Always shown as text, never colour alone. */
  detail?: string;
}

const DOT_CLASSES: Record<IStatusPillStatus, string> = {
  ok: 'bg-status-ok',
  offline: 'bg-error',
  checking: 'bg-border-strong animate-pulse',
};

export function IStatusPill({ status, label, detail }: IStatusPillProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      data-status={status}
      className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-[0.875em] leading-snug text-text"
    >
      <span aria-hidden="true" className={cn('size-2.5 shrink-0 rounded-full', DOT_CLASSES[status])} />
      <span className="min-w-0 break-words">
        <span className="font-semibold">{label}</span>
        {detail ? <span className="text-text-secondary"> · {detail}</span> : null}
      </span>
    </span>
  );
}
