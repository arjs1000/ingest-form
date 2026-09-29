/*
 * Payloads for the pipeline spec. The three examples are the sample payloads from the brief, verbatim.
 * All data is synthetic.
 */

export const EXAMPLE_1 = {
  session_id: 'c8267b77-d796-451e-9948-e82f56412b56',
  application_reference: 'GRU-123089-2026',
  name: 'John Doe',
  email: 'john.doe@example.com',
  gender: 'male',
  date_of_birth: '1990-01-01',
  phone_number: '07123456789',
  mobile_number: '07123456789',
  address: {
    address_line_1: 'Stratford Village Surgery',
    address_line_2: '50C Romford Road',
    address_line_3: 'London',
    postcode: 'E15 4BZ',
    country: 'United Kingdom',
  },
} as const;

export const EXAMPLE_2 = {
  session_id: 'c77fb77f-5a95-4935-9d5a-12953f29da89',
  application_reference: 'GRU-123090-2026',
  name: 'Andy James Smith-Jones',
  email: 'andy.smith.jones@example.com',
  gender: 'other',
  date_of_birth: '1985-06-20',
  phone_number: '0001',
  mobile_number: '07777777777',
  address: {
    address_line_1: '1 The Avenue',
    address_line_2: 'Bristol',
    postcode: 'BS1 1AA',
    country: 'United Kingdom',
  },
} as const;

export const EXAMPLE_3 = {
  session_id: '881fa3b2-84cd-4517-b909-84a073ca0110',
  application_reference: 'GRU-123092-2026',
  name: 'Jane Doe',
  email: 'jane.doe@example.com',
  gender: 'female',
  date_of_birth: '1921-03-14',
  mobile_number: '07123456789',
  address: {
    address_line_1: '123 Main St',
    address_line_2: 'Apt 1',
    postcode: 'SW1A 1AA',
    country: 'United Kingdom',
  },
} as const;

/** A body that was cut off mid-way, so it is not valid JSON. */
export const INVALID_JSON_BODY = '{"session_id": "c8267b77-d796-451e-9948-e82f56412b56", "name": ';

/** Fixed clock, so date-of-birth rules give the same answer every day. */
export const FIXED_NOW = new Date('2026-09-27T10:00:00.000Z');

/** The postcodes the fake lookup knows about, with their coordinates. */
export const KNOWN_POSTCODES: Readonly<Record<string, { latitude: number; longitude: number }>> = {
  'E15 4BZ': { latitude: 51.542097, longitude: 0.006388 },
  'BS1 1AA': { latitude: 51.4495, longitude: -2.5806 },
  'SW1A 1AA': { latitude: 51.501009, longitude: -0.141588 },
};
