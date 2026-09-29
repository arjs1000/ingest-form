import { createFileRoute, Outlet } from '@tanstack/react-router';

import { AdminLayout } from '@/app/layouts/admin-layout';

export const Route = createFileRoute('/_admin')({
  // Auth gate goes here (TBD: OAuth/JWT). Guard in beforeLoad only, never again in the layout.
  beforeLoad: () => undefined,
  component: () => (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  ),
});
