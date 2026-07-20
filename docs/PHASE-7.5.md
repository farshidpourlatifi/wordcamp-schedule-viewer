# Phase 7.5 — Discovery & performance (Atlas-inspired, in place)

Companion to [`BUILD-PLAN.md`](BUILD-PLAN.md). Borrows the strongest ideas from
the "WordCamp Atlas" design handoff **without a rewrite** — the current app
already satisfies the brief (Google-Calendar-like calendar required; map
optional), so these are additive improvements to what ships, not a pivot.

## Why

The Atlas concept is a stronger *product design* than a plain schedule viewer.
Most of that strength is portable into the existing architecture as filters,
richer detail, and a smarter fetch — keeping the required calendar, the tested
data layer, the graded commit history, and the live deploy.

Scope decided with the user: **all four**, plus a small map fix.

## Items

### A. Map min-zoom clamp (quick fix)
Stop the map zooming out past a whole-world view (currently you can zoom into
grey void). Set `minZoom` to the level where the world just fills the frame, and
`maxBounds` so panning can't leave the world. MapView-only.

### B. Search
Case-insensitive filter across **title, location, country, venue**. A pure
predicate over normalized camps, applied per view input — so one implementation
serves calendar, list, and map. Result count announced via `aria-live`.

### C. Region (continent) filter
A `<select>` of continents, derived from `_venue_country_code` via a local
lookup (ported from the Atlas contract). Composes with search in one filter row.

### D. Richer map popups
Add **timezone** (present on nearly every record) and **anticipated
attendance** (labelled "anticipated", shown only when present) to the popup,
using fields the normalizer currently drops.

### E. Two-tier loading (scheduled-first)
`?status=wcpt-scheduled` returns **40 records in 1 request**; the default feed is
**1,481 records across 15 requests (~4.35 MB)**. Load scheduled first for an
instant upcoming paint, then stream the full archive in the background.

**Design.** `useWordCamps` runs two queries: `scheduled` (fast, drives the first
paint) and `all` (full, enabled right after mount, non-blocking). `camps` uses
`all` once present, `scheduled` meanwhile; `partitionByDate` splits it. Exposes
`isArchiveLoading` so the Past count and past-heavy views can show a quiet
"loading archive…" until the full feed lands.

**Honest limitation:** this *defers* the 4.35 MB off the critical path (better
FCP/LCP/perceived speed), it does not *avoid* it — the calendar is the default
view and shows the whole timeline, so the archive must load for it regardless.
Avoiding the bytes entirely would mean gating the archive on interaction, which
breaks the continuous calendar and the Past count. Not worth that trade.

## New / changed files

- `src/utils/continent.js` (+ test) — `continentFromCountryCode(code)`.
- `src/utils/filterCamps.js` (+ test) — pure `filterCamps(camps, {query, region})`.
- `src/utils/normalizeWordCamp.js` — add `timezone`, `attendees`, `countryCode`,
  `country`, `continent` to the view model (+ tests for each).
- `src/components/Filters.jsx` (+ test) — search input + region select + count.
- `src/components/MapView.jsx` — min-zoom/maxBounds; enriched popup.
- `src/api/wordcamps.js` — optional `status` param on the query (+ tests).
- `src/hooks/useWordCamps.js` — two-query scheduled/archive strategy (+ tests).
- `src/App.jsx` — filter state, filter row, `isArchiveLoading` wiring (+ tests).
- `e2e/schedule.spec.js` — search-filters-a-view and (light) archive scenarios.

## Testing (all kinds — required)

Every new pure util is in the Stryker scope (`src/utils` + `src/api`), so
mutation covers B/C/D/E's logic automatically; strengthen assertions until
survivors are only equivalent mutants.

- **Unit:** `continent` (each continent + Unknown + junk), `filterCamps` (each
  field, case-insensitivity, combined query+region, empty), normalizer additions,
  the `status` query param.
- **Integration (RTL):** App filters all three views; result count updates;
  empty-filter state; archive-loading indicator.
- **E2E (Playwright):** typing in search narrows a view; region select narrows it.
- **Mutation:** re-run `npm run test:mutation`; record the new score.

Gate every commit on `npm test` + `npx eslint .` (check the **exit code**, not
piped `tail`) + `npm run build`.

## Commit sequence (conventional, small, each green)

1. `fix(ui): clamp the map to a whole-world minimum zoom`
2. `feat(utils): derive continent from ISO country code`
3. `feat(utils): normalize timezone, attendance, country, and continent`
4. `feat(utils): filter camps by search text and region`
5. `feat(ui): add a search and region filter row`
6. `feat(ui): enrich map popups with timezone and attendance`
7. `perf(data): load scheduled events first, stream the archive`
8. `test: extend E2E and re-run mutation for the discovery features`
9. `docs: record Phase 7.5`

## Out of scope (decided)

Marker-size-by-attendance (data too sparse), in-progress status colour (the 16%
multi-month programmes would sit perpetually "in progress"), the time-horizon
slider (the calendar already owns time), and a full editorial rebrand.
