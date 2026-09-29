import { z } from 'zod';

/** Where a word came from: the PDF's printed text layer, a typed annotation, a form field, or OCR. */
export type WordSource = 'text' | 'annotation' | 'acroform' | 'ocr';

/**
 * One page as words with boxes, the shape every reader produces (native PDF reader and the OCR
 * sidecar). Boxes are [x0, y0, x1, y1] with a top-left origin, in any unit: the mapper rescales.
 */
export const pageWordsSchema = z.object({
  page: z.object({ width: z.number().positive(), height: z.number().positive() }),
  words: z.array(
    z.object({
      text: z.string(),
      bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
      conf: z.number().optional(),
      source: z.enum(['text', 'annotation', 'acroform', 'ocr']).optional(),
    }),
  ),
});

export type PageWords = z.infer<typeof pageWordsSchema>;
export type PageWord = PageWords['words'][number];

/**
 * A blank form's printed words and labels, in the mapper's 431.35pt-wide page space. Built once
 * per form in the OCR lab (`template_profile.py`) from the blank PDF, so it holds no patient data.
 */
export interface TemplateProfile {
  page: { width: number; height: number };
  words: { text: string; bbox: [number, number, number, number] }[];
  labels: { key: string; text: string; bbox: [number, number, number, number] }[];
  fields: string[];
}
