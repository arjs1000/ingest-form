import { STEP_NAMES, SUBMISSION_SOURCES, SUBMISSION_STATUSES } from '@ingest-form/shared';
import { z } from 'zod';

import { SETTINGS_TABS } from '../constants';

/**
 * URL search params for /admin/settings. Unknown or missing tab falls back to "general"; any
 * other invalid param is dropped rather than breaking the page.
 *
 * - `submission`: id of the submission open in the "Ingested forms" detail view.
 * - `status`, `source`, `failedStep`, `page`: "Ingested forms" list filters. They live in the
 *   URL so they survive opening a submission and coming back, a refresh, and a shared link.
 */
export const settingsSearchSchema = z.object({
  tab: z.enum(SETTINGS_TABS).default('general').catch('general'),
  submission: z.string().min(1).optional().catch(undefined),
  status: z.enum(SUBMISSION_STATUSES).optional().catch(undefined),
  source: z.enum(SUBMISSION_SOURCES).optional().catch(undefined),
  failedStep: z.enum(STEP_NAMES).optional().catch(undefined),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
});

export type SettingsSearch = z.infer<typeof settingsSearchSchema>;
