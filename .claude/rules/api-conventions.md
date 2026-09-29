# API conventions

Applies to `apps/api` and to how `apps/web` calls it.

## Routing

- Every route lives under `/api`. Each feature mounts its router in `createApp()`: `app.route('/api/<feature>', createXRoutes(deps.xService))`.
- Resource paths are plural nouns in kebab-case: `/api/intake-forms/:id/uploads`.
- `GET /api/health` is liveness only and must not touch the database. A readiness check goes on `GET /api/health/ready`.

## Third-party ingest endpoint (FEAT-001)

- `POST /api/v1/ingest` is versioned (`/v1`) because external suppliers integrate against it; breaking changes get `/v2`.
- It **stores the body before parsing it**, so nothing a supplier sends is lost. Parsing and every business rule happen in pipeline steps, not in the route.
- It answers `202` once the body is stored, with the outcome in `data` (`status`, `failedStep`, `issues`), because a failed record can still succeed after a fix and re-run. Transport problems keep their own codes: `401`, `413`, `429`.
- Pipeline steps return `{ status, output, issues }` and never throw for expected problems; issue `code`s are stable SCREAMING_SNAKE (`INVALID_MOBILE`, `POSTCODE_TERMINATED`). A thrown error becomes `STEP_CRASHED`.
- `/api/admin/*` is unauthenticated for the POC (see security-and-data.md).

## Response envelope

Every JSON response uses one of two shapes, defined in `packages/shared/src/http/envelope.schema.ts`:

```ts
{ data: T }                                         // success
{ error: { code: string, message: string, details?: unknown } }   // failure
```

- Build them with `ok(c, data)` and `fail(...)` from `core/http/envelope.ts`. Never call `c.json` directly in a route.
- `code` is SCREAMING_SNAKE and stable. Clients branch on `code`, never on `message`.
- `message` is safe to show a user. It never contains stack traces, SQL, or submitted form values.

## Status codes

| Status | When | Code |
|--------|------|------|
| 200 | Read or update succeeded | — |
| 201 | Created | — |
| 204 | Deleted, no body | — |
| 202 | Ingest body stored and processed (outcome in body) | — |
| 400 | Request failed Zod validation, or malformed JSON | `VALIDATION_ERROR` |
| 401 | Not authenticated | `UNAUTHENTICATED`, `API_KEY_EXPIRED`, `API_KEY_REVOKED` |
| 403 | Authenticated but not allowed | `FORBIDDEN` |
| 404 | Resource or route missing | `NOT_FOUND` |
| 409 | State conflict (duplicate, stale version) | `CONFLICT` |
| 413 | Upload too large | `PAYLOAD_TOO_LARGE` |
| 415 | Upload type not allowed | `UNSUPPORTED_MEDIA_TYPE` |
| 429 | Rate limited (`Retry-After` header set) | `RATE_LIMITED` |
| 500 | Anything unexpected | `INTERNAL_ERROR` |
| 503 | Database not configured | `DATABASE_UNAVAILABLE` |

## Errors

- Throw an `AppError` subclass for any expected failure. `handleError` in `core/errors/error-handler.ts` turns it into the envelope.
- Anything that is not an `AppError` becomes a 500 with a generic message. The real error is logged with method and path only.
- Services throw `AppError`s; they never build responses. Routes never `try/catch` just to reformat an error.

## Validation

- Request input is validated with `validate(target, schema)` from `core/http/validate.ts` (`json`, `query`, `param`, `form`, `header`).
- Read validated input with `c.req.valid(target)`. Never read `c.req.json()` unvalidated.
- Request schemas that the web app also uses (forms) live in `packages/shared`. API-only schemas may live in the feature folder.

## Config

- Only `core/config/env.ts` reads environment input. Everything else receives `AppConfig` through `buildDeps()`.
- `process.env` is never read inside `src/` except in `server.ts`. On Workers, bindings are passed to `loadConfig(env)`.
- New env var = add it to the Zod schema, to `.env.example`, to the README env table, and (for secrets) to `.dev.vars` / `wrangler secret put`.

## Web client

- The web app calls the API only through `apps/web/src/core/lib/api-client.ts`, and only from a feature's `api/` folder.
- Every response is parsed with its shared schema before it reaches a component.
- Server state lives in TanStack Query. `queryOptions` objects are the unit of reuse; components call `useQuery(xQueryOptions)`.
