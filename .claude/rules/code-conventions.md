# Code conventions (project overrides)

The workspace rule `~/Developer/.claude/rules/code-conventions.md` applies. This file adds the
ingest-form rules on top, and where the two disagree, this file wins for this repo.

## UI components: the `I*` design system

- **Every reusable UI primitive lives in `apps/web/src/core/components/`** and is named with an `I` prefix.
  The live catalogue is the admin "UI component library" tab (`/admin/settings?tab=components`); every new
  `I*` component gets a demo there in the same change.
- **File name = export name, PascalCase:** `core/components/IButton.tsx` exports `IButton`.
  This is a deliberate exception to the workspace kebab-case file rule, for `core/components/` only.
  Everything else (features, lib, routes, tests helpers) stays kebab-case.
- Props interfaces are `<Component>Props` (`IButtonProps`). The workspace rule against `I`-prefixed
  *interfaces* still holds for every non-component type: `UserContext`, not `IUserContext`.
- Sub-parts live in the same file and share the prefix: `ICard`, `ICardHeading`, `ICardBody`, `ICardLink`.
- Variants are a string-union prop (`variant: 'primary' | 'secondary'`) mapped through a
  `Record<Variant, string>` of classes. No boolean flags per variant (`primary`, `isSecondary`).
- Composition over configuration: use `asChild` (Radix `Slot`) to style a router `Link` as a button
  or back link, instead of adding `href`/`to` props to every component.
- React 19: `ref` is a normal prop. Don't use `forwardRef`.
- Every `I*` component has a demo in the component library; the library's smoke test renders them all. Individual component specs are not required (see testing.md: the suite covers key flows only).

## Building on libraries

- **Native HTML first.** `button`, `input`, `select`, radios, checkboxes, `details` are wrapped, not replaced.
- **Radix primitives** only where HTML has no accessible equivalent (dialog, popover, tooltip,
  dropdown menu, tabs). Install them when first needed, and wrap them as `I*`.
- **Any third-party UI component is wrapped and restyled to the design tokens before use.** Features
  never import a UI library (Radix, shadcn, Flowbite, a date picker) directly; they import the `I*` wrapper.
- No shadcn. Its generated components carry their own theme and would be rewritten line by line anyway.

## Features use the design system, they don't restyle it

- Feature components compose `I*` components and Tailwind layout utilities (`flex`, `grid`, `gap-*`,
  `max-w-2xl`). They don't style raw form controls, buttons or cards themselves.
- If a feature needs a new visual pattern, add it to `.claude/rules/design-patterns.md` and `core/components/` first.
- **No hex values outside `apps/web/src/styles.css`.** Colours come from token utilities (`bg-brand`, `text-text-secondary`).
- **Responsiveness is CSS only**: Tailwind breakpoint prefixes (media queries). No user-agent sniffing, no
  `useMediaQuery`/`window.innerWidth` for layout, no separate mobile and desktop component trees.
- A component that sets a link's text colour must also set `focus-visible:text-text` (see design-patterns.md "Focus").

## Web folder names

| Folder | Holds |
|--------|-------|
| `app/` | Router, query client, providers, `app-meta.ts` |
| `core/components/` | `I*` design system |
| `core/lib/` | `cn()`, `api-client` |
| `core/testing/` | Spec helpers (`renderWithRouter`) |
| `core/lib/notify.ts` | The only toast API |
| `app/layouts/` | `PatientLayout`, `AdminLayout` (rendered by the `_patient` / `_admin` layout routes) |
| `features/<name>/` | Feature pages and UI, composed from `I*` |
| `routes/` | Thin TanStack file routes |

## Feature anatomy

A feature owns one capability end to end. Create only the folders it needs. This is the canonical
shape, using the planned patient intake flow as the example:

```
apps/web/src/features/patient-intake/
  components/     intake-triage-step.tsx, intake-upload-step.tsx, intake-summary.tsx
                  UI composed from I*. One exported component per file.
  hooks/          use-intake-steps.ts
                  Feature logic that combines store + router + queries. No JSX.
  api/            intake.api.ts        fetchers: apiGet/apiPost + shared schema, nothing else
                  intake.queries.ts    queryOptions factories (keys live here, nowhere else)
                  intake.mutations.ts  mutationOptions factories (invalidation lives here)
  schemas/        triage-form.schema.ts
                  Web-only form schemas. Wire contracts live in packages/shared/src/intake/.
  store/          intake-draft.store.ts
                  Zustand. Memory only. Only if state must survive route changes.
  constants.ts    INTAKE_STEPS, MAX_FILE_SIZE_MB (as const)
  types.ts        Feature-internal types, mostly z.infer aliases
  utils/          format-file-size.ts  pure functions, no React
  test/           *.spec.ts(x) mirroring the files above

apps/web/src/routes/_patient/patient-upload/   index, triage, documents, check, confirmation (thin)
apps/api/src/features/intake/                  intake.routes.ts, intake.service.ts, intake.repository.ts, test/
packages/shared/src/intake/intake.schema.ts    request/response schemas shared by web and api
```

- Route files map URL (path params, `validateSearch`) to props and render one feature component.
- Components never call `fetch` or the API client; they use `useQuery(xQueryOptions)` / `useMutation(xMutationOptions)`.
- A feature imports another feature only to render its exported component (as the layouts render `ApiStatus`).

## State: where each kind lives

| Kind of state | Where | Example |
|---------------|-------|---------|
| Server data | TanStack Query (`queryOptions` in `api/`) | health status, submitted uploads |
| Anything that should survive refresh or be linkable | URL: `validateSearch` (Zod) or path params | active settings tab, list filters, flow step |
| Client state shared across routes | Zustand store in `features/<x>/store/` | patient intake draft between steps |
| Form state | react-hook-form | intake settings form |
| Local UI state | `useState` in the component | preview surface toggle, open/closed |

Zustand rules. **Reference store:** `apps/web/src/features/patient-intake/store/intake-draft.store.ts`
(`useIntakeDraftStore`): typed state + actions in one `create<State>()(...)`, no `persist`, a
`startIntakeDraft()` helper for callers outside React, and route guards that read it with `getState()`
in `beforeLoad` (`utils/require-intake-draft.ts`). Copy its shape for the next store.
- File `<name>.store.ts`, hook `use<Name>Store`. One store per concern, inside the feature that owns it.
- **Read with atomic selectors**: `useIntakeDraftStore((s) => s.answers)`. Never destructure the whole store (every change re-renders every consumer).
- Actions live in the store next to the state they change. Outside React, use `useXStore.getState()`.
- **Never copy server data into a store**; that is TanStack Query's job.
- **Never `persist` patient data** (localStorage/sessionStorage outlive the tab and are readable by any script). Patient drafts stay in memory; a refresh restarts the flow.

## Forms

- react-hook-form + `@hookform/resolvers/zod`. Type the form from the schema: `useForm<IntakeSettingsValues>({ resolver: zodResolver(schema) })`. Never `Control<any>`.
- Schema in `features/<x>/schemas/` (web-only) or `packages/shared` (when the API validates the same shape).
- Bind native `I*` controls with `register` inside `IFormField`'s render prop: `{(field) => <IInput {...field} {...register('name')} />}`. Radix controls (`ISwitch`) use `Controller`. `IRadios` takes `inputProps={register('name')}`.
- `shouldFocusError: false` and render `IErrorSummary` after a failed submit (NHS pattern: focus goes to the summary).
- Hooks are never called conditionally.
- Simple forms that don't need field-level state may use React 19 `useActionState` + `safeParse` instead.

## Toasts

- Only `notify.success | info | warning | error | promise` from `core/lib/notify.ts`. Never import `sonner` in a feature.
- `IToaster` is mounted once in `AppProviders`. Never put patient data in a toast message.
- Toasts confirm or report; they never carry the only copy of an instruction. Form errors use `IErrorSummary`, not toasts.

## Icons

- **Lucide only** (`lucide-react`). No react-icons, tabler, heroicons or icon fonts.
- Decorative icons get `aria-hidden="true"`. An icon-only button gets an `aria-label` (or visually hidden text).
- Size with classes (`size-4` admin, `size-5`/`size-6` patient); `IButton` sizes child icons to the text.

## Typography

- Use `IHeading level={1-4}` and `IText` (`as`, `asChild`, `size`, `weight`, `tone`, `truncate`), mirroring Radix Themes `Heading`/`Text`.
- Features don't set font sizes or families with raw classes. Sizes come from surface variables, so the same `IText size="sm"` is right on both surfaces.
- The font (Hanken Grotesk Variable) is imported once in `styles.css`. Never import a font anywhere else.

## Types

- Wire and form types are `z.infer` of a schema. Don't hand-write a type that a schema already describes.
- **No TypeScript `enum`**: use `as const` arrays or objects plus a derived union (`SETTINGS_TABS` → `SettingsTab`). Enums are not erasable syntax and add runtime objects.
- `interface` for props and object shapes, `type` for unions and derived types (workspace rule).
- No central `types/` folder: types live next to the code that owns them (`features/<x>/types.ts`, `packages/shared`).

## React 19

- The **React Compiler** is on (`vite.config.ts`, Babel preset). Don't add `useMemo` / `useCallback` / `memo` unless a profile shows a problem.
- `ref` is a normal prop; no `forwardRef`. Provide context with `<Ctx value={...}>`, not `<Ctx.Provider>`.
- `useEffect` only for syncing with something outside React (focus, DOM measurement, subscriptions). Derived values are computed during render.
- Server Components and Server Actions don't apply: this is a Vite SPA talking to a separate API.
