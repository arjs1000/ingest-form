/*
 * Template mode: a profile built from the blank form supplies every printed word and label. The
 * filled page is aligned to it (a least-squares similarity transform from matching words), printed
 * text is subtracted, and what remains is assigned to the form's own labels. OCR mistakes on the
 * labels stop mattering: PaddleOCR scored 7/7 on a scan this way, 6/7 without it.
 */
import type { TemplateProfile } from './page-words';
import { fuzzRatio, Label, normText, setBounds, upperMedian, Word } from './layout';

interface Point {
  x: number;
  y: number;
}

interface Similarity {
  /** Rotation and scale as a complex number a = re + i·im. */
  re: number;
  im: number;
  source: Point;
  target: Point;
}

const IDENTITY: Similarity = { re: 1, im: 0, source: { x: 0, y: 0 }, target: { x: 0, y: 0 } };

function centre(bbox: readonly number[]): Point {
  return { x: (bbox[0]! + bbox[2]!) / 2, y: (bbox[1]! + bbox[3]!) / 2 };
}

function mean(points: Point[]): Point {
  return {
    x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
    y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
  };
}

function apply(t: Similarity, p: Point): Point {
  const dx = p.x - t.source.x;
  const dy = p.y - t.source.y;
  return { x: t.re * dx - t.im * dy + t.target.x, y: t.re * dy + t.im * dx + t.target.y };
}

/** Least-squares similarity (scale, rotation, translation) with outlier trimming. */
function fitSimilarity(pairs: { from: Point; to: Point }[]): { transform: Similarity; used: number } {
  let keep = pairs.map((_, i) => i);
  let transform = IDENTITY;
  for (let round = 0; round < 4; round++) {
    if (keep.length < 4) return { transform: IDENTITY, used: 0 };
    const source = mean(keep.map((i) => pairs[i]!.from));
    const target = mean(keep.map((i) => pairs[i]!.to));
    let re = 0;
    let im = 0;
    let den = 0;
    for (const i of keep) {
      const s = { x: pairs[i]!.from.x - source.x, y: pairs[i]!.from.y - source.y };
      const d = { x: pairs[i]!.to.x - target.x, y: pairs[i]!.to.y - target.y };
      // conj(s) · d
      re += s.x * d.x + s.y * d.y;
      im += s.x * d.y - s.y * d.x;
      den += s.x * s.x + s.y * s.y;
    }
    transform = den ? { re: re / den, im: im / den, source, target } : { ...IDENTITY, source, target };
    const residuals = keep.map((i) => {
      const moved = apply(transform, pairs[i]!.from);
      return Math.hypot(moved.x - pairs[i]!.to.x, moved.y - pairs[i]!.to.y);
    });
    const limit = Math.max(3, 3 * upperMedian(residuals));
    const next = keep.filter((_, j) => residuals[j]! <= limit);
    if (next.length === keep.length) break;
    keep = next;
  }
  return { transform, used: keep.length };
}

function indexByText<T>(items: T[], textOf: (item: T) => string): Map<string, T[]> {
  const index = new Map<string, T[]>();
  for (const item of items) {
    const key = normText(textOf(item)).replaceAll(' ', '');
    if (key.length < 3) continue;
    index.set(key, [...(index.get(key) ?? []), item]);
  }
  return index;
}

/** Moves words into template space, in place, using words printed exactly once on both pages. */
export function alignToTemplate(words: Word[], profile: TemplateProfile): void {
  const templateIndex = indexByText(profile.words, (t) => t.text);
  const filledIndex = indexByText(words, (w) => w.text);
  const pairs: { from: Point; to: Point }[] = [];
  for (const [key, templateWords] of templateIndex) {
    const filled = filledIndex.get(key);
    if (templateWords.length !== 1 || filled?.length !== 1) continue;
    const to = centre(templateWords[0]!.bbox);
    const word = filled[0]!;
    if (Math.abs(word.xc - to.x) < 80 && Math.abs(word.yc - to.y) < 80) pairs.push({ from: { x: word.xc, y: word.yc }, to });
  }
  const { transform, used } = fitSimilarity(pairs);
  if (!used) return;
  for (const word of words) {
    const corners = [
      apply(transform, { x: word.x0, y: word.y0 }),
      apply(transform, { x: word.x1, y: word.y0 }),
      apply(transform, { x: word.x0, y: word.y1 }),
      apply(transform, { x: word.x1, y: word.y1 }),
    ];
    word.x0 = Math.min(...corners.map((c) => c.x));
    word.x1 = Math.max(...corners.map((c) => c.x));
    word.y0 = Math.min(...corners.map((c) => c.y));
    word.y1 = Math.max(...corners.map((c) => c.y));
  }
}

/**
 * OCR sometimes merges a printed label and the value after it into one token ("PostcoSW1A").
 * Returns the value part when the token starts with (a close match of) the printed word and
 * carries on for at least two more characters, else null. Not in the lab mapper: added after the
 * synthetic scan lost its postcode this way.
 */
function valueAfterMergedLabel(word: Word, printedText: string): Word | null {
  const printed = normText(printedText).replaceAll(' ', '');
  const alnum = word.text.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
  if (printed.length < 4 || alnum.length < printed.length) return null;
  // The best-matching cut wins: "PostcoSW1A" must split after "Postco", not after "Postcos".
  let best: { cut: number; score: number } | null = null;
  for (const cut of [printed.length, printed.length - 1, printed.length - 2]) {
    if (alnum.length - cut < 2) continue;
    const score = fuzzRatio(alnum.slice(0, cut), printed);
    if (score >= 80 && (!best || score > best.score)) best = { cut, score };
  }
  if (!best) return null;
  // Map the alphanumeric cut back to a position in the raw text.
  let seen = 0;
  let index = 0;
  while (index < word.text.length && seen < best.cut) {
    if (/[A-Za-z0-9]/.test(word.text[index]!)) seen++;
    index++;
  }
  const rest = word.text.slice(index).replace(/^[ :.-]+/, '');
  if (rest.length < 2) return null;
  const splitX = word.x0 + word.w * (index / word.text.length);
  return new Word(rest, splitX, word.y0, word.x1, word.y1, word.conf, word.source);
}

/** Drops words printed on the blank form, and splits tokens that merge a label and a value. */
export function subtractTemplate(words: Word[], profile: TemplateProfile): Word[] {
  // Dotted leaders and rules sit in the text layer as runs of "." or "_": not words.
  const printedWords = profile.words.filter((t) => /[A-Za-z0-9]/.test(t.text));
  const out: Word[] = [];
  for (const word of words) {
    const area = Math.max(word.w * word.h, 1e-6);
    const normalised = normText(word.text);
    let printed = false;
    for (const t of printedWords) {
      const [tx0, ty0, tx1, ty1] = t.bbox;
      const ix = Math.min(word.x1, tx1) - Math.max(word.x0, tx0);
      const iy = Math.min(word.y1, ty1) - Math.max(word.y0, ty0);
      if (ix <= 0 || iy <= 0) continue;
      const overlap = ix * iy;
      const templateArea = Math.max((tx1 - tx0) * (ty1 - ty0), 1e-6);
      // A third of the way down: tall annotation rects overhang the next row.
      const yRef = word.y0 + 0.35 * word.h;
      const centreInside = tx0 - 1 <= word.xc && word.xc <= tx1 + 1 && ty0 - 1 <= yRef && yRef <= ty1 + 1;
      const sameText = normalised.length >= 3 && fuzzRatio(normalised, normText(t.text)) >= 70;
      const merged = sameText ? null : valueAfterMergedLabel(word, t.text);
      if (merged) {
        out.push(merged);
        printed = true;
        break;
      }
      if (overlap / area > 0.45 || centreInside || sameText) {
        printed = true;
        break;
      }
      if (overlap / templateArea > 0.5 && word.x1 > tx1 + 0.25 * word.w && word.x0 < tx0 + 0.3 * (tx1 - tx0)) {
        const fraction = Math.min(Math.max((tx1 - word.x0) / word.w, 0), 1);
        const rest = word.text.slice(Math.round(fraction * word.text.length)).replace(/^[ :.-]+/, '');
        if (rest.length >= 2) out.push(new Word(rest, tx1, word.y0, word.x1, word.y1, word.conf, word.source));
        printed = true;
        break;
      }
    }
    if (!printed) out.push(word);
  }
  return out;
}

export function templateLabels(profile: TemplateProfile): Label[] {
  const labels = profile.labels.map((l) => new Label(l.key, l.text, ...l.bbox));
  setBounds(labels);
  return labels;
}
