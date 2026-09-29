import { Info } from 'lucide-react';

import { ICopyButton } from '@/core/components/ICopyButton';
import { IText } from '@/core/components/IText';

import { deleteSubmissionSql, SUBMISSION_ID_PLACEHOLDER } from '../constants';

/** Explains that duplicates are removed by hand. The admin UI has no delete button by design. */
export function ManualDeleteNote() {
  const sql = deleteSubmissionSql(SUBMISSION_ID_PLACEHOLDER);

  return (
    <aside
      aria-labelledby="manual-delete-title"
      className="flex flex-col gap-3 rounded-(--card-radius) border border-brand-tint border-l-4 border-l-brand bg-surface p-(--card-pad)"
    >
      <div className="flex items-center gap-2">
        <Info aria-hidden="true" className="size-5 text-brand" />
        <IText id="manual-delete-title" weight="semibold">
          Duplicates are removed by hand
        </IText>
      </div>
      <IText as="p" tone="secondary">
        A submission is listed here when another one has the same application reference, or the same first and last
        name with the same email or the same mobile. The same name alone is not enough. Duplicates are kept so nothing
        is lost, and nothing is deleted from this page. To remove one, copy its submission ID and run this against the
        database. Its step runs and application are deleted with it. If you delete the first-received submission, the
        others are unlinked automatically and this list is recalculated.
      </IText>
      <div className="flex items-start gap-1">
        <pre className="min-w-0 flex-1 overflow-x-auto rounded-(--control-radius) border border-border bg-page p-3 font-mono text-[0.8125em]">
          {sql}
        </pre>
        <ICopyButton value={sql} label="Copy DELETE statement" />
      </div>
    </aside>
  );
}
