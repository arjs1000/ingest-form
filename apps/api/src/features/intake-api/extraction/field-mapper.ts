/*
 * Words with boxes → the ingest `extractedFields` shape. Ported from the OCR lab's
 * mapper/map_fields.py (2026-09-29 benchmark, ai-context/research/OCR-AI-form-extraction.md).
 *
 *   discover  labels found on the page itself (typed-annotation PDFs, forms without a profile)
 *   template  labels from the blank form's profile; the page is aligned and printed words removed
 *             (OCR of scans and photos of a known form)
 */
import type { ExtractedFields } from '@ingest-form/shared';

import { assignValues, joinLines } from './assign-values';
import { discoverLabels } from './discover-labels';
import { loadWords, normText } from './layout';
import {
  normaliseDate,
  normaliseEmail,
  normaliseName,
  normalisePhone,
  normalisePostcode,
  POSTCODE_IN_TEXT,
} from './normalisers';
import type { PageWords, TemplateProfile } from './page-words';
import { alignToTemplate, subtractTemplate, templateLabels } from './template-labels';

/** Text found for each canonical field key, one entry per line. */
type RawValues = Partial<Record<string, string[]>>;

function joined(raw: RawValues, key: string): string {
  return (raw[key] ?? []).join(' ');
}

function nameFrom(raw: RawValues): string | undefined {
  if (raw.full_name?.length) return normaliseName(joined(raw, 'full_name'));
  const parts = [normaliseName(joined(raw, 'first_name')), normaliseName(joined(raw, 'last_name'))].filter(Boolean);
  return parts.length ? parts.join(' ') : undefined;
}

function genderFrom(raw: RawValues): 'male' | 'female' | undefined {
  const male = Boolean(raw.male?.length);
  const female = Boolean(raw.female?.length);
  if (male !== female) return male ? 'male' : 'female';
  // No tick, or both ticked: fall back to a written answer next to "Sex" / "Gender".
  if (!raw.gender?.length) return undefined;
  const written = normText(joined(raw, 'gender'));
  if (written === 'male' || written === 'm') return 'male';
  if (written === 'female' || written === 'f') return 'female';
  return undefined;
}

function addressFrom(raw: RawValues): ExtractedFields['address'] {
  const lines = [...(raw.address ?? [])];
  let postcode = raw.postcode?.length ? normalisePostcode(joined(raw, 'postcode')) : null;
  const last = lines.at(-1);
  if (!postcode && last) {
    // No separate postcode box: take it off the end of the address.
    const match = POSTCODE_IN_TEXT.exec(last.toUpperCase());
    if (match) {
      postcode = normalisePostcode(match[0]);
      const rest = last.slice(0, match.index).replace(/[ ,]+$/, '');
      if (rest) lines[lines.length - 1] = rest;
      else lines.pop();
    }
  }
  const address: NonNullable<ExtractedFields['address']> = {};
  const [line1, line2, line3] = lines;
  if (line1) address.address_line_1 = line1;
  if (line2) address.address_line_2 = line2;
  if (line3) address.address_line_3 = line3;
  if (postcode) address.postcode = postcode;
  if (raw.country?.length) address.country = normaliseName(joined(raw, 'country'));
  return Object.keys(address).length ? address : undefined;
}

function fieldsFromValues(raw: RawValues): ExtractedFields {
  const fields: ExtractedFields = {};
  const name = nameFrom(raw);
  if (name) fields.name = name;
  const email = raw.email?.length ? normaliseEmail(joined(raw, 'email')) : null;
  if (email) fields.email = email;
  const gender = genderFrom(raw);
  if (gender) fields.gender = gender;
  const dateOfBirth = raw.date_of_birth?.length ? normaliseDate(joined(raw, 'date_of_birth')) : null;
  if (dateOfBirth) fields.date_of_birth = dateOfBirth;
  const phone = raw.phone?.length ? normalisePhone(joined(raw, 'phone')) : null;
  if (phone) fields.phone_number = phone;
  const mobile = raw.mobile?.length ? normalisePhone(joined(raw, 'mobile')) : null;
  if (mobile) fields.mobile_number = mobile;
  const address = addressFrom(raw);
  if (address) fields.address = address;
  return fields;
}

/** Maps one page to patient fields. Pass the form's profile for template mode. */
export function mapFields(doc: PageWords, profile?: TemplateProfile): ExtractedFields {
  let words = loadWords(doc);
  let labels;
  if (profile) {
    alignToTemplate(words, profile);
    words = subtractTemplate(words, profile);
    labels = templateLabels(profile);
  } else {
    const discovered = discoverLabels(words);
    labels = discovered.labels;
    words = [...words, ...discovered.extraValues];
  }
  const raw: RawValues = {};
  for (const [key, values] of assignValues(words, labels)) {
    if (values.length && !key.startsWith('other:')) raw[key] = joinLines(values);
  }
  return fieldsFromValues(raw);
}

/** How many leaf fields were filled, counting each address line separately. */
export function countFilledFields(fields: ExtractedFields): number {
  const { address, ...rest } = fields;
  return Object.values(rest).filter(Boolean).length + Object.values(address ?? {}).filter(Boolean).length;
}
