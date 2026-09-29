import { intakeSettingsDtoSchema, MAX_FILE_SIZE_MB_OPTIONS, type IntakeSettingsDto } from '@ingest-form/shared';
import { z } from 'zod';

/** Radio values are strings; the API takes numbers (intakeSettingsDtoSchema in packages/shared). */
export const MAX_FILE_SIZE_OPTIONS = ['5', '10', '25'] as const satisfies readonly `${(typeof MAX_FILE_SIZE_MB_OPTIONS)[number]}`[];

export const intakeSettingsSchema = z.object({
  acceptPhotos: z.boolean(),
  maxFileSizeMb: z.enum(MAX_FILE_SIZE_OPTIONS, { error: 'Select a maximum file size' }),
});

export type IntakeSettingsValues = z.infer<typeof intakeSettingsSchema>;

/** Order of fields on the page; the error summary lists errors in this order. */
export const INTAKE_SETTINGS_FIELD_ORDER = ['maxFileSizeMb'] as const;

export function toIntakeSettingsValues(settings: IntakeSettingsDto): IntakeSettingsValues {
  return { acceptPhotos: settings.acceptPhotos, maxFileSizeMb: `${settings.maxFileSizeMb}` };
}

export function toIntakeSettingsDto(values: IntakeSettingsValues): IntakeSettingsDto {
  return intakeSettingsDtoSchema.parse({ acceptPhotos: values.acceptPhotos, maxFileSizeMb: Number(values.maxFileSizeMb) });
}
