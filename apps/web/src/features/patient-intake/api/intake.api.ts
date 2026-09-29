import {
  apiSuccessSchema,
  extractResultDtoSchema,
  intakeResultDtoSchema,
  intakeSettingsDtoSchema,
  type ExtractResultDto,
  type IntakeResultDto,
  type IntakeSettingsDto,
} from '@ingest-form/shared';

import { apiGet, apiPost, apiPostForm } from '@/core/lib/api-client';

import { EXTRACT_ENDPOINT, INTAKE_ENDPOINT, UPLOAD_SETTINGS_ENDPOINT } from '../constants';
import type { ExtractVariables, IntakePayload } from '../types';

const extractEnvelope = apiSuccessSchema(extractResultDtoSchema);
const intakeEnvelope = apiSuccessSchema(intakeResultDtoSchema);
const uploadSettingsEnvelope = apiSuccessSchema(intakeSettingsDtoSchema);

/** The upload types and size limit an admin set on Admin → General. */
export async function fetchUploadSettings(): Promise<IntakeSettingsDto> {
  return (await apiGet(UPLOAD_SETTINGS_ENDPOINT, uploadSettingsEnvelope)).data;
}

/** Uploads the document; the API returns the fields it found (OCR). The file is not stored. */
export async function extractDocument({ file, documentType }: ExtractVariables): Promise<ExtractResultDto> {
  const formData = new FormData();
  formData.append('documentType', documentType);
  formData.append('file', file, file.name);
  return (await apiPostForm(EXTRACT_ENDPOINT, formData, extractEnvelope)).data;
}

/** Sends the checked details through the ingest pipeline (202 with the outcome and reference). */
export async function submitIntake(payload: IntakePayload): Promise<IntakeResultDto> {
  return (await apiPost(INTAKE_ENDPOINT, payload, intakeEnvelope)).data;
}
