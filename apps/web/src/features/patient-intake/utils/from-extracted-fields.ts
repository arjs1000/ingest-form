import { formatUkPostcode, type ExtractedFields } from '@ingest-form/shared';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

import type { PatientDetailsValues } from '../schemas/patient-details.schema';

/**
 * E.164 when the number parses (UK numbers may be written nationally), else as found. Possible
 * but invalid numbers still become E.164, so the phone input shows them and validation explains.
 */
function toE164(value: string): string {
  const parsed = parsePhoneNumberFromString(value, 'GB');
  return parsed?.isPossible() ? parsed.number : value.trim();
}

/** "YYYY-MM-DD" only; anything else is dropped so the date field starts empty. */
function toIsoDate(value: string): string | undefined {
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim()) ? value.trim() : undefined;
}

/**
 * Fields found in a document → form defaults. Only fields the document had are returned, so the
 * caller knows which ones to label "From your document". The last word of the name is the last
 * name, matching the pipeline's transform step.
 */
export function fromExtractedFields(fields: ExtractedFields): Partial<PatientDetailsValues> {
  const values: Partial<PatientDetailsValues> = {};

  const words = fields.name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (words.length > 0) {
    values.lastName = words.at(-1);
    if (words.length > 1) values.firstNames = words.slice(0, -1).join(' ');
  }
  if (fields.email?.trim()) values.email = fields.email.trim();
  if (fields.gender) values.gender = fields.gender;

  const dateOfBirth = fields.date_of_birth ? toIsoDate(fields.date_of_birth) : undefined;
  if (dateOfBirth) values.dateOfBirth = dateOfBirth;

  if (fields.mobile_number?.trim()) values.mobileNumber = toE164(fields.mobile_number);
  if (fields.phone_number?.trim()) values.phoneNumber = toE164(fields.phone_number);

  const address = fields.address;
  if (address?.address_line_1?.trim()) values.addressLine1 = address.address_line_1.trim();
  if (address?.address_line_2?.trim()) values.addressLine2 = address.address_line_2.trim();
  if (address?.address_line_3?.trim()) values.addressLine3 = address.address_line_3.trim();
  if (address?.postcode?.trim()) values.postcode = formatUkPostcode(address.postcode) ?? address.postcode.trim();

  return values;
}

/** How many details the document gave us, counted as the person would (a name is one detail). */
export function countExtractedDetails(fields: ExtractedFields): number {
  const { address, application_reference: _reference, ...person } = fields;
  const filled = (value: unknown) => typeof value === 'string' && value.trim() !== '';
  const personCount = Object.values(person).filter(filled).length;
  const { country: _country, ...addressLines } = address ?? {};
  return personCount + Object.values(addressLines).filter(filled).length;
}
