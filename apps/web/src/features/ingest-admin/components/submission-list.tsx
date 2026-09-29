import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Inbox, RefreshCw } from 'lucide-react';

import { IButton } from '@/core/components/IButton';
import { IText } from '@/core/components/IText';

import { submissionListQueryOptions } from '../api/ingest-admin.queries';
import type { SubmissionFilters } from '../types';
import { pluralise } from '../utils/format';
import { BulkRerunDialog } from './bulk-rerun-dialog';
import { EmptyState } from './empty-state';
import { LoadError } from './load-error';
import { SubmissionFiltersBar } from './submission-filters-bar';
import { SubmissionTable } from './submission-table';
import { TableSkeleton } from './table-skeleton';

export interface SubmissionListProps {
  filters: SubmissionFilters;
  onFiltersChange: (filters: SubmissionFilters) => void;
  onOpenSubmission: (id: string) => void;
}

/** "Ingested forms" list: filters, bulk re-run, table and pagination. */
export function SubmissionList({ filters, onFiltersChange, onOpenSubmission }: SubmissionListProps) {
  const query = useQuery(submissionListQueryOptions(filters));
  const page = filters.page ?? 1;

  const hasFilters = Boolean(filters.status || filters.source || filters.failedStep);
  const totalPages = query.data ? Math.max(1, Math.ceil(query.data.total / query.data.pageSize)) : 1;

  return (
    <div className="flex flex-col gap-4">
      <SubmissionFiltersBar filters={filters} onChange={onFiltersChange} />

      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <IButton variant="reverse" onClick={() => void query.refetch()} disabled={query.isFetching}>
          <RefreshCw aria-hidden="true" />
          Refresh
        </IButton>
        <BulkRerunDialog step={filters.failedStep} />
        {query.data ? (
          <IText size="sm" tone="secondary" role="status" className="md:ml-auto">
            {pluralise(query.data.total, 'submission')}
          </IText>
        ) : null}
      </div>

      {query.isPending ? <TableSkeleton label="Loading submissions" /> : null}
      {query.isError ? (
        <LoadError title="Could not load submissions" error={query.error} onRetry={() => void query.refetch()} />
      ) : null}
      {query.data && query.data.items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={hasFilters ? 'No submissions match these filters' : 'No submissions yet'}
          description={
            hasFilters
              ? 'Clear a filter to see more.'
              : 'Forms sent to POST /api/v1/ingest, or through the patient flow, appear here.'
          }
        />
      ) : null}
      {query.data && query.data.items.length > 0 ? (
        <>
          <SubmissionTable submissions={query.data.items} onOpenSubmission={onOpenSubmission} />
          <nav aria-label="Pagination" className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <IText tone="secondary">
              Page {page} of {totalPages}
            </IText>
            <div className="flex flex-col gap-2 md:flex-row">
              <IButton
                variant="reverse"
                disabled={page <= 1}
                onClick={() => onFiltersChange({ ...filters, page: page - 1 === 1 ? undefined : page - 1 })}
              >
                <ChevronLeft aria-hidden="true" />
                Previous
              </IButton>
              <IButton
                variant="reverse"
                disabled={page >= totalPages}
                onClick={() => onFiltersChange({ ...filters, page: page + 1 })}
              >
                Next
                <ChevronRight aria-hidden="true" />
              </IButton>
            </div>
          </nav>
        </>
      ) : null}
    </div>
  );
}
