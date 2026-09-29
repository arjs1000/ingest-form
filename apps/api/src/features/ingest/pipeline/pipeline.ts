import { validateStep } from '../steps/01-validate.step';
import { normaliseStep } from '../steps/02-normalise.step';
import { geocodeStep } from '../steps/03-geocode.step';
import { transformStep } from '../steps/04-transform.step';
import { persistStep } from '../steps/05-persist.step';
import { notifyStep } from '../steps/06-notify.step';
import type { IngestStep, StepName } from './step.types';

/**
 * A step with its types erased. The runner checks each input against `step.input` before
 * calling `run`, which is what makes the erasure safe.
 */
export type PipelineStep = IngestStep<unknown, unknown>;

/** The steps in run order. Must match STEP_NAMES in @ingest-form/shared (a spec checks it). */
export const PIPELINE_STEPS: readonly PipelineStep[] = [
  validateStep,
  normaliseStep,
  geocodeStep,
  transformStep,
  persistStep,
  notifyStep,
];

/** Position of a step in PIPELINE_STEPS. Throws for a name missing from the list (a code bug). */
export function stepIndex(name: StepName): number {
  const index = PIPELINE_STEPS.findIndex((step) => step.name === name);
  if (index === -1) throw new Error(`Pipeline has no step named ${name}`);
  return index;
}

export function getStep(name: StepName): PipelineStep {
  // stepIndex already guarantees the index exists.
  return PIPELINE_STEPS[stepIndex(name)] as PipelineStep;
}
