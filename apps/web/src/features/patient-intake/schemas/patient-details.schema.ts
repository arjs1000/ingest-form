import { formatUkPostcode } from '@ingest-form/shared';
import { z } from 'zod';

import { isValidPhoneNumber } from '@/core/components/IPhoneInput';

import { MAX_AGE_YEARS, PATIENT_COUNTRY, PATIENT_GENDERS } from '../constants';

const required = (message: string) => z.string({ error: message }).trim().min(1, message);

/** Local today as "YYYY-MM-DD", to compare with ISO dates as strings. */
function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function oldestAllowedIso(): string {
  const now = new Date();
  return `${now.getFullYear() - MAX_AGE_YEARS}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * The patient details form (step 2). Web-only: the wire shape is the snake_case ingest payload
 * built by `toIngestPayload`. Messages follow the NHS style: say what to do, not what went wrong.
 */
export const patientDetailsSchema = z.object({
  firstNames: required('Enter your first name').max(100, 'First name must be 100 characters or fewer'),
  lastName: required('Enter your last name').max(100, 'Last name must be 100 characters or fewer'),
  email: required('Enter your email address').pipe(
    z.email({ error: 'Enter an email address in the correct format, like name@example.com' }),
  ),
  gender: z.enum(PATIENT_GENDERS, { error: 'Select your gender' }),
  dateOfBirth: required('Enter your date of birth')
    .refine((iso) => iso < todayIso(), 'Your date of birth must be in the past')
    .refine((iso) => iso >= oldestAllowedIso(), `Your date of birth must be within the last ${MAX_AGE_YEARS} years`),
  mobileNumber: required('Enter your mobile number').refine((value) => isValidPhoneNumber(value), 'Enter a valid UK mobile number'),
  phoneNumber: z
    .string()
    .trim()
    .refine((value) => value === '' || isValidPhoneNumber(value), 'Enter a valid phone number, or leave it empty'),
  addressLine1: required('Enter the first line of your address'),
  addressLine2: required('Enter your town or city'),
  addressLine3: z.string().trim(),
  postcode: required('Enter your postcode').refine((value) => formatUkPostcode(value) !== null, 'Enter a real postcode'),
  country: z.literal(PATIENT_COUNTRY),
});

export type PatientDetailsValues = z.infer<typeof patientDetailsSchema>;
export type PatientDetailsField = keyof PatientDetailsValues;

/** Top-to-bottom order of the fields, for the error summary. */
export const PATIENT_DETAILS_FIELD_ORDER = [
  'firstNames',
  'lastName',
  'email',
  'mobileNumber',
  'phoneNumber',
  'gender',
  'dateOfBirth',
  'addressLine1',
  'addressLine2',
  'addressLine3',
  'postcode',
] as const satisfies readonly PatientDetailsField[];
