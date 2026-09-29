import type { DocumentType, ExtractedFields } from '@ingest-form/shared';

export interface UploadedDocument {
  bytes: Uint8Array;
  /** MIME type detected from magic bytes (never the client's claim). */
  mimeType: 'application/pdf' | 'image/jpeg' | 'image/png';
  sizeBytes: number;
}

export interface ExtractionResult {
  /** Which layers produced the fields, e.g. "pdf-native" or "paddleocr". Shown in the developer panel. */
  extractor: string;
  fields: ExtractedFields;
}

/**
 * Reads an uploaded document and returns the ingest fields it contains.
 * The one implementation is extraction/layered-document-extractor.ts: the PDF's own text first,
 * then the optional PaddleOCR sidecar (FEAT-005). Implementations never log document contents.
 */
export interface DocumentExtractor {
  extractDocumentFields(document: UploadedDocument, documentType: DocumentType): Promise<ExtractionResult>;
}
