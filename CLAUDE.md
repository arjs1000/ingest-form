# ingest-form

Front end for ingesting medical-product intake forms, with file uploads, plus a serverless API.
Product description: TBD.

## Stack

- **Monorepo**: Turborepo + pnpm 9, Node >= 22.12
- **Web** (`apps/web`): React 19, Vite 8, TanStack Router (file-based) + Query, Tailwind CSS 4, `I*` design system in `core/components/` (native HTML + Radix Slot, Hanken Grotesk, Lucide)
- **API** (`apps/api`): Hono on Cloudflare Workers (Node locally), Prisma 7 with driver adapters
- **Shared** (`packages/shared`): Zod 4 schemas and inferred types used by both apps
- **Tests**: Vitest everywhere

## Rules (read before writing code)

| File | Covers |
|------|--------|
| `.claude/rules/architecture.md` | Feature folders, layers, SOLID, dependency direction |
| `.claude/rules/api-conventions.md` | Routes, response envelope, status codes, errors, validation |
| `.claude/rules/testing.md` | `test/` folders, `*.spec.ts`, fakes over mocks, per-layer strategy |
| `.claude/rules/security-and-data.md` | Patient data handling, uploads, logging |
| `.claude/rules/code-conventions.md` | `I*` component naming and placement, wrapping UI libraries |
| `.claude/rules/design-patterns.md` | Visual design (NHS/Bookable style). **Every user-facing page follows it.** |

Workspace rules in `~/Developer/.claude/rules/` also apply (code, frontend, deployment, worktrees, ports).
Where they conflict (shadcn/ui, kebab-case component files), this repo's rules win.

## Two surfaces: patient and admin

The web app has two deliberately different styles, built from the **same** `I*` components:

| Surface | Routes | Style |
|---------|--------|-------|
| **Patient** | under `routes/_patient/` (`PatientLayout`) | NHS consumer style: blue header, back bar, footer disclaimer, big controls, green primary button, one question per page, no modals |
| **Admin** | under `routes/_admin/` (`AdminLayout`, `data-surface="admin"`) | Expert dashboard style: white top bar, sidebar, tabs, dense 14px text, 36px controls, blue flat primary, dialogs and dropdown menus allowed |

- Put a page under the folder of its audience; the layout route applies the surface. Never add a "mode" prop to a component.
- Both surfaces keep the NHS yellow focus, the tokens, Hanken Grotesk, Lucide icons and WCAG 2.2 AA.
- Every shared component is shown at `/admin/settings?tab=components`, with a patient/admin preview toggle. Add a demo there with every new `I*` component.
- Details: `.claude/rules/design-patterns.md` ("Surfaces").

## Dev

```bash
export PATH="$HOME/.nvm/versions/node/v22.23.3/bin:$PATH"   # Node >= 22.12 required
pnpm install
pnpm db:up          # Docker Postgres on 8303
pnpm dev            # API 8300 + web 8301
pnpm test && pnpm typecheck && pnpm build
```

Ports: block **8300-8309** (API 8300, web 8301, Prisma Studio 8302, Postgres 8303, wrangler dev 8304, OCR sidecar 8307).
Check `~/Developer/.claude/rules/port-registry.md` before starting anything.

## Database

- Local: Docker Postgres (`docker-compose.yml`). Cloud: Neon.
- **Never run migrations or queries against Neon unless explicitly asked.**
- After any `schema.prisma` change: `pnpm generate`. Migrations: `pnpm db:migrate`.
- Prisma client is generated into `apps/api/src/generated/` (gitignored). Only repositories import it.

## Conventions

- Strict TypeScript, named exports, extensionless local imports (`from './app'`, `from '@/core/components/IButton'`; `moduleResolution: bundler`), kebab-case files.
- Zod at every boundary. Cross-app types come from `packages/shared` via `z.infer`, never hand-copied.
- One root `.env` for all apps (copy `.env.example`). Never read or print `.env` contents.
- Tracking lives in `ai-context/tracking/` (PROGRESS.md, DISC/FEAT/FIX/ADR docs).
