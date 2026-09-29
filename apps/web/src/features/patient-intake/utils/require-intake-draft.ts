import { redirect } from '@tanstack/react-router';

import { useIntakeDraftStore, type IntakeDraftState } from '../store/intake-draft.store';

/** What each step needs from the draft before it can be shown. */
const STEP_REQUIREMENTS = {
  document: (s: IntakeDraftState) => s.sessionId !== null,
  details: (s: IntakeDraftState) => s.sessionId !== null,
  submitting: (s: IntakeDraftState) => s.sessionId !== null && s.details !== null,
  complete: (s: IntakeDraftState) => s.result !== null,
} as const;

export type IntakeStep = keyof typeof STEP_REQUIREMENTS;

/**
 * Route guard (`beforeLoad`). The draft lives in memory only, so after a refresh or a deep link
 * there is nothing to show: send the person back to the start page.
 */
export function requireIntakeDraft(step: IntakeStep): void {
  if (!STEP_REQUIREMENTS[step](useIntakeDraftStore.getState())) {
    throw redirect({ to: '/patient-upload' });
  }
}
