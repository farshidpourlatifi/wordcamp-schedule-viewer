---
name: wordcamp-design-system
description: The design system for the WordCamp Schedule Viewer app. Use whenever building, styling, or reviewing UI — components, layout, color, typography, spacing, states. A shadcn-style OKLCH theme (neutral zinc + blue) with light and dark modes, implemented with Tailwind + Base UI primitives.
---

# WordCamp Schedule Viewer — Design System

A small, focused design system for a **content-forward, view-only** web app.
Uses a **shadcn-style OKLCH token theme** (neutral zinc grays with a blue
`--primary`) with **light and dark modes** and a user-facing theme toggle.
Implemented with **Tailwind CSS + Base UI** primitives — components are written
by hand (no shadcn CLI, no Radix; the CLI/scaffold is not used on this Webpack
build).

Invoke this skill before creating or restyling any UI. Follow the tokens and
component rules below rather than inventing ad-hoc values.

> **Visual reference:** to (re)generate a visual design-system sheet in Claude
> Design, use `prompts/claude-design-system.md`. This SKILL.md is the source of
> truth for code tokens; if the visual sheet and this file ever diverge, update
> this file and re-export the sheet to match.

---

## Design principles

1. **Content first.** The WordCamps are the product. Chrome is quiet; the data is loud.
2. **Calm, professional, legible.** This is a portfolio piece reviewed by an
   engineer — restraint reads as competence. No gradients-for-drama, no motion
   for its own sake.
3. **One accent, used sparingly.** Neutral zinc grays are structure; the blue
   `--primary` is the single accent for links, active states, dates, and rings.
   Don't rainbow it.
4. **Every state is designed.** Loading, empty, and error states are first-class,
   not afterthoughts.
5. **Accessible by default.** WCAG AA contrast in both modes, real semantic
   elements, visible focus rings, keyboard-navigable tabs.
6. **Light and dark are equal citizens.** Every component must look correct in
   both themes; verify contrast in each.

---

## Design tokens

The theme is a **shadcn-style OKLCH token set** with `:root` (light) and `.dark`
overrides. Define these CSS variables globally and map the semantic names into
`tailwind.config.js` (e.g. `background`, `foreground`, `primary`,
`primary-foreground`, `muted`, `muted-foreground`, `card`, `border`, `input`,
`ring`, `destructive`, `radius`). Components reference **semantic token names
only** — never raw OKLCH/hex, and never a literal color (DRY). This is the single
source of truth; keep code and any visual sheet in agreement with it.

### Color — light (`:root`) and dark (`.dark`)

Sidebar and chart tokens from the source theme are intentionally **omitted** —
this app has no sidebar and no charts (KISS). Keep only what the app uses.

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.141 0.005 285.823);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.141 0.005 285.823);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.141 0.005 285.823);
  --primary: oklch(0.5 0.134 242.749);          /* blue accent */
  --primary-foreground: oklch(0.977 0.013 236.62);
  --secondary: oklch(0.967 0.001 286.375);
  --secondary-foreground: oklch(0.21 0.006 285.885);
  --muted: oklch(0.967 0.001 286.375);
  --muted-foreground: oklch(0.552 0.016 285.938);
  --accent: oklch(0.967 0.001 286.375);
  --accent-foreground: oklch(0.21 0.006 285.885);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.92 0.004 286.32);
  --input: oklch(0.92 0.004 286.32);
  --ring: oklch(0.705 0.015 286.067);
  --radius: 0.625rem;
}

.dark {
  --background: oklch(0.141 0.005 285.823);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.21 0.006 285.885);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.21 0.006 285.885);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.65 0.11 240.79);        /* AA-tuned; see note below */
  --primary-foreground: oklch(0.977 0.013 236.62);
  --secondary: oklch(0.274 0.006 286.033);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.274 0.006 286.033);
  --muted-foreground: oklch(0.705 0.015 286.067);
  --accent: oklch(0.274 0.006 286.033);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.552 0.016 285.938);
}
```

**Semantic usage:** page = `background`/`foreground`; cards = `card`/
`card-foreground`; the accent (links, active tab, date line, focus ring) =
`primary` (with `ring` for focus outlines); secondary/metadata text =
`muted-foreground`; hairlines = `border`; errors = `destructive`.

**Dark mode:** toggled by adding/removing `.dark` on `<html>`. Ship a header
theme toggle that persists the choice (localStorage) and initializes from the
stored value or `prefers-color-scheme`. Both modes must pass AA.

Contrast: `foreground`/`muted-foreground` on `background` pass AA in both modes.
Never put body text on the `primary` fill except `primary-foreground`.

**Dark-mode `--primary` is a TEXT accent, not a fill** (corrected 2026-07-19).
The accent carries month headings and every card's date line, so it is small
bold *text* and must clear 4.5:1. The original `oklch(0.443 0.11 240.79)`
scored **2.64:1** on the page and **2.35:1** on a card — a real AA failure,
caught by Lighthouse, not by eye. It is now `oklch(0.65 0.11 240.79)`:
**6.24:1** and **5.56:1**.

The trade-off is deliberate: at this lightness, `primary-foreground` on a
`primary` fill is only 2.99:1, so **do not use dark-mode `primary` as a
background behind text**. If a filled accent is ever needed, add a separate
darker `--primary-fill` token rather than dimming this one back down.

Light mode is unchanged: `oklch(0.5 0.134 242.749)` on white is 5.85:1.

### Typography

- **Family:** Inter (with system-ui fallback): `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`.
- **Scale:** `h1` 2rem/700 · `h2` (month labels) 0.85rem/700 uppercase tracked ·
  `h3` (card title) 1rem/600 · body 1rem/400 · meta 0.85rem.
- Line-height 1.5 body, 1.2 headings. Left-aligned. No justification.

### Spacing & shape

- 4px base scale (Tailwind default). Card padding `1rem–1.1rem`. Section gap `2rem`.
- Radius: from `--radius` (`0.625rem`) for cards/inputs; pills/tabs `999px`.
- Shadow: none at rest; a soft elevation on card hover only (use a Tailwind
  shadow utility so it reads correctly in both light and dark).

---

## Components

Build these as the app's vocabulary. Interactive primitives are built on **Base
UI** (`@base-ui/react`) and styled with Tailwind + the semantic tokens
above; write the component source by hand into `src/components/ui/` (no shadcn
CLI, no Radix). In practice only **Tabs** needs a headless primitive — Button,
Card, and Skeleton are plain token-styled elements.

### AppHeader
Title (`WordCamp Schedule Viewer`, `foreground`, h1) + one-line `muted-foreground`
subtitle naming the data source. Include the **theme toggle** (light/dark) here.

### ThemeToggle
Button that toggles `.dark` on `<html>`, persists to localStorage, and initializes
from stored value or `prefers-color-scheme`. Accessible label; visible focus ring.

### Tabs (Upcoming / Past)  — Base UI Tabs
Pill-style segmented control built on Base UI Tabs. Active pill: `card` bg,
`foreground` text, subtle shadow. Inactive: transparent, `muted-foreground` text.
Base UI provides the roles/keyboard behavior; ensure `aria-selected` and a visible
`ring` focus outline.

### ViewToggle (Calendar / List)
Pill-style segmented control matching the Tabs treatment, right-aligned on the
schedule's top row — sharing it with the tabs in the list view, alone in the
calendar view. Two buttons in a `role="group"`, each carrying `aria-pressed`.
Active: `card` bg, `foreground` text, subtle shadow. Inactive: transparent,
`muted-foreground` text.

### MonthCalendar (required primary view)
A real month grid as a native `<table>`, Monday-first, six fixed rows so the
height never jumps between months. Header row: `muted-foreground`, uppercase,
tracked. Day cells: `border` hairlines, `h-24`, top-aligned; adjacent-month
cells get `bg-muted/30` and a dimmed day number. Today's day number is
`primary` and bold, with `aria-current="date"` on the cell.

Today's cell also carries `ring-2 ring-inset ring-primary` — a ring rather than
a fill, so today reads at a glance in both themes without putting text on a
`primary` background.

Nav row above the grid: ghost chevron buttons either side of an `h2` month
label, disabled at the bounds of the data, plus a small default-variant "Today"
button beside the label that returns to the current month (disabled while it is
already on screen).

Note the tabs do **not** appear above the calendar — they filter the list only.

Camp chips: `secondary` bg with `secondary-foreground`, `rounded`, `text-xs`,
truncated. **Never `primary` as a chip fill** — in dark mode `--primary` is
lightened as a text accent and hits only 2.99:1 behind `primary-foreground`.
Continuation days of a multi-day camp are `muted-foreground` text with a `↳`
marker and no link.

### ListView (companion view)
WordCamps grouped into **month sections** in chronological order. Each section:
uppercase `primary`-colored month label (`March 2026`) with a `border` hairline
rule beneath, then a responsive grid of cards
(`repeat(auto-fill, minmax(240px, 1fr))`).

### WordCampCard
- Title (h3) — links to the event (`target="_blank" rel="noopener noreferrer"`),
  `foreground` → `primary` on hover.
- Date line in `primary`, bold, `Sat, 14 Mar 2026` format; `Date TBD` when missing.
- Location in `muted-foreground`; hidden entirely when absent (no empty label).
- Card: `card` surface, `border`, `--radius`; lifts on hover (shadow +
  `translateY(-2px)`).

### States
- **Loading:** Skeleton cards (not a spinner) — preserves layout. Region has
  `role="status"`.
- **Empty:** calm `muted-foreground` sentence, e.g. "No upcoming WordCamps with
  scheduled dates."
- **Error:** `destructive` text in a bordered callout, `role="alert"`,
  plain-language message + the underlying reason.

### Footer
Small `muted-foreground` line linking the WordCamp Central API endpoint (credit
the source).

---

## Do / Don't

**Do:** semantic HTML, semantic token names, AA contrast **in both modes**,
designed empty/error states, keyboard-navigable tabs, hover affordances on
interactive cards, verify each component in light AND dark.

**Don't:** hardcode OKLCH/hex or literal colors in components (use tokens), use
the shadcn CLI or Radix (Base UI, hand-written), add a spinner where a skeleton
fits, put body text on the `primary` fill, add animation/parallax/gradients that
don't serve legibility, or introduce a second accent color.

---

## Implementation checklist

- [ ] OKLCH tokens defined once (`:root` + `.dark`) and mapped in `tailwind.config.js`
- [ ] `cn()` util in `src/lib/` (clsx + tailwind-merge), set up by hand
- [ ] Base UI installed; Tabs built on it; ui primitives hand-written in `src/components/ui/`
- [ ] Theme toggle: persists to localStorage, respects `prefers-color-scheme`
- [ ] All four states (loading skeleton / success / empty / error) implemented
- [ ] Focus-visible `ring` on every interactive element
- [ ] Every component verified in both light and dark modes
- [ ] Contrast checked in both modes (foreground/muted-foreground on background; primary-foreground on the primary active pill)
