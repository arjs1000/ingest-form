import { mutationOptions } from '@tanstack/react-query';

import { extractDocument, submitIntake } from './intake.api';

const intakeKeys = { all: ['intake'] as const };

export function extractDocumentMutationOptions() {
  return mutationOptions({
    mutationKey: [...intakeKeys.all, 'extract'],
    mutationFn: extractDocument,
  });
}

export function submitIntakeMutationOptions() {
  return mutationOptions({
    mutationKey: [...intakeKeys.all, 'submit'],
    mutationFn: submitIntake,
  });
}
