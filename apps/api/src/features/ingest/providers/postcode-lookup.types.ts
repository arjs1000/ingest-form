import type { HttpResponse } from './http-response';

export interface Coordinates {
  longitude: number;
  latitude: number;
}

/**
 * Postcode → coordinates. The postcodes.io implementation lives in postcode-lookup.ts;
 * tests inject a fake. Error codes: POSTCODE_NOT_FOUND, POSTCODE_TERMINATED,
 * GEOCODER_UNAVAILABLE (retryable).
 */
export type PostcodeLookup = (postcode: string) => Promise<HttpResponse<Coordinates>>;
