# API architecture

How the ingest-form API is built, every endpoint it serves, and how the ingest pipeline behaves.
The README keeps a short endpoint list; this file has the detail. The rules the code follows are
in `.claude/rules/architecture.md` and `.claude/rules/api-conventions.md`.

Diagrams (open in draw.io or the VS Code Draw.io Integration extension):

| Diagram | Shows |
|---------|-------|
| `ai-context/diagrams/DIAG-FLOW-ingest-api.drawio` | `POST /api/v1/ingest` from middleware to stored application, step by step, with issue codes and the FEAT-001 spec drift |
| `ai-context/diagrams/DIAG-ER-database.drawio` | Every Prisma model, enum and relation |
| `ai-context/diagrams/DIAG-ARCH-frontend-backend.drawio` | Web route → fetcher → api-client → router → service → repository → table, one row per flow |

## Shape of the API

- **One app, two runtimes.** `createApp(deps)` in `apps/api/src/app.ts` knows nothing about Node or Workers. `server.ts` (Node, local dev on 8300) builds it once. `worker.ts` (Cloudflare Workers) builds it per request, because a Worker cannot reuse a TCP connection opened in another request, and disconnects Prisma with `ctx.waitUntil(deps.dispose())`.
- **Composition root.** `buildDeps(config, runtime)` is the only place that creates repositories, services, rate limiters and the pipeline runner.
- **Layers.** `*.routes.ts` (HTTP only) → `*.service.ts` (business rules, no Hono or Prisma) → repository (Prisma only). Services depend on repository interfaces; tests swap in the in-memory fakes from `ingest/repositories/in-memory.repositories.ts`.
- **Prisma on two runtimes.** Code imports `#prisma`; `apps/api/package.json` maps it to `src/generated/prisma-worker` under the `workerd` condition and `src/generated/prisma` otherwise. `core/db/prisma.ts` uses `PrismaNeon` for `*.neon.tech` hosts and `PrismaPg` for anything else.
- **Rate limiters.** `buildLimiter` uses a Cloudflare `ratelimits` binding when one exists (`INGEST_IP_LIMITER`, `INGEST_KEY_LIMITER`, `INTAKE_IP_LIMITER` in `wrangler.jsonc`) and an in-memory fixed window on Node.
- **No database configured.** Without `DATABASE_URL`, `/api/v1/ingest`, `POST /api/v1/intake` and the `/api/admin` ingest routes answer `503 DATABASE_UNAVAILABLE`. Health, extract and the settings reads (defaults, no addresses) still work.

## Response envelope and errors

Every JSON response is `{ data: T }` or `{ error: { code, message, details? } }`
(`packages/shared/src/http/envelope.schema.ts`). Clients branch on `code`, never on `message`.
Expected failures are thrown as `AppError` subclasses and turned into the envelope by
`handleError`; anything else becomes a 500 with a generic message.

| Status | Code |
|--------|------|
| 400 | `VALIDATION_ERROR` |
| 401 | `UNAUTHENTICATED`, `API_KEY_EXPIRED`, `API_KEY_REVOKED` |
| 404 | `NOT_FOUND` |
| 409 | `CONFLICT` (re-run not possible) |
| 413 | `PAYLOAD_TOO_LARGE` |
| 415 | `UNSUPPORTED_MEDIA_TYPE` |
| 429 | `RATE_LIMITED` (with `Retry-After`) |
| 500 | `INTERNAL_ERROR` |
| 503 | `DATABASE_UNAVAILABLE` |

The web app calls the API only through `apps/web/src/core/lib/api-client.ts`, which parses every
success body with the shared schema and turns error bodies into `ApiRequestError`.

## Endpoints

All routes are under `/api`, except the plain-text smoke test at `/`.

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | `/` | Plain-text smoke test | `Hello, world` |
| GET | `/api/health` | Liveness, no DB access. Polled every 30 s by the header status pill | `{ data: { status: "ok" } }` |
| GET | `/api/v1/intake/settings` | Upload settings from Admin → General, read by the patient document step | `{ data: { acceptPhotos, maxFileSizeMb } }` |
| POST | `/api/v1/intake/extract` | Patient document upload (multipart `file` + `documentType`). See "Document extraction" | `{ data: { documentType, extractor, fields } }` |
| POST | `/api/v1/intake` | Patient submission (public, no key). Generates `UIF-######-YYYY` if no reference; source `ui` | `202 { data: { submissionId, status, failedStep, issues, applicationReference } }` |
| POST | `/api/v1/ingest` | Third-party intake. `Authorization: Bearer <key>`, JSON body, max 64 KB | `202 { data: { submissionId, status, failedStep, issues } }` |
| GET / PUT | `/api/admin/settings/notifications` | Read / save the success and failure addresses (`{ successEmail, failureEmail }`, each an email or null). GET adds `emailConfigured` | `{ data: { successEmail, failureEmail, emailConfigured } }` |
| GET / PUT | `/api/admin/settings/intake` | Read / save upload settings (`{ acceptPhotos, maxFileSizeMb: 5 \| 10 \| 25 }`). Defaults (photos on, 10 MB) until the first save | `{ data: { acceptPhotos, maxFileSizeMb } }` |
| GET / POST | `/api/admin/providers` | List / create providers | `ProviderDto[]` / `201 ProviderDto` |
| POST | `/api/admin/providers/:id/keys` | Create (or rotate) a key. Full key returned once | `201 { key, apiKey }` |
| POST | `/api/admin/keys/:id/revoke` | Revoke a key | `ApiKeyDto` |
| GET | `/api/admin/submissions` | List, filters `status`, `source`, `failedStep`, `page`, `pageSize` | `SubmissionListDto` |
| GET | `/api/admin/submissions/duplicates` | Duplicate groups with the reason each matched | `DuplicateGroupDto[]` |
| GET | `/api/admin/submissions/:id` | Detail: step runs, raw body, application | `SubmissionDetailDto` |
| POST | `/api/admin/submissions/:id/rerun` | Re-run from the failed step, or `{ fromStep }` | `IngestResultDto` |
| POST | `/api/admin/submissions/rerun-failed` | Re-run every submission that failed at `{ step }` | `{ requested, completed, failed }` |

**`/api/admin/*` has no authentication in this POC.** Anyone who can reach a deployed API can
create keys and read submissions. Do not deploy with real patient data before admin sign-in exists.

### Middleware order on the public write routes

| Route | Order |
|-------|-------|
| `POST /api/v1/ingest` | `bodyLimit` 64 KB (413) → IP limit 20 / 60 s (429) → API key auth (401) → key limit 60 / 60 s (429) → handler |
| `POST /api/v1/intake` | IP limit 10 / 60 s (429) → `bodyLimit` 64 KB (413) → handler |
| `POST /api/v1/intake/extract` | IP limit 10 / 60 s (429) → `bodyLimit` (hard max + multipart overhead, 413) → Zod form → size and type checks against the settings (413, 415) |

## Third-party ingest (`POST /api/v1/ingest`)

- **Keys.** Created per provider in Admin → API providers. Format `ifk_` + 32 base62 characters. Stored only as a SHA-256 hash plus a 12-character display prefix; the full key is shown once. Keys expire after 30 days. Rotating issues a new key; the old one works until it expires or is revoked.
- **Auth.** `ApiKeyAuthService.authenticate` reads the Bearer token, hashes it, looks up the hash, rejects revoked then expired keys, and updates `lastUsedAt`.
- **Storage first.** `IngestService.receive` stores the body text exactly as received (even invalid JSON) as an `IngestSubmission` with status `received`, then runs the pipeline in the same request.
- **202 contract.** Once the body is stored the answer is `202`, with the outcome in `data` (`status: completed | failed`, `failedStep`, `issues`). A failed record can still succeed after a fix and a re-run. Transport problems keep their own codes (401, 413, 429).

## Ingest pipeline

`createPipelineRunner()` (`apps/api/src/features/ingest/pipeline/run-pipeline.ts`) runs one file
per step from `apps/api/src/features/ingest/steps/`. Each step declares an input Zod schema and
returns `{ status, output, issues }`. For every step the runner re-checks the input, runs the
step, and records an `IngestStepRun` (status, output, issues, duration, attempt). The first
`error` stops the run and sets `status = failed`, `failedStep = <step>`. `warning` and `skipped`
continue.

| Step | Does | Error codes (stop) | Warning codes |
|------|------|--------------------|---------------|
| 1 validate | `JSON.parse`, Zod `ingestPayloadSchema`, date of birth plausible | `INVALID_JSON`, `REQUIRED`, `INVALID_TYPE`, `INVALID_FORMAT`, `INVALID_VALUE`, `DATE_OF_BIRTH_IN_FUTURE`, `DATE_OF_BIRTH_IMPLAUSIBLE` | `APPLICATION_REFERENCE_FORMAT` |
| 2 normalise | mobile / phone → E.164 (`+447…`), postcode → `SW1A 1AA`, country → `United Kingdom` | `INVALID_MOBILE`, `INVALID_POSTCODE`, `UNSUPPORTED_COUNTRY` | `INVALID_PHONE_DROPPED` (optional phone removed) |
| 3 geocode | postcode → latitude / longitude via postcodes.io (5 s timeout; terminated postcodes checked on 404) | `POSTCODE_NOT_FOUND`, `POSTCODE_TERMINATED`, `GEOCODER_UNAVAILABLE` | — |
| 4 transform | camelCase `transformedFormSchema`, name split (last word = last name), gender `other` → `prefer-not-to-say` | `NAME_NOT_SPLITTABLE` | `GENDER_MAPPED` |
| 5 persist | upsert the `Application` row on `submissionId` | `PERSIST_FAILED` | — |
| 6 notify | success email through Resend to the Admin → General success address (FEAT-003). Never fails the submission | — | `EMAIL_NOT_CONFIGURED`, `EMAIL_NO_RECIPIENT` (both `skipped`), `EMAIL_SEND_FAILED` |

The runner adds two codes of its own for any step: `STEP_INPUT_INVALID` (the previous output
does not match the step's input schema) and `STEP_CRASHED` (the step threw; only the error type
and stack are logged, never the message, because messages can echo input values).

### Fix and re-run

When a step's rule is wrong, fix that one step file and deploy, then open the submission in
Admin → Ingested forms and press "Re-run from <step>", or re-run everything that failed at that
step.

- `rerun(id, fromStep?)` starts at `fromStep ?? failedStep ?? validate`. Its input is the output of the latest non-error run of the previous step, so earlier steps (and the geocoder) are not repeated. `attempts` goes up by one.
- It answers `409 CONFLICT` for a submission that is already `completed`, or when the previous step has no usable output.
- `rerunFailedAt(step)` re-runs every submission that failed at `step`, one after another, and returns `{ requested, completed, failed }`.

### Notification emails (FEAT-003)

One email per completed submission and one per failed attempt, sent through the Resend REST API
(`POST https://api.resend.com/emails`, plain `fetch`, so it runs on Node and Workers).

- **Where to.** The success and failure addresses from Admin → General (`NotificationSettings`, one row). One address each, shared by API and UI submissions. Empty means no email.
- **When.** The notify step sends the success email. The runner sends the failure email right after a step errors, because notify never runs after an error. Each re-run is a new attempt, so a re-run that fails again sends another failure email, and one that completes sends the success email.
- **Duplicates.** Each send carries an `Idempotency-Key` of `<completed|failed>-<submissionId>-<attempt>`, so Resend drops a repeat of the same attempt within 24 hours.
- **Contents.** Reference, status, source, attempt, submission ID, failed step and issue codes, plus a link to `ADMIN_BASE_URL/admin/settings?tab=ingested&submission=<id>`. No names, dates of birth, contact details or addresses.
- **Never fails a submission.** No key or sender → `skipped EMAIL_NOT_CONFIGURED`. No address → `skipped EMAIL_NO_RECIPIENT`. Resend refused or timed out (10 s) → warning `EMAIL_SEND_FAILED`; only the HTTP status is logged.
- **Setup.** Set `RESEND_API_KEY` (secret) and `RESEND_FROM_EMAIL` (a sender on a domain verified in Resend) on the API, and optionally `ADMIN_BASE_URL`. Resend's shared `onboarding@resend.dev` sender only delivers to the Resend account's own address.

Code: `apps/api/src/features/notifications/` (`email-sender.ts`, `notification-templates.ts`, `submission-notifier.ts`, settings repository, service and routes).

### Duplicates

Duplicates are stored as separate records, linked with `duplicateOfId` and `duplicateReason`, and
listed in Admin → Duplicate submissions.

| Rule | Reason | Checked |
|------|--------|---------|
| the same `application_reference` | `same_reference` | after validate |
| the same first + last name **and** the same email | `same_person_email` | after persist (saved applications) |
| the same first + last name **and** the same mobile | `same_person_mobile` | after persist (saved applications) |

The same name alone is never a duplicate. Names and email compare case-insensitively; mobiles
compare in E.164, so `07123 456789` and `+447123456789` match. Rules live in
`apps/api/src/features/ingest/duplicates/duplicate-rules.ts`; the tab groups submissions
transitively and shows why each matched.

Removal is manual: `DELETE FROM "IngestSubmission" WHERE id = '<id>';`. Step runs and the
application are deleted with it, and deleting a first-received submission unlinks its duplicates
(`duplicateOfId` is a foreign key with `ON DELETE SET NULL`).

### FEAT-001 spec vs code

Where the code has moved on from `ai-context/tracking/features/FEAT-001-third-party-ingest-api.md`:

| # | Spec says | Code does |
|---|-----------|-----------|
| 1 | `runPipeline(submissionId, fromStep)` | `createPipelineRunner()` returns `run`, `rerun`, `rerunFailedAt` |
| 2 | Uppercase enums (`RECEIVED`, `SUCCESS`, `API`) | Lowercase in Prisma and shared (`received`, `success`, `api`) |
| 3 | `IngestStep = { name, run }` | Adds `input: z.ZodType`; the runner re-validates (`STEP_INPUT_INVALID`) |
| 4 | — | `STEP_CRASHED` catch-all around every step |
| 5 | Notify skipped only without `RESEND_API_KEY`, output `{}` | Notify sends the success email and outputs `{ applicationId, emailId? }`; the runner sends the failure email (FEAT-003) |
| 6 | Re-run from the failed step | Also `fromStep` in the body, fallback to `validate`, 409 when completed or no usable previous output, `attempts + 1` |
| 7 | Duplicates by application reference | Also same person (first + last name with email or mobile) after persist; `duplicateReason` column; `duplicateOfId` is a self FK with `SetNull` |
| 8 | No issue codes named | Codes listed in the step table above |
| 9 | `lookupPostcode(postcode)` | Built by `createPostcodeLookup({ baseUrl, fetch?, timeoutMs? })`; null coordinates → `POSTCODE_NOT_FOUND`; non-200 → `GEOCODER_UNAVAILABLE` |
| 10 | Postcode formatting inside the ingest feature | `formatUkPostcode` in `packages/shared/src/intake/postcode.ts` |
| 11 | `failedStep?` optional in the response | Always present, nullable |
| 12 | `ingest/*.repository.ts` | `ingest/repositories/` with interfaces, Prisma classes and in-memory fakes |
| 13 | One entry point | `POST /api/v1/intake` (FEAT-002) shares the pipeline; its IP limit runs before its body limit, the reverse of `/ingest` |

Unchanged from the spec: middleware order, 64 KB, 20 / 60 s per IP, 60 / 60 s per key, the 401
codes, `ifk_` + 32 base62 keys with a 12-character prefix, 30-day expiry, the 202 contract, 503
without a database.

## Patient intake (FEAT-002)

`/patient-upload` → **document** (choose the form, upload one file) → **details** (pre-filled
from the document, editable; phone saved as E.164, date of birth as `YYYY-MM-DD`) →
**submitting** → **complete** (reference shown).

- The draft lives in memory only (`useIntakeDraftStore`, Zustand); a refresh restarts the flow.
- `POST /api/v1/intake` goes through `IntakeService.submit`, which adds a `UIF-######-YYYY` reference when the body has none (so a UI body is not stored byte for byte), stores it with source `ui`, and runs the same pipeline.
- Only critical errors (network, 413, 429, 5xx, bad format) show the error screen. Pipeline failures such as an unknown postcode, and duplicates, still show the thank-you screen and appear in the admin tabs with source UI.

### Document extraction and file handling

**Uploaded files are not stored anywhere.** There is no bucket, no presigned URL, and no table
for files or file metadata.

1. The browser sends the file as multipart to `POST /api/v1/intake/extract`.
2. The route reads it into memory (`file.arrayBuffer()`).
3. `DocumentExtractService` loads the Admin → General settings, applies the size limit (413), and checks the real type by magic bytes with `detectFileType` (`core/security/file-type.ts`): PDF always, JPG / PNG only when photos are on (415).
4. `LayeredDocumentExtractor` reads a PDF's own text, annotations and form fields (`readPdfWords`). If that finds fewer than 3 fields, or the file is a photo, it sends the bytes to the local PaddleOCR sidecar (`OCR_SIDECAR_URL`, `127.0.0.1:8307`) when configured.
5. The mapped fields are returned and the bytes are dropped. The file name exists only in the browser draft.

Neither the API nor the sidecar logs file names or contents. Planned: direct-to-storage uploads
to a private R2 or S3 bucket through short-lived presigned URLs, with the magic-byte check on
confirmation (`.claude/rules/security-and-data.md`, `ai-context/guides/backend/deploy-to-aws.md`).
