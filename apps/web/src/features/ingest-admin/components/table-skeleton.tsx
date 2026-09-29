import { ISkeleton } from '@/core/components/ISkeleton';

const SKELETON_ROWS = 5;

/** Loading placeholder shaped like a table. The label is for screen readers; the bars are hidden. */
export function TableSkeleton({ label }: { label: string }) {
  return (
    <div role="status" className="flex flex-col gap-2 rounded-(--card-radius) border border-border bg-surface p-(--card-pad)">
      <span className="sr-only">{label}</span>
      <ISkeleton className="h-5 w-1/3" />
      {Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <ISkeleton key={index} className="h-8 w-full" />
      ))}
    </div>
  );
}
