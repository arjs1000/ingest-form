# OCR / AI form extraction research

**Status:** decided 2026-09-29: native PDF reading, then PaddleOCR as a second layer (FEAT-005)  
**Reviewed:** 2026-09-29  
**Scope:** private evaluation of medical intake PDFs and images for `ingest-form`.

## Non-negotiable data rule

Use **synthetic forms only** in public demos. A public Hugging Face Space, browser demo, or hosted
"free OCR" site is a third party: it is not an approved place for patient data, even if the page
looks disposable. Do not upload real, pseudonymised, or partially redacted PHI there.

For a real form, run one of the local routes below on a workstation, home-lab machine, or a
private worker in the chosen cloud account. Verify both the code and model-weight licences before
commercial deployment; a project's code licence and a model-weight licence are not necessarily
the same.

## What to evaluate

Create a synthetic test pack for each form type:

1. `template.pdf` — the blank form, at its real print/scanner resolution.
2. `filled.pdf` — the same form with representative block capitals, joined-up handwriting, ticks,
   crosses, empty boxes, dates, names, UK postcodes, and a deliberately poor scan.
3. `expected.json` — the known answer for each field, including blank fields and checkboxes.

Run both supported input modes:

- **Filled form only:** evaluates an OCR/document model's layout and field localisation without
  any template help.
- **Template plus filled form:** align the completed page to the blank template, mask static
  labels/rules, and inspect only changed regions. This is usually the more accurate and auditable
  route for the project's known intake forms.

No tool below automatically understands that two arbitrary PDFs are "before" and "after" versions
of one form. That comparison belongs in the application: page alignment and pixel/ink difference
find the candidate regions; OCR/HTR reads their contents; deterministic rules map them to our
fields.

### Score the right things

Record field exact-match rate, character error rate for free text, checkbox precision/recall,
false values on blank fields, confidence calibration, pages/minute, peak RAM/VRAM, and whether a
reviewer can see the source crop and bounding box. Do not use overall page text similarity as the
selection metric: it can score highly while assigning a name or a tick to the wrong field.

## Fast, visual experiments

These links were live or reachable on 2026-09-29. Their availability can change. They are for
synthetic files only.

| Tool | Try it now | Input and visible result | Best use in evaluation | Caveat |
| --- | --- | --- | --- | --- |
| **Docling.rs** | [Browser-local demo](https://docling-project.github.io/docling.rs/) | DOCX and text-layer PDFs; returns Markdown, Docling JSON, or DocLang in the browser | Inspect native template/fillable-PDF extraction without sending the file to a server | It explicitly does **not** OCR scanned/image-only PDFs. |
| **PaddleOCR-VL** | [PaddlePaddle public demo](https://huggingface.co/spaces/PaddlePaddle/PaddleOCR-VL_Online_Demo) | Upload document/image; inspect document parsing output | Fast comparison point for difficult scanned layouts, tables, and text | Public Hugging Face Space; do not use PHI. PaddleOCR-VL is a 0.9B document VLM, so it is materially heavier than PP-OCRv6. |
| **Marker** | [Community public PDF demo](https://huggingface.co/spaces/xiaoyao9184/marker) | PDF upload; Markdown, JSON, or HTML plus PDF preview | Visualise reading order/table conversion from a whole PDF | Community Space, not a privacy boundary. Its optional LLM mode must remain off for this project. |
| **Surya** | [Community PDF/image demo](https://huggingface.co/spaces/mizoru/surya) | PDF/image; OCR lines, polygons, confidence, layout and reading-order outputs | Best public visual check of text boxes and coordinates | Community-maintained demo, not an official service; may sleep or change. |
| **Tesseract.js** | [In-browser image demo](https://tesseract.projectnaptha.com/) | Drop a rendered PDF page (PNG/JPG); shows text and word/character boxes | Quick baseline for a crop or one form page | Image-only: render a PDF page first. Download/run it locally rather than relying on a hosted page for sensitive work. |
| **TrOCR** | [Official handwritten checkpoint](https://huggingface.co/microsoft/trocr-base-handwritten) | No dependable first-party PDF demo; local inference takes a cropped handwritten line and returns text | Handwriting comparison after fields/lines are located | Its linked public `TrOCR-handwritten` Space had a runtime error on this review date. It is not a full-page/form parser. |

The [Docling.rs documentation](https://docling-project.github.io/docling.rs/) says conversion is
client-side with no server upload, but it only handles PDFs that already contain text. The official
PaddleOCR Space was running when checked. The official docTR Space was paused and the TrOCR
community Space was failing, so neither is a dependable web trial at present.

## Free, open-source local candidates

All of these can be loaded locally. "Visual output" means the result can be viewed as annotated
pages, HTML, a searchable PDF, or JSON with source geometry—not that the tool understands the
project's eventual patient schema by itself.

| Tool | What it returns | Template + filled handling | Local visual path | Fit / caution | Latest verified update |
| --- | --- | --- | --- | --- | --- |
| [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) | OCR text, geometry/confidence; layout/table pipelines; document parsing exports | Align/mask template in our layer, then OCR changed field crops or the whole page | Run PP-OCR/PP-Structure locally; compare its text/boxes to the rendered page | **Top full-page baseline.** Start with PP-OCRv6, not the larger VLM, for a narrow known-form task | v3.7.0, 2026-06-11 |
| [TrOCR](https://github.com/microsoft/unilm/tree/master/trocr) | Text from an image/line crop | Use only after template alignment or a text-line detector finds handwriting | Local Python/Transformers inference; save crop + returned text side by side | **Handwriting specialist**, not form layout or checkbox detection; expect local fine-tuning/review for patient handwriting | checkpoint card updated 2025-02-11 |
| [Docling](https://github.com/docling-project/docling) | Lossless Docling JSON, HTML, Markdown, layout visualisation | Run both PDFs; use its JSON/boxes as evidence, with application-side template differencing | Run `docling convert <file> --to json --to html --show-layout` for each file | Strong multi-format first pass for PDF/DOCX; use its standard/explicit OCR pipeline, not unrelated general VLMs | 2.126.0, 2026-09-04 |
| [Surya](https://github.com/datalab-to/surya) | `results.json` with lines, text, confidence, polygons/bounding boxes; optional page/line images | Excellent evidence for a template-difference pipeline | `surya_gui` gives an interactive local PDF/image UI; CLI can save annotated images | Strong layout/reading order and geometry; confirm its code and model-weight terms before product use | 2026-07-20 release |
| [docTR](https://github.com/mindee/doctr) | OCR object/JSON with words, blocks, geometry, confidence; layout/table exports | Application-side alignment/difference then `ocr_predictor` per crop/page | Its local API can save visualisation/JSON | Good second OCR benchmark; its public Space is currently paused | v1.1.0, 2026-08-21 |
| [OCRmyPDF](https://github.com/ocrmypdf/OCRmyPDF) | Searchable PDF/PDF-A plus optional text sidecar | Preprocess the filled form; template difference is external | Open the output PDF visually, compare text layer/sidecar | Best preprocessing and archival baseline; not field/checkbox JSON extraction | 16.13.0, 2026-09-16 |
| [Tesseract](https://github.com/tesseract-ocr/tesseract) | TXT, TSV, hOCR/PAGE XML, searchable PDF; TSV/hOCR carry boxes and confidence | Template difference and checkbox detection are external | hOCR/TSV overlay viewer or searchable PDF | CPU-friendly printed-text baseline; weak for unrestricted handwriting | 5.5.3, 2026-07-24 |
| [PyMuPDF](https://github.com/pymupdf/PyMuPDF) | Native text words, coordinates, PDF widgets, raster page images | Read AcroForm values directly; render/alignment/difference for scans | Build a small local evidence page from its word boxes/page image | **Not OCR.** Essential routing/rendering layer; AGPL unless a commercial licence is used | 1.28.2, 2026-08-06 |
| [Apache Tika](https://tika.apache.org/) | Text and metadata from PDFs, DOCX, Office and many other types; can invoke Tesseract locally | Direct extraction from digital template/fillable file; OCR is a fallback | Tika Server's JSON endpoint or local response viewer | Best broad file-type gateway, rather than a handwriting/form engine | 4.1.0, 2026-09-21 |
| [Unstructured](https://github.com/Unstructured-IO/unstructured) | Structured elements (title, paragraph, table etc.) and metadata | Feed template/filled outputs to a local differ; OCR engine is configurable | JSON elements can be rendered as a review list | Useful multi-format partitioner, not the OCR accuracy winner | 0.27.8, 2026-09-22 |
| [Kraken](https://github.com/mittagessen/kraken) | OCR/HTR text and PAGE XML workflows | Train or run on already-segmented handwriting regions | Local CLI/PAGE XML viewer | Good route if labelled in-house handwriting data justifies training; more specialised than first-pilot choices | 7.0, 2026-08-05 |
| [Marker](https://github.com/datalab-to/marker) | Markdown/JSON/HTML, tables, images and page-level parsing | Whole-form conversion; align/diff and field map are external | Local command produces inspectable HTML/JSON | Strong document conversion comparison, but not a medical-form JSON solution alone | check current release/model terms before adoption |

### Supporting deterministic tools

- **OpenCV**: align a filled page to its blank template, detect checkbox boxes/contours, and
  measure ink-fill ratio. Use it for checkboxes rather than asking an OCR model to infer a tick.
- **pypdf/PyMuPDF**: inspect PDF AcroForm widgets and extract existing digital values before
  rasterising anything.
- **OCRmyPDF + Tesseract**: rotate/deskew first, then retain hOCR/TSV geometry and confidence as
  review evidence. Tesseract documents its TSV/hOCR boxes and confidence output
  [here](https://github.com/tesseract-ocr/tesseract/blob/main/doc/tesseract.1.asc).

## Recommended evaluation sequence

1. **Native/document check:** use Docling.rs (for text-layer PDFs/DOCX) and PyMuPDF locally. If
   the file has AcroForm data or a genuine text layer, no OCR should run.
2. **Whole-page OCR benchmark:** run the synthetic filled scan through local PaddleOCR, Surya, and
   docTR. Save raw output, annotated page, elapsed time and model version.
3. **Fixed-template benchmark:** align each filled page to the blank template; use OpenCV to crop
   each known field. Run the same engines only on those crops. Detect checkboxes geometrically.
4. **Handwriting benchmark:** run those handwritten field crops through TrOCR and, separately,
   PaddleOCR. Measure each field against `expected.json`; never silently accept low confidence.
5. **Integration decision:** select the smallest stack that clears target field/check-box accuracy
   and gives sufficient evidence for staff review. Only then test it on a private environment with
   authorised data.

The highest-value first comparison is therefore:

```
PyMuPDF/native values → OpenCV template alignment + checkbox detector
                       → PaddleOCR (printed fields/layout)
                       → TrOCR (only handwritten crops)
                       → fixed Zod schema + human review queue
```

Compare that against a simpler `Docling → JSON/HTML → field mapper` route. This keeps all models
document/handwriting-specific and avoids a general-purpose LLM.

## Benchmark results (2026-09-29)

Run in `~/Developer/ocr-lab` (a separate local repo, not committed here) on a **MacBook Air M2,
24GB unified memory**, CPU or Apple GPU as each tool chose. One form, the GMS1, page 1.

**Inputs.** A GMS1 filled with real details as 24 macOS
Preview text annotations (kept in the lab's gitignored `private/` folder, never uploaded), and
three renders of it: a clean 200 dpi scan, a degraded phone photo (rotated 2°, noise, JPEG q60)
and a **handwriting-font stand-in**. The same variants were built from a synthetic copy with fake
details ("Alex Example"), which is now a test fixture here.

**Scoring.** Seven fields were filled on the form: name, gender, date of birth, phone, address
lines 1-2, postcode. A field scores when the normalised value equals the expected one. One shared
mapper turns every tool's words and boxes into fields, in two modes: *discover* (labels found on
the page) and *template* (labels from the blank form's profile, printed words subtracted).

### Real form, fields matched out of 7 (best mode)

| Method | The PDF itself | Clean scan | Phone photo | Handwriting stand-in | Time per page | Peak memory |
|---|---|---|---|---|---|---|
| **Native PDF** (unpdf: text layer + annotations) | **7/7** | n/a | n/a | n/a | 0.3s | 89MB |
| **PaddleOCR** PP-OCRv6, template mode | n/a | **7/7** | 6/7 | 6/7 | 37s warm, 60-110s cold | 3.9-4.2GB |
| Apple Vision (macOS only) | n/a | 5/7 | 4/7 | 5/7 | 3-7s | 300MB |
| Docling, template mode | failed on PDF | 4/7 | 5/7 | 5/7 | 20-100s | 1.6GB |
| Tesseract 5 | n/a | 4/7 | 4/7 | 3/7 | 3-12s | 220MB |
| OCRmyPDF (Tesseract) | n/a | 4/7 | 4/7 | 3/7 | 7-13s | 150MB |
| Qwen3-VL 8B (Ollama) | 0/7 | 0/7 | not run | not run | about 2 min | GPU |
| Surya, docTR, Marker, TrOCR | failed to run | | | | | |

- **Qwen3-VL's 0/7 is not a verdict.** Its "thinking" output most likely used up the 400-token
  answer limit before any JSON came out. It was not retested (see the crash below).
- **Surya, docTR, Marker and TrOCR** exited with errors on every variant and produced no score.
  Nothing here says they are worse; they are untested.
- **The handwriting column is a font, not handwriting.** Real handwriting is untested.

### The crash, and the rule that came from it

The run ended in a forced restart of the laptop. The log shows Ollama loading Qwen3-VL 8B with
4.3GB free and no swap while Surya was running on the Apple GPU at the same time. **Never run two
models at once on a 24GB laptop, and don't run large vision-language models on it at all.** The
chosen PaddleOCR sidecar runs alone and serves one request at a time.

### Decision

1. **Layer 1, native PDF reading** (in the Worker, free, instant). A PDF filled in on a computer
   carries its answers as text: annotations, form fields or a text layer. Read them directly.
2. **Layer 2, PaddleOCR** (local sidecar, `services/ocr-sidecar`). For photos, scans, and PDFs
   where layer 1 finds fewer than 3 fields. The best OCR result in the benchmark, on a CPU.
3. **One mapper for both layers**, ported from the lab to TypeScript
   (`apps/api/src/features/intake-api/extraction/`), so a fix improves both.

Setup, machine requirements and limits: README, "Setting up AI OCR".

**Through the built endpoint** (FEAT-005, same machine, sidecar warm): the PDF itself 7/7 via
`pdf-native` in 0.2s; clean scan 7/7, phone photo 5/7 (gender and postcode missed; the lab
scored 6/7, cause not yet investigated), handwriting stand-in 6/7 (gender missed), each via
`paddleocr` in 33-39s.

### Known limits

- **Speed:** about 37 seconds per page on the M2's CPU, even with the model already loaded.
- **Tested on one form only (GMS1).** The other four forms have template profiles but no scored
  run.
- **Values written over a printed label** (for example an address typed on top of "Home
  address") lose the overlapping words in template mode.
- **Page 1 only.**
- **No per-field confidence** is shown to the patient yet.
- **Mapper improvement:** the TypeScript port adds one rule the lab lacked. OCR tokens that merge
  a label and its value ("PostcoSW1A") keep the value; this recovered the synthetic scan's postcode.

## How this fits ingest-form

Implemented in FEAT-005 behind the existing port,
`DocumentExtractor.extractDocumentFields(document, documentType)`:

```
upload → size/type checks (Admin → General)
       → layer 1: readPdfWords (unpdf, in the Worker) → mapFields (discover mode)
            3 or more fields? done: extractor "pdf-native"
       → layer 2: PaddleOCR sidecar POST /ocr (words + boxes) → mapFields (template mode for the
            chosen form) → merged, layer 1 wins: extractor "paddleocr" or "pdf-native+paddleocr"
       → the patient checks and corrects every pre-filled field on the details step
```

OCR failure never fails the upload: the extractor reads "… (ocr unavailable)" and the patient
types their details. For a deployed service, the sidecar must run on a private host the Worker can
reach. It never runs inside the Worker, and files are never stored.

## Sources

- [PaddleOCR releases](https://github.com/PaddlePaddle/PaddleOCR/releases)
- [Docling CLI and local output options](https://docling-project.github.io/docling/reference/cli/)
- [Docling local REST API response format](https://docling-project.github.io/docling/usage/api_server/rest_api/)
- [Surya local CLI/GUI and JSON output](https://github.com/datalab-to/surya)
- [TrOCR handwritten model](https://huggingface.co/microsoft/trocr-base-handwritten)
- [OCRmyPDF preprocessing](https://ocrmypdf.readthedocs.io/en/stable/advanced.html)
- [Tesseract output formats](https://github.com/tesseract-ocr/tesseract/blob/main/doc/tesseract.1.asc)
- [OWASP file upload guidance](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
