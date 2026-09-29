import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ComponentProps } from 'react';

import { cn } from '@/core/lib/cn';

/**
 * Side sheet from the right (Radix Dialog). Full width on mobile, 32rem from `md`.
 * For developer tools and admin detail panels; the patient flow only uses it for the
 * "Developer tool" exception documented in design-patterns.md.
 */
export const ISheet = Dialog.Root;
export const ISheetTrigger = Dialog.Trigger;
export const ISheetClose = Dialog.Close;

export function ISheetContent({ className, children, ...props }: ComponentProps<typeof Dialog.Content>) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-overlay" />
      <Dialog.Content
        // Developer tooling is dense, like the admin surface.
        data-surface="admin"
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full flex-col gap-4 overflow-y-auto bg-surface p-4 font-sans text-text shadow-overlay',
          'pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] md:w-lg md:p-6',
          className,
        )}
        {...props}
      >
        {children}
        <Dialog.Close
          aria-label="Close"
          className="absolute right-3 top-3 inline-flex size-11 items-center justify-center rounded-[8px] text-text-secondary hover:bg-page md:size-9"
        >
          <X aria-hidden="true" className="size-5" />
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}

export function ISheetTitle({ className, ...props }: ComponentProps<typeof Dialog.Title>) {
  return <Dialog.Title className={cn('pr-10 text-(length:--h2-size) font-semibold', className)} {...props} />;
}

export function ISheetDescription({ className, ...props }: ComponentProps<typeof Dialog.Description>) {
  return <Dialog.Description className={cn('text-text-secondary', className)} {...props} />;
}
