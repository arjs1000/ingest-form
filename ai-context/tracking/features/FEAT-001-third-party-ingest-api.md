---
id: FEAT-001
title: Third-party ingest API
status: Complete
created: 2026-09-27
completed: 2026-09-27
---

# FEAT-001: Third-party ingest API

**Status:** Complete
**Priority:** High
**Created:** 2026-09-27
**Dependencies:** None (builds on DISC-001 conventions)
**Branch:** feature/feat-001-third-party-ingest-api

## Problem

Third-party suppliers need to send patient intake records to ingest-form. Their payloads are often incomplete or dirty (bad phone numbers, missing lines, odd casing). Today there is no endpoint, no storage, and no way for an admin to see why a record failed or to retry it after a fix.

## Solution

`POST /api/v1/ingest` accepts the snake_case `IngestedFormSchema`. Every request body is stored exactly as received, then run through six small, separately editable steps that turn it into the camelCase `TransformedFormSchema` with latitude and longitude, saved to Postgres. Every step's result is recorded, so an admin can see exactly where and why a record failed. After a developer ships a fix, the admin re-runs the submission from the failed step.

Deliverables:
1. Ingest endpoint with per-provider API keys (30-day expiry), rate limiting and a body size limit.
2. Six pipeline steps: validate, normalise, geocode, transform, persist, notify (stub). One file each, plus a runner that records step runs and supports re-running from any step.
3. postcodes.io provider: `lookupPostcode(postcode): Promise<HttpResponse<{ longitude; latitude }>>`.
4. Prisma models and migration: providers, keys, submissions, step runs, applications.
5. Admin API: providers and keys, submissions list and detail, re-run (single and bulk), duplicates.
6. Admin UI tabs: **API providers**, **Ingested forms**, **Duplicate submissions**.

### Decisions (from planning)

| Topic | Decision |
|-------|----------|
| Geocoding | postcodes.io (free, no key, ONS open data under the OGL, so results may be stored). Behind a provider interface. Google Geocoding rejected: needs billing, and its terms limit caching lat/lng to 30 days. |
| Name split | Last word = `lastName`, the rest = `firstName`. "Andy James Smith-Jones" gives "Andy James" / "Smith-Jones". A single word is a validation error. Known limitation: multi-word surnames ("Van Der Berg"). |
| Gender | `male` and `female` pass through. `other` becomes `prefer-not-to-say` (**lossy**, because the target type has no "other"; revisit before real data). |
| Optional phone | Invalid `phone_number` (e.g. "0001") is dropped with a **warning**. An invalid `mobile_number` is an **error**. |
| API keys | Per provider, created in admin settings, stored as a SHA-256 hash with a display prefix, shown in full once. Valid 30 days. Rotating creates a new key; the old key works until it expires or is revoked. |
| Admin auth | **None for this POC** (POC decision). Admin pages and `/api/admin/*` are open. **Known risk: do not deploy with real patient data until admin auth exists.** |
| Duplicates | Accepted and stored as separate records, linked via `duplicateOfId`, listed in "Duplicate submissions" with their Prisma IDs. No delete in the UI; removal is manual (see below). |
| Response | `202` with the outcome once the body is stored, even if a step failed, because the record exists and can be re-run. Transport and auth problems use 401/413/429. |
| Email | The notify step exists and returns `skipped` until Resend is wired in a follow-up. |

## Architecture

```
POST /api/v1/ingest ──► bodyLimit(64KB) ─► ipRateLimit ─► apiKeyAuth ─► keyRateLimit
                          │ 413              │ 429          │ 401          │ 429
                          ▼
                  receive: store raw body text as IngestSubmission (status RECEIVED)
                          ▼
            runPipeline(submissionId, fromStep = 'validate')
   ┌────────────┬─────────────┬───────────┬─────────────┬────────────┬──────────┐
   │ validate   │ normalise   │ geocode   │ transform   │ persist    │ notify   │
   │ JSON + Zod │ E.164, PC,  │ postcodes │ camelCase,  │ Application│ skipped  │
   │ (snake)    │ country     │ .io       │ name split  │ row        │ (Resend) │
   └────────────┴─────────────┴───────────┴─────────────┴────────────┴──────────┘
   each step: run(input, deps) → StepResult; the runner saves an IngestStepRun
   (status, output JSON, issues, duration, attempt) and stops at the first error.
                          ▼
   202 { data: { submissionId, status: 'completed' | 'failed', failedStep?, issues[] } }
```

### Step contract

`apps/api/src/features/ingest/pipeline/step.types.ts`

```ts
type StepName = 'validate' | 'normalise' | 'geocode' | 'transform' | 'persist' | 'notify';
interface StepIssue { path: string; code: string; message: string; severity: 'error' | 'warning' }
type StepResult<T> =
  | { status: 'success' | 'warning' | 'skipped'; output: T; issues: StepIssue[] }
  | { status: 'error'; issues: StepIssue[] };
interface IngestStep<In, Out> { name: StepName; run(input: In, deps: StepDeps): Promise<StepResult<Out>> }
```

Each step lives in its own file (`steps/01-validate.step.ts` … `steps/06-notify.step.ts`) and is a plain function of its input and injected deps. A backend developer changes one file and one spec.

| Step | Input → Output | Errors | Warnings |
|------|----------------|--------|----------|
| validate | raw body text → `IngestPayload` (parsed, trimmed) | invalid JSON; missing or invalid required fields; `session_id` not a UUID; bad email; DOB not ISO, in the future, or age > 120; gender not male/female/other | `application_reference` doesn't match `^[A-Z]{3}-\d{6}-\d{4}$` |
| normalise | `IngestPayload` → `NormalisedPayload` | mobile not a valid GB mobile; postcode not UK format; non-UK country | invalid optional phone (dropped) |
| geocode | `NormalisedPayload` → `+ { latitude, longitude }` | `POSTCODE_NOT_FOUND`, `POSTCODE_TERMINATED`, `GEOCODER_UNAVAILABLE` (retryable) | — |
| transform | geocoded → `TransformedForm` | single-word name | gender `other` mapped to `prefer-not-to-say` |
| persist | `TransformedForm` → `{ applicationId }` | database write failed | — |
| notify | `{ applicationId }` → `{}` | — | `skipped` without `RESEND_API_KEY` |

**Normalisation rules:**
- Phones use `libphonenumber-js`, `parsePhoneNumberFromString(value, 'GB')`, and are stored in E.164 (`+447123456789`). The mobile must be of type `MOBILE`.
- Postcodes are uppercased, whitespace is collapsed, a single space is inserted before the last 3 characters, and the result is validated against the UK format.
- Country accepts `United Kingdom`, `UK`, `GB`, `Great Britain`, `England`, `Scotland`, `Wales`, `Northern Ireland` (case-insensitive) and becomes `United Kingdom`. Anything else is an error, because the geocoder is UK-only.

### Re-run

`POST /api/admin/submissions/:id/rerun` finds the failed step, loads the output of the last successful run of the step before it, and runs from the failed step with `attempt + 1`. Re-running from transform never calls the geocoder again. `POST /api/admin/submissions/rerun-failed { step }` does the same for every submission that failed at that step. Re-running a completed submission is refused with a 409.

### Keys and rate limiting

- **Key format:** `ifk_` + 32 base62 characters from `crypto.getRandomValues`. Stored: SHA-256 hex (`crypto.subtle`) plus a 12-character display prefix. Both calls work on Node and Workers.
- **Auth errors:** 401 with code `UNAUTHENTICATED` (missing or unknown key), `API_KEY_EXPIRED` or `API_KEY_REVOKED`. A successful auth updates `lastUsedAt`.
- **`RateLimiter` interface** with two implementations. On Workers it uses the `ratelimits` binding (`env.X.limit({ key })` → `{ success }`; period 10 or 60s; counted per location and approximate, per Cloudflare docs). On Node and in tests it uses an in-memory fixed window.
- **Limits:** 60 requests/60s per key, and 20 requests/60s per IP before auth. A 429 carries `Retry-After`. Cloudflare's network DDoS protection handles volumetric floods.

### Reusable code

- `createApp(deps)` / `buildDeps(config)`: `apps/api/src/app.ts` (composition root)
- `loadConfig`: `apps/api/src/core/config/env.ts`
- `ok` / `fail` envelope: `apps/api/src/core/http/envelope.ts`
- `validate()` middleware: `apps/api/src/core/http/validate.ts`
- `AppError` family and `handleError`: `apps/api/src/core/errors/`
- `createPrismaClient`: `apps/api/src/core/db/prisma.ts`
- `apiGet`, `ApiRequestError`: `apps/web/src/core/lib/api-client.ts` (extend with `apiPost`)
- `notify`: `apps/web/src/core/lib/notify.ts`
- The `I*` components: `ITabs`, `IBadge`, `IDialog`, `IStatusPill`, `IFormSection`, `IErrorSummary`, `IPageHeader`, `ISkeleton`, `IDropdownMenu`
- `renderWithRouter`: `apps/web/src/core/testing/render-with-router.tsx`
- Settings tabs via `validateSearch`: `apps/web/src/features/admin-settings/`

## Data Sources / External APIs

| Data | Source | Frequency | Cost |
|------|--------|-----------|------|
| Postcode → lat/lng | postcodes.io `GET /postcodes/{postcode}` (checked 2026-09-27: `E15 4BZ` gives lat 51.542097, lng 0.006388; unknown gives `404 "Postcode not found"`) | Once per submission, not repeated on re-runs from transform onwards | Free, no key, OGL data |
| Terminated postcodes | postcodes.io `GET /terminated_postcodes/{postcode}` | Only after a 404 | Free |
| Email | Resend (follow-up) | Per completed submission | Free tier (not wired yet) |

## Database Changes

Prisma models in `apps/api/prisma/schema.prisma`, with the first migration on the local Docker DB:

| Model | Fields |
|-------|--------|
| `IngestProvider` | `id` uuid, `name` unique, `createdAt`; has keys and submissions |
| `IngestApiKey` | `id`, `providerId`, `label?`, `prefix`, `keyHash` unique, `createdAt`, `expiresAt`, `lastUsedAt?`, `revokedAt?` |
| `IngestSubmission` | `id`, `source` (API\|UI), `providerId?`, `apiKeyId?`, `status` (RECEIVED\|PROCESSING\|COMPLETED\|FAILED), `lastStep?`, `failedStep?`, `rawBody` text, `applicationReference?` (indexed), `sessionId?`, `duplicateOfId?`, `attempts`, `receivedAt`, `updatedAt` |
| `IngestStepRun` | `id`, `submissionId`, `step`, `attempt`, `status` (SUCCESS\|WARNING\|ERROR\|SKIPPED), `output` Json?, `issues` Json, `durationMs`, `startedAt`; index on (`submissionId`, `step`) |
| `Application` | `id`, `submissionId` unique, every `TransformedFormSchema` field (`dateOfBirth` @db.Date, `latitude` / `longitude` Float), `createdAt` |

Step runs and the application cascade-delete with their submission.

### Removing a duplicate (manual, by design)

The admin UI never deletes. Copy the submission ID from "Duplicate submissions", then run either of:

```sql
-- psql against the Docker DB (port 8303)
DELETE FROM "IngestSubmission" WHERE id = '<submission-id>';
```

```ts
// Prisma (e.g. in a one-off script)
await prisma.ingestSubmission.delete({ where: { id: '<submission-id>' } });
```

`rawBody` stores patient data in plain text. That is acceptable only with synthetic data. It is flagged in `.claude/rules/security-and-data.md` for the compliance decision (encryption at rest, retention).

## Environment Variables

```bash
# Ingest
POSTCODES_IO_BASE_URL=https://api.postcodes.io
# Email (optional; the notify step is skipped without it)
# RESEND_API_KEY=
```

- `DATABASE_URL` is required by the ingest and admin routes. `/api/health` still works without it; those routes return 503 `DATABASE_UNAVAILABLE`.
- Worker bindings (in `wrangler.jsonc`): `INGEST_KEY_LIMITER`, `INGEST_IP_LIMITER`.

## Phases

### Phase 1 — Contracts and data spike

**Scope:** shared schemas, step and repository types, Prisma models and migration, and proof that Prisma works on both runtimes.

| Task | Detail |
|------|--------|
| Shared schemas | `packages/shared/src/ingest/`: ingest payload (snake), transformed form, submission and step-run DTOs, provider and key DTOs |
| Step + repository types | `step.types.ts`, `SubmissionRepository`, `ProviderRepository`, `ApplicationRepository` interfaces |
| Prisma | models above; `prisma migrate dev` on the Docker DB |
| Runtime spike | a Prisma query from `server.ts` (Node) and from `wrangler dev` (8304) against the Docker DB; choose the generator runtime and record it in PROGRESS gotchas |

**Gate:** typecheck passes, the migration is applied, and one query succeeds on both runtimes.

### Phase 2 — Parallel build (three agents, disjoint files)

| Agent | Owns | Delivers |
|-------|------|----------|
| A: Pipeline | `apps/api/src/features/ingest/{steps,pipeline,providers}` + `test/` | 6 steps, `runPipeline`, postcode and phone providers, fixture tests (3 examples + dirty variants) |
| B: HTTP + security | `apps/api/src/features/{ingest-api,admin-ingest}`, `apps/api/src/core/security/`, Prisma repositories, `app.ts`, `env.ts`, `wrangler.jsonc`, `.env.example` | Ingest route, key auth, rate limits, body limit, admin API, route tests with fakes |
| C: Admin UI | `apps/web/src/features/{ingest-admin,providers-admin}`, `core/components/ITable.tsx`, `core/components/ICopyButton.tsx` (+ specs, library demos), settings tabs, `api-client` `apiPost` | API providers, Ingested forms (with detail and re-run) and Duplicate submissions tabs |

**Gate:** each agent's package typechecks and its tests pass.

### Phase 3 — Integration and verification

| Task | Detail |
|------|--------|
| Wire | pipeline into routes via `buildDeps`; web against the real API |
| Integration test | `test:integration` against the Docker DB: examples 1-3 end to end |
| E2E | curl on Node (8300) and `wrangler dev` (8304); Playwright on the three tabs at 375 and 1280 |
| Docs | README (endpoints, env), api-conventions, design-patterns (ITable, ICopyButton), security-and-data, PROGRESS |

**Gate:** every verification item below passes.

## Key Changes

### New Files

| File | Purpose |
|------|---------|
| `packages/shared/src/ingest/*.schema.ts` | Wire contracts shared by api and web |
| `apps/api/src/features/ingest/pipeline/{step.types,run-pipeline,pipeline}.ts` | Step contract, runner, ordered step list |
| `apps/api/src/features/ingest/steps/0N-*.step.ts` | The six steps |
| `apps/api/src/features/ingest/providers/{postcode-lookup,http-response,phone}.ts` | postcodes.io and phone normalisation |
| `apps/api/src/features/ingest/*.repository.ts` | Repository interfaces + Prisma implementations |
| `apps/api/src/features/ingest-api/ingest.routes.ts` | `POST /api/v1/ingest` |
| `apps/api/src/features/admin-ingest/*.routes.ts` | Admin API |
| `apps/api/src/core/security/{api-key,rate-limiter}.ts` | Key hashing and generation, limiter interface and implementations |
| `apps/api/prisma/migrations/*` | First migration |
| `apps/web/src/features/ingest-admin/**` | Ingested forms + duplicates tabs |
| `apps/web/src/features/providers-admin/**` | API providers tab |
| `apps/web/src/core/components/{ITable,ICopyButton}.tsx` | New shared components |

### Modified Files

| File | Change |
|------|--------|
| `apps/api/src/app.ts` | Mount ingest and admin routes, build repositories and limiters |
| `apps/api/src/core/config/env.ts` | `POSTCODES_IO_BASE_URL`, `RESEND_API_KEY` |
| `apps/api/prisma/schema.prisma` | Models |
| `apps/api/wrangler.jsonc` | `ratelimits` bindings |
| `apps/web/src/features/admin-settings/*` | Three new tabs |
| `apps/web/src/app/layouts/admin-layout.tsx` | Sidebar and menu entries |
| `apps/web/src/core/lib/api-client.ts` | `apiPost` |
| `.env.example`, `README.md`, `.claude/rules/*.md`, `PROGRESS.md` | Docs |

## Verification

1. Examples 1 and 3 complete. Each has an Application row with an E.164 mobile, a formatted postcode, and lat/lng. Example 3 has `phoneNumber` null.
2. Example 2 completes with a warning on `phone_number` ("0001" dropped). The name splits as "Andy James" / "Smith-Jones", and gender becomes `prefer-not-to-say`.
3. Dirty payloads fail at the right step with readable issues. Invalid JSON is stored and fails at validate.
4. Re-running from a failed step reuses earlier outputs (no geocoder call when re-running from transform), increments `attempts`, and completes.
5. Sending the same `application_reference` twice creates a second submission, and "Duplicate submissions" shows both IDs.
6. Auth and limits:
   - no key → 401 `UNAUTHENTICATED`
   - expired key → 401 `API_KEY_EXPIRED`
   - revoked key → 401 `API_KEY_REVOKED`
   - body over 64KB → 413
   - a burst → 429 with `Retry-After`
7. The same flow works on `wrangler dev` (8304) as on Node (8300).
8. `pnpm typecheck`, `pnpm test` and `pnpm build` pass. The admin tabs are checked with Playwright at 375×812 and 1280×800. There is no hex outside `styles.css`, and no Radix or Sonner imports in features.

## Changelog

| Date | Change |
|------|--------|
| 2026-09-27 | Created feature spec from approved plan |
| 2026-09-27 | Phase 1: contracts, Prisma models + migration. Spike found Prisma needs two generated clients (Node + workerd), selected via the `#prisma` import condition |
| 2026-09-27 | Phase 2: pipeline, HTTP/security and admin UI built by three parallel agents |
| 2026-09-27 | Phase 3: integration. Fixed Worker request hang (app + Prisma client per request), crash logs without messages, malformed admin JSON → 400, mobile overflow (ITable `relative`, grid `minmax(0,1fr)`). `scripts/e2e-ingest.mjs` passes 27/27 on Node and `wrangler dev` |
| 2026-09-27 | Finding: Example 2 postcode BS1 1AA is terminated (1998), so Example 2 fails at geocode as specified; live-postcode variant completes |
| 2026-09-27 | Test suite reduced to 23 functional tests over key flows (user request); testing.md rewritten |
| 2026-09-29 | Duplicates extended: same first + last name with the same email or mobile is also flagged (saved applications); `duplicateOfId` became an FK with ON DELETE SET NULL; `duplicateReason` added. See README "Duplicates" |
