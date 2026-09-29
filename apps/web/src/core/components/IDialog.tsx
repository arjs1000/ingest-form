import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ComponentProps, HTMLAttributes } from 'react';

import { cn } from '@/core/lib/cn';

/** Admin surface only. The patient flow uses one question per page, never modals. */
export const IDialog = Dialog.Root;
export const IDialogTrigger = Dialog.Trigger;
export const IDialogClose = Dialog.Close;

export function IDialogContent({ className, children, ...props }: ComponentProps<typeof Dialog.Content>) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-overlay" />
      <Dialog.Content
        data-surface="admin"
        className={cn(
          'fixed left-1/2 top-1/2 z-50 flex max-h-[85dvh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2',
          'flex-col gap-4 overflow-y-auto rounded-(--card-radius) bg-surface p-6 font-sans text-text shadow-overlay',
          className,
        )}
        {...props}
      >
        {children}
        <Dialog.Close
          aria-label="Close"
          className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-[8px] text-text-secondary hover:bg-page"
        >
          <X aria-hidden="true" className="size-5" />
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}

export function IDialogTitle({ className, ...props }: ComponentProps<typeof Dialog.Title>) {
  return <Dialog.Title className={cn('pr-8 text-(length:--h2-size) font-semibold', className)} {...props} />;
}

export function IDialogDescription({ className, ...props }: ComponentProps<typeof Dialog.Description>) {
  return <Dialog.Description className={cn('text-text-secondary', className)} {...props} />;
}

export function IDialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-2 flex flex-col-reverse gap-2 md:flex-row md:justify-end', className)} {...props} />;
}
