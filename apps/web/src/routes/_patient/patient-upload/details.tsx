import { createFileRoute } from '@tanstack/react-router';

import { DetailsStep } from '@/features/patient-intake/components/details-step';
import { requireIntakeDraft } from '@/features/patient-intake/utils/require-intake-draft';

export const Route = createFileRoute('/_patient/patient-upload/details')({
  beforeLoad: () => requireIntakeDraft('details'),
  component: DetailsStep,
});
