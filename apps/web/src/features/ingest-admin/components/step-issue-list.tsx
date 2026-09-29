import type { StepIssue } from '@ingest-form/shared';

import { IBadge } from '@/core/components/IBadge';
import { IText } from '@/core/components/IText';

/** Issues a step recorded: severity, code, payload path and message. */
export function StepIssueList({ issues }: { issues: StepIssue[] }) {
  if (issues.length === 0) return null;

  return (
    <ul className="flex flex-col gap-2">
      {issues.map((issue, index) => (
        <li
          key={`${issue.code}-${issue.path}-${index}`}
          className="flex flex-col gap-1 rounded-(--control-radius) border border-border bg-page px-3 py-2"
        >
          <div className="flex flex-wrap items-center gap-2">
            <IBadge tone={issue.severity === 'error' ? 'error' : 'warning'}>
              {issue.severity === 'error' ? 'Error' : 'Warning'}
            </IBadge>
            <code className="font-mono text-[0.8125em] font-semibold">{issue.code}</code>
            <IText size="sm" tone="secondary">
              at <code className="font-mono">{issue.path || '(whole payload)'}</code>
            </IText>
          </div>
          <IText as="p">{issue.message}</IText>
        </li>
      ))}
    </ul>
  );
}
