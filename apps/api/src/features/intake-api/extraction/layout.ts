/*
 * Page geometry shared by both mapper modes: words, lines, segments, labels and their bounds.
 * Ported from the OCR lab's mapper/map_fields.py (FEAT-005); behaviour is kept identical so the
 * lab's benchmark scores still describe this code.
 */
import type { PageWords, WordSource } from './page-words';

/** Every page is rescaled to the GMS1 width, so one set of tolerances fits a render, a photo or the PDF. */
export const PAGE_WIDTH_PT = 431.35;

/** Canonical field → label synonyms (normalised: lowercase, punctuation stripped). Order matters. */
export const FIELD_SYNONYMS: Record<string, readonly string[]> = {
  last_name: ['surname', 'last name', 'family name'],
  first_name: ['first names', 'first name', 'first name s', 'forename', 'forenames', 'given name', 'given names'],
  full_name: ['name', 'full name', 'patient name', 'your name', 'child s name', 'patient s name', 'name of patient'],
  date_of_birth: ['date of birth', 'dob', 'd o b', 'birth date', 'date of birth d o b'],
  email: ['email', 'e mail', 'email address', 'e mail address'],
  phone: ['telephone number', 'telephone', 'phone', 'home phone', 'home telephone number', 'home telephone', 'home tel', 'tel', 'tel no', 'phone number', 'daytime telephone', 'landline'],
  mobile: ['mobile number', 'mobile', 'mobile phone', 'mobile telephone number', 'mobile tel', 'mobile no'],
  address: ['home address', 'address', 'postal address', 'home address details', 'full address'],
  postcode: ['postcode', 'post code'],
  country: ['country'],
  gender: ['sex', 'gender'],
  male: ['male'],
  female: ['female'],
  title_mr: ['mr'],
  title_mrs: ['mrs'],
  title_miss: ['miss'],
  title_ms: ['ms'],
};

export const CHECKBOX_KEYS = new Set(['male', 'female', 'title_mr', 'title_mrs', 'title_miss', 'title_ms']);
const TARGET_KEYS = new Set(Object.keys(FIELD_SYNONYMS).filter((key) => !CHECKBOX_KEYS.has(key)));

export class Word {
  used = false;

  constructor(
    public text: string,
    public x0: number,
    public y0: number,
    public x1: number,
    public y1: number,
    public conf = 1,
    public source: WordSource = 'ocr',
  ) {}

  get xc(): number {
    return (this.x0 + this.x1) / 2;
  }

  get yc(): number {
    return (this.y0 + this.y1) / 2;
  }

  get w(): number {
    return this.x1 - this.x0;
  }

  get h(): number {
    return this.y1 - this.y0;
  }
}

export class Label {
  rightBound = PAGE_WIDTH_PT;
  bottomBound = Number.POSITIVE_INFINITY;

  constructor(
    /** A canonical field key, or `other:<text>` for printed text that only bounds other labels. */
    public key: string,
    public text: string,
    public x0: number,
    public y0: number,
    public x1: number,
    public y1: number,
  ) {}

  get isCheckbox(): boolean {
    return CHECKBOX_KEYS.has(this.key);
  }

  get isTarget(): boolean {
    return TARGET_KEYS.has(this.key) || this.isCheckbox;
  }
}

export type Box = [number, number, number, number];

export function normText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/** Python's `str.isupper()`: at least one cased character, and every cased one is upper case. */
export function isUpperCase(text: string): boolean {
  return /[a-z]/i.test(text) && text === text.toUpperCase();
}

/** The upper median, as `sorted(values)[len // 2]` in the lab code. */
export function upperMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

/** rapidfuzz `fuzz.ratio`: 100 × 2·LCS / (len(a) + len(b)). */
export function fuzzRatio(a: string, b: string): number {
  if (!a.length && !b.length) return 100;
  let previous = new Array<number>(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    const current = new Array<number>(b.length + 1).fill(0);
    for (let j = 1; j <= b.length; j++) {
      current[j] = a[i - 1] === b[j - 1] ? previous[j - 1]! + 1 : Math.max(previous[j]!, current[j - 1]!);
    }
    previous = current;
  }
  return (200 * previous[b.length]!) / (a.length + b.length);
}

export function loadWords(doc: PageWords): Word[] {
  const scale = PAGE_WIDTH_PT / doc.page.width;
  return doc.words.flatMap((word) => {
    const text = word.text.trim();
    if (!text) return [];
    const [x0, y0, x1, y1] = word.bbox.map((value) => value * scale) as Box;
    return [new Word(text, x0, y0, x1, y1, word.conf ?? 1, word.source ?? 'ocr')];
  });
}

/** Groups words into lines by centre and height, top to bottom, then left to right. */
export function buildLines(words: Word[]): Word[][] {
  const lines: Word[][] = [];
  for (const word of [...words].sort((a, b) => a.yc - b.yc || a.x0 - b.x0)) {
    const home = lines.find((line) => {
      const lineYc = upperMedian(line.map((w) => w.yc));
      const lineH = upperMedian(line.map((w) => w.h));
      const ratio = lineH ? word.h / lineH : 1;
      return ratio > 0.6 && ratio < 1.7 && Math.abs(word.yc - lineYc) < 0.5 * Math.min(lineH, word.h) + 1;
    });
    if (home) home.push(word);
    else lines.push([word]);
  }
  for (const line of lines) line.sort((a, b) => a.x0 - b.x0);
  return lines.sort((a, b) => Math.min(...a.map((w) => w.yc)) - Math.min(...b.map((w) => w.yc)));
}

/** Splits a line where the horizontal gap is large: separate labels share a row on forms. */
export function segments(line: Word[], gapFactor = 2.2): Word[][] {
  const [first, ...rest] = line;
  if (!first) return [];
  const charW = upperMedian(line.map((w) => w.w / Math.max(w.text.length, 1))) || 4;
  const out: Word[][] = [[first]];
  let previous = first;
  for (const word of rest) {
    if (word.x0 - previous.x1 > gapFactor * charW + 2) out.push([word]);
    else out[out.length - 1]!.push(word);
    previous = word;
  }
  return out;
}

export function bboxOf(words: Word[]): Box {
  return [
    Math.min(...words.map((w) => w.x0)),
    Math.min(...words.map((w) => w.y0)),
    Math.max(...words.map((w) => w.x1)),
    Math.max(...words.map((w) => w.y1)),
  ];
}

export function joinText(words: Word[]): string {
  return words.map((w) => w.text).join(' ');
}

/** The canonical key for a label's text, or null. Short labels (Mr, tel, dob) must match exactly. */
export function synonymKey(text: string): string | null {
  const normalised = normText(text);
  if (!normalised) return null;
  let best: { score: number; key: string } | null = null;
  for (const [key, synonyms] of Object.entries(FIELD_SYNONYMS)) {
    for (const synonym of synonyms) {
      if (normalised === synonym) return key;
      if (synonym.length <= 4) continue;
      const score = fuzzRatio(normalised, synonym);
      if (score >= 86 && (!best || score > best.score)) best = { score, key };
    }
  }
  return best?.key ?? null;
}

/** A label's column ends at the next label to its right on the same row, and above the next label below. */
export function setBounds(labels: Label[]): void {
  for (const label of labels) {
    for (const other of labels) {
      if (other === label) continue;
      const verticalOverlap = Math.min(label.y1, other.y1) - Math.max(label.y0, other.y0);
      if (other.x0 > label.x1 && verticalOverlap > 0) label.rightBound = Math.min(label.rightBound, other.x0 - 2);
    }
    for (const other of labels) {
      if (other === label || other.y0 <= label.y1) continue;
      if (other.x0 < label.rightBound && other.x1 > label.x0) label.bottomBound = Math.min(label.bottomBound, other.y0);
    }
  }
}
