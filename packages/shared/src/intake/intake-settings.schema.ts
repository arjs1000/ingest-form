import { z } from 'zod';

const MB = 1024 * 1024;

/** Upload size limits an admin can choose on Admin → General. */
export const MAX_FILE_SIZE_MB_OPTIONS = [5, 10, 25] as const;

/**
 * Admin → General upload settings. The API enforces them on POST /api/v1/intake/extract and the
 * patient document step reads them from GET /api/v1/intake/settings.
 */
export const intakeSettingsDtoSchema = z.object({
  /** false: PDF only. true: PDF, JPG or PNG. */
  acceptPhotos: z.boolean(),
  maxFileSizeMb: z.literal(MAX_FILE_SIZE_MB_OPTIONS),
});

export type IntakeSettingsDto = z.infer<typeof intakeSettingsDtoSchema>;

/** Used until an admin first saves the settings. */
export const DEFAULT_INTAKE_SETTINGS: IntakeSettingsDto = { acceptPhotos: true, maxFileSizeMb: 10 };

/** Largest upload any setting allows. The extract route's body cap. */
export const INTAKE_UPLOAD_HARD_MAX_BYTES = Math.max(...MAX_FILE_SIZE_MB_OPTIONS) * MB;

const PDF_TYPES = ['application/pdf'] as const;
const PHOTO_TYPES = ['image/jpeg', 'image/png'] as const;

export type IntakeUploadMimeType = (typeof PDF_TYPES)[number] | (typeof PHOTO_TYPES)[number];

/** What the settings allow, in the forms both apps need. */
export interface IntakeUploadRules {
  mimeTypes: readonly IntakeUploadMimeType[];
  maxBytes: number;
  /** "PDF, JPG or PNG, up to 10MB" */
  hint: string;
  /** "Upload a PDF, JPG or PNG" */
  typeMessage: string;
  /** "The file must be 10MB or smaller" */
  sizeMessage: string;
}

export function intakeUploadRules(settings: IntakeSettingsDto): IntakeUploadRules {
  const types = settings.acceptPhotos ? 'PDF, JPG or PNG' : 'PDF';
  return {
    mimeTypes: settings.acceptPhotos ? [...PDF_TYPES, ...PHOTO_TYPES] : PDF_TYPES,
    maxBytes: settings.maxFileSizeMb * MB,
    hint: `${types}, up to ${settings.maxFileSizeMb}MB`,
    typeMessage: `Upload a ${types}`,
    sizeMessage: `The file must be ${settings.maxFileSizeMb}MB or smaller`,
  };
}
