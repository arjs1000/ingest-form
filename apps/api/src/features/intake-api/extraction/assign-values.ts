/*
 * The value rule both mapper modes share: a value sits to the right of, or below, its label,
 * inside the label's column and above the next label in it. Ticks attach to the checkbox label
 * immediately to their right.
 */
import { buildLines, type Label, type Word } from './layout';

const TICK_TEXTS = new Set(['x', '✓', '✔', '√', 'v', '×', '☒', '☑', '✗', '✘', '[x]', 'xx', 'y']);
/** How engines often read a ✓: accepted only in a checkbox slot, directly left of a checkbox label. */
const WEAK_TICK_TEXTS = new Set(['i', 'l', '|', '/', '\\', 'k', 't']);
const MAX_TICK_WIDTH = 20;

function nearestCheckbox(word: Word, checkboxes: Label[]): Label | null {
  let best: { gap: number; label: Label } | null = null;
  for (const label of checkboxes) {
    const overlap = Math.min(word.y1, label.y1) - Math.max(word.y0, label.y0);
    const gap = label.x0 - word.x1;
    if (overlap > 0 && gap >= -4 && gap <= 22 && (!best || gap < best.gap)) best = { gap, label };
  }
  return best?.label ?? null;
}

function nearestTextLabel(word: Word, labels: Label[], tolerance: number): Label | null {
  // A third of the way down the box, near the x-height: tall annotation rects and OCR boxes that
  // hug the field rules both keep it near the glyphs.
  const yRef = word.y0 + 0.35 * word.h;
  let best: { distance: number; label: Label } | null = null;
  for (const label of labels) {
    if (yRef < label.y0 - 1 || yRef >= label.bottomBound) continue;
    if (word.x0 < label.x0 - tolerance || word.x0 >= label.rightBound) continue;
    const distance = yRef - label.y0 + 0.15 * Math.max(0, word.x0 - label.x1);
    if (!best || distance < best.distance) best = { distance, label };
  }
  return best?.label ?? null;
}

export function assignValues(words: Word[], labels: Label[], tolerance = 6): Map<string, Word[]> {
  const values = new Map<string, Word[]>(labels.map((label) => [label.key, []]));
  const checkboxes = labels.filter((label) => label.isCheckbox);
  const textLabels = labels.filter((label) => !label.isCheckbox);
  for (const word of words) {
    if (word.used) continue;
    const text = word.text.trim().toLowerCase();
    const isTick = TICK_TEXTS.has(text) || WEAK_TICK_TEXTS.has(text);
    if (isTick && word.w < MAX_TICK_WIDTH) {
      const checkbox = nearestCheckbox(word, checkboxes);
      if (checkbox) {
        values.get(checkbox.key)!.push(word);
        continue;
      }
      if (WEAK_TICK_TEXTS.has(text)) continue; // a stray stroke, not a value
    }
    const label = nearestTextLabel(word, textLabels, tolerance);
    if (label) values.get(label.key)!.push(word);
  }
  return values;
}

/** Words for one field, as tidy lines of text, top to bottom. */
export function joinLines(words: Word[]): string[] {
  return buildLines(words).flatMap((line) => {
    const text = line
      .map((w) => w.text)
      .join(' ')
      .replace(/\s+,/g, ',')
      .replace(/\s{2,}/g, ' ')
      .replace(/^[ ,:]+|[ ,:]+$/g, '');
    return text ? [text] : [];
  });
}
