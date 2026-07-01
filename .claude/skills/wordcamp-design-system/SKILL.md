---
name: wordcamp-design-system
description: The design system for the WordCamp Schedule Viewer app. Use whenever building, styling, or reviewing UI — components, layout, color, typography, spacing, states. Based on Claude Design brand tokens (navy/blue), implemented with Tailwind + shadcn/ui.
---

# WordCamp Schedule Viewer — Design System

A small, focused design system for a **content-forward, view-only** web app.
Based on **Claude Design** brand tokens so it stays visually coherent with the
owner's CV and portfolio. Implemented with **Tailwind CSS + shadcn/ui**
(components copied in by hand — the shadcn CLI is not used on this Webpack build).

Invoke this skill before creating or restyling any UI. Follow the tokens and
component rules below rather than inventing ad-hoc values.

---

## Design principles

1. **Content first.** The WordCamps are the product. Chrome is quiet; the data is loud.
2. **Calm, professional, legible.** This is a portfolio piece reviewed by an
   engineer — restraint reads as competence. No gradients-for-drama, no motion
   for its own sake.
3. **One accent, used sparingly.** Navy is structure; blue is the single accent
   for links, active states, and dates. Don't rainbow it.
4. **Every state is designed.** Loading, empty, and error states are first-class,
   not afterthoughts.
5. **Accessible by default.** WCAG AA contrast, real semantic elements, visible
   focus rings, keyboard-navigable tabs.

---

## Design tokens

Define these as CSS variables (`:root`) and map them in `tailwind.config.js` so
components reference semantic names, never raw hex (DRY).

### Color

| Token | Value | Use |
|---|---|---|
| `--navy` (foreground/structure) | `#0f2438` | Headings, primary text, name/brand |
| `--blue` (accent) | `#1b6ec2` | Links, active tab, dates, focus ring |
| `--blue-hover` | `#155a9e` | Accent hover |
| `--slate` (muted) | `#64748b` | Secondary text, metadata, captions |
| `--bg` | `#f8fafc` | Page background |
| `--card` | `#ffffff` | Card / surface background |
| `--border` | `#e2e8f0` | Hairline borders, dividers |
| `--danger` | `#b91c1c` | Error text/state |
| `--success` | `#15803d` | (optional) upcoming badge |

Contrast: navy on white and slate on white both pass AA for body text. Never put
body text on the blue fill.

### Typography

- **Family:** Inter (with system-ui fallback): `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`.
- **Scale:** `h1` 2rem/700 · `h2` (month labels) 0.85rem/700 uppercase tracked ·
  `h3` (card title) 1rem/600 · body 1rem/400 · meta 0.85rem.
- Line-height 1.5 body, 1.2 headings. Left-aligned. No justification.

### Spacing & shape

- 4px base scale (Tailwind default). Card padding `1rem–1.1rem`. Section gap `2rem`.
- Radius: cards/inputs `10px` (`--radius`), pills/tabs `999px`.
- Shadow: none at rest; a soft `0 4px 14px rgba(15,36,56,0.10)` on card hover only.

---

## Components

Build these as the app's vocabulary. Prefer shadcn/ui primitives (Button, Tabs,
Card, Skeleton) styled with the tokens above; copy their source into
`src/components/ui/` by hand.

### AppHeader
Title (`WordCamp Schedule Viewer`, navy, h1) + one-line slate subtitle naming the
data source. No nav bar needed.

### Tabs (Upcoming / Past)
Pill-style segmented control. Active pill: white bg, navy text, subtle shadow.
Inactive: transparent, slate text. `role="tablist"`/`role="tab"`,
`aria-selected`, arrow-key navigable, visible focus ring in `--blue`.

### CalendarView (required primary view)
WordCamps grouped into **month sections** in chronological order. Each section:
uppercase blue month label (`March 2026`) with a hairline rule beneath, then a
responsive grid of cards (`repeat(auto-fill, minmax(240px, 1fr))`).

### WordCampCard
- Title (h3) — links to the event (`target="_blank" rel="noopener noreferrer"`),
  navy → blue on hover.
- Date line in **blue**, bold, `Sat, 14 Mar 2026` format; `Date TBD` when missing.
- Location in slate; hidden entirely when absent (no empty label).
- Card: white, `--border`, `--radius`; lifts on hover (shadow + `translateY(-2px)`).

### States
- **Loading:** shadcn `Skeleton` cards (not a spinner) — preserves layout.
  Region has `role="status"`.
- **Empty:** calm slate sentence, e.g. "No upcoming WordCamps with scheduled dates."
- **Error:** `--danger` text in a bordered callout, `role="alert"`, plain-language
  message + the underlying reason.

### Footer
Small slate line linking the WordCamp Central API endpoint (credit the source).

---

## Do / Don't

**Do:** semantic HTML, token variables, AA contrast, designed empty/error states,
keyboard-navigable tabs, hover affordances on interactive cards.

**Don't:** hardcode hex in components (use tokens), use the shadcn CLI (copy in
by hand), add a spinner where a skeleton fits, put text on the blue fill, add
animation/parallax/gradients that don't serve legibility, or introduce a second
accent color.

---

## Implementation checklist

- [ ] Tokens defined once in `:root` and mapped in `tailwind.config.js`
- [ ] `cn()` util in `src/lib/` (clsx + tailwind-merge), set up by hand
- [ ] shadcn primitives copied into `src/components/ui/`, restyled to tokens
- [ ] All four states (loading skeleton / success / empty / error) implemented
- [ ] Focus-visible rings on every interactive element, in `--blue`
- [ ] Contrast checked (navy/slate on white, white on blue for the active pill)
