// Flow: the patient's checked details become the exact snake_case JSON the intake API ingests.
import { describe, expect, it } from 'vitest';

import type { PatientDetailsValues } from '../schemas/patient-details.schema';
import { toIngestPayload } from '../utils/to-ingest-payload';

const SESSION_ID = '0b5c3a4e-3f55-4a7e-9a0e-6c1d2b3a4f5e';

const values: PatientDetailsValues = {
  firstNames: ' Alex James ',
  lastName: 'Example',
  email: 'alex@example.com',
  gender: 'female',
  dateOfBirth: '1984-03-15',
  mobileNumber: '+447123456789',
  phoneNumber: '',
  addressLine1: '1 High Street',
  addressLine2: 'Leeds',
  addressLine3: '',
  postcode: 'ls11aa',
  country: 'United Kingdom',
};

describe('toIngestPayload', () => {
  it('builds the ingest JSON: joined name, E.164 phone, ISO date, formatted postcode, no reference when absent', () => {
    expect(toIngestPayload(values, { sessionId: SESSION_ID })).toEqual({
      session_id: SESSION_ID,
      name: 'Alex James Example',
      email: 'alex@example.com',
      gender: 'female',
      date_of_birth: '1984-03-15',
      mobile_number: '+447123456789',
      address: {
        address_line_1: '1 High Street',
        address_line_2: 'Leeds',
        postcode: 'LS1 1AA',
        country: 'United Kingdom',
      },
    });
  });
});
