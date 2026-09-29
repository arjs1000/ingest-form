import { formatUkPostcode } from '@ingest-form/shared';

import { PATIENT_COUNTRY } from '../constants';
import type { PatientDetailsValues } from '../schemas/patient-details.schema';
import type { IntakePayload } from '../types';

export interface IngestPayloadContext {
  sessionId: string;
  /** From the uploaded document, when it had one. Omitted otherwise: the server generates it. */
  applicationReference?: string | null;
}

/**
 * Form values → the exact snake_case JSON sent to POST /api/v1/intake. Also runs on every
 * keystroke for the developer sheet, so it never throws on half-filled values: the postcode is
 * formatted when it is valid and sent as typed otherwise. Empty optional fields are left out.
 */
export function toIngestPayload(values: PatientDetailsValues, { sessionId, applicationReference }: IngestPayloadContext): IntakePayload {
  const postcode = values.postcode.trim();
  const phoneNumber = values.phoneNumber.trim();
  const addressLine3 = values.addressLine3.trim();

  return {
    session_id: sessionId,
    ...(applicationReference ? { application_reference: applicationReference } : {}),
    name: `${values.firstNames.trim()} ${values.lastName.trim()}`.trim(),
    email: values.email.trim(),
    gender: values.gender,
    date_of_birth: values.dateOfBirth,
    ...(phoneNumber ? { phone_number: phoneNumber } : {}),
    mobile_number: values.mobileNumber.trim(),
    address: {
      address_line_1: values.addressLine1.trim(),
      address_line_2: values.addressLine2.trim(),
      ...(addressLine3 ? { address_line_3: addressLine3 } : {}),
      postcode: formatUkPostcode(postcode) ?? postcode,
      country: PATIENT_COUNTRY,
    },
  };
}
