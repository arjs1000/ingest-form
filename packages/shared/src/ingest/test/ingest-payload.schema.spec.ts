// Flow: every ingested form is checked against this one shared schema at the validate step.
import { describe, expect, it } from 'vitest';

import { ingestPayloadSchema } from '../ingest-payload.schema';

const VALID_PAYLOAD = {
  session_id: '881fa3b2-84cd-4517-b909-84a073ca0110',
  application_reference: 'GRU-123092-2026',
  name: 'Jane Doe',
  email: 'jane.doe@example.com',
  gender: 'female',
  date_of_birth: '1921-03-14',
  mobile_number: '07123456789',
  address: { address_line_1: '123 Main St', address_line_2: 'Apt 1', postcode: 'SW1A 1AA', country: 'United Kingdom' },
};

describe('ingestPayloadSchema', () => {
  it('accepts a payload without its optional fields and reports missing required fields by path', () => {
    const valid = ingestPayloadSchema.safeParse(VALID_PAYLOAD);
    const missingFields = ingestPayloadSchema.safeParse({ ...VALID_PAYLOAD, email: undefined, address: { country: 'UK' } });

    expect(valid.success).toBe(true);
    expect(missingFields.success).toBe(false);
    const paths = missingFields.error?.issues.map((issue) => issue.path.join('.'));
    expect(paths).toEqual(expect.arrayContaining(['email', 'address.address_line_1', 'address.postcode']));
  });
});
