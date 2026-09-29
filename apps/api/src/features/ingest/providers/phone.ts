// The '/max' build carries full metadata. The default ('min') build cannot tell a mobile from a
// landline, so getType() would return undefined for every number.
import { parsePhoneNumberFromString } from 'libphonenumber-js/max';

/** Region assumed for numbers written without a country code, e.g. "07123 456789". */
export const DEFAULT_PHONE_REGION = 'GB';

/** Types we accept as a mobile. Some regions cannot tell the two apart, hence the second one. */
const MOBILE_TYPES: ReadonlySet<string> = new Set(['MOBILE', 'FIXED_LINE_OR_MOBILE']);

/** Any valid phone number in E.164 (`+447123456789`), or null when it is not a real number. */
export function toE164(value: string): string | null {
  const parsed = parsePhoneNumberFromString(value, DEFAULT_PHONE_REGION);
  return parsed?.isValid() ? parsed.number : null;
}

/** A valid mobile number in E.164, or null when invalid or not a mobile (e.g. a landline). */
export function toE164Mobile(value: string): string | null {
  const parsed = parsePhoneNumberFromString(value, DEFAULT_PHONE_REGION);
  if (!parsed?.isValid()) return null;
  const type = parsed.getType();
  return type !== undefined && MOBILE_TYPES.has(type) ? parsed.number : null;
}

/** Shape check for a stored E.164 number, used by step input schemas on re-run. */
export const E164_PATTERN = /^\+[1-9]\d{6,14}$/;
