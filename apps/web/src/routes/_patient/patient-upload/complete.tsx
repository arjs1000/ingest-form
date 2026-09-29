import { createFileRoute } from '@tanstack/react-router';

import { CompleteStep } from '@/features/patient-intake/components/complete-step';
import { requireIntakeDraft } from '@/features/patient-intake/utils/require-intake-draft';

export const Route = createFileRoute('/_patient/patient-upload/complete')({
  beforeLoad: () => requireIntakeDraft('complete'),
  component: CompleteStep,
});
