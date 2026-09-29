import { keepPreviousData, queryOptions } from '@tanstack/react-query';

import type { SubmissionFilters } from '../types';
import { fetchDuplicateGroups, fetchSubmission, fetchSubmissions } from './ingest-admin.api';

/** Query keys for admin submissions. Invalidating `all` refreshes lists, details and duplicates. */
export const submissionKeys = {
  all: ['admin-submissions'] as const,
  list: (filters: SubmissionFilters) => ['admin-submissions', 'list', filters] as const,
  detail: (id: string) => ['admin-submissions', 'detail', id] as const,
  duplicates: () => ['admin-submissions', 'duplicates'] as const,
};

export function submissionListQueryOptions(filters: SubmissionFilters) {
  return queryOptions({
    queryKey: submissionKeys.list(filters),
    queryFn: () => fetchSubmissions(filters),
    // Keep the current page on screen while the next one loads.
    placeholderData: keepPreviousData,
  });
}

export function submissionDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: submissionKeys.detail(id),
    queryFn: () => fetchSubmission(id),
  });
}

export const duplicateGroupsQueryOptions = queryOptions({
  queryKey: submissionKeys.duplicates(),
  queryFn: fetchDuplicateGroups,
});
