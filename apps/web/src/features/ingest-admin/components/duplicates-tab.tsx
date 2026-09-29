import { useQuery } from '@tanstack/react-query';
import { Files, RefreshCw } from 'lucide-react';

import { IButton } from '@/core/components/IButton';

import { duplicateGroupsQueryOptions } from '../api/ingest-admin.queries';
import { DuplicateGroupSection } from './duplicate-group-section';
import { EmptyState } from './empty-state';
import { LoadError } from './load-error';
import { ManualDeleteNote } from './manual-delete-note';
import { TableSkeleton } from './table-skeleton';

export interface DuplicatesTabProps {
  onOpenSubmission: (id: string) => void;
}

/** "Duplicate submissions" settings tab: grouped by application reference. Read-only by design. */
export function DuplicatesTab({ onOpenSubmission }: DuplicatesTabProps) {
  const query = useQuery(duplicateGroupsQueryOptions);

  return (
    <div className="flex flex-col gap-4">
      <ManualDeleteNote />
      <div>
        <IButton variant="reverse" onClick={() => void query.refetch()} disabled={query.isFetching}>
          <RefreshCw aria-hidden="true" />
          Refresh
        </IButton>
      </div>
      {query.isPending ? <TableSkeleton label="Loading duplicate submissions" /> : null}
      {query.isError ? (
        <LoadError title="Could not load duplicate submissions" error={query.error} onRetry={() => void query.refetch()} />
      ) : null}
      {query.data && query.data.length === 0 ? (
        <EmptyState
          icon={Files}
          title="No duplicate submissions"
          description="When an application reference is received more than once, every copy is listed here."
        />
      ) : null}
      {query.data?.map((group) => (
        <DuplicateGroupSection key={group.key} group={group} onOpenSubmission={onOpenSubmission} />
      ))}
    </div>
  );
}
