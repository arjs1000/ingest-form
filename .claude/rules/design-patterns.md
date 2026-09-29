# ingest-form — Design Patterns

**Approved:** 2026-09-27
**Based on:** NHS design system tokens as used by Bookable (bookable.health), softened: rounded cards, soft shadows
**Discovery:** `ai-context/tracking/discovery/DISC-001-ui-nhs-design-system.md`
**Components:** `apps/web/src/core/components/I*.tsx` (native HTML first, Radix primitives only where HTML falls short)

Every user-facing page follows this file. If a design need is not covered here, add it here first,
then build it. Any third-party UI component is restyled to these tokens before it ships.
The live reference is the admin "UI component library" tab: `/admin/settings?tab=components`.

---

## Surfaces: patient and admin

One token set and one `I*` library, rendered at two densities. The layout root sets
`data-surface`, which swaps CSS variables in `styles.css`; components read the variables, so no
component takes a "mode" prop.

| | Patient (`data-surface="patient"`, default) | Admin (`data-surface="admin"`) |
|---|---|---|
| Who | Patients on phones, often anxious | Clinic staff on desktop, experts |
| Layout route | `routes/_patient.tsx` → `PatientLayout` | `routes/_admin.tsx` → `AdminLayout` |
| Chrome | Blue `IHeader`, `IBackBar`, white `IFooter` with disclaimer | White `ITopBar`, `ISidebar` from `lg` (Menu dropdown below), no footer |
| Width | `IContainer` 960px | `max-w-admin` 1280px, sidebar 14rem + content |
| Body text | 16px / 19px (md) | 14px |
| h1 / h2 / h3 | 32/48, 24/32, 20/24 | 24/30, 18/20, 16 |
| Controls | 48px high, 6px radius, 2px border | 36px high, 8px radius, 1px border |
| Primary button | Green `action` with 4px dark edge, presses down | Blue `brand`, flat with a 1px shadow |
| Cards | 16px radius, 24/32px padding, soft shadow | 12px radius, 16/20px padding, hairline shadow |
| Radios / checkboxes | 40px NHS targets | 18px |
| Page pattern | One question per page, linear, no modals, no hamburger | Many options per page, `ITabs` (URL-synced), `IFormSection`s, `IDialog` for confirmations, `IDropdownMenu` for actions |
| Toasts | Rare: confirm a completed step | Normal: confirm saves and actions |

Rules that hold on **both** surfaces: tokens only (no hex), NHS yellow focus, Hanken Grotesk,
Lucide icons, label → hint → error → control, status never colour-only, WCAG 2.2 AA, 44px minimum
touch target on mobile (admin controls grow via padding, and the admin surface is desktop-first but must still work at 375px).

---

## Creative North Star

**"Calm, plain, trustworthy."** Patients arrive worried and often on a phone. Every screen asks
one thing, says why, and makes the next step obvious. The look is NHS-familiar (blue header, green
go button, yellow focus) with Bookable's warmth: white rounded cards on a soft grey page. Nothing
decorative competes with the question being asked.

---

## Color Tokens

Declared once in `apps/web/src/styles.css` (`@theme`). Use the Tailwind utilities they generate
(`bg-brand`, `text-text-secondary`, `border-border`). **Never write a hex value anywhere else.**

| Token | Hex | Utility examples | Use |
|-------|-----|------------------|-----|
| `brand` | `#005eb8` | `bg-brand`, `text-brand`, `border-brand` | Header, links, secondary button |
| `brand-dark` | `#003087` | `shadow-edge-brand` | Secondary button edge, hover on brand |
| `brand-bar` | `#2a77bf` | `bg-brand-bar` | Back bar under the header (white text 4.68:1) |
| `action` | `#007f3b` | `bg-action` | Primary button only |
| `action-hover` | `#00662f` | `hover:bg-action-hover` | Primary hover |
| `action-edge` | `#00401e` | `shadow-edge-action` | Primary 4px bottom edge |
| `text` | `#212b32` | `text-text` | Body, headings, focus inner edge |
| `text-secondary` | `#4c6272` | `text-text-secondary` | Hints, captions, intro text, input borders |
| `border` | `#d8dde0` | `border-border` | Card borders, dividers |
| `border-strong` | `#aeb7bd` | `border-border-strong` | Hover card edge, disabled borders |
| `page` | `#f0f4f5` | `bg-page` | Page background |
| `surface` | `#ffffff` | `bg-surface` | Cards, footer, pills, inputs |
| `error` | `#d5281b` | `text-error`, `border-error` | Error messages and borders, warning button |
| `error-edge` | `#6a140e` | `shadow-edge-error` | Warning button edge |
| `focus` | `#ffeb3b` | `bg-focus` | Focus state only |
| `status-ok` | `#00d663` | `bg-status-ok` | "Online" dot only |
| `link-visited` | `#330072` | — | Visited links (base style) |
| `link-hover` | `#7c2855` | — | Link hover (base style) |

### Color Rules

- **Green (`action`) means "go forward".** Only primary buttons use it, plus the one `IConfirmationPanel` that ends a flow ("you're done"). Never for links, headings or decoration.
- **Blue (`brand`) means "this service" and "navigate".** Header, links, secondary buttons.
- **Yellow (`focus`) means keyboard focus.** Never for highlights, warnings or decoration.
- **Red (`error`) means something is wrong or dangerous.** Error messages and destructive actions only.
- **Status is never colour alone.** Every coloured dot or border has a text label next to it.
- Body text on `page` or `surface` is `text` or `text-secondary`. Both pass WCAG AA.
- Measured contrast: `text-secondary` on `page` 5.75:1, on `surface` 6.37:1; white on `brand` 6.38:1, on `brand-bar` 4.68:1, on `action` 5.12:1; `text` on `focus` 11.81:1.
- `brand-bar` was derived from the screenshots (the Bookable CSS value was not found) and darkened from `#2b7ac4` (4.48:1, fails AA) to pass. Any new colour pair gets measured before use.
- White text only on `brand`, `brand-bar`, `action` and `error` backgrounds.

---

## Typography

**Font:** Hanken Grotesk Variable, self-hosted via `@fontsource-variable/hanken-grotesk`, imported
once in `styles.css`. Fallback `Arial, Helvetica, sans-serif` (the NHS fallback). Frutiger is NHS-licensed: never use it.

**Weights:** 400 (regular) and 600 (semibold). Nothing else: no 300, no 700, no italics for emphasis (use semibold).

### Type Scale

Mobile first; the second size applies from `md` (768px). Set in `styles.css` base layer for `body`, `h1`–`h3`.

| Style | Mobile | md+ | Line height | Weight | Element |
|-------|--------|-----|-------------|--------|---------|
| Page title | 32px | 48px | 1.19 / 1.17 | 600 | `h1` (one per page) |
| Section | 24px | 32px | 1.25 / 1.19 | 600 | `h2` |
| Card title | 20px | 24px | 1.3 / 1.25 | 600 | `h3`, `ICardHeading` (20/24) |
| Body | 16px | 19px | 1.5 / 1.47 | 400 | `p`, `li` |
| Small | 14px | 16px | 1.4 | 400 | captions, footer, pill |
| Button | 16px | 19px | 1.25 | 600 | `IButton` |

### Typography Rules

- **One `h1` per page**, and it is the question or task: "What is your date of birth?", "Upload your documents".
- Intro text under the `h1` is `text-text-secondary`, one or two sentences.
- **Inputs and selects are never below 16px** (iOS zooms the page on focus below 16px).
- Sentence case everywhere. No ALL CAPS, no Title Case headings.
- Line length: keep reading text within `max-w-2xl` (about 70 characters).

---

## Layout System

| Rule | Value |
|------|-------|
| Width container | `IContainer`: max 960px (`max-w-page`), centred |
| Gutters | 16px mobile (`px-4`), 32px from `md` (`md:px-8`) |
| Page top spacing | `pt-8`, `md:pt-12` below the header / back bar |
| Page bottom spacing | `pb-12`, `md:pb-16` before the footer |
| Vertical rhythm | `gap-8` between page sections, `gap-4` inside cards, `gap-2` label→control |
| Question pages | Content column `max-w-2xl` (left aligned, not centred) |
| Choice grids | 1 column mobile, `md:grid-cols-2` |
| Full height | `min-h-dvh` on the shell. Never `h-screen` / `100vh` |

### Page Anatomy

```
IHeader            bg-brand, title + subtitle, actions slot (status pill)
IBackBar           bg-brand-bar, "‹ Back" (every page except the root)
main > IContainer  h1, intro, cards / form, primary button
IFooter            bg-surface, brand block, disclaimer, links
```

`PatientLayout` (`apps/web/src/app/layouts/patient-layout.tsx`, via the `_patient` layout route) renders header, `main` and footer. Pages render their
own `IBackBar` and `IContainer`.

---

## Components

All live in `apps/web/src/core/components/`. Features compose these; they never restyle raw HTML
controls themselves.

### IButton

| Variant | Look | Use |
|---------|------|-----|
| `primary` | `bg-action`, white text, 4px `action-edge` bottom edge | The one main action per screen: Continue, Submit, Start now |
| `secondary` | White, 2px `brand` border, `brand` text, 4px `brand-dark` edge | Alternative path: "Register without appointment" |
| `reverse` | White, `text` text, grey edge | On blue backgrounds only |
| `warning` | `bg-error`, white text, dark red edge | Destructive: Delete, Withdraw |

- Radius 6px (`rounded-control`). Min height 48px (about 52px with the edge). Padding `px-4 py-3`.
- **Full width on mobile, auto width from `md`** (built in). `fullWidth` forces full width everywhere.
- Pressed: moves down 4px and loses its edge (`active:translate-y-1 active:shadow-none`).
- Focus: yellow fill, `text`-coloured text, dark 4px bottom edge.
- **One primary button per screen.** Continue goes below the form, left aligned.
- Navigation that looks like a button uses `asChild` with a router `Link`, never `onClick={navigate}`.
- `type="button"` is the default. Forms set `type="submit"` explicitly.

### ICard

- White `surface`, 1px `border`, radius 16px (`rounded-card`), `shadow-card`, padding 24px / 32px (md).
- `ICardHeading` (h2 styled 20/24px) then `ICardBody` (`text-secondary`).
- **Clickable card:** `clickable` prop adds a 4px bottom border and hover tint. Exactly one
  `ICardLink` in the heading stretches the link over the whole card. Never nest other links or buttons inside a clickable card.
- Cards group one topic. Don't nest cards.

### IHeader

- `bg-brand`, white text, `IContainer` inside. Title 24px / 28px semibold, subtitle lines 14px / 16px at 90% white.
- `actions` slot is right aligned and **wraps under the title on narrow screens** (flex-wrap). No hamburger menus.
- Respects `env(safe-area-inset-top)`.

### IBackBar

- Full-width `bg-brand-bar` strip directly under the header, min height 48px.
- Contains one link: chevron + "Back", white, underline on hover.
- Every page except the root has one. It goes to the previous step in a flow, not browser history.

### IStatusPill

- White pill (`rounded-full`) with a 10px dot and a text label; optional `detail` after a "·".
- `ok` → `status-ok` dot; `offline` → `error` dot; `checking` → grey pulsing dot.
- `role="status"` + `aria-live="polite"`. Wraps its text, never truncates.
- API status reasons: "No response from API", "No response from API (HTTP 502)", "&lt;API message&gt; (&lt;CODE&gt;)", "Unexpected response from API".

### IList

- `bullet` (disc), `number` (decimal), `plain`. `gap-2` between items. Markers in `text` colour.

### IFooter

- `bg-surface`, top border, brand block (icon tile + name + tagline), divider, disclaimer, link row.
- **The disclaimer is required on every patient-facing page:** "This is a proof of concept. Use synthetic data only."
- Respects `env(safe-area-inset-bottom)`.

### IContainer

- The only way to set page width and gutters. Never hand-roll `max-w-*` + `mx-auto` on a page.

---

### Typography components

- `IHeading level={1|2|3|4}` renders `h1`-`h4` with the surface size; `size` changes only the look (keeps the outline correct).
- `IText` mirrors Radix Themes `Text`: `as` (`span` default, `p`, `div`, `label`), `asChild`, `size` (`sm` 0.875em, `md` 1em, `lg` 1.125em of the surface body size), `weight` (`regular`, `semibold`), `tone` (`default`, `secondary`, `error`, `inverse`), `truncate`.
- `IPageHeader` is the h1 block: optional `eyebrow` (breadcrumb or step progress), `title`, `description`, `actions`.

### Display

- `IBadge` tones: `neutral`, `info`, `success`, `warning`, `error`. Tint background with dark same-hue text, all measured ≥ 6.2:1.
- `ISkeleton`: loading placeholder, `aria-hidden`.
- **`ITable`** (admin) + `ITableCaption`, `ITableHead`, `ITableBody`, `ITableRow`, `ITableHeaderCell`, `ITableCell`: native `<table>` in a bordered surface card whose wrapper has `overflow-x-auto`, so a wide table scrolls inside itself and the page never scrolls sideways (check at 375px). Dense: `px-3 py-2` cells, `bg-page` header row with small semibold `text-secondary` labels, 1px `border` row dividers. `ITableHeaderCell` defaults to `scope="col"`. Every table has an `ITableCaption` (add `className="sr-only"` when a visible heading already names it). `ITableRow clickable` adds a hover tint and pointer for an `onClick` row, but a row click is only a mouse shortcut: the row must also hold a real "View" button or link. `selected` tints the row `brand-tint`. Identifiers in cells use `font-mono`; statuses use `IBadge`, never colour alone.
- **`ICopyButton`**: icon-only button (Lucide `Copy`, then `Check` for 2s) that writes `value` with `navigator.clipboard.writeText` and confirms with `notify.success('Copied')`; clipboard failure raises `notify.error`. `label` is required and names what is copied ("Copy submission ID"). 44px target on mobile, 32px from `md`. Put it right after the text it copies (IDs, API keys, SQL, curl commands). The toast never repeats the copied value.

### Feedback and overlay

- **Toasts** (`IToaster` + `notify`): top-centre, white card, 4px left border in the tone colour, Lucide icon, title + optional description. Errors stay 8s.
- **`IErrorSummary`**: 4px `error` border card, "There is a problem", links to each field; takes focus on mount.
- **`IDialog`** (Radix): admin only. Overlay `--color-overlay`, max 32rem, title + description required, close button top right, footer buttons stack on mobile (primary on top).

### Navigation (admin)

- **`ITopBar`**: sticky white bar, brand left, actions right (status pill, back to site).
- **`ISidebar`** + `ISidebarSection` + `ISidebarItem`: 36px items, active item `brand-tint` background with `brand-dark` semibold text (TanStack `data-status="active"`).
- **`ITabs`** (Radix): underline tabs, active = 2px `brand` underline + `text` colour. Always controlled and stored in the URL.
- **`IBreadcrumb`**: small secondary text, chevron separators, current page semibold with `aria-current="page"`.
- **`IDropdownMenu`** (Radix): white panel, 36px items, highlighted item uses the yellow focus colour.

### Form controls

- `ITextarea` with `maxChars` shows NHS "You have N characters remaining" (live region) and never blocks typing.
- `IRadios` (fieldset + legend) and `ICheckbox`: native inputs, `--choice-size` targets, hints **outside** the `<label>` so the accessible name stays short.
- `ISwitch` (Radix): admin settings that apply immediately. Patient answers use radios or checkboxes, never switches.
- `IFormSection`: card with a titled header; `collapsible` uses native `<details>` (open by default).
- `IStepProgress`: "Step 2 of 4: Label" text above the h1.

### Intake components (FEAT-002)

Each wraps one third-party library; its restyle lives in `styles.css` ("Third-party widgets"), tokens only.

- **`IFileUpload`** (FilePond + validate-type/size plugins): label, hint, error in NHS order above a white drop card with a 2px dashed `border-strong` border and brand "choose a file" text. Tapping it opens the phone's picker (files or camera); drag and drop is an enhancement. Props: `acceptedFileTypes`, `maxFileSize` (bytes), `onProcessFile(file) => Promise<void>` (run through FilePond's custom `server.process`; a rejection's message shows on the file row as "Failed: …"), `onRemoveFile`, `allowMultiple` (false today), `disabled`. File row: grey while uploading, `action` green when uploaded, `error` red when failed, always with status text.
- **`IPhoneInput`** (react-phone-number-input): native country `<select>` (accessible name "Phone number country") made transparent over a control-styled face showing the flag, dial code ("+44") and a chevron, then an `IInput`. Flags are the library's bundled inline SVGs (`react-phone-number-input/flags`, never its CDN `<img>`s), lazy-loaded in their own ~58KB gzip chunk. Options read "United Kingdom +44"; all countries, GB pinned first, no "International" entry. GB default, typed nationally, `value`/`onChange` in E.164. Takes `IFormField`'s control props. Re-exports `isValidPhoneNumber` / `isPossiblePhoneNumber` for schemas.
- **`IDateInput`**: `IInput` (DD/MM/YYYY, max 12rem wide) plus a square calendar button (Lucide `CalendarDays`, `aria-label="Choose date"`) opening a Radix popover with react-day-picker (`mode="single"`, month/year dropdowns, en-GB weeks, January 1900 to this month, future days disabled). 44px day targets, selected day `brand` with white text, NHS focus on days, nav buttons and dropdowns. `value`/`onChange` are ISO, `''` while incomplete or not a real date; the text is reformatted to DD/MM/YYYY on blur.
- **`ISheet`** + `ISheetTrigger`, `ISheetContent`, `ISheetTitle`, `ISheetDescription`, `ISheetClose` (Radix Dialog): panel from the right, full width on mobile, 32rem from `md`, `--color-overlay` backdrop, close button top right, admin density inside (`data-surface="admin"`). For developer tools and detail panels; see anti-pattern 14 for the one patient-flow use.
- **`ICodeBlock`**: `<pre><code>` in a bordered `page` block, 13px monospace, wraps long lines, scrolls inside itself (max 24rem by default) and is focusable so the keyboard can scroll it. `label` names the region and the optional `ICopyButton`.
- **`IConfirmationPanel`**: the end of a patient flow. `action` green background, white centred text (5.12:1), h1 title, body, and a "Your reference:" line with the reference semibold at card-title size. The only green that is not a button.

## Forms

NHS form order is fixed: **label → hint → error → control.** `IFormField` renders it and wires
`aria-describedby` and `aria-invalid`; the control receives them through the render prop.

```tsx
<IFormField id="dob-year" label="Year" hint="For example, 1987" error={errors.year}>
  {(control) => <IInput {...control} inputMode="numeric" autoComplete="bday-year" />}
</IFormField>
```

| Rule | Detail |
|------|--------|
| One question per page | Patient flows ask one thing per screen, the `h1` is the question |
| Label | Always visible, semibold. Placeholders are examples, never labels |
| Hint | `text-secondary`, above the control |
| Error | Semibold `error` text above the control, 4px `error` left border on the field group, visually hidden "Error:" prefix |
| Error summary | On submit with errors: a summary box at the top of the page linking to each field (built with the first form) |
| Input | `IInput`: 2px `text-secondary` border, radius 6px, min height 48px, 16px/19px text |
| Select | `ISelect`: **native `<select>`** with a chevron. Phones open their own picker |
| Radios / checkboxes | Native inputs, 40px custom box, whole row clickable (built with the first form) |
| Dates | `IDateInput`: one typed field, DD/MM/YYYY (`inputMode="numeric"`, `autoComplete="bday"`), plus a calendar button. Typing always works on its own; the calendar is a shortcut. Value is ISO `YYYY-MM-DD` |
| Phone numbers | `IPhoneInput`: country select (flag + dial code) + number, GB default, value in E.164. Validate with its re-exported `isValidPhoneNumber` |
| Autocomplete | Always set `autoComplete` and `inputMode` for personal data fields |
| Validation | Zod schema from `packages/shared` on submit; don't validate while the user is typing |

---

## Step Progress

For multi-step flows (patient upload). Built with that feature.

- A line above the `h1`: "Step 2 of 4", 16px `text-secondary`. No progress bars, no step circles.
- The Back bar goes to the previous step.
- Each step's URL is its own route (`/patient-upload/document`, `/patient-upload/details`) so browser back works. The draft is memory-only patient data, so a refresh sends the person back to the start page (route guards).

## Check Your Answers (Summary List)

Before submit. Built with the patient upload feature.

- `ICard` with rows: key (semibold, left), value (right on `md`, below on mobile), "Change" link (`brand`) that returns to that step.
- Rows separated by 1px `border`.
- Primary button "Submit" below the card.
- The confirmation page after it: an `IConfirmationPanel` (green, title, reference) followed by a white "What happens next" card with an `IList`. No back bar (going back would resend).

## File Upload

Built with the patient intake feature as `IFileUpload` (FilePond). Behaviour rules: `.claude/rules/security-and-data.md`.

- **Mobile first:** the whole drop card is the tap target and opens the phone's own picker (files or camera). Drag and drop is an enhancement, never the only way.
- Idle text: "Drag your file here or **choose a file**". Hint lists accepted types and max size in words: "PDF, JPG or PNG, up to 10MB".
- Type and size are checked before upload, with plain messages ("This file type is not accepted", "The file is too large").
- Each file is a row with its name and status text, always present ("Uploading", "Uploaded", "Failed: …"), and a remove button.
- A failed upload also shows the Forms error pattern below the field, with a way forward (the intake flow offers "Continue without the document").
- "Continue" stays disabled until the file shows "Uploaded".
- While the API reads the document, a status line says so ("Reading your document. A photo or scan can take up to a minute."): OCR of a photo takes about 40 seconds.

---

## Elevation & Depth

| Level | Style | Use |
|-------|-------|-----|
| 0 | none | Page, header, back bar |
| 1 | `shadow-card` (`0 2px 8px rgb(33 43 50 / .08)`) + 1px border | Cards |
| Edge | `0 4px 0 <edge>` | Buttons only (solid bottom edge, not a blur) |

No other shadows. No glows, no inner shadows except the focus ring.

## Focus

The NHS focus style is mandatory on **every** interactive element, via `:focus-visible` in `styles.css`:

- Controls: 4px `focus` outline plus a 2px `text` inset ring (`focus-ring` utility).
- Links: `focus` background, `text` colour, 4px `text` underline bar, no outline.
- Buttons: `focus` fill, `text` text, 4px `text` bottom edge.
- **Any component that sets a text colour on a link must also set `focus-visible:text-text`**, because utilities override the base focus rule (white-on-yellow bug found in the back bar).

## Animation & Interaction

- Colour transitions only (`transition-colors`, default 150ms). No slide, fade or spring animations.
- Button press moves 4px down. Status "checking" dot pulses.
- `prefers-reduced-motion: reduce` disables all transitions and animations (in `styles.css`).

## Border Radius

| Element | Radius |
|---------|--------|
| Cards | 16px (`rounded-card`) |
| Buttons, inputs, selects, icon tiles | 6px (`rounded-control`) |
| Pills, dots | full (`rounded-full`) |
| Header, back bar, footer | 0 |

## Spacing

4px base (Tailwind default scale). Allowed steps: 1, 2, 3, 4, 6, 8, 10, 12, 16 (4px to 64px).
Use `gap-*` on flex/grid parents instead of margins on children.

## Responsive Breakpoints

Mobile first. **CSS only:** Tailwind breakpoint prefixes compile to media queries.

| Breakpoint | Width | Changes |
|------------|-------|---------|
| base | < 768px | Single column, full-width buttons, 16px gutters, mobile type scale |
| `md` | ≥ 768px | 2-column choice grids, auto-width buttons, 32px gutters, desktop type scale |
| `lg` | ≥ 1024px | Only if a page needs a sidebar; the 960px container caps width anyway |

- Test every page at **375×812** and **1280×800**, and check that `scrollWidth === clientWidth` (no horizontal scroll).
- Touch targets ≥ 44×44px. Buttons and inputs are 48px.
- Same markup for all sizes. **Never** render separate mobile and desktop trees.

## Accessibility

- WCAG 2.2 AA minimum. Contrast is built into the tokens: don't invent new colour pairs.
- Semantic HTML first: `button` for actions, `a` for navigation, native form controls, `nav`, `main`, `header`, `footer`.
- Every control has a visible `<label>`. Icons are `aria-hidden` unless they are the only content (then `aria-label`).
- Live regions: status pills use `role="status"`; error summaries get focus on submit.
- Pinch zoom stays enabled (no `maximum-scale` / `user-scalable=no` in the viewport meta).

## Key Dependencies

| Package | Use |
|---------|-----|
| `tailwindcss` 4 + `@tailwindcss/vite` | Styling, tokens via `@theme` |
| `@fontsource-variable/hanken-grotesk` | Font |
| `@radix-ui/react-slot` | `asChild` on `IButton`, `ICardLink`, `IBackBar` |
| `lucide-react` | Icons (24px default, `size-5`/`size-6`), always `aria-hidden` when decorative |
| `@radix-ui/react-{dialog,tabs,dropdown-menu,switch,popover}` | Wrapped as `IDialog` / `ISheet`, `ITabs`, `IDropdownMenu`, `ISwitch`, the `IDateInput` calendar |
| `filepond`, `react-filepond`, `filepond-plugin-file-validate-{type,size}` | Wrapped as `IFileUpload` |
| `react-phone-number-input` (on `libphonenumber-js`) | Wrapped as `IPhoneInput` |
| `react-day-picker` 10 | Calendar inside `IDateInput` |
| `sonner` | Toasts, wrapped as `IToaster` + `notify` |
| `react-hook-form` + `@hookform/resolvers` | Forms (see code-conventions.md) |

## File Organization

```
apps/web/src/
  styles.css                 # tokens (@theme), base type, focus, reduced motion
  app/layouts/               # PatientLayout, AdminLayout (surface roots)
  core/components/           # I*.tsx design system components
  core/components/test/      # I*.spec.tsx
  core/lib/                  # cn(), api-client
  core/testing/              # render helpers for specs
  features/<feature>/components/   # pages and feature UI composed from I*
```

---

## Anti-Patterns (NEVER DO)

1. **No hex values outside `styles.css`.** No `bg-[#005eb8]`, no inline `style={{ color }}`.
2. **No unstyled third-party components.** No shadcn defaults, Flowbite, MUI, or raw Radix in a feature. Wrap and restyle as `I*` first.
3. **No custom select, and no picker-only dates.** Native `<select>` (including the phone country select). Dates use `IDateInput`: typed DD/MM/YYYY first, the calendar popover is optional.
4. **No `user-scalable=no` or `maximum-scale`** in the viewport meta.
5. **No inputs below 16px** font size.
6. **No UA sniffing** (`react-device-detect`, `navigator.userAgent`) and **no JS breakpoints** (`useMediaQuery`, `innerWidth`) for layout.
7. **No duplicated mobile/desktop markup** (`hidden md:block` + `md:hidden` copies of the same content).
8. **No `h-screen` / `100vh`.** Use `min-h-dvh`.
9. **No colour-only status.** Every dot, border or tint has text.
10. **No green for anything but the primary action**, and no more than one primary button per screen.
11. **No placeholder-as-label**, no floating labels.
12. **No hamburger menus** in the patient flow. Patients follow a linear path.
13. **No NHS logo, "NHS" lozenge, Frutiger, or wording that implies NHS endorsement.**
14. **No modals in the patient flow.** One question per page instead. `IDialog` is admin-only. **One exception:** the "View developer data" `ISheet` on the intake details step, labelled "Developer tool" (proof of concept; gate it behind `VITE_SHOW_DEVELOPER_TOOLS` before production). The `IDateInput` calendar is a popover attached to its field, not a modal.
15. **No emoji** in UI.
16. **No component "mode" props for patient vs admin.** Density comes from `data-surface` on the layout root.
17. **No `sonner` / Radix imports in features.** Use `notify` and the `I*` wrappers.
18. **No hint text inside a `<label>`.** Link it with `aria-describedby` instead.
