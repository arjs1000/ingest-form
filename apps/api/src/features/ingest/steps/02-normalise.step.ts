import { ingestPayloadSchema } from '@ingest-form/shared';
import type { IngestPayload } from '@ingest-form/shared';

import { failure, issue, success } from '../pipeline/step.types';
import type { IngestStep, StepIssue } from '../pipeline/step.types';
import { normaliseCountry } from '../providers/country';
import { toE164, toE164Mobile } from '../providers/phone';
import { formatUkPostcode } from '@ingest-form/shared';
import type { NormalisedPayload } from './normalised-payload.schema';

/**
 * Phones to E.164, postcode to canonical UK form, country to "United Kingdom".
 * Reports every error at once, so a third party can fix the whole payload in one go.
 */
export const normaliseStep: IngestStep<IngestPayload, NormalisedPayload> = {
  name: 'normalise',
  // Re-parsing the validated payload is idempotent, and guards stored input on re-run.
  input: ingestPayloadSchema,
  async run(payload) {
    // Errors and warnings together, so a failed record still shows the dropped landline.
    const issues: StepIssue[] = [];

    const mobileNumber = toE164Mobile(payload.mobile_number);
    if (!mobileNumber) {
      issues.push(issue('mobile_number', 'INVALID_MOBILE', 'mobile_number must be a valid UK mobile number'));
    }

    // The landline is optional, so a bad one is dropped rather than failing the record.
    const phoneNumber = payload.phone_number === undefined ? undefined : (toE164(payload.phone_number) ?? undefined);
    if (payload.phone_number !== undefined && phoneNumber === undefined) {
      issues.push(
        issue('phone_number', 'INVALID_PHONE_DROPPED', 'phone_number is not a valid phone number and was dropped', 'warning'),
      );
    }

    const postcode = formatUkPostcode(payload.address.postcode);
    if (!postcode) {
      issues.push(issue('address.postcode', 'INVALID_POSTCODE', 'address.postcode is not a valid UK postcode'));
    }

    const country = normaliseCountry(payload.address.country);
    if (!country) {
      issues.push(issue('address.country', 'UNSUPPORTED_COUNTRY', 'Only United Kingdom addresses are supported'));
    }

    if (!mobileNumber || !postcode || !country) return failure(issues);

    const { address } = payload;
    const normalised: NormalisedPayload = {
      session_id: payload.session_id,
      application_reference: payload.application_reference,
      name: payload.name,
      email: payload.email,
      gender: payload.gender,
      date_of_birth: payload.date_of_birth,
      mobile_number: mobileNumber,
      // Optional keys are left out rather than set to undefined, so stored JSON matches the object.
      ...(phoneNumber === undefined ? {} : { phone_number: phoneNumber }),
      address: {
        address_line_1: address.address_line_1,
        address_line_2: address.address_line_2,
        ...(address.address_line_3 === undefined ? {} : { address_line_3: address.address_line_3 }),
        postcode,
        country,
      },
    };
    return success(normalised, issues);
  },
};
