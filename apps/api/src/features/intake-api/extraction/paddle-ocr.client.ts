import { pageWordsSchema, type PageWords } from './page-words';

/** Layer 2: reads a page image (or a scanned PDF) with OCR. Throws when the service can't answer. */
export interface OcrClient {
  /** Short name shown as the extractor, e.g. "paddleocr". */
  readonly name: string;
  readWords(bytes: Uint8Array, mimeType: string): Promise<PageWords>;
}

export interface PaddleOcrClientOptions {
  /** e.g. http://127.0.0.1:8307, the local sidecar in services/ocr-sidecar. */
  baseUrl: string;
  timeoutMs: number;
  fetch?: typeof fetch;
}

export class OcrUnavailableError extends Error {
  constructor(reason: string) {
    super(`OCR sidecar unavailable: ${reason}`);
    this.name = 'OcrUnavailableError';
  }
}

/** HTTP client for the PaddleOCR sidecar. It returns words and boxes; the API maps them to fields. */
export function createPaddleOcrClient({ baseUrl, timeoutMs, fetch: fetchFn = fetch }: PaddleOcrClientOptions): OcrClient {
  const url = new URL('/ocr', baseUrl).toString();
  return {
    name: 'paddleocr',
    async readWords(bytes, mimeType) {
      let response: Response;
      try {
        response = await fetchFn(url, {
          method: 'POST',
          headers: { 'Content-Type': mimeType },
          body: bytes,
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (error) {
        throw new OcrUnavailableError(error instanceof Error ? error.name : 'network');
      }
      if (!response.ok) throw new OcrUnavailableError(`HTTP ${response.status}`);
      // Extra keys (engine, model, timing_ms) are dropped by the schema.
      const parsed = pageWordsSchema.safeParse(await response.json().catch(() => null));
      if (!parsed.success) throw new OcrUnavailableError('unexpected response');
      return parsed.data;
    },
  };
}
