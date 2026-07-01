# Design-System Prompts

Paste-ready prompts for building the UI in a fresh Claude Code session. They
assume the `wordcamp-design-system` skill and `CLAUDE.md` are present. Run them
in order; each is a small, reviewable, commit-sized step.

---

## 0. Prime the session

> Read `CLAUDE.md`, `docs/PRD.md`, and the `wordcamp-design-system` skill. Confirm
> the stack (React + Webpack/Babel, Tailwind + shadcn/ui copied in by hand,
> TanStack Query + Router code-based, Jest + Playwright) and that nothing you do
> will violate the assignment's non-negotiables. Then wait for my next step.

---

## 1. Tokens & Tailwind foundation

> Set up the design-system foundation from the `wordcamp-design-system` skill.
> Author (do NOT scaffold) `tailwind.config.js` and `postcss.config.js` by hand.
> Define the color/typography/spacing tokens as CSS variables in a global stylesheet
> and map the semantic names into the Tailwind theme so components never use raw
> hex. Add the `cn()` helper (clsx + tailwind-merge) in `src/lib/`. Wire Inter as
> the font. Keep it minimal — no components yet. Commit as
> `feat(ui): design tokens and tailwind foundation`.

---

## 2. Base primitives (shadcn, copied in by hand)

> Add the shadcn/ui primitives we need — Button, Tabs, Card, Skeleton — by copying
> their source into `src/components/ui/` and restyling them to our tokens. Do NOT
> run the shadcn CLI (it assumes Vite/Next; we're on Webpack). Each primitive gets
> a small RTL smoke test. Ensure focus-visible rings use the blue accent token.
> Commit as `feat(ui): base primitives (button, tabs, card, skeleton)`.

---

## 3. WordCampCard

> Build `WordCampCard` per the skill: h3 title linking out
> (`target="_blank" rel="noopener noreferrer"`, navy→blue hover), blue bold date
> line (`Sat, 14 Mar 2026`, `Date TBD` when missing), slate location hidden when
> absent, card hover lift. Props are the normalized WordCamp shape. Cover it with
> RTL tests (link vs plain title, hidden empty location, date formatting).
> Commit as `feat(ui): WordCampCard component`.

---

## 4. Tabs + CalendarView

> Build the Upcoming/Past pill Tabs (accessible: role=tablist/tab, aria-selected,
> arrow-key nav, blue focus ring) and the CalendarView that groups WordCamps into
> month sections (uppercase blue month label + hairline rule, responsive card grid).
> Include the empty state. Tests: month grouping/order, empty state, tab a11y.
> Commit as `feat(ui): tabs and month-grouped calendar view`.

---

## 5. States pass

> Ensure all four states are designed and tested: loading (skeleton cards,
> role=status), success, empty (calm slate sentence), error (danger callout,
> role=alert, plain-language message). No spinners. Verify AA contrast on
> navy/slate text and the white-on-blue active pill. Commit as
> `feat(ui): loading, empty, and error states`.

---

## 6. Design review

> Review the built UI against the `wordcamp-design-system` skill's Do/Don't list
> and implementation checklist. Flag any hardcoded hex, missing focus rings,
> undesigned states, or contrast issues, and fix them. Keep changes minimal
> (KISS). Commit as `refactor(ui): design-system compliance pass`.
