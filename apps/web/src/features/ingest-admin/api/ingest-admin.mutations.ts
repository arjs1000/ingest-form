import { mutationOptions, type QueryClient } from '@tanstack/react-query';

import { rerunFailedAtStep, rerunSubmission } from './ingest-admin.api';
import { submissionKeys } from './ingest-admin.queries';

/** Re-runs one submission, then refreshes every submission list, detail and the duplicates. */
export function rerunSubmissionMutationOptions(queryClient: QueryClient) {
  return mutationOptions({
    mutationKey: [...submissionKeys.all, 'rerun'],
    mutationFn: rerunSubmission,
    onSettled: () => queryClient.invalidateQueries({ queryKey: submissionKeys.all }),
  });
}

/** Re-runs every submission that failed at a step, then refreshes all submission queries. */
export function rerunFailedMutationOptions(queryClient: QueryClient) {
  return mutationOptions({
    mutationKey: [...submissionKeys.all, 'rerun-failed'],
    mutationFn: rerunFailedAtStep,
    onSettled: () => queryClient.invalidateQueries({ queryKey: submissionKeys.all }),
  });
}
