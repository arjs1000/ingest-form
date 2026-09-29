import * as Menu from '@radix-ui/react-dropdown-menu';
import type { ComponentProps } from 'react';

import { cn } from '@/core/lib/cn';

/** Radix menu: keyboard navigation, typeahead, focus return. Admin surface. */
export const IDropdownMenu = Menu.Root;
export const IDropdownMenuTrigger = Menu.Trigger;

export function IDropdownMenuContent({ className, sideOffset = 6, ...props }: ComponentProps<typeof Menu.Content>) {
  return (
    <Menu.Portal>
      <Menu.Content
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-48 rounded-[10px] border border-border bg-surface p-1 font-sans text-[0.875rem] text-text shadow-overlay',
          className,
        )}
        {...props}
      />
    </Menu.Portal>
  );
}

export function IDropdownMenuItem({ className, ...props }: ComponentProps<typeof Menu.Item>) {
  return (
    <Menu.Item
      className={cn(
        'flex min-h-9 cursor-pointer select-none items-center gap-2 rounded-[6px] px-2 text-text no-underline outline-none visited:text-text',
        'data-[highlighted]:bg-focus data-[highlighted]:text-text data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4',
        className,
      )}
      {...props}
    />
  );
}

export function IDropdownMenuLabel({ className, ...props }: ComponentProps<typeof Menu.Label>) {
  return <Menu.Label className={cn('px-2 py-1.5 text-[0.75rem] font-semibold text-text-secondary', className)} {...props} />;
}

export function IDropdownMenuSeparator({ className, ...props }: ComponentProps<typeof Menu.Separator>) {
  return <Menu.Separator className={cn('my-1 h-px bg-border', className)} {...props} />;
}
