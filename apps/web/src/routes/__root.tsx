import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';

interface RouterContext {
  queryClient: QueryClient;
}

// Layouts live in pathless layout routes (_patient, _admin), not here.
export const Route = createRootRouteWithContext<RouterContext>()({
  component: Outlet,
});
