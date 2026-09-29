---
project: ingest-form
last-updated: 2026-09-29
---

# ingest-form — AI Progress Tracker

## Active Work

| ID | Type | Title | Status | Last Updated | Notes |
|----|------|-------|--------|--------------|-------|
| FEAT-005 | Feature | Document extraction (native PDF + PaddleOCR) | Review | 2026-09-29 | Layer 1 unpdf reads typed PDFs in the Worker; layer 2 local PaddleOCR sidecar (8307) for photos/scans; one TS mapper. Stub removed. Awaiting manual upload testing. |

### Status Values

- **Exploring** — Discovery: actively researching
- **Evaluated** — Discovery: options analyzed, awaiting decision
- **Decided** — Discovery: decision made, ready for implementation
- **Planning** — Feature: requirements gathering
- **In Progress** — Feature/Fix: actively implementing
- **Review** — Feature/Fix: testing and review
- **Done** — Completed

## Completed

| ID | Type | Title | Completed | Outcome |
|----|------|-------|-----------|---------|
| FEAT-003 | Feature | Intake notification emails (Resend) | 2026-09-29 | Success email from the notify step, failure email from a runner hook (once per attempt, Resend idempotency key). Addresses in `NotificationSettings`, set in Admin → General; `emailConfigured` shown without revealing the key. Plain `fetch` to the Resend API (no SDK). Emails carry identifiers and issue codes only. |
| — | Docs | Architecture diagrams and API architecture guide | 2026-09-29 | Three draw.io diagrams in `ai-context/diagrams/` (ingest API flow with FEAT-001 spec drift, database ER, front end to back end); API detail moved from the README to `ai-context/guides/backend/api-architecture.md`; README file-upload text corrected (nothing is stored yet). |
| FEAT-004 | Feature | IPhoneInput flag + dial code picker | 2026-09-29 | Native select kept, transparent over a face with bundled SVG flag + "+44" + chevron; flags lazy in own chunk (51.7KB gz); options "Country +code", GB pinned, no International. typecheck, 11/11 tests, build pass. Manual browser check pending. |
| — | Research | OCR / AI form extraction | 2026-09-29 | Local and public-demo comparison for synthetic blank/filled intake forms; recommends native extraction → template alignment/checkbox CV → document OCR/HTR → schema and human review. See `ai-context/research/OCR-AI-form-extraction.md`. |
| FEAT-002 | Feature | Patient intake flow (UI ingest) | 2026-09-27 | Document choice + FilePond upload → stub OCR (`POST /api/v1/intake/extract`, magic-byte checked) → pre-filled details (IPhoneInput E.164, IDateInput calendar → YYYY-MM-DD) with developer data sheet → `POST /api/v1/intake` (public, UIF reference, source ui) → same pipeline; progress + thank-you screens; critical-only error screen. e2e 33/33 on Node + Workers. |
| FEAT-001 | Feature | Third-party ingest API | 2026-09-27 | `POST /api/v1/ingest` with provider keys (30d, hashed), rate limits, 64KB cap; 6-step re-runnable pipeline (validate, normalise, geocode via postcodes.io, transform, persist, notify stub); admin tabs API providers / Ingested forms / Duplicate submissions; ITable + ICopyButton. Verified on Node and `wrangler dev` with `scripts/e2e-ingest.mjs` (27/27). |
| DISC-001 | UI Discovery | NHS-style design system, root page, flow starters | 2026-09-27 | Decided Bookable-style NHS tokens, Hanken Grotesk, native HTML + Radix `I*` components in `core/components/`. Root page, `/patient-upload`, `/admin/settings` built. `design-patterns.md` approved. |
| — | Scaffold | Initial monorepo scaffold | 2026-09-27 | Turborepo + pnpm; web (React 19, Vite 8, TanStack Router/Query, Tailwind 4), api (Hono on Workers + Node, Prisma 7), shared (Zod 4). Health endpoint, hello-world page, Vitest in all packages, rules, README. |

## Gotchas & Notes

- 2026-09-27 — **Node 22.12+ required.** The workspace's usual nvm build (v22.5.1) is too old for Prisma 7 and Vite 8. Node 22.23.3 was installed via nvm (default alias unchanged). Use `export PATH="$HOME/.nvm/versions/node/v22.23.3/bin:$PATH"`.
- 2026-09-27 — **npm `latest` for `prisma` points at an 8.0 release candidate.** Pinned `~7.10.0` on purpose. Check before bumping.
- 2026-09-27 — **TypeScript pinned to `~6.0.3`**, not 7 (the Go-native compiler), to avoid tooling that still needs the JS compiler API.
- 2026-09-27 — **Prisma on Workers: bundles but runtime unverified.** A probe Worker importing `createPrismaClient` bundled to 5.3 MB raw / 1.8 MB gzip (free-tier limit 3 MB). The generator uses the default `nodejs` runtime; Prisma docs say to use `runtime = "workerd"` for Workers. The first feature that queries the DB must verify on `wrangler dev` and may need a separate workerd-targeted client.
- 2026-09-27 — **`prisma generate` works with zero models** (Prisma 7.10), so no placeholder model was needed.
- 2026-09-27 — **`pnpm --filter x deploy` runs pnpm's own `deploy` command**, not the script. The Worker deploy script is named `deploy:worker` for that reason.
- 2026-09-27 — **Web bundle is 553 kB (171 kB gzip)** in one chunk, over Vite's 500 kB warning. Mostly React + Router + Query + Zod 4. Consider `zod/mini` on the web side or manual chunks when it matters.
- 2026-09-27 — **Screenshots lie about colour.** macOS screenshots carry the display profile, so decoded hex values are shifted (`#1c51ae` vs the real `#005eb8`). Take colours from CSS, not screenshots.
- 2026-09-27 — **Utility text colours beat the base `a:focus-visible` rule** (Tailwind layers). A link styled `text-white` showed white on yellow when focused. Any component colouring a link must add `focus-visible:text-text`.
- 2026-09-27 — **`brand-bar` `#2b7ac4` failed AA with white text (4.48:1)**; darkened to `#2a77bf` (4.68:1). Measure every new colour pair.
- 2026-09-27 — **Vite proxy returns a bare 502 when the API is down**, not a network error. `api-client` maps 502/503/504 without an envelope to `GATEWAY_ERROR` "No response from API (HTTP 502)".
- 2026-09-27 — **Hint text inside a `<label>` becomes part of the accessible name.** Keep hints outside, linked with `aria-describedby`.
- 2026-09-27 — **react-hook-form focuses the first invalid field by default**; set `shouldFocusError: false` so `IErrorSummary` gets focus.
- 2026-09-27 — **Radix in jsdom needs stubs** (`ResizeObserver`, pointer capture, `scrollIntoView`, `matchMedia`); they live in `apps/web/src/test-setup.ts`.
- 2026-09-27 — **Vite re-optimises deps after installing packages** and reloads the page once; a screenshot taken then is blank.
- 2026-09-27 — **Prisma needs two generated clients.** The `nodejs` runtime client crashes on workerd (`fileURLToPath(import.meta.url)` is undefined); the `workerd` client fails on Node (wasm module undefined). `schema.prisma` has two generators (`src/generated/prisma`, `src/generated/prisma-worker`) and code imports `#prisma`, which `apps/api/package.json` `imports` resolves per runtime (`workerd` condition for wrangler, `default` for Node/tsx/vitest). Verified: same query works on `tsx` and `wrangler dev` against Docker Postgres via `@prisma/adapter-pg`.
- 2026-09-27 — **Example 2's postcode BS1 1AA was terminated in Dec 1998** (postcodes.io `/terminated_postcodes`), so Example 2 fails at geocode with `POSTCODE_TERMINATED`. postcodes.io still returns the last known coordinates; accepting terminated postcodes with a warning is a one-file change in `03-geocode.step.ts` if the product wants it.
- 2026-09-27 — **Workers cannot reuse a Prisma/pg connection across requests**: the second DB request hung ("Worker's code had hung"). `worker.ts` now builds the app per request and disconnects via `ctx.waitUntil(dispose())`. Rate-limit state is in the bindings, so rebuilding doesn't reset limits.
- 2026-09-27 — **`sr-only` text inside a scrolling table escaped and widened the page on mobile** (absolute positioning with no positioned ancestor inside the scroll box). `ITable`'s wrapper is `relative`. Similarly, CSS grid tracks grow to their content: use `grid-cols-[minmax(0,1fr)]` for single-column grids holding wide children.
- 2026-09-27 — **The in-memory rate limiter survives across e2e runs** of the same Node process; restart the API between burst tests.
- 2026-09-27 — **Links styled as buttons turned dark-on-green once visited**: `IButton` used `visited:text-inherit`. Each variant now sets its own `visited:`/`hover:` text colour. Found on the intake error screen ("Try again" links to an already-visited page).
- 2026-09-27 — **Ofcom drama numbers (07700 900xxx) are invalid in libphonenumber**; use 07123 456789 / 07777 777777 for synthetic data.
- 2026-09-27 — **FilePond's progress animation can lag the server response** (shows "Uploading 78%" after extraction finished). Cosmetic.
- 2026-09-29 — **The FK clears `duplicateOfId` on delete but not `duplicateReason`.** The API reports a reason only when a link exists, and the runner ignores a stale same-reference reason, so a re-run re-checks the person rules.
- 2026-09-29 — **Local Worker rate limits survive a `wrangler dev` restart** for their 60s window; wait before re-running the burst e2e.
- 2026-09-27 — `tsr generate` prints a harmless "replaceRouteChunk ... circular dependency" warning.
