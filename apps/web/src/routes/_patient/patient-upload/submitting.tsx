import { createFileRoute } from '@tanstack/react-router';

import { SubmittingStep } from '@/features/patient-intake/components/submitting-step';
import { requireIntakeDraft } from '@/features/patient-intake/utils/require-intake-draft';

export const Route = createFileRoute('/_patient/patient-upload/submitting')({
  beforeLoad: () => requireIntakeDraft('submitting'),
  component: SubmittingStep,
});
