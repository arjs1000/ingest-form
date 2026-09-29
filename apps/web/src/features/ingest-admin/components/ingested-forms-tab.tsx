import type { SubmissionFilters } from '../types';
import { SubmissionDetail } from './submission-detail';
import { SubmissionList } from './submission-list';

export interface IngestedFormsTabProps {
  /** When set, the detail view for this submission replaces the list. */
  submissionId?: string;
  filters: SubmissionFilters;
  onFiltersChange: (filters: SubmissionFilters) => void;
  onOpenSubmission: (id: string) => void;
  onCloseSubmission: () => void;
}

/** "Ingested forms" settings tab. Router-agnostic: URL state comes in as props, changes go out as callbacks. */
export function IngestedFormsTab({
  submissionId,
  filters,
  onFiltersChange,
  onOpenSubmission,
  onCloseSubmission,
}: IngestedFormsTabProps) {
  if (submissionId) return <SubmissionDetail submissionId={submissionId} onBack={onCloseSubmission} />;
  return <SubmissionList filters={filters} onFiltersChange={onFiltersChange} onOpenSubmission={onOpenSubmission} />;
}
