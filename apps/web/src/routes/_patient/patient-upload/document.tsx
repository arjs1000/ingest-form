import { createFileRoute } from '@tanstack/react-router';

import { DocumentStep } from '@/features/patient-intake/components/document-step';
import { requireIntakeDraft } from '@/features/patient-intake/utils/require-intake-draft';

export const Route = createFileRoute('/_patient/patient-upload/document')({
  beforeLoad: () => requireIntakeDraft('document'),
  component: DocumentStep,
});
