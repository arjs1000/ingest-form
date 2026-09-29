/*
 * Discover mode: find the labels on the filled page itself by fuzzy-matching label synonyms.
 * Works on any form with printed labels. Used for PDFs whose answers are typed annotations or form
 * fields (7/7 fields in the lab), and for forms with no template profile.
 */
import {
  bboxOf,
  buildLines,
  FIELD_SYNONYMS,
  fuzzRatio,
  isUpperCase,
  joinText,
  Label,
  normText,
  segments,
  setBounds,
  synonymKey,
  Word,
} from './layout';

const LETTER_OR_DIGIT = /[A-Za-z0-9]/;
const DIGIT_OR_AT = /[\d@]/;

function labelFrom(key: string, words: Word[]): Label {
  return new Label(key, joinText(words), ...bboxOf(words));
}

function otherKey(words: Word[]): string {
  return `other:${joinText(words).slice(0, 40)}`;
}

/** 'SurnaEXample' → label 'Surna' + value 'EXample', when a token starts with a long label. */
function splitMergedLabel(word: Word): { label: Label; rest: Word | null } | null {
  const normalised = normText(word.text);
  if (normalised.length < 8) return null;
  for (const [key, synonyms] of Object.entries(FIELD_SYNONYMS)) {
    for (const synonym of synonyms) {
      if (synonym.length < 6 || normalised.length <= synonym.length + 1) continue;
      for (const cut of [synonym.length, synonym.length - 1, synonym.length - 2]) {
        if (fuzzRatio(normalised.slice(0, cut), synonym) < 84) continue;
        const splitX = word.x0 + word.w * (cut / normalised.length);
        const label = new Label(key, word.text.slice(0, cut), word.x0, word.y0, splitX, word.y1);
        const restText = word.text.slice(cut).replace(/^[ :.-]+/, '');
        const rest =
          restText.length >= 2 ? new Word(restText, splitX, word.y0, word.x1, word.y1, word.conf, word.source) : null;
        return { label, rest };
      }
    }
  }
  return null;
}

/**
 * A longish run of words with no digits or symbols is far more likely printed instruction text
 * than a filled-in value. All-capitals values (forms ask for BLOCK CAPITALS) get the benefit of the
 * doubt up to four words.
 */
function looksPrinted(segment: Word[]): boolean {
  const text = joinText(segment);
  if (DIGIT_OR_AT.test(text)) return false;
  if (segment.length >= 4) return true;
  return segment.length >= 3 && !isUpperCase(text);
}

/** Tries windows of up to 5 leading words of a segment as a label. True when one matched. */
function matchLabelWindow(segment: Word[], labels: Label[]): boolean {
  for (let size = Math.min(segment.length, 5); size > 0; size--) {
    let window = segment.slice(0, size);
    if (window.some((w) => w.used)) continue;
    let key = synonymKey(joinText(window));
    if (!key) continue;
    const rest = segment.slice(size);
    // "Name of previous doctor while at that address": a label word leading a printed phrase is a
    // sink, not a field with a value.
    if (rest.length >= 3 && !DIGIT_OR_AT.test(joinText(rest))) {
      key = otherKey(segment);
      window = segment;
    }
    for (const w of window) w.used = true;
    labels.push(labelFrom(key, window));
    return true;
  }
  return false;
}

export function discoverLabels(words: Word[]): { labels: Label[]; extraValues: Word[] } {
  const labels: Label[] = [];
  const extraValues: Word[] = [];
  // A PDF whose values arrive as annotations or form fields: its text layer is the printed form.
  const hasAnswers = words.some((w) => w.source === 'annotation' || w.source === 'acroform');

  for (const line of buildLines(words)) {
    for (const segment of segments(line)) {
      if (!LETTER_OR_DIGIT.test(joinText(segment))) {
        // Dotted leaders and rules that reach the text layer: neither label nor value.
        for (const w of segment) w.used = true;
        continue;
      }
      if (matchLabelWindow(segment, labels)) continue;

      const first = segment[0]!;
      if (!first.used) {
        const merged = splitMergedLabel(first);
        if (merged) {
          first.used = true;
          labels.push(merged.label);
          if (merged.rest) extraValues.push(merged.rest);
          continue;
        }
      }
      const printed = (hasAnswers && segment.every((w) => w.source === 'text')) || looksPrinted(segment);
      if (printed && !segment.some((w) => w.used)) {
        for (const w of segment) w.used = true;
        labels.push(labelFrom(otherKey(segment), segment));
      }
    }
  }

  // The topmost instance of each target key owns the field; later duplicates become sinks.
  const seen = new Set<string>();
  for (const label of [...labels].sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0)) {
    if (seen.has(label.key) && label.isTarget && !label.isCheckbox) label.key = `other:${label.text}`;
    seen.add(label.key);
  }
  setBounds(labels);
  return { labels, extraValues };
}
