# Testing

The suite is a **minimal functional suite of about 33 tests**, one per key flow. It exists so the
team can read every test top to bottom and explain it in one sentence. Vitest runs it; `pnpm test`
at the root runs all packages through Turborepo.

## Coverage at a glance

| # | Flow | Spec file |
|---|------|-----------|
| 1 | Shared payload schema accepts a valid form and reports missing fields by path | `packages/shared/src/ingest/test/ingest-payload.schema.spec.ts` |
| 2 | `GET /api/health` returns status ok | `apps/api/src/features/health/test/health.routes.spec.ts` |
| 3-9 | Pipeline: examples 1, 2 and 3 complete (example 1 also emails the success address, with no patient name); invalid JSON fails at validate; a geocode failure re-runs once the lookup is back (one failure email for attempt 1, one success email for attempt 2); a repeated application reference is linked as a duplicate; the same person (name + email, or name + mobile) is flagged but a namesake is not | `apps/api/src/features/ingest/test/run-pipeline.spec.ts` |
| 10 | Postcode lookup maps a 200 to coordinates and a 404 to `POSTCODE_NOT_FOUND` | `apps/api/src/features/ingest/test/postcode-lookup.spec.ts` |
| 11-14 | `POST /api/v1/ingest`: 202 and raw body stored; 401 for a missing or expired key; 413 over 64 KB; 429 after a burst | `apps/api/src/features/ingest-api/test/ingest.routes.spec.ts` |
| 15 | `POST /api/v1/intake/extract` reads the details typed onto a synthetic GMS1 PDF from the PDF itself (`pdf-native`, all 7 fields, no OCR) | `apps/api/src/features/intake-api/test/intake.routes.spec.ts` |
| 16 | `POST /api/v1/intake/extract` sends a photo to the OCR sidecar (a fake returning recorded PaddleOCR words) and maps them with the GMS1 template | `apps/api/src/features/intake-api/test/intake.routes.spec.ts` |
| 17 | `POST /api/v1/intake/extract` returns 415 for bytes that are not PDF/JPG/PNG, whatever the claimed type | `apps/api/src/features/intake-api/test/intake.routes.spec.ts` |
| 18 | `POST /api/v1/intake` generates a `UIF-######-YYYY` reference, stores source `ui`, returns 202 | `apps/api/src/features/intake-api/test/intake.routes.spec.ts` |
| 19 | Admin upload settings are saved, served at `GET /api/v1/intake/settings`, and enforced by extract (413 over the size limit, 415 for a photo when photos are off) | `apps/api/src/features/intake-api/test/intake.routes.spec.ts` |
| 20 | Admin creates an API key: full key returned once, only its hash stored | `apps/api/src/features/admin-ingest/test/providers.routes.spec.ts` |
| 21 | api-client unwraps `{ data }` and turns `{ error }` into `ApiRequestError` | `apps/web/src/core/lib/test/api-client.spec.ts` |
| 22-23 | API status pill: "API OK" when healthy, "API offline" with the reason when not | `apps/web/src/features/health/test/api-status.spec.tsx` |
| 24 | Home page links to patient upload and admin settings | `apps/web/src/features/home/test/home-page.spec.tsx` |
| 25 | Intake settings: loads the saved settings, and Save sends the change to the API and shows "Settings saved" | `apps/web/src/features/admin-settings/test/intake-settings-form.spec.tsx` |
| 26 | Providers tab shows a new key once, in the dialog | `apps/web/src/features/providers-admin/test/providers-tab.spec.tsx` |
| 27 | Ingested forms: a failed submission shows its issue and "Re-run" calls the rerun endpoint | `apps/web/src/features/ingest-admin/test/ingested-forms-tab.spec.tsx` |
| 28 | Duplicates tab lists each submission ID and has no delete button | `apps/web/src/features/ingest-admin/test/duplicates-tab.spec.tsx` |
| 29 | Component library renders every category (smoke test) | `apps/web/src/features/component-library/test/component-library.spec.tsx` |
| 30 | Patient intake: form values become the exact ingest JSON (joined name, E.164 phone, ISO date, formatted postcode, no reference when absent) | `apps/web/src/features/patient-intake/test/to-ingest-payload.spec.ts` |
| 32 | Notification addresses are saved and read back with the email status; an invalid address gets 400 | `apps/api/src/features/notifications/test/notification-settings.routes.spec.ts` |
| 33 | Notification settings form: loads the addresses, flags an invalid one in the error summary, and Save sends the change and shows "Notification settings saved" | `apps/web/src/features/admin-settings/test/notification-settings-form.spec.tsx` |
| 31 | Patient intake: details pre-filled from the extract API submit and reach "Thanks for your submission" with the reference (starts at the details step, because FilePond can't upload in jsdom) | `apps/web/src/features/patient-intake/test/intake-flow.spec.tsx` |

Update this table whenever a test is added or removed.

## Rules

- **Simple functional tests.** Arrange, act, assert, with plain data. One behaviour per test.
- **Name the behaviour** in plain English: `returns 413 for a body over 64 KB`, not `test bodyLimit`.
- **Fakes over mocks.** Use the in-memory repositories (`in-memory.repositories.ts`), the fake
  postcode lookup, the fake email sender (`createFakeEmailSender` in `ingest/test/fixtures/fakes.ts`), a fake `OcrClient` (recorded sidecar words in `intake-api/test/fixtures/`), and `stubApi()` (`apps/web/src/core/testing/stub-api.ts`) for `fetch`. Do not
  deep-mock Prisma.
- **No tests for styling or implementation details**: no CSS classes, no internal call counts, no
  private helpers, no snapshots, no exhaustive edge-case tables.
- **Add a test only** for a new key flow, or with a bug fix (the test fails before the fix).
- **Keep the total small.** Replace an existing test rather than adding another next to it.
- Each spec file starts with a 1-2 line comment naming the user-facing flow it proves.
- Each test builds its own app and query client. Unit tests never need Docker, a network or a `.env` file.

## Where tests live

- In a `test/` folder inside the feature (or `core/` module) they cover, named `*.spec.ts`, or
  `*.spec.tsx` for React. Each `vitest.config.ts` only picks up `src/**/test/**/*.spec.ts(x)`.
- Never put tests in `apps/web/src/routes/`. The TanStack Router generator treats every file there as a route.

## Environments

| Package | Environment | Notes |
|---------|-------------|-------|
| `api` | `node` | Tests call `createApp(deps).request(path)`. No server, no port. |
| `web` | `jsdom` | Testing Library + jest-dom matchers, set up in `src/test-setup.ts`. |
| `shared` | `node` | Schema test only. |

## Known friction

1. **Prisma client must be generated first.** Turbo's `test` and `typecheck` depend on the
   `generate` task (`prisma generate` in api, `tsr generate` in web).
2. **The Workers runtime is not covered by unit tests.** API tests run in Node. Worker-only
   behaviour (bindings, `nodejs_compat` gaps) is verified with a scripted end-to-end
   run against `wrangler dev`.
3. **Radix needs jsdom stubs.** `src/test-setup.ts` stubs the browser APIs Radix calls that jsdom
   lacks (pointer capture, `scrollIntoView`, `ResizeObserver`, `matchMedia`). Keep them when upgrading.
4. **Turbo strips undeclared env vars.** Pass config explicitly (`loadConfig({ NODE_ENV: 'test' })`).
