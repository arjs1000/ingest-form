export const UNITED_KINGDOM = 'United Kingdom';

/** Spellings third parties use for the UK. Compared after trimming and lower-casing. */
const UK_ALIASES: ReadonlySet<string> = new Set([
  'united kingdom',
  'uk',
  'gb',
  'great britain',
  'england',
  'scotland',
  'wales',
  'northern ireland',
]);

/**
 * "United Kingdom" for any UK spelling, or null. Only the UK is supported because the
 * geocoder (postcodes.io) only knows UK postcodes.
 */
export function normaliseCountry(value: string): typeof UNITED_KINGDOM | null {
  return UK_ALIASES.has(value.trim().toLowerCase()) ? UNITED_KINGDOM : null;
}
