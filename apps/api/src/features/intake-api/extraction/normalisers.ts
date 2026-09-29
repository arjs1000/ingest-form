/*
 * Per-field normalisers. Anything that doesn't parse is dropped rather than guessed, so the
 * patient sees an empty field instead of a wrong one.
 */
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const DATE_PATTERN = /(\d{1,2})\s*[\s/.-]\s*([a-z]{3,9}|\d{1,2})\s*[\s/.-]\s*(\d{4}|\d{2})\b/;
const COMPACT_DATE_PATTERN = /\b(\d{2})(\d{2})(\d{4})\b/;

/** "04/07/1990", "4 July 1990", "04071990" → "1990-07-04". Day first (UK forms). */
export function normaliseDate(text: string): string | null {
  const t = text.toLowerCase().replaceAll('|', ' ');
  let day: number;
  let month: number | undefined;
  let year: number;
  const match = DATE_PATTERN.exec(t);
  if (match) {
    day = Number(match[1]);
    const rawMonth = match[2]!;
    month = /^[a-z]+$/.test(rawMonth) ? MONTHS.indexOf(rawMonth.slice(0, 3)) + 1 || undefined : Number(rawMonth);
    year = Number(match[3]);
    if (year < 100) year += year > 30 ? 1900 : 2000;
  } else {
    const compact = COMPACT_DATE_PATTERN.exec(t.replace(/\s/g, ''));
    if (!compact) return null;
    [day, month, year] = [Number(compact[1]), Number(compact[2]), Number(compact[3])];
  }
  if (!month || month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** UK numbers to E.164 (+44…); anything else with 10-15 digits is kept as read. */
export function normalisePhone(text: string): string | null {
  let digits = text.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) digits = `+${digits.replace(/\D/g, '')}`;
  if (digits.startsWith('+44') && digits.length === 13) return digits;
  if (digits.startsWith('0044')) digits = digits.slice(2);
  if (digits.startsWith('44') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 11) return `+44${digits.slice(1)}`;
  const count = digits.replace(/\D/g, '').length;
  return count >= 10 && count <= 15 ? digits : null;
}

const POSTCODE_SHAPE = /^([A-Z]{1,2}\d[A-Z\d]?)(\d[A-Z]{2})$/;
export const POSTCODE_IN_TEXT = /\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/;

function translate(ch: string, from: string, to: string): string {
  const index = from.indexOf(ch);
  return index === -1 ? ch : to[index]!;
}

/**
 * UK postcode with OCR confusions fixed: the inward code is always digit-letter-letter, and the
 * outward code starts with letters then a digit.
 */
export function normalisePostcode(text: string): string | null {
  const raw = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (raw.length < 5 || raw.length > 8) return null;
  const outward = raw.slice(0, -3);
  const inward = raw.slice(-3);
  const fixedInward =
    translate(inward[0]!, 'OILSB', '01158') + [...inward.slice(1)].map((ch) => translate(ch, '01', 'OI')).join('');
  const fixedOutward = [...outward]
    .map((ch, i) => {
      if (i === 0) return translate(ch, '01', 'OI');
      if (i === 1 && 'OILS'.includes(ch) && outward.length <= 3) return translate(ch, 'OILS', '0115');
      return ch;
    })
    .join('');
  const match = POSTCODE_SHAPE.exec(fixedOutward + fixedInward);
  return match ? `${match[1]} ${match[2]}` : null;
}

/** Collapses spaces; BLOCK CAPITALS become Title Case. */
export function normaliseName(text: string): string {
  const tidy = text.replace(/\s+/g, ' ').replace(/^[ ,:]+|[ ,:]+$/g, '');
  const hasLetters = /[a-z]/i.test(tidy);
  if (!hasLetters || tidy !== tidy.toUpperCase()) return tidy;
  return tidy
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function normaliseEmail(text: string): string | null {
  const compact = text.replace(/\s+/g, '');
  return /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(compact) ? compact : null;
}
