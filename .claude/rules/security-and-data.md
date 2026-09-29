# Security and data handling

This app collects medical intake forms and file uploads. Treat every submitted field and file as
sensitive patient data (PHI under HIPAA, special category data under UK GDPR).
Compliance scope (BAA, data region, retention period) is **TBD** and must be decided before real
patient data is stored. Until then, use synthetic data only.

## Never

- Log request bodies, query strings, form values, file names, or file contents. Log method, path, status, and an opaque ID.
- Put patient data in URLs (path segments or query strings). Use opaque IDs.
- Put patient data in error messages returned to the client.
- Store uploaded files in a public bucket or serve them from a public URL.
- Commit `.env`, `.dev.vars`, real connection strings, or sample files containing real data.
- Send patient data to third-party analytics, error trackers, or LLM APIs without an explicit decision recorded in an ADR.

## File uploads (planned pattern)

**Today (FEAT-005):** nothing is stored. File bytes do pass through the API: `POST /api/v1/intake/extract` reads the file in memory, extracts fields and drops it (see "Document extraction" below). The pattern below is the plan for when files must be kept.

Uploads go straight from the browser to object storage using presigned URLs; file bytes never pass through the API. This keeps Workers under their request size and CPU limits.

1. Web asks the API for an upload URL, sending declared content type and size.
2. API validates type against an allowlist and size against a limit, creates a pending upload record, returns a short-lived presigned PUT URL (minutes, not hours).
3. Browser uploads directly to the private bucket.
4. Web confirms; API verifies the object exists, checks its **magic bytes** (the declared MIME type is untrusted), and marks the upload complete.
5. Downloads use short-lived presigned GET URLs issued after an authorisation check.

Storage provider (Cloudflare R2 vs AWS S3) is TBD and depends on the compliance decision. See `ai-context/guides/backend/deploy-to-aws.md`.

## Ingest API (FEAT-001)

- **Keys**: per provider, `ifk_` + 32 random base62 characters, stored only as a SHA-256 hash plus a 12-character display prefix. The full key is shown once. Keys expire after 30 days; rotating issues a new key and the old one works until it expires or is revoked.
- **Limits**: 64KB body cap; 20 requests/min per IP before auth and 60/min per key (Cloudflare `ratelimits` bindings on Workers, in-memory on Node). Cloudflare's network absorbs volumetric DDoS.
- **Stored patient data**: `IngestSubmission.rawBody`, step outputs and `Application` rows hold patient data in plain text. Acceptable only with synthetic data; encryption at rest and a retention period are part of the compliance decision.
- **Known risk: `/api/admin/*` and the admin pages have no authentication** (POC decision). Anyone who can reach a deployed API can create keys and read submissions. Do not deploy with real data before admin sign-in (OAuth/JWT) exists.
- **Logging**: the ingest route logs method, path, submission id and status; a crashed step logs its error type and stack frames, never the error message (messages can echo input values).

## Notification emails (FEAT-003)

- Emails go through Resend, a third party, so they carry **no patient data**: reference, status, source, attempt, submission ID, failed step, issue codes and an admin link only (`notifications/notification-templates.ts`). Adding any other field needs an ADR.
- The recipient addresses are admin data stored in `NotificationSettings`. Logs name the submission ID and the HTTP status, never an address or a provider message.

## Document extraction (FEAT-005)

- Uploaded files are read in memory by the API (native PDF reading) and, when configured, sent
  to the **local PaddleOCR sidecar** (`services/ocr-sidecar`, 127.0.0.1:8307). Neither stores the
  file. The sidecar logs method, path, status, size and duration only; the API logs only why the
  OCR layer was skipped.
- The sidecar is **local-only**. Running it on another host, or replacing it with any cloud OCR
  or LLM service, sends patient documents to a third party and needs an ADR first (see "Never").
- Test with synthetic documents. The repo's fixtures are synthetic ("Alex Example"); real
  documents used in benchmarking stay outside the repo (`~/Developer/ocr-lab/private/`, gitignored).

## Always

- Validate every input with Zod at the boundary (see `api-conventions.md`).
- CORS allows only origins listed in `ALLOWED_ORIGINS`. Never `*` with credentials.
- Secrets reach the API through `loadConfig()` only. Workers secrets are set with `wrangler secret put`.
- Local development uses the Docker Postgres and synthetic data. Never run migrations or queries against Neon unless explicitly asked.
