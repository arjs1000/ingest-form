import type { DocumentType, ExtractedFields } from '@ingest-form/shared';

import type { DocumentExtractor, ExtractionResult, UploadedDocument } from '../document-extractor.types';
import { countFilledFields, mapFields } from './field-mapper';
import { OcrUnavailableError, type OcrClient } from './paddle-ocr.client';
import type { PageWords } from './page-words';
import type { PdfWordsReader } from './pdf-words.reader';
import { templateProfileFor } from './profiles';

/** Below this many fields from the PDF's own text, the page is probably a scan: try OCR too. */
export const MIN_NATIVE_FIELDS = 3;

export interface LayeredDocumentExtractorDeps {
  readPdfWords: PdfWordsReader;
  /** null when OCR_SIDECAR_URL is not set: images and scanned PDFs then return no fields. */
  ocr: OcrClient | null;
}

function hasTypedAnswers(doc: PageWords): boolean {
  return doc.words.some((word) => word.source === 'annotation' || word.source === 'acroform');
}

/** Earlier layers win; later ones only fill gaps. */
function merge(first: ExtractedFields, second: ExtractedFields): ExtractedFields {
  const address = { ...second.address, ...first.address };
  return { ...second, ...first, ...(Object.keys(address).length ? { address } : {}) };
}

/**
 * Two layers (FEAT-005):
 * 1. PDFs: read the PDF's own text, typed annotations and form fields. Free, instant, in the Worker.
 * 2. Images, and PDFs where layer 1 found fewer than MIN_NATIVE_FIELDS: OCR through the local
 *    PaddleOCR sidecar, then the same mapper with the form's blank template.
 *
 * `extractor` in the result names the layers that ran, for the developer panel:
 * "pdf-native", "paddleocr", "pdf-native+paddleocr", or "none", plus " (ocr unavailable)" when
 * layer 2 was wanted but not configured or not answering. OCR failure never fails the upload: the
 * patient types their details instead.
 */
export function createLayeredDocumentExtractor(deps: LayeredDocumentExtractorDeps): DocumentExtractor {
  async function readNative(document: UploadedDocument, documentType: DocumentType): Promise<ExtractedFields | null> {
    if (document.mimeType !== 'application/pdf') return null;
    const words = await deps.readPdfWords(document.bytes);
    if (!words) return null;
    // Typed answers over a printed form: labels come from the page itself (7/7 in the lab).
    // Only printed text: compare against the blank form so printed words aren't read as answers.
    return hasTypedAnswers(words) ? mapFields(words) : mapFields(words, templateProfileFor(documentType));
  }

  async function readOcr(ocr: OcrClient, document: UploadedDocument, documentType: DocumentType): Promise<ExtractedFields> {
    const words = await ocr.readWords(document.bytes, document.mimeType);
    return mapFields(words, templateProfileFor(documentType));
  }

  return {
    async extractDocumentFields(document, documentType) {
      const native = await readNative(document, documentType);
      const layers: string[] = native ? ['pdf-native'] : [];
      let fields = native ?? {};
      if (native && countFilledFields(native) >= MIN_NATIVE_FIELDS) return { extractor: 'pdf-native', fields };

      let suffix = '';
      if (!deps.ocr) {
        suffix = ' (ocr unavailable)';
      } else {
        try {
          fields = merge(fields, await readOcr(deps.ocr, document, documentType));
          layers.push(deps.ocr.name);
        } catch (error) {
          // Our own unavailable message, or just the error type: other messages can echo content.
          const reason = error instanceof OcrUnavailableError ? error.message : error instanceof Error ? error.name : 'unknown';
          console.warn(`[intake] OCR layer skipped: ${reason}`);
          suffix = ' (ocr unavailable)';
        }
      }
      return { extractor: `${layers.join('+') || 'none'}${suffix}`, fields } satisfies ExtractionResult;
    },
  };
}
