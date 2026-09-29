import { z } from 'zod';

/** Genders a third party may send. Matched case-insensitively. */
export const INGEST_GENDERS = ['male', 'female', 'other'] as const;

/** Soft format check only: a mismatch is a warning, not an error. */
export const APPLICATION_REFERENCE_PATTERN = /^[A-Z]{3}-\d{6}-\d{4}$/;

const requiredText = (field: string) =>
  z
    .string({ error: `${field} is required` })
    .trim()
    .min(1, `${field} is required`);

/** Empty strings and nulls from third parties mean "not provided". */
const optionalText = z.preprocess(
  (value) => (value === null || (typeof value === 'string' && value.trim() === '') ? undefined : value),
  z.string().trim().optional(),
);

/**
 * The snake_case payload third parties POST to /api/v1/ingest (IngestedFormSchema).
 * Structural checks only; business rules (age, phone validity, postcode) run in later steps.
 */
export const ingestPayloadSchema = z.object({
  session_id: z.uuid({ error: 'session_id must be a UUID' }),
  application_reference: requiredText('application_reference'),
  name: requiredText('name'),
  email: z
    .string({ error: 'email is required' })
    .trim()
    .pipe(z.email({ error: 'email must be a valid email address' })),
  gender: z.preprocess(
    (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
    z.enum(INGEST_GENDERS, { error: 'gender must be one of male, female, other' }),
  ),
  date_of_birth: z.iso.date({ error: 'date_of_birth must be an ISO date (YYYY-MM-DD)' }),
  phone_number: optionalText,
  mobile_number: requiredText('mobile_number'),
  address: z.object(
    {
      address_line_1: requiredText('address.address_line_1'),
      address_line_2: requiredText('address.address_line_2'),
      address_line_3: optionalText,
      postcode: requiredText('address.postcode'),
      country: requiredText('address.country'),
    },
    { error: 'address is required' },
  ),
});

export type IngestPayload = z.infer<typeof ingestPayloadSchema>;
