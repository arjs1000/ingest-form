import type { DocumentType, ExtractResultDto, IntakeResultDto } from '@ingest-form/shared';
import { create } from 'zustand';

import type { PatientDetailsValues } from '../schemas/patient-details.schema';

/**
 * The patient's intake draft while they move between steps. Memory only, never `persist`:
 * it holds patient data, so a refresh deliberately restarts the flow (the route guards send
 * the person back to the start page). Read it with atomic selectors:
 * `useIntakeDraftStore((s) => s.extraction)`.
 */
export interface IntakeDraftState {
  /** Set by `start()`. null means there is no draft. Sent as the ingest `session_id`. */
  sessionId: string | null;
  documentType: DocumentType | null;
  fileName: string | null;
  /** What the API found in the uploaded document; null when skipped or not uploaded yet. */
  extraction: ExtractResultDto | null;
  /** Submitted form values; kept so "Try again" returns to a filled-in form. */
  details: PatientDetailsValues | null;
  result: IntakeResultDto | null;
  /** Starts a fresh draft with a new session id, discarding any previous one. */
  start: () => void;
  /** Forgets everything (after completion, or "Start again"). */
  reset: () => void;
  setDocumentType: (documentType: DocumentType) => void;
  /** Records the document the extraction came from, or clears it (null) when the file is removed. */
  setExtraction: (extraction: ExtractResultDto | null, fileName?: string | null) => void;
  setDetails: (details: PatientDetailsValues) => void;
  setResult: (result: IntakeResultDto) => void;
}

const EMPTY_DRAFT = {
  sessionId: null,
  documentType: null,
  fileName: null,
  extraction: null,
  details: null,
  result: null,
} as const;

export const useIntakeDraftStore = create<IntakeDraftState>()((set) => ({
  ...EMPTY_DRAFT,
  start: () => set({ ...EMPTY_DRAFT, sessionId: crypto.randomUUID() }),
  reset: () => set(EMPTY_DRAFT),
  // A different document type makes the old extraction meaningless.
  setDocumentType: (documentType) =>
    set((state) => (state.documentType === documentType ? state : { documentType, extraction: null, fileName: null })),
  setExtraction: (extraction, fileName = null) => set({ extraction, fileName }),
  setDetails: (details) => set({ details }),
  setResult: (result) => set({ result }),
}));

/** For the "Start now" button (outside React state, so it can run before navigating). */
export function startIntakeDraft(): void {
  useIntakeDraftStore.getState().start();
}
