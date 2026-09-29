---
id: FEAT-002
title: Patient intake flow (UI ingest)
status: Complete
created: 2026-09-27
completed: 2026-09-27
---

# FEAT-002: Patient intake flow (UI ingest)

**Status:** Complete
**Priority:** High
**Created:** 2026-09-27
**Dependencies:** FEAT-001 (ingest pipeline, admin tabs)
**Related:** FEAT-003 (notification emails, spec only)
**Branch:** feature/feat-002-patient-intake-flow

## Problem

Patients need the UI equivalent of the third-party ingest. They pick which form they are uploading and upload it. The details found in the document pre-fill a form, they check and correct it, and the result goes through the same pipeline as supplier data. Today the patient upload page is a "coming soon" placeholder.

## Solution

A three-step patient flow on the patient (NHS) surface, and two public API endpoints:

1. **Document**: "Which document are you uploading?" (five known forms plus Other) and a single-file FilePond upload. The API validates the file and returns the fields found. OCR is **stubbed**: dummy data per form, mirroring the fields each real form has.
2. **Details**: a pre-filled, editable form:
   - first and last name, email, gender
   - date of birth, with a calendar picker; sent as `YYYY-MM-DD`
   - mobile and phone, with country code; E.164
   - address and postcode, with the same postcode rule as the API
   - a **"View developer data"** side sheet showing the exact ingest JSON that will be sent.
3. **Submitting → Complete**: a visual pipeline while `POST /api/v1/intake` runs, then a thank-you screen with the reference. Only critical errors (network, 413/429/5xx, bad format) show "Sorry, there's been an error. Please try again." Everything else (geocode failures, duplicates) is handled silently in the admin tabs.

### Decisions

| Topic | Decision |
|-------|----------|
| OCR | Runs in the API behind `DocumentExtractor.extractDocumentFields()`; the stub implementation returns per-form dummy fields. The file is validated (magic bytes, 10MB) and discarded (storage is a later feature). |
| UI submissions | Public `POST /api/v1/intake`, no key (a browser can't keep one secret), 10 requests/min per IP, 64KB. Source `ui`. Bot protection (Cloudflare Turnstile) is a follow-up. |
| Application reference | None of the five forms has one, so the server generates `UIF-<6 digits>-<year>` when it is missing. |
| Name | The form asks for first and last name separately and joins them into `name`, so the transform step's "last word = last name" split always works. |
| Date of birth | Typed DD/MM/YYYY plus a calendar button (react-day-picker in a popover, month/year dropdowns). This replaces the earlier "three inputs, no picker" rule. |
| Phone | `react-phone-number-input` (built on libphonenumber-js, the same library the API normalises with), GB default, E.164 output. |
| State | First Zustand store: the intake draft, memory only (patient data), atomic selectors. A refresh restarts the flow. |
| Developer panel | `ISheet` from the right, labelled "Developer tool". An explicit exception to "no modals in the patient flow". Visible in the POC; gate with `VITE_SHOW_DEVELOPER_TOOLS` before production. |

### Stub fields per document (from `~/Documents/HealthTech1-Research/Forms`)

| `documentType` | Title | Pre-filled fields |
|---|---|---|
| `gms1` | Family doctor services registration GMS1 | name, date_of_birth, gender (male/female), address lines, postcode, phone_number |
| `new-patient-adult` | New Patient Registration (September 2018) | name, date_of_birth, email, phone_number, mobile_number |
| `new-patient-child` | Child New Patient Registration (under 16) | name |
| `carers-identification` | Carer's Identification Form | name, address lines, postcode, date_of_birth, phone_number, mobile_number, email |
| `travel-risk-assessment` | Travel Risk Assessment Form (2022) | name, email, gender (Non-binary → `other`), date_of_birth, phone_number, mobile_number |
| `other` | Other document | none |

## Architecture

```
/patient-upload ─► /document ──(FilePond)──► POST /api/v1/intake/extract ─► DocumentExtractor (stub)
                        │                          multipart file + documentType
                        ▼                          → { documentType, extractor, fields: Partial<IngestPayload> }
                  /details  (RHF + zod, pre-filled from fields; "View developer data" → ISheet: ingest JSON)
                        ▼
                  /submitting ─► POST /api/v1/intake (ingest JSON) ─► store rawBody (source ui) ─► PipelineRunner.run
                        │                                              → 202 { submissionId, status, failedStep, issues, applicationReference }
                        ├─ critical (network/4xx/5xx or failedStep=validate) → error panel + "Try again" (back to /details)
                        ▼
                  /complete  (IConfirmationPanel with the reference)
```

- **API:** `apps/api/src/features/intake-api/` (routes → service). `DocumentExtractor` interface plus `stub-document-extractor.ts`; magic-byte sniffing in `core/security/file-type.ts`. It reuses `SubmissionRepository`, `PipelineRunner`, `rateLimit`, `clientIp`, `bodyLimit` and the envelope helpers from FEAT-001.
- **Web:** `apps/web/src/features/patient-intake/`:
  - `components/` for the screens
  - `api/` (extract and intake mutations)
  - `schemas/patient-details.schema.ts`
  - `store/intake-draft.store.ts`
  - `utils/to-ingest-payload.ts`, `constants.ts`
- **Routes:** `routes/_patient/patient-upload/{document,details,submitting,complete}.tsx`
- **Shared:** `packages/shared/src/intake/`: `DOCUMENT_TYPES` and titles, `extractResultDtoSchema`, `intakeResultDtoSchema`, and `formatUkPostcode` (moved from the API so web and API apply one rule).
- **New `I*` components:** `IFileUpload` (FilePond), `IPhoneInput`, `IDateInput`, `ISheet`, `ICodeBlock`, `IConfirmationPanel`, each with a component library demo.

### Reusable code

- `PipelineRunner` / `createPipelineRunner`: `apps/api/src/features/ingest/pipeline/`
- `SubmissionRepository` (Prisma + in-memory): `apps/api/src/features/ingest/repositories/`
- `rateLimit`, `clientIp`: `apps/api/src/core/http/rate-limit.ts`; `createMemoryRateLimiter` / `createWorkersRateLimiter`: `core/security/rate-limiter.ts`
- `ingestPayloadSchema`, `ingestResultDtoSchema`, `APPLICATION_REFERENCE_PATTERN`: `packages/shared/src/ingest/`
- `apiPost`, `ApiRequestError`, `notify`: `apps/web/src/core/lib/`
- `IFormField`, `IInput`, `IRadios`, `IErrorSummary`, `IStepProgress`, `IBackBar`, `IContainer`, `IButton`, `ICopyButton`, `IDialog`

## Data Sources / External APIs

| Data | Source | Frequency | Cost |
|------|--------|-----------|------|
| Document fields | Stub extractor (real OCR TBD) | Per upload | Free |
| Postcode → lat/lng | postcodes.io (existing geocode step) | Per submission | Free |

## Database Changes

None. UI submissions use the existing `IngestSubmission` table with `source = 'ui'` and no provider or key.

## Environment Variables

- API: none new. Worker binding `INTAKE_IP_LIMITER` (10/60s) in `wrangler.jsonc`; in-memory on Node.
- Web: `VITE_SHOW_DEVELOPER_TOOLS` (optional, default shown) for gating the developer panel later.

## Phases

### Phase 1 — Contracts

| Task | Detail |
|------|--------|
| Shared intake schemas | `DOCUMENT_TYPES`, titles, `extractResultDtoSchema`, `intakeResultDtoSchema` |
| Move `formatUkPostcode` | to `packages/shared`; the API normalise step imports it from there |
| Interfaces | `DocumentExtractor` (API) |
| Deps | web: react-filepond, filepond + validate-type/size plugins, react-phone-number-input, react-day-picker, @radix-ui/react-popover, zustand, libphonenumber-js |

**Gate:** typecheck passes.

### Phase 2 — Parallel build (two agents)

| Agent | Owns | Delivers |
|-------|------|----------|
| API | `apps/api/src/features/intake-api/**`, `core/security/file-type.ts`, `app.ts`/`worker.ts` wiring, `wrangler.jsonc` binding | Extract + intake endpoints, stub extractor, 3 tests |
| Web | `apps/web/src/features/patient-intake/**`, the 6 new `I*` components + demos, patient routes, start page button | Full flow, developer sheet, 2 tests |

**Gate:** both packages typecheck and tests pass.

### Phase 3 — Integration and verification

| Task | Detail |
|------|--------|
| E2E API | extend `scripts/e2e-ingest.mjs` with extract (multipart) and intake, on Node and `wrangler dev` |
| E2E UI | Playwright through the flow for each document type at 375 and 1280 |
| Docs | README, design-patterns (dates, developer sheet), code-conventions (Zustand), testing.md table, PROGRESS |

## Key Changes

### New Files

| File | Purpose |
|------|---------|
| `packages/shared/src/intake/*.ts` | Document types, DTOs, postcode rule |
| `apps/api/src/features/intake-api/**` | Extract + intake routes, service, stub extractor |
| `apps/api/src/core/security/file-type.ts` | Magic-byte file type detection |
| `apps/web/src/features/patient-intake/**` | Flow screens, store, schema, API calls |
| `apps/web/src/routes/_patient/patient-upload/*.tsx` | Thin routes |
| `apps/web/src/core/components/{IFileUpload,IPhoneInput,IDateInput,ISheet,ICodeBlock,IConfirmationPanel}.tsx` | New shared components |

### Modified Files

| File | Change |
|------|--------|
| `apps/api/src/features/ingest/steps/02-normalise.step.ts` | Import `formatUkPostcode` from shared |
| `apps/api/src/app.ts`, `worker.ts`, `wrangler.jsonc` | Mount intake routes, intake limiter |
| `apps/web/src/features/patient-upload/components/patient-upload-start.tsx` | Enable "Start now" |
| `.claude/rules/design-patterns.md`, `code-conventions.md`, `testing.md`, README | Docs |

## Verification

1. `pnpm typecheck`, `pnpm test` (about 28 tests), `pnpm build`.
2. `scripts/e2e-ingest.mjs` passes on Node and `wrangler dev`, including extract (multipart) and intake.
3. Each document type pre-fills exactly its fields; Other pre-fills nothing. The developer sheet shows the phone in E.164 and the date of birth as `YYYY-MM-DD`.
4. A bad postcode or phone is blocked in the form, with the error summary.
5. A terminated postcode (BS1 1AA) still reaches the thank-you screen and shows in admin as failed at geocode, with source UI. A repeated reference appears in Duplicate submissions.
6. A network failure shows the error panel with "Try again", and the entered data is kept.
7. No horizontal scroll at 375px. The calendar and the country select are usable by keyboard.

## Changelog

| Date | Change |
|------|--------|
| 2026-09-27 | Created feature spec from approved plan |
| 2026-09-27 | Phase 1: shared intake contracts, `formatUkPostcode` moved to shared, DocumentExtractor interface, web deps |
| 2026-09-27 | Phase 2: API agent (extract + intake endpoints, stub extractor, INTAKE_IP_LIMITER) and web agent (flow, 6 new I* components, first Zustand store) in parallel |
| 2026-09-27 | Phase 3: `scripts/e2e-ingest.mjs` 33/33 on Node and `wrangler dev` (multipart works on Workers). Browser walk-through at 1280 and 375: GMS1 pre-fill, calendar, developer sheet JSON (E.164, YYYY-MM-DD), submit → UIF reference, "Other" → empty form, validation summary, network error screen. Fixed IButton visited colour and the details intro copy when nothing was found. 28 tests |
| 2026-09-29 | Admin → General upload settings wired in: `IntakeSettings` table, `GET/PUT /api/admin/settings/intake`, public `GET /api/v1/intake/settings`; extract enforces the chosen types and size limit (transport cap raised to 25MB); the document step shows and applies them |
