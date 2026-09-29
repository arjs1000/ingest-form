import { apiSuccessSchema, intakeSettingsDtoSchema, type IntakeSettingsDto } from '@ingest-form/shared';

import { apiGet, apiPut } from '@/core/lib/api-client';

const INTAKE_SETTINGS_ENDPOINT = '/api/admin/settings/intake';
const settingsEnvelope = apiSuccessSchema(intakeSettingsDtoSchema);

export async function fetchIntakeSettings(): Promise<IntakeSettingsDto> {
  return (await apiGet(INTAKE_SETTINGS_ENDPOINT, settingsEnvelope)).data;
}

export async function saveIntakeSettings(settings: IntakeSettingsDto): Promise<IntakeSettingsDto> {
  return (await apiPut(INTAKE_SETTINGS_ENDPOINT, settings, settingsEnvelope)).data;
}
