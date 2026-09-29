import { INGEST_GENDERS } from '@ingest-form/shared';
import { z } from 'zod';

import { UNITED_KINGDOM } from '../providers/country';
import { E164_PATTERN } from '../providers/phone';
import { UK_POSTCODE_PATTERN } from '@ingest-form/shared';

/*
 * Intermediate shapes between steps. They stay snake_case like the incoming payload; the
 * camelCase rename happens once, in the transform step. The runner re-parses stored outputs with
 * these on re-run, so they must describe exactly what the previous step writes.
 */

/** Output of normalise: phones in E.164, canonical UK postcode, country "United Kingdom". */
export const normalisedPayloadSchema = z.object({
  session_id: z.string(),
  application_reference: z.string(),
  name: z.string(),
  email: z.string(),
  gender: z.enum(INGEST_GENDERS),
  date_of_birth: z.iso.date(),
  phone_number: z.string().regex(E164_PATTERN).optional(),
  mobile_number: z.string().regex(E164_PATTERN),
  address: z.object({
    address_line_1: z.string(),
    address_line_2: z.string(),
    address_line_3: z.string().optional(),
    postcode: z.string().regex(UK_POSTCODE_PATTERN),
    country: z.literal(UNITED_KINGDOM),
  }),
});

export type NormalisedPayload = z.infer<typeof normalisedPayloadSchema>;

/** Output of geocode: the normalised payload plus coordinates. */
export const geocodedPayloadSchema = normalisedPayloadSchema.extend({
  latitude: z.number(),
  longitude: z.number(),
});

export type GeocodedPayload = z.infer<typeof geocodedPayloadSchema>;
