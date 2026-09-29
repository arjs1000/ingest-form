import { z } from 'zod';

import { ingestResultDtoSchema } from '../ingest/submission.schema';

/**
 * Documents a patient can upload in the intake flow. Titles are as printed on the forms in
 * HealthTech1-Research/Forms; `other` is any document we don't recognise.
 */
export const DOCUMENT_TYPES = [
  'gms1',
  'new-patient-adult',
  'new-patient-child',
  'carers-identification',
  'travel-risk-assessment',
  'other',
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_TITLES: Record<DocumentType, string> = {
  gms1: 'Family doctor services registration (GMS1)',
  'new-patient-adult': 'New patient registration (adult)',
  'new-patient-child': 'Child new patient registration (under 16)',
  'carers-identification': "Carer's identification form",
  'travel-risk-assessment': 'Travel risk assessment form',
  other: 'Other document',
};

/**
 * Fields found in an uploaded document, in the ingest (snake_case) shape. Every field is optional:
 * anything the document doesn't contain is simply absent, and the form leaves it empty.
 */
export const extractedFieldsSchema = z.object({
  application_reference: z.string().optional(),
  name: z.string().optional(),
  email: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  /** YYYY-MM-DD */
  date_of_birth: z.string().optional(),
  phone_number: z.string().optional(),
  mobile_number: z.string().optional(),
  address: z
    .object({
      address_line_1: z.string().optional(),
      address_line_2: z.string().optional(),
      address_line_3: z.string().optional(),
      postcode: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
});

export type ExtractedFields = z.infer<typeof extractedFieldsSchema>;

/** Response of POST /api/v1/intake/extract. `extractor` says which OCR produced the fields. */
export const extractResultDtoSchema = z.object({
  documentType: z.enum(DOCUMENT_TYPES),
  extractor: z.string(),
  fields: extractedFieldsSchema,
});

export type ExtractResultDto = z.infer<typeof extractResultDtoSchema>;

/** Response of POST /api/v1/intake: the pipeline outcome plus the (possibly generated) reference. */
export const intakeResultDtoSchema = ingestResultDtoSchema.extend({
  applicationReference: z.string().nullable(),
});

export type IntakeResultDto = z.infer<typeof intakeResultDtoSchema>;
