# ingest-form

Intake form ingestion for a medical UI booking project. This includes a web front end that collects intake forms and file uploads of medical forms and a serverless API behind it.

## Features

Built (each in its own feature folder):

- **Third-party ingest API** (FEAT-001): `POST /api/v1/ingest` takes supplier intake records with a per-provider API key, runs a six-step pipeline (validate → normalise → geocode → transform → persist → notify) and saves the transformed application. Every step result is stored, so failed records can be fixed and re-run.
- **Patient intake flow** (FEAT-002): choose a form, upload it, check the details read from it, submit. Submissions go through the same pipeline.
- **Document extraction** (FEAT-005): native PDF reading plus an optional local PaddleOCR sidecar. Files are checked by type and size, read in memory and not stored.
- **Notification emails** (FEAT-003): one email per completed submission and one per failed attempt, through Resend, to addresses set in Admin → General. Emails carry identifiers and issue codes only.
- **Admin settings** (`/admin/settings`): General (upload limits, notification addresses), API providers (keys), Ingested forms (step timeline, re-run), Duplicate submissions, UI component library.
- **Health**: liveness endpoint and the API status pill in every header.

Not built yet: admin sign-in, file storage, web hosting (see [File Uploads](#file-uploads) and [Deployment](#deployment)).

## Tech Stack

| Layer | Technology |
|-------|------------|
| Monorepo | Turborepo 2, pnpm 9 workspaces |
| Runtime | Node.js >= 22.12 (local), Cloudflare Workers (API in production) |
| Language | TypeScript 6, strict mode |
| Frontend | React 19, Vite 8 |
| Routing | TanStack Router (file-based, `src/routes/`) |
| Server state | TanStack Query 5 |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite`), design tokens in `@theme`, `cn()` helper (clsx + tailwind-merge) |
| UI components | `I*` design system in `apps/web/src/core/components/`: native HTML + Radix primitives (Slot, Dialog, Tabs, Dropdown Menu, Switch, Popover) |
| Toasts | Sonner, wrapped as `IToaster` + `notify` |
| Forms | react-hook-form + `@hookform/resolvers` (Zod 4) |
| Client state | Zustand, only for cross-route client state (the patient intake draft, memory only) |
| Email | Resend REST API (plain `fetch`), optional |
| Compiler | React Compiler 1.0 (Babel preset via `@rolldown/plugin-babel`) |
| Font / icons | Hanken Grotesk Variable (`@fontsource-variable`), Lucide React |
| API | Hono 4 (`@hono/node-server` locally, native `fetch` handler on Workers) |
| Validation | Zod 4, shared between web and API via `@ingest-form/shared` |
| Database | PostgreSQL: Docker locally, Neon in the cloud |
| ORM | Prisma 7 (`prisma-client` generator, `@prisma/adapter-pg` / `@prisma/adapter-neon`) |
| File storage | None yet: uploads are read in memory and dropped. Planned: Cloudflare R2 or AWS S3 (see [File Uploads](#file-uploads)) |
| Auth | TBD - Planned gap, expected OAuth 2.0 infra |
| Testing | Vitest 5, Testing Library, jsdom |
| Deploy | Wrangler 4 (API), static hosting for web (TBD) |

## Project Structure

```
ingest-form/
├── apps/
│   ├── api/                          # @ingest-form/api — Hono API
│   │   ├── prisma/                   # schema.prisma + migrations/
│   │   ├── prisma.config.ts          # Prisma 7 config: schema path, DATABASE_URL
│   │   ├── wrangler.jsonc            # Cloudflare Worker config (vars, rate-limit bindings)
│   │   └── src/
│   │       ├── app.ts                # Composition root: buildDeps() + createApp()
│   │       ├── server.ts             # Node entry (local dev, port 8300)
│   │       ├── worker.ts             # Cloudflare Workers entry
│   │       ├── core/                 # config/, db/, errors/, http/, security/ (keys, rate limits, file types)
│   │       ├── features/
│   │       │   ├── health/           # GET /api/health
│   │       │   ├── ingest/           # pipeline runner, six steps, duplicates, repositories
│   │       │   ├── ingest-api/       # POST /api/v1/ingest: key auth, limits
│   │       │   ├── intake-api/       # POST /api/v1/intake and /extract, document extraction
│   │       │   ├── intake-settings/  # Admin → General upload limits
│   │       │   ├── notifications/    # Resend sender, email templates, notification addresses
│   │       │   └── admin-ingest/     # /api/admin providers, keys, submissions, re-runs
│   │       └── generated/            # Prisma clients (gitignored)
│   └── web/                          # @ingest-form/web — React app
│       ├── vite.config.ts            # Port 8301, /api proxy → 8300
│       └── src/
│           ├── styles.css            # Tailwind entry + design tokens (@theme), focus, type scale
│           ├── app/                  # Router, QueryClient, providers; layouts/ (PatientLayout, AdminLayout)
│           ├── routes/               # File routes. _patient/ and _admin/ are pathless layout routes
│           ├── core/                 # components/ (I* design system), lib/ (cn, api-client, notify), testing/
│           └── features/
│               ├── home/             # root page with the two entry cards
│               ├── patient-upload/   # start page of the patient flow
│               ├── patient-intake/   # document → details → submitting → complete
│               ├── admin-settings/   # settings page: General (uploads, notifications) + tabs
│               ├── providers-admin/  # API providers and keys
│               ├── ingest-admin/     # Ingested forms and Duplicate submissions tabs
│               ├── component-library/# living catalogue of every I* component
│               └── health/           # ApiStatus pill
├── packages/
│   └── shared/                       # @ingest-form/shared — Zod schemas + types (source-exported)
├── services/ocr-sidecar/             # Optional local PaddleOCR server (Python)
├── scripts/e2e-ingest.mjs            # End-to-end run against a live API
├── assets/                           # Source intake forms and a diagram preview
├── ai-context/                       # Diagrams, guides, research, feature specs, progress
├── .claude/rules/                    # Project conventions for Claude Code
├── docker-compose.yml                # Local Postgres (port 8303)
├── turbo.json
└── .env.example
```

Every feature keeps its tests in its own `test/` folder as `*.spec.ts` (or `*.spec.tsx`). See [Testing](#test).

## Getting Started

### Prerequisites

- **Node.js 22.12 or newer.** Prisma 7 and Vite 8 refuse older versions. With nvm: `nvm install 22` (`.nvmrc` pins the major).
- **pnpm 9.** `corepack enable` picks up the version from `packageManager` in `package.json`.
- **Docker**, for the local Postgres.
- **Wrangler login** only for deploying the API (`pnpm --filter @ingest-form/api exec wrangler login`).

### Environment Variables

One `.env` at the repo root serves every app. Copy the example:

```bash
cp .env.example .env
```

| Variable | Required | Used by | Description |
|----------|----------|---------|-------------|
| `BE_PORT` | No | api | Node dev server port (default: `8300`) |
| `FE_PORT` | No | web | Vite dev and preview port (default: `8301`) |
| `DB_STUDIO_PORT` | No | api | Prisma Studio port (default: `8302`) |
| `DB_PORT` | No | docker | Host port for local Postgres (default: `8303`) |
| `WORKER_DEV_PORT` | No | api | Reference only; `wrangler dev` port is set in `wrangler.jsonc` (`8304`) |
| `NODE_ENV` | No | api | `development` \| `test` \| `production` (default: `development`) |
| `DATABASE_URL` | For DB work | api, Prisma CLI | Postgres connection string. Local Docker URL in the example; Neon URL in the cloud |
| `ALLOWED_ORIGINS` | Yes in prod | api | Pipe-separated CORS origins, e.g. `http://localhost:8301\|https://app.example.com` |
| `VITE_API_URL` | Yes in prod | web | API origin. Empty in dev (Vite proxies `/api`). Baked in at build time |
| `POSTCODES_IO_BASE_URL` | No | api | Geocoder base URL (default: `https://api.postcodes.io`) |
| `RESEND_API_KEY` | No | api | Resend API key for success and failure emails. Secret: `wrangler secret put RESEND_API_KEY` on Workers |
| `RESEND_FROM_EMAIL` | With the key | api | Sender on a domain verified in Resend, e.g. `Bookable <notifications@yourdomain.com>`. Emails are skipped unless both are set |
| `ADMIN_BASE_URL` | No | api | Admin panel origin for the link in each email, e.g. `http://localhost:8301` |
| `OCR_SIDECAR_URL` | No | api | PaddleOCR sidecar, e.g. `http://127.0.0.1:8307`. Without it only PDFs with their own text are read (see "Setting up AI OCR") |
| `OCR_SIDECAR_TIMEOUT_MS` | No | api | How long to wait for one page of OCR (default: `120000`) |
| `R2_*` | TBD | api | File storage credentials, commented out until uploads are built |

The API validates its variables with Zod at startup (`apps/api/src/core/config/env.ts`) and exits with a readable error if any are invalid.

**Workers do not read `.env`.** For `wrangler dev`, put secrets in `apps/api/.dev.vars` (gitignored). For deployed Workers, use `wrangler secret put DATABASE_URL`. Non-secret vars live under `vars` in `wrangler.jsonc`.

### Install & Run

```bash
pnpm install
pnpm db:up           # Start local Postgres (Docker, port 8303)
pnpm dev             # Generate clients, then start API + web
```

The web app opens at `http://localhost:8301`: a Bookable header with the live API status pill, and two entry cards. The API runs at `http://localhost:8300` (`GET /api/health`).

Run one app at a time:

```bash
pnpm dev:api         # API only (Node, port 8300)
pnpm dev:web         # Web only (port 8301, proxies /api to 8300)
pnpm --filter @ingest-form/api dev:worker   # API on the real Workers runtime (wrangler, port 8304)
```

### Database

```bash
pnpm db:up           # docker compose up -d
pnpm generate        # prisma generate (+ TanStack route tree). Run after every schema change
pnpm db:migrate      # prisma migrate dev against DATABASE_URL (local Docker)
pnpm db:studio       # Prisma Studio on port 8302
pnpm db:down         # Stop Postgres (data survives in the named volume)
```

Migrations run against the local Docker database only. Neon migrations are a deliberate, separate step (TBD).

### Build

```bash
pnpm build           # web → apps/web/dist, api → apps/api/dist (wrangler dry-run bundle)
pnpm typecheck       # tsc across all packages
```

### Test

```bash
pnpm test            # Vitest in every package
pnpm --filter @ingest-form/web test:watch
```

Tests live in a `test/` folder inside the feature they cover, named `*.spec.ts` (`*.spec.tsx` for components). The suite is deliberately small (about 30 functional tests over the key flows). API tests call the Hono app in memory; no server or database needed. Details and the flow list: `.claude/rules/testing.md`.

End-to-end check of the ingest API against a running server, the real database and postcodes.io (creates a provider and key, sends the three example payloads plus dirty ones, checks re-run, duplicates, auth, limits):

```bash
node scripts/e2e-ingest.mjs http://localhost:8300   # Node dev server
node scripts/e2e-ingest.mjs http://localhost:8304   # wrangler dev (Workers runtime)
```

## Setting up AI OCR

Uploaded documents are read in two layers (FEAT-005, research in
`ai-context/research/OCR-AI-form-extraction.md`):

1. **Native PDF reading, always on.** A PDF filled in on a computer (typed annotations, a
   fillable form, a text layer) is read directly inside the API: no AI, no setup, well under a
   second.
2. **PaddleOCR, optional.** Photos, scans, and PDFs where layer 1 finds fewer than 3 fields go
   to a local OCR service, `services/ocr-sidecar`. It is a Python process running the PaddleOCR
   PP-OCRv6 models on the CPU. Without it, those uploads return no fields and the patient types
   their details.

Either way the patient checks every pre-filled field before submitting.

### Minimum machine

The sidecar was measured on a MacBook Air M2 with 24GB: **3.9-4.2GB peak memory per page**,
about 850MB idle once loaded, and **about 37 seconds per page** on the CPU. To run it:

| | Minimum | Measured on |
|---|---|---|
| RAM | **16GB**, with about 5GB free for the sidecar | 24GB M2 |
| CPU | 64-bit Apple silicon (M1 or later), or x86-64 with AVX2 | M2 (8 cores) |
| Disk | 1.2GB: 960MB Python venv, 130MB models in `~/.paddlex` | |
| Python | 3.12 (native arm64 on Apple silicon, not Rosetta) | 3.12.2 |

**Don't run it on an 8GB machine, or alongside another AI model.** The sidecar serves one request
at a time and downscales photos to 2400px on the long side to keep memory bounded.

### Setup

```bash
pnpm ocr:setup    # creates services/ocr-sidecar/.venv, installs requirements.txt (~1GB)
pnpm ocr:start    # loads the models (first run downloads ~130MB), listens on 127.0.0.1:8307
```

Then set `OCR_SIDECAR_URL=http://127.0.0.1:8307` in `.env` and restart the API. For `wrangler
dev`, add the same line to `apps/api/.dev.vars`. Stop the sidecar with Ctrl-C when you're not
using it: it holds about 850MB while idle.

### Checking it works

Upload a document on `/patient-upload` and open **View developer data** on the details step. The
`extractor` field names the layers that ran: `pdf-native`, `paddleocr`, `pdf-native+paddleocr`,
or `none`. `(ocr unavailable)` means OCR was needed but the sidecar wasn't set up or didn't
answer. The API logs `[intake] OCR layer skipped: …` in that case, never the document contents.

### Caveats

- **Tested on the GMS1 only.** The other four forms have template profiles (built from the blank
  PDFs) but no scored run yet.
- **Real handwriting is untested.** The benchmark used a handwriting font as a stand-in.
- **About 40 seconds per photo** on a laptop CPU. The document step tells the patient it can
  take up to a minute.
- **Page 1 only.**
- **Values written over a printed label** can lose the overlapping words.
- **Not deployable as it is.** A deployed Worker can't reach `127.0.0.1`: the sidecar needs a
  private host (and an ADR, per `security-and-data.md`) before production use. Layer 1 works
  in the Worker.

## Ports

Block **8300-8309**, registered in `~/Developer/.claude/rules/port-registry.md`.

| Port | Service |
|------|---------|
| 8300 | API (Node dev server) |
| 8301 | Web (Vite, `strictPort`) |
| 8302 | Prisma Studio |
| 8303 | Postgres (Docker) |
| 8304 | API on `wrangler dev` |
| 8307 | PaddleOCR sidecar (optional, `pnpm ocr:start`, 127.0.0.1 only) |

## Architecture

- **Feature-first**: code is grouped by feature (`features/<name>/`), then by role inside it.
- **API layers**: `routes` (HTTP only) → `service` (business rules) → `repository` (Prisma only). Services depend on interfaces; `buildDeps()` in `app.ts` is the single composition root.
- **One app, two runtimes**: `createApp()` knows nothing about Node or Workers. `server.ts` and `worker.ts` are thin adapters, so moving to AWS Lambda means adding one more.
- **Shared contracts**: request and response schemas live in `packages/shared`. The web app parses every response against them.

Full rules: `.claude/rules/architecture.md` and `.claude/rules/api-conventions.md`.

## API Endpoints

All routes are prefixed with `/api`. Responses use `{ data }` on success and `{ error: { code, message, details? } }` on failure.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Liveness, no DB access |
| GET | `/api/v1/intake/settings` | Upload settings for the patient document step |
| POST | `/api/v1/intake/extract` | Patient document upload, returns extracted fields |
| POST | `/api/v1/intake` | Patient submission (public), runs the ingest pipeline |
| POST | `/api/v1/ingest` | Third-party intake with a provider API key, runs the ingest pipeline |
| GET / PUT | `/api/admin/settings/intake` | Admin upload settings |
| GET / PUT | `/api/admin/settings/notifications` | Success and failure email addresses |
| GET / POST | `/api/admin/providers`, `/api/admin/providers/:id/keys`, `/api/admin/keys/:id/revoke` | Providers and API keys |
| GET / POST | `/api/admin/submissions`, `/duplicates`, `/:id`, `/:id/rerun`, `/rerun-failed` | Ingested submissions, duplicates, re-runs |

Admin routes have **no authentication** in this POC. Do not deploy with real patient data before admin sign-in exists.

Response shapes, limits, the six-step ingest pipeline, re-runs, duplicate rules and the patient intake flow: [`ai-context/guides/backend/api-architecture.md`](ai-context/guides/backend/api-architecture.md). Diagrams: [`ai-context/diagrams/`](ai-context/diagrams/).

## File Uploads

Uploaded files are **not stored**. `POST /api/v1/intake/extract` reads the file into memory, checks its real type by magic bytes and its size against Admin → General, extracts the form fields (native PDF reading, then the optional local OCR sidecar), returns them and drops the bytes. There is no bucket, no presigned URL and no file table.

Planned: the browser uploads directly to a private bucket (Cloudflare R2 or AWS S3) using short-lived presigned URLs; the API validates type and size before issuing, then checks magic bytes on confirmation. See `.claude/rules/security-and-data.md`.

## Deployment

Web and API deploy separately.

| App | Target | Command | Status |
|-----|--------|---------|--------|
| API | Cloudflare Workers | `pnpm --filter @ingest-form/api deploy:worker` | Config in place, not yet deployed |
| Web | Static hosting (Cloudflare Pages or Workers static assets) | `pnpm --filter @ingest-form/web build` | TBD |

- Set `VITE_API_URL` to the API origin before building the web app.
- Set `ALLOWED_ORIGINS` (in `wrangler.jsonc` vars) to the deployed web origin.
- AWS Lambda alternative: `ai-context/guides/backend/deploy-to-aws.md`.

## Design

NHS design system tokens as Bookable uses them, softened with rounded cards and soft shadows. Every user-facing page follows `.claude/rules/design-patterns.md`.

- **Colours**: NHS blue `#005eb8` header and links, green `#007f3b` primary action, yellow `#ffeb3b` focus, `#f0f4f5` page, white cards. Tokens live only in `apps/web/src/styles.css`.
- **Type**: Hanken Grotesk 400/600, NHS responsive scale (body 16px mobile, 19px desktop; h1 32/48px).
- **Two surfaces**: patient pages (NHS consumer style, `_patient` layout) and admin pages (dense dashboard style, `_admin` layout, `data-surface="admin"`). Same components, different density.
- **Components**: 38 `I*` components in `apps/web/src/core/components/`, browsable at `/admin/settings?tab=components`. Native HTML first, Radix primitives only where HTML falls short. Naming rules: `.claude/rules/code-conventions.md`.
- **Mobile**: mobile-first Tailwind breakpoints (CSS media queries only), full-width buttons below 768px, 48px controls, 16px minimum input text, `min-h-dvh`, safe-area insets.
- **Discovery**: `ai-context/tracking/discovery/DISC-001-ui-nhs-design-system.md`

## Project Notes

Built by Arjun Shankar using a spec-driven workflow: every feature starts as a written spec in `ai-context/tracking/features/` (FEAT-NNN), with decisions, phases and verification steps, so each change is reproducible and reviewable. AI assistance was used during development.

| Path | Holds |
|------|-------|
| `CLAUDE.md` | Project summary and conventions index |
| `.claude/rules/` | Architecture, API, testing, security and design conventions |
| `ai-context/tracking/features/` | `FEAT-NNN` feature specs: problem, decisions, phases, verification |
| `ai-context/tracking/discovery/` | `DISC-NNN` design and architecture explorations |
| `ai-context/tracking/PROGRESS.md` | Active and completed work |
| `ai-context/guides/` | Setup and deployment runbooks, API architecture (`backend/api-architecture.md`) |
| `ai-context/diagrams/` | draw.io diagrams: ingest API flow, database schema, front end to back end |
| `ai-context/research/` | Research notes (OCR and form extraction) |

## License

TBD.
