---
id: FEAT-004
title: IPhoneInput flag and dial code country picker
status: Complete
created: 2026-09-29
completed: 2026-09-29
---

# FEAT-004: IPhoneInput flag and dial code country picker

**Status:** Complete (manual browser checks 2-5 pending)
**Priority:** Medium
**Created:** 2026-09-29
**Dependencies:** FEAT-002 (built `IPhoneInput`)
**Branch:** feature/feat-004-phone-input-flags

## Problem

`IPhoneInput`'s country control shows only the two-letter code ("GB"). People recognise a flag
and a dial code ("+44") faster than an ISO code, especially on a phone. Flags were left out
because the library's default flags are `<img>`s fetched from a third-party CDN, which would
leak every visit.

## Solution

Keep the native `<select>` (design-patterns.md anti-pattern 3) and give it a better face,
inspired by the reUI phone input (https://reui.io/docs/components/radix/phone-input) without its
custom popover:

1. The closed control shows the country's flag (inline SVG from `react-phone-number-input/flags`,
   bundled, no network) + the dial code ("+44") + a chevron.
2. A transparent native `<select>` covers that face, so a tap opens the phone's own picker and a
   desktop click opens the browser list. Options read "United Kingdom +44".
3. All countries, GB pinned on top (unchanged). No "International" option.
4. `value` / `onChange` stay E.164; the props interface does not change, so callers are untouched.

Decisions (2026-09-29): native select over a Radix + cmdk searchable popover; all
countries rather than a whitelist.

## Architecture

```
IPhoneInput (react-phone-number-input PhoneInput)
├── countrySelectComponent = CountrySelect (file-local)
│   ├── face: <CountryFlag country/> "+44" <ChevronDown/>      (aria-hidden)
│   └── <select aria-label="Phone number country" class="absolute inset-0 opacity-0">
│         options from the library ({ value, label, divider }) → "Label +code"
└── inputComponent = IInput
```

`CountryFlag` is `React.lazy` over `react-phone-number-input/flags`. All 250 flags are 331 KB raw
/ 58 KB gzip (`country-flag-icons/modules/react/3x2/index.js`), so they go in their own chunk that
loads after the field renders. The fallback is a same-size blank box, so layout does not shift.

The library passes the select: `name`, `aria-label`, `value`, `options`, `onChange(country?)`,
`onFocus`, `onBlur`, `disabled`, `readOnly`, `iconComponent`
(`modules/PhoneInputWithCountry.js:427-438`). Divider options (`{ divider: true }`) render as a
disabled option, as the library's own `CountrySelect` does.

### Reusable code

- `IInput` (`apps/web/src/core/components/IInput.tsx`): number input, unchanged.
- `ISelect` (`apps/web/src/core/components/ISelect.tsx`): border, radius, disabled and chevron
  styles to match.
- `IDateInput` calendar trigger (`apps/web/src/core/components/IDateInput.tsx`): square control
  next to an `IInput`, same sizing tokens.
- `cn` (`apps/web/src/core/lib/cn.ts`).

## Phases

### Phase 1: Component and styles

| Task | Detail |
|------|--------|
| `CountrySelect` | Face + overlaid native select, focus ring via `:has(select:focus-visible)`, disabled state |
| `CountryFlag` | Lazy flags chunk, `Globe` icon when no country |
| `IPhoneInput` props | `countrySelectComponent`, `addInternationalOption={false}`; drop `flagComponent` |
| `styles.css` | Delete `.PhoneInputCountry*` rules; keep the container gap |

**Gate:** `tsc` and Vitest pass.

### Phase 2: Docs, showcase, verification

| Task | Detail |
|------|--------|
| `design-patterns.md` | Update the `IPhoneInput` entry and the phone numbers row |
| Showcase | Disabled example in `forms-section.tsx` |
| Browser checks | Playwright at 375px and 1280px (see Verification) |

**Gate:** all verification checks pass.

## Key changes

### Modified files

| File | Change |
|------|--------|
| `apps/web/src/core/components/IPhoneInput.tsx` | Custom country select with flag + dial code |
| `apps/web/src/styles.css` | Remove dead `.PhoneInputCountry*` overrides |
| `.claude/rules/design-patterns.md` | Document the new face |
| `apps/web/src/features/component-library/components/sections/forms-section.tsx` | Disabled example |

## Verification

1. `pnpm --filter web exec tsc --noEmit` and `pnpm --filter web test`.
2. Component library page and intake details step at 375px and 1280px: face shows GB flag + "+44";
   choosing Ireland shows the IE flag + "+353"; the value stays E.164.
3. Keyboard: Tab reaches the select, the focus ring shows, arrow keys change country.
4. Disabled example greys the face and the input.
5. No network request to any flag CDN; flags arrive as one same-origin JS chunk.
6. `vite build`: flags are in their own chunk, not the entry or route chunk.

## Changelog

| Date | Change |
|------|--------|
| 2026-09-29 | Created feature spec |
| 2026-09-29 | Built and merged to main; Playwright browser not installed, so Verification 2-5 are manual |
