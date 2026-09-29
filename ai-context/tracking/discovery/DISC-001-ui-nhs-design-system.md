# DISC-001: UI — NHS-style design system, root page and flow starters

**Status:** Decided
**Created:** 2026-09-27
**Last Updated:** 2026-09-27

## What We're Building

A design system for every user-facing page of ingest-form, modelled on the NHS design system as
Bookable (bookable.health) uses it, plus the first three screens:

- **Root page**: header reading "Bookable" / "Ingest Form POC v0.1" / "created by Arjun Shankar", an API status pill on the right ("API OK" or "API offline" with the reason), and two CTAs.
- **Patient document upload starter** (`/patient-upload`): the future flow is triage questions → document upload → confirmation.
- **Admin medical settings starter** (`/admin/settings`): the future settings page, later behind OAuth/JWT sign-in.

Reusable base components live in `apps/web/src/core/components/` as `I*`-prefixed React components.

## Target User

- **Patients**, mostly on phones, often worried, not technical. They need one question per screen and obvious next steps.
- **Clinic admins**, on desktop, configuring intake defaults.

## Research

- **Reference screenshots:** 9 files in `~/Documents/HealthTech1-Research/`, covering landing, postcode search, "How can we help?", date of birth, the 999 red-flag screen, GP list, practice page, and loading state.
- **Bookable's live CSS** (`bookable.health`) is built on `nhsuk-frontend` classes. Its most-used hex values are the standard NHS tokens: `#212b32` ×302, `#ffeb3b` ×142, `#005eb8` ×126, `#d8dde0` ×72, `#4c6272` ×38, `#f0f4f5` ×30, `#d5281b` ×28, `#007f3b` ×10. The status dot is `#00d663`.
- **Why the screenshots don't match exactly:** decoding the PNGs gives shifted values (`#1c51ae` header, `#177434` button, `#eef2f3` page). That shift comes from the macOS display colour profile, so the CSS values are used.
- **Font:** Bookable sets body text in Frutiger W01, which is licensed to the NHS, and uses Hanken Grotesk for some headings.

## Design Direction

### Option A: Bookable-style (softened NHS) — chosen
- **Visual style**: NHS tokens with rounded 16px white cards, a soft shadow, 6px-radius buttons that keep the NHS 4px solid bottom edge, a blue header plus a lighter Back bar, and a grey page.
- **Color approach**: NHS palette exactly (blue for service and navigation, green for "go", yellow for focus, red for errors).
- **Component library**: native HTML plus Radix primitives where needed, wrapped as `I*`.
- **Mobile strategy**: mobile-first Tailwind breakpoints, full-width buttons below `md`, 48px controls.
- **Complexity**: Low.
- **Stitch mockup**: not generated. The direction was chosen from ASCII previews and the real reference screenshots.

### Option B: NHS.UK faithful
- **Visual style**: nhsuk-frontend as shipped: square cards with a 1px border, no shadows, 4px buttons, a back link on the page background.
- **Color approach**: same palette.
- **Component library**: same.
- **Mobile strategy**: same.
- **Complexity**: Low.
- **Stitch mockup**: not generated.

**Recommended:** Option A. It matches the reference screenshots (Bookable) and keeps every NHS usability rule (focus, button edge, form order, one question per page). Only the surface is softer.

### Component library decision

| Option | Verdict |
|--------|---------|
| **Native HTML + Radix primitives, wrapped as `I*`** | **Chosen.** A native `<select>` opens the phone's own picker, which is the most accessible option. Radix only for things HTML lacks (dialog, popover, tooltip, dropdown menu). |
| shadcn, restyled | Rejected. Every generated file would be rewritten to NHS styling. Radix Select would replace the native mobile picker. It also conflicts with the workspace rule against editing `src/components/ui`. |

### Font decision

Hanken Grotesk Variable, self-hosted via `@fontsource-variable/hanken-grotesk`, with an Arial fallback (the NHS's own fallback for Frutiger).

## Component Inventory

### Existing (reuse)
- `cn()`: `apps/web/src/core/lib/cn.ts` (moved from `shared/lib`)
- `apiGet` / `ApiRequestError`: `apps/web/src/core/lib/api-client.ts`. It now also maps `NETWORK_ERROR`, `GATEWAY_ERROR`, `HTTP_ERROR` and `INVALID_RESPONSE`.
- `healthQueryOptions`: `apps/web/src/features/health/api/health.queries.ts`, which now polls every 30s.

### New (created)
- `IButton`: primary / secondary / reverse / warning, plus `asChild`
- `ICard`, `ICardHeading`, `ICardBody`, `ICardLink`: including the clickable card
- `IHeader`: title, subtitle lines, actions slot
- `IBackBar`: lighter blue bar with a back link
- `IFooter`: brand, disclaimer, links
- `IStatusPill`: ok / offline / checking, with detail text
- `IList`: bullet / number / plain
- `IContainer`: 960px width container
- `IFormField`, `IInput`, `ISelect`: native controls with label → hint → error wiring
- `AppShell`: `apps/web/src/app/app-shell.tsx`

### Specified only (built with their features)
- Step progress ("Step 2 of 4")
- "Check your answers" summary list
- File upload rows and states
- Error summary
- Radios and checkboxes

### Modify
- `ApiStatus`: now renders `IStatusPill` and shows the offline reason
- `routes/__root.tsx`: renders `AppShell`
- `hello-world.tsx`: removed

## Screen Descriptions

### Root `/`
Header (Bookable, two subtitle lines, status pill on the right that wraps under the title on
phones), then h1 "What would you like to do?", an intro line, and two clickable cards:
"Patient document upload" and "Admin medical settings". The cards stack on mobile and sit in 2
columns from 768px. The footer carries the medical-advice disclaimer.

### `/patient-upload`
Back bar, h1 "Upload your documents", a card listing the 3 flow steps, and a disabled "Start now"
primary button with a "Coming soon" hint.

### `/admin/settings`
Back bar, h1 "Medical settings", and an "Intake defaults" card with a disabled native select preview.

## Verification

- Playwright (headless) at 375×812 and 1280×800 checked the header, cards, starter pages, and that there is no horizontal scroll (`scrollWidth` 375 = viewport).
- **Keyboard focus bug found and fixed:** the back link showed white text on the yellow focus background. Components that colour links now set `focus-visible:text-text`, and this is written into the rules.
- **Offline state:** with the API stopped, the Vite proxy returned 502 and the pill read "API offline · No response from API (HTTP 502)". It wraps cleanly at 375px.
- **Contrast check:** the derived back-bar colour `#2b7ac4` gave 4.48:1 with white text, which fails AA. It was darkened to `#2a77bf` (4.68:1).

## Design Patterns Reference

`.claude/rules/design-patterns.md` (approved 2026-09-27) and `.claude/rules/code-conventions.md` (`I*` rules).

## Handoff

- [x] Design approved
- [ ] Discuss feature architecture for patient upload (triage, documents, confirmation) and admin settings (plus auth), then `/create-feature`

## Changelog

| Date | Change |
|------|--------|
| 2026-09-27 | Created UI discovery, direction decided, design system and starter pages built |
