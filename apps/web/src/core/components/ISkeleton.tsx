import { cn } from '@/core/lib/cn';

/** Placeholder block while content loads. Size it with className (h-*, w-*). */
export function ISkeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-[8px] bg-border/70', className)} />;
}
