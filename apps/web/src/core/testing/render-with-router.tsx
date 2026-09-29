import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { render, type RenderResult } from '@testing-library/react';
import type { ReactNode } from 'react';

/** Renders `ui` at "/" inside the app's providers (fresh query client, router), so Links and queries work. */
export function renderWithRouter(ui: ReactNode, queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })): RenderResult {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: () => ui });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router as never} />
    </QueryClientProvider>,
  );
}
