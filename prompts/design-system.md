# Design-System Prompts

Paste-ready prompts for building the UI in a fresh Claude Code session. They
assume the `wordcamp-design-system` skill and `CLAUDE.md` are present. Run them
in order; each is a small, reviewable, commit-sized step.

---

## 0. Prime the session

> Read `CLAUDE.md`, `docs/PRD.md`, and the `wordcamp-design-system` skill. Confirm
> the stack (React + Webpack/Babel, Tailwind + Base UI primitives hand-written,
> TanStack Query + Router code-based, Jest + Playwright) and that nothing you do
> will violate the assignment's non-negotiables. Then wait for my next step.

---

## 1. Tokens & Tailwind foundation

> Set up the design-system foundation from the `wordcamp-design-system` skill.
> Author (do NOT scaffold) `tailwind.config.js` and `postcss.config.js` by hand.
> Define the OKLCH tokens as CSS variables in `:root` and `.dark` (per the skill),
> and map the semantic names into the Tailwind theme so components never use raw
> OKLCH/hex. Add the `cn()` helper (clsx + tailwind-merge) in `src/lib/`. Wire
> Inter as the font. Add the theme-toggle mechanism (write `.dark` on `<html>`,
> persist to localStorage, init from stored value or `prefers-color-scheme`).
> Keep it minimal — no components yet. Commit as
> `feat(ui): oklch design tokens, tailwind foundation, theme toggle`.

---

## 2. Base primitives (Base UI, hand-written)

> Add the UI primitives we need — Button, Card, Skeleton (plain, token-styled) and
> Tabs (built on Base UI, `@base-ui-components/react`) — written by hand into
> `src/components/ui/`. Do NOT run the shadcn CLI and do NOT use Radix. Each
> primitive gets a small RTL smoke test, checked in both light and dark. Ensure
> focus-visible rings use the `ring` token. Commit as
> `feat(ui): base primitives (button, card, skeleton, base-ui tabs)`.

---

## 3. WordCampCard

> Build `WordCampCard` per the skill: h3 title linking out
> (`target="_blank" rel="noopener noreferrer"`, `foreground`→`primary` hover),
> `primary` bold date line (`Sat, 14 Mar 2026`, `Date TBD` when missing),
> `muted-foreground` location hidden when absent, card hover lift. Props are the
> normalized WordCamp shape. Cover it with
> RTL tests (link vs plain title, hidden empty location, date formatting).
> Commit as `feat(ui): WordCampCard component`.

---

## 4. Tabs + CalendarView

> Build the Upcoming/Past pill Tabs on Base UI (accessible: tablist/tab,
> aria-selected, arrow-key nav, `ring` focus outline) and the CalendarView that
> groups WordCamps into month sections (uppercase `primary` month label + `border`
> hairline rule, responsive card grid). Include the empty state. Tests: month
> grouping/order, empty state, tab a11y. Commit as
> `feat(ui): tabs and month-grouped calendar view`.

---

## 5. States pass

> Ensure all four states are designed and tested: loading (skeleton cards,
> role=status), success, empty (calm `muted-foreground` sentence), error
> (`destructive` callout, role=alert, plain-language message). No spinners. Verify
> AA contrast in BOTH light and dark for text and the active pill. Commit as
> `feat(ui): loading, empty, and error states`.

---

## 6. Design review

> Review the built UI against the `wordcamp-design-system` skill's Do/Don't list
> and implementation checklist. Flag any hardcoded OKLCH/hex, missing focus rings,
> undesigned states, Radix/shadcn-CLI usage, or contrast issues (in either mode),
> and fix them. Keep changes minimal (KISS). Commit as
> `refactor(ui): design-system compliance pass`.
