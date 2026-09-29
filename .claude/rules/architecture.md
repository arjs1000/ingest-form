# Architecture

How code is organised in ingest-form. Workspace-wide rules still apply on top of this file:
`~/Developer/.claude/rules/code-conventions.md` (TypeScript, naming, imports, errors) and
`~/Developer/.claude/rules/frontend-conventions.md` (React, Tailwind, accessibility).
Project overrides for UI components (`I*` naming, library wrapping) are in `.claude/rules/code-conventions.md`.

## Monorepo

| Package | Path | Owns |
|---------|------|------|
| `@ingest-form/web` | `apps/web` | The React app. Talks to the API over HTTP only. |
| `@ingest-form/api` | `apps/api` | The Hono API. The only package that touches the database. |
| `@ingest-form/shared` | `packages/shared` | Zod schemas and inferred types used by both apps. No runtime code beyond schemas. |

- `web` and `api` never import each other. Anything both need goes in `packages/shared`.
- `packages/shared` exports TypeScript source (`"exports": "./src/index.ts"`). There is no build step; each app's bundler compiles it.
- Web and API deploy separately. Neither may assume it runs on the same origin as the other in production.

## Feature-first folders

Code is grouped by feature, then by role inside the feature. A feature is one user-facing capability (`intake-form`, `uploads`, `health`), not a technical layer.

### API (`apps/api/src`)

```
app.ts                     # composition root: buildDeps() + createApp()
server.ts | worker.ts      # runtime entries. Node dev and Cloudflare Workers. No logic.
core/                      # cross-cutting, feature-agnostic
  config/                  # Zod env schema, loadConfig()
  db/                      # Prisma client factory
  errors/                  # AppError family, onError / notFound handlers
  http/                    # response envelope, validate() middleware
features/<feature>/
  <feature>.routes.ts      # HTTP only: validate input, call service, shape response
  <feature>.service.ts     # business rules. No Hono, no Prisma.
  <feature>.repository.ts  # data access only. Prisma lives here and nowhere else.
  <feature>.types.ts       # feature-internal types (optional)
  test/<name>.spec.ts
generated/                 # Prisma client output. Never edit, never commit.
```

### Web (`apps/web/src`)

```
main.tsx                   # mounts <AppProviders />
styles.css                 # design tokens (@theme), base type, focus
app/                       # router, query client, providers, app-meta
  layouts/                 # PatientLayout, AdminLayout
routes/                    # TanStack Router file routes. Thin: map a URL to a feature component.
  __root.tsx               # <Outlet/> only
  _patient.tsx, _patient/  # pathless layout route: NHS patient surface
  _admin.tsx, _admin/      # pathless layout route: admin surface, auth gate in beforeLoad
core/
  components/I*.tsx        # design system (see design-patterns.md, code-conventions.md)
  lib/                     # cn(), api-client
  testing/                 # spec helpers
features/<feature>/
  components/              # feature UI composed from I* (kebab-case files, PascalCase exports)
  hooks/                   # use* hooks that combine queries, mutations and local state
  api/                     # queryOptions / mutation fns. The only place that calls the API client.
  schemas/                 # form schemas that are web-only (shared contracts live in packages/shared)
  test/<name>.spec.ts(x)
```

### Layouts, providers and routing

- **Layouts are pathless layout routes**, never wrapped inside page components. `routes/_patient.tsx`
  renders `PatientLayout`, `routes/_admin.tsx` renders `AdminLayout`; child routes render inside `<Outlet/>`.
  Adding a page to a surface means adding a file under that folder.
- **Auth is checked once, in `beforeLoad`** of the layout route (throw `redirect`). Never again in a
  layout `useEffect`.
- **Provider order** (`app/providers.tsx`): `QueryClientProvider` → `RouterProvider`,
  with `IToaster` beside the router so toasts survive navigation.
- The router context carries `queryClient`, so route loaders can prefetch with `queryClient.ensureQueryData(xQueryOptions)`.
- Layouts use `min-h-dvh` and let the document scroll. No `h-screen` + nested `overflow-y-auto` containers.

### Database access on two runtimes

- Prisma generates **two clients** from one schema: `src/generated/prisma` (Node: dev server, tests, scripts) and `src/generated/prisma-worker` (workerd). Neither runs on the other runtime.
- Code imports **`#prisma`** only. `apps/api/package.json` `imports` maps it to the workerd client under the `workerd` condition (wrangler) and the Node client by default.
- The **Worker builds the app per request** (`worker.ts`) and disconnects afterwards (`dispose` via `ctx.waitUntil`): Workers cannot reuse a TCP connection opened during another request. Node builds the app once.

## Layer rules

| Layer | May import | Must not |
|-------|------------|----------|
| routes | its service interface, `core/http`, shared schemas | Prisma, other features' internals |
| service | its repository interface, other services' interfaces (injected), shared types | Hono, Prisma, `process.env` |
| repository | the Prisma client, feature types | business rules, HTTP concerns |
| web route file | one feature component | fetching, state, markup beyond layout |
| web component | its feature's hooks and `api/`, `core/` | `fetch`, the API client directly, UI libraries directly |

Dependency direction is always inward: `features -> core | shared`. `core` never imports a feature.

**No cross-feature reach-ins.** A feature must not import another feature's `repository`, internal types or components by deep path. If two features need the same thing, move it to `core/` (in-app) or `packages/shared` (cross-app). The one allowed case is composing another feature's exported *component*, as the layouts do with `health`'s `ApiStatus`.

## SOLID, made concrete

| Principle | What it means here |
|-----------|--------------------|
| Single responsibility | One reason to change per file. Routes change when the HTTP contract changes, services when a business rule changes, repositories when the schema changes. A file that changes for two of those reasons gets split. |
| Open/closed | New capability = new feature folder mounted in `createApp()`. Do not grow `core/` with feature-specific branches or `switch` statements. |
| Liskov substitution | Every repository has an interface. The Prisma implementation and the in-memory test fake must both satisfy it with the same observable behaviour. |
| Interface segregation | Keep interfaces small and owned by the consumer. A service that only reads submissions depends on `SubmissionReader`, not a 12-method `SubmissionRepository`. |
| Dependency inversion | Services receive dependencies as constructor/factory arguments typed as interfaces. `buildDeps()` in `app.ts` is the only place that instantiates concrete classes. No module-level singletons of services or clients. |

## Clean code rules

- Functions do one thing, and their name says what. If a name needs "and", split the function.
- Prefer factory functions returning an interface (`createHealthService(): HealthService`) over classes. Use a class when it holds state or extends `AppError`.
- No boolean flag parameters that switch behaviour. Write two functions.
- Return early. Maximum nesting depth of 3.
- No magic values: named constants in SCREAMING_SNAKE, or a Zod enum.
- Comments explain *why*, not *what*. Delete commented-out code.
- A file over ~200 lines, or a component over ~150, is a signal to split.

## Boundaries and types

- Zod validates at every boundary: env (`loadConfig`), incoming requests (`validate()`), outgoing responses read by the web app (`apiGet(path, schema)`), and form input.
- Types that cross the wire are `z.infer<>` of a schema in `packages/shared`. Never re-declare them by hand in an app.
- The API response shape is fixed: see `api-conventions.md`.
