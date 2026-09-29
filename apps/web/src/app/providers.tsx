import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';

import { IToaster } from '@/core/components/IToaster';

import { queryClient } from './query-client';
import { router } from './router';

/**
 * Provider order: data (Query) → router.
 * The toaster sits beside the router so toasts survive navigation.
 */
export function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <IToaster />
    </QueryClientProvider>
  );
}
