---
id: FEAT-005
title: Document extraction (native PDF reading + PaddleOCR)
status: In Review
created: 2026-09-29
completed: null
---

# FEAT-005: Document extraction (native PDF reading + PaddleOCR)

**Status:** In Review (user testing uploads through the patient flow)
**Priority:** High
**Created:** 2026-09-29
**Dependencies:** FEAT-002 (intake flow, `POST /api/v1/intake/extract`)
**Spawned from:** `ai-context/research/OCR-AI-form-extraction.md` (benchmark 2026-09-29)
**Branch:** feature/feat-005-document-extraction-pocs

## Problem

`POST /api/v1/intake/extract` returned dummy fields from a stub, so patients retyped everything.
Uploads arrive as typed or annotated PDFs, printed scans or photos, and handwritten scans or photos.

## Solution

The first plan was three selectable POCs chosen by a benchmark. The benchmark (research doc) made
the choice clear, so the chosen approach is one two-layer chain instead:

1. **Layer 1, native PDF reading** (`unpdf`, inside the Worker): text layer, typed annotations and
   form fields. 7/7 fields on the annotated GMS1 in 0.3s.
2. **Layer 2, PaddleOCR** (local Python sidecar, `services/ocr-sidecar`, port 8307): photos,
   scans, and PDFs where layer 1 finds fewer than 3 fields. 7/7 on a clean scan, 6/7 on a photo.
3. **One field mapper** for both, ported from the lab's Python to TypeScript: *discover* mode
   (labels found on the page) for typed PDFs, *template* mode (blank-form profile) for OCR.
4. The stub is deleted. The OCR lab, extractor switch and "Extraction lab" admin tab from the
   first plan were dropped.

## Architecture

```
POST /api/v1/intake/extract → size/type checks (Admin → General)
  → createLayeredDocumentExtractor
      readPdfWords (unpdf) → mapFields(words)                 ≥ 3 fields → "pdf-native"
      OcrClient (PaddleOCR sidecar) → mapFields(words, profile) → merged, layer 1 wins
  → ExtractResultDto { documentType, extractor, fields }
```

- `extractor` names the layers that ran: `pdf-native`, `paddleocr`, `pdf-native+paddleocr`,
  `none`, plus ` (ocr unavailable)` when OCR was needed but not configured or not answering.
- OCR failure never fails the upload. The API logs `[intake] OCR layer skipped: <reason>` only.
- The sidecar serves one request at a time, binds 127.0.0.1, downscales images to 2400px on the
  long side, and logs no content.

### Reused code

| Code | Path |
|------|------|
| `DocumentExtractor` port | `apps/api/src/features/intake-api/document-extractor.types.ts` |
| Upload checks and Admin → General limits | `document-extract.service.ts`, `packages/shared/src/intake/intake-settings.schema.ts` |
| Pre-fill and developer sheet | `apps/web/src/features/patient-intake/` (unchanged apart from a "Reading your document" status line) |

## Environment Variables

```bash
# OCR_SIDECAR_URL=http://127.0.0.1:8307   # optional; without it images return no fields
# OCR_SIDECAR_TIMEOUT_MS=120000
```

## Key Changes

### New files

| File | Purpose |
|------|---------|
| `apps/api/src/features/intake-api/extraction/` | Readers (`pdf-words.reader.ts`, `paddle-ocr.client.ts`), mapper (`field-mapper.ts`, `layout.ts`, `discover-labels.ts`, `template-labels.ts`, `assign-values.ts`, `normalisers.ts`), `layered-document-extractor.ts`, `profiles/*.profile.json` |
| `apps/api/src/features/intake-api/test/fixtures/` | Synthetic annotated GMS1 PDF, recorded PaddleOCR words for its scan |
| `services/ocr-sidecar/server.py`, `requirements.txt` | PaddleOCR HTTP sidecar; `pnpm ocr:setup` / `pnpm ocr:start` |

### Deleted files

| File | Reason |
|------|--------|
| `apps/api/src/features/intake-api/stub-document-extractor.ts` | Replaced by the layered extractor |

## Verification

1. `pnpm turbo run typecheck test build`: 31 tests, Worker bundle 2,160KiB gzip.
2. The synthetic annotated PDF fills all 7 fields through the real endpoint (test 15); recorded
   OCR words fill 6 of 7, missing only the address line typed over a printed label (test 16).
3. `scripts/e2e-ingest.mjs` checks `pdf-native` on the synthetic PDF against a running API.
4. Real GMS1 through the running endpoint with the sidecar: PDF 7/7 (`pdf-native`, 0.2s), scan
   7/7, photo 5/7, handwriting stand-in 6/7 (`paddleocr`, 33-39s).
5. Upload real documents through `/patient-upload` with the sidecar running, and check
   the details step and the developer sheet's `extractor`.

## Changelog

| Date | Change |
|------|--------|
| 2026-09-29 | Created spec with three POCs; research agent launched |
| 2026-09-29 | Research run crashed the laptop (two models at once); results kept, lab trimmed |
| 2026-09-29 | Scope changed to native PDF + PaddleOCR; implemented, stub removed |
