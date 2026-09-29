import { STEP_NAMES, SUBMISSION_SOURCES, SUBMISSION_STATUSES } from '@ingest-form/shared';

import { IFormField } from '@/core/components/IFormField';
import { ISelect } from '@/core/components/ISelect';

import { STEP_LABELS, SUBMISSION_SOURCE_LABELS, SUBMISSION_STATUS_LABELS } from '../constants';
import type { SubmissionFilters } from '../types';

export interface SubmissionFiltersBarProps {
  filters: SubmissionFilters;
  /** Called with the new filters; the page always resets to the first. */
  onChange: (filters: SubmissionFilters) => void;
}

function pick<T extends string>(options: readonly T[], value: string): T | undefined {
  return options.find((option) => option === value);
}

export function SubmissionFiltersBar({ filters, onChange }: SubmissionFiltersBarProps) {
  const update = (next: Partial<SubmissionFilters>) => onChange({ ...filters, ...next, page: undefined });

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <IFormField id="filter-status" label="Status">
        {(field) => (
          <ISelect
            {...field}
            value={filters.status ?? ''}
            onChange={(event) => update({ status: pick(SUBMISSION_STATUSES, event.target.value) })}
          >
            <option value="">All statuses</option>
            {SUBMISSION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {SUBMISSION_STATUS_LABELS[status]}
              </option>
            ))}
          </ISelect>
        )}
      </IFormField>
      <IFormField id="filter-source" label="Source">
        {(field) => (
          <ISelect
            {...field}
            value={filters.source ?? ''}
            onChange={(event) => update({ source: pick(SUBMISSION_SOURCES, event.target.value) })}
          >
            <option value="">All sources</option>
            {SUBMISSION_SOURCES.map((source) => (
              <option key={source} value={source}>
                {SUBMISSION_SOURCE_LABELS[source]}
              </option>
            ))}
          </ISelect>
        )}
      </IFormField>
      <IFormField id="filter-failed-step" label="Failed step">
        {(field) => (
          <ISelect
            {...field}
            value={filters.failedStep ?? ''}
            onChange={(event) => update({ failedStep: pick(STEP_NAMES, event.target.value) })}
          >
            <option value="">Any step</option>
            {STEP_NAMES.map((step) => (
              <option key={step} value={step}>
                {STEP_LABELS[step]}
              </option>
            ))}
          </ISelect>
        )}
      </IFormField>
    </div>
  );
}
