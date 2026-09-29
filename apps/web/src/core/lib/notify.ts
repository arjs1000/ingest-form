import type { ReactNode } from 'react';
import { toast } from 'sonner';

export interface NotifyOptions {
  description?: ReactNode;
  /** Milliseconds. Errors default to staying longer. */
  duration?: number;
}

const ERROR_DURATION_MS = 8000;

/**
 * The only way features raise toasts. Wraps Sonner so the library can change without touching
 * features, and so every toast uses the IToaster styling.
 */
export const notify = {
  success: (message: string, options?: NotifyOptions) => toast.success(message, options),
  info: (message: string, options?: NotifyOptions) => toast.info(message, options),
  warning: (message: string, options?: NotifyOptions) => toast.warning(message, options),
  error: (message: string, options?: NotifyOptions) =>
    toast.error(message, { duration: ERROR_DURATION_MS, ...options }),
  /** Loading toast that resolves to success or error with the promise. */
  promise: <T>(promise: Promise<T>, messages: { loading: string; success: string; error: string }) =>
    toast.promise(promise, messages),
  dismiss: (id?: string | number) => toast.dismiss(id),
};
