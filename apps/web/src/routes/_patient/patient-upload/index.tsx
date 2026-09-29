import { createFileRoute } from '@tanstack/react-router';

import { startIntakeDraft } from '@/features/patient-intake/store/intake-draft.store';
import { PatientUploadStart } from '@/features/patient-upload/components/patient-upload-start';

export const Route = createFileRoute('/_patient/patient-upload/')({
  component: () => <PatientUploadStart onStart={startIntakeDraft} />,
});
