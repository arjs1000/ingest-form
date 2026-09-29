import * as Tabs from '@radix-ui/react-tabs';
import type { ComponentProps } from 'react';

import { cn } from '@/core/lib/cn';

/**
 * Radix Tabs (roving focus, arrow keys, ARIA). Keep it controlled and store the active tab in
 * the URL (`validateSearch`) so tabs survive refresh and can be linked to.
 */
export const ITabs = Tabs.Root;

export function ITabsList({ className, ...props }: ComponentProps<typeof Tabs.List>) {
  return (
    <Tabs.List
      className={cn('-mx-1 flex gap-1 overflow-x-auto border-b border-border px-1 [scrollbar-width:none]', className)}
      {...props}
    />
  );
}

export function ITabsTrigger({ className, ...props }: ComponentProps<typeof Tabs.Trigger>) {
  return (
    <Tabs.Trigger
      className={cn(
        '-mb-px inline-flex min-h-10 shrink-0 items-center gap-2 border-b-2 border-transparent px-3 font-semibold text-text-secondary',
        'hover:text-text data-[state=active]:border-brand data-[state=active]:text-text [&_svg]:size-4',
        className,
      )}
      {...props}
    />
  );
}

export function ITabsContent({ className, ...props }: ComponentProps<typeof Tabs.Content>) {
  return <Tabs.Content className={cn('pt-6 focus-visible:outline-none', className)} {...props} />;
}
