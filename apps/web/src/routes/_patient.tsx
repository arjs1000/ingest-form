import { createFileRoute, Outlet } from '@tanstack/react-router';

import { PatientLayout } from '@/app/layouts/patient-layout';

export const Route = createFileRoute('/_patient')({
  component: () => (
    <PatientLayout>
      <Outlet />
    </PatientLayout>
  ),
});
