/**
 * UK postcode in its canonical form: outward code, one space, inward code (digit + two letters).
 * GIR 0AA is the one historic exception (Girobank) that postcodes.io still knows.
 * Shared so the patient form (web) and the normalise step (api) apply exactly the same rule.
 */
export const UK_POSTCODE_PATTERN = /^(?:GIR 0AA|[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2})$/;

/**
 * Canonical UK postcode ("e154bz" → "E15 4BZ"), or null when it is not UK-shaped.
 * Shape only: whether the postcode exists is the geocoder's job.
 */
export function formatUkPostcode(value: string): string | null {
  const compact = value.toUpperCase().replace(/\s+/g, '');
  // The inward code is always the last three characters, so the split point is fixed.
  if (compact.length < 5) return null;
  const formatted = `${compact.slice(0, -3)} ${compact.slice(-3)}`;
  return UK_POSTCODE_PATTERN.test(formatted) ? formatted : null;
}
