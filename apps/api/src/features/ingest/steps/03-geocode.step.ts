import { failure, issue, success } from '../pipeline/step.types';
import type { IngestStep } from '../pipeline/step.types';
import { normalisedPayloadSchema } from './normalised-payload.schema';
import type { GeocodedPayload, NormalisedPayload } from './normalised-payload.schema';

/**
 * Adds latitude and longitude from the postcode. The provider's code (POSTCODE_NOT_FOUND,
 * POSTCODE_TERMINATED, GEOCODER_UNAVAILABLE) is passed through so admins can tell a bad postcode
 * from an outage worth re-running.
 */
export const geocodeStep: IngestStep<NormalisedPayload, GeocodedPayload> = {
  name: 'geocode',
  input: normalisedPayloadSchema,
  async run(payload, deps) {
    const result = await deps.lookupPostcode(payload.address.postcode);
    if (!result.ok) return failure([issue('address.postcode', result.error.code, result.error.message)]);
    return success({ ...payload, latitude: result.data.latitude, longitude: result.data.longitude });
  },
};
