import type { TransformedForm } from '@ingest-form/shared';

import { failure, issue, success } from '../pipeline/step.types';
import type { IngestStep, StepIssue } from '../pipeline/step.types';
import { geocodedPayloadSchema } from './normalised-payload.schema';
import type { GeocodedPayload } from './normalised-payload.schema';

/**
 * Last word is the surname, the rest is the first name: "Andy James Smith-Jones" gives
 * "Andy James" / "Smith-Jones". Known limitation: multi-word surnames ("Van Der Berg").
 */
function splitName(name: string): { firstName: string; lastName: string } | null {
  const words = name.trim().split(/\s+/);
  const lastName = words.pop();
  if (!lastName || words.length === 0) return null;
  return { firstName: words.join(' '), lastName };
}

/** snake_case geocoded payload → camelCase TransformedForm. */
export const transformStep: IngestStep<GeocodedPayload, TransformedForm> = {
  name: 'transform',
  input: geocodedPayloadSchema,
  async run(payload) {
    const name = splitName(payload.name);
    if (!name) {
      return failure([issue('name', 'NAME_NOT_SPLITTABLE', 'name must include a first name and a last name')]);
    }

    const warnings: StepIssue[] = [];
    // The target type has no "other". Lossy by decision (FEAT-001); revisit before real data.
    const gender = payload.gender === 'other' ? 'prefer-not-to-say' : payload.gender;
    if (payload.gender === 'other') {
      warnings.push(issue('gender', 'GENDER_MAPPED', 'gender "other" was saved as "prefer-not-to-say"', 'warning'));
    }

    const { address } = payload;
    const form: TransformedForm = {
      sessionId: payload.session_id,
      applicationReference: payload.application_reference,
      firstName: name.firstName,
      lastName: name.lastName,
      email: payload.email,
      gender,
      dateOfBirth: payload.date_of_birth,
      ...(payload.phone_number === undefined ? {} : { phoneNumber: payload.phone_number }),
      mobileNumber: payload.mobile_number,
      addressLine1: address.address_line_1,
      addressLine2: address.address_line_2,
      ...(address.address_line_3 === undefined ? {} : { addressLine3: address.address_line_3 }),
      postcode: address.postcode,
      country: address.country,
      longitude: payload.longitude,
      latitude: payload.latitude,
    };
    return success(form, warnings);
  },
};
