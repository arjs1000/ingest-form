import type { StepName, StepRunDto } from '@ingest-form/shared';

/** The latest attempt of each step that has run. Steps that never ran are absent. */
export function latestStepRuns(runs: readonly StepRunDto[]): Map<StepName, StepRunDto> {
  const latest = new Map<StepName, StepRunDto>();
  for (const run of runs) {
    const current = latest.get(run.step);
    if (!current || run.attempt > current.attempt) latest.set(run.step, run);
  }
  return latest;
}

/** Every run, oldest attempt first, then in pipeline order within an attempt. */
export function sortStepRuns(runs: readonly StepRunDto[], order: readonly StepName[]): StepRunDto[] {
  return [...runs].sort((a, b) => a.attempt - b.attempt || order.indexOf(a.step) - order.indexOf(b.step));
}
