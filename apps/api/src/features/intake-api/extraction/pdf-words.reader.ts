import { getDocumentProxy } from 'unpdf';

import type { PageWord, PageWords, WordSource } from './page-words';

/**
 * Layer 1: reads page 1 of a PDF without OCR. Printed text layer, typed annotations (macOS
 * Preview, Acrobat "Add text") and fillable form values, as words with boxes in PDF points.
 * unpdf is pdf.js's serverless build, so this runs inside the Cloudflare Worker as well as Node.
 *
 * Returns null when the bytes can't be parsed as a PDF; the caller then falls back to OCR.
 */
export type PdfWordsReader = (bytes: Uint8Array) => Promise<PageWords | null>;

type Viewport = { width: number; height: number; convertToViewportPoint: (x: number, y: number) => number[] };

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Splits a positioned string into words with proportional x extents. */
function pushWords(out: PageWord[], text: string, box: [number, number, number, number], source: WordSource): void {
  const [x0, y0, x1, y1] = box;
  const total = text.length || 1;
  for (const match of text.matchAll(/\S+/g)) {
    const start = match.index;
    const a = x0 + ((x1 - x0) * start) / total;
    const b = x0 + ((x1 - x0) * (start + match[0].length)) / total;
    out.push({ text: match[0], bbox: [round(a), round(y0), round(b), round(y1)], conf: 1, source });
  }
}

/** A PDF rect (user space, bottom-left origin) as a top-left viewport box. */
function viewportBox(viewport: Viewport, rect: number[]): [number, number, number, number] {
  const [ax, ay] = viewport.convertToViewportPoint(rect[0]!, rect[1]!);
  const [bx, by] = viewport.convertToViewportPoint(rect[2]!, rect[3]!);
  return [Math.min(ax!, bx!), Math.min(ay!, by!), Math.max(ax!, bx!), Math.max(ay!, by!)];
}

interface AnnotationLike {
  subtype?: string;
  rect?: number[];
  contents?: string;
  contentsObj?: { str?: string };
  fieldValue?: unknown;
}

function annotationWords(out: PageWord[], viewport: Viewport, annotation: AnnotationLike): void {
  if (!annotation.rect) return;
  const [x0, top, x1, bottom] = viewportBox(viewport, annotation.rect);
  if (annotation.subtype === 'FreeText' || annotation.subtype === 'Text') {
    const text = (annotation.contentsObj?.str ?? annotation.contents ?? '').trim();
    // Multi-line contents: spread the lines down the rect.
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    const lineHeight = (bottom - top) / (lines.length || 1);
    lines.forEach((line, i) => pushWords(out, line, [x0, top + i * lineHeight, x1, top + (i + 1) * lineHeight], 'annotation'));
  } else if (annotation.subtype === 'Widget' && typeof annotation.fieldValue === 'string' && annotation.fieldValue) {
    pushWords(out, annotation.fieldValue, [x0, top, x1, bottom], 'acroform');
  }
}

export const readPdfWords: PdfWordsReader = async (bytes) => {
  let pdf;
  try {
    // pdf.js takes ownership of the buffer it is given; copy so the caller's bytes stay usable.
    pdf = await getDocumentProxy(bytes.slice());
  } catch {
    return null;
  }
  try {
    return await readFirstPage(pdf);
  } catch {
    return null; // a damaged or unusual PDF: let OCR try instead
  } finally {
    await pdf.loadingTask.destroy(); // frees pdf.js's worker-side state for this document
  }
};

async function readFirstPage(pdf: Awaited<ReturnType<typeof getDocumentProxy>>): Promise<PageWords> {
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1 }) as Viewport;
  const words: PageWord[] = [];

  const content = await page.getTextContent();
  for (const item of content.items) {
    if (!('str' in item) || !item.str.trim()) continue;
    const [, , c, d, e, f] = item.transform as number[];
    const fontHeight = Math.hypot(c!, d!) || item.height;
    // Forms whose MediaBox doesn't start at 0,0 (GMS1) need the viewport mapping.
    const [x0, yBottom] = viewport.convertToViewportPoint(e!, f!);
    const [x1, yTop] = viewport.convertToViewportPoint(e! + item.width, f! + fontHeight);
    pushWords(words, item.str, [x0!, yTop!, x1!, yBottom!], 'text');
  }

  for (const annotation of (await page.getAnnotations()) as AnnotationLike[]) {
    annotationWords(words, viewport, annotation);
  }
  return { page: { width: viewport.width, height: viewport.height }, words };
}
