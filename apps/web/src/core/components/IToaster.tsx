import { CircleAlert, CircleCheck, Info, LoaderCircle, TriangleAlert } from 'lucide-react';
import { Toaster } from 'sonner';

/** Mounted once in AppProviders. Raise toasts with `notify` from core/lib/notify.ts. */
export function IToaster() {
  return (
    <Toaster
      position="top-center"
      gap={8}
      icons={{
        success: <CircleCheck aria-hidden="true" className="size-5 text-action" />,
        info: <Info aria-hidden="true" className="size-5 text-brand" />,
        warning: <TriangleAlert aria-hidden="true" className="size-5 text-warning" />,
        error: <CircleAlert aria-hidden="true" className="size-5 text-error" />,
        loading: <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-text-secondary" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'flex w-[calc(100vw-2rem)] max-w-md items-start gap-3 rounded-[12px] border border-border border-l-4 bg-surface p-4 font-sans text-[0.9375rem] text-text shadow-overlay',
          title: 'font-semibold leading-snug',
          description: 'mt-0.5 text-text-secondary leading-snug',
          icon: 'mt-0.5 shrink-0',
          success: 'border-l-action',
          info: 'border-l-brand',
          warning: 'border-l-warning',
          error: 'border-l-error',
        },
      }}
    />
  );
}
