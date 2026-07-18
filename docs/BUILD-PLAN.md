# Build Plan - WordCamp Schedule Viewer

**This is the working copy - tick the checkboxes here as you build.**
Copied 2026-07-18 from the private job-search workspace
(`applications/rtcamp/build-plan.md`, the master record). Companion to
[`PRD.md`](PRD.md) (requirements) and the root `CLAUDE.md` (stack decisions).

## Current state

- **Repo exists - do not create a new one.**
  - Local: `~/Claude/Projects/wordcamp-schedule-viewer`
  - Remote: `github.com/farshidpourlatifi/wordcamp-schedule-viewer` (PUBLIC), in sync
  - Git author: farshidpourlatifi <farshid.pourlatifi@gmail.com> (correct - no work identity leak)
- Docs-only commits from 2026-07-02 + 2026-07-18. **No source code yet.**
- Stack already decided in the repo's CLAUDE.md: React 18, hand-wired Webpack 5 + Babel
  (no CRA/Vite scaffold), Tailwind CSS + Base UI primitives, shadcn-style OKLCH tokens
  (light/dark, in `.claude/skills/wordcamp-design-system/`), TanStack Query + code-based
  TanStack Router, Jest + RTL (>=60% enforced via coverageThreshold), Playwright E2E,
  Vercel deploy, GitHub Actions CI.

## AI-docs decision - RESOLVED 2026-07-18

Farshid decided: **keep things transparent.** CLAUDE.md, prompts/, and the design-system
skill stay in the public repo; the history stays as-is. AI-assisted development is
presented openly (stated in docs/ASSESSMENT.md). Still do in Phase 0: re-check the live
brief for an AI-use policy and follow it exactly if one exists.

## Methodology

- **Test-first for pure layers** (utils, API client) - tests drive the design there.
  Test-alongside for components and UI glue. RTL asserts user-visible behavior.
  No Gherkin/Cucumber ceremony - overkill for this size.
- **Commit pairing rule (history is graded):** every `feat` commit is followed
  immediately by (or includes) its tests - e.g. `feat(utils): ...` then
  `test(utils): ...`. Small conventional commits; never squash; no node_modules/dist.
- Sequencing rule: core before stretch. Playwright, CI, Router, map view come AFTER
  the required app is solid (PRD §9 warning).

## Build phases with explicit quality tasks

### Phase 0 - Pre-flight (~30 min) - DONE 2026-07-18
- [x] Re-read the live brief (https://careers.rtcamp.com/assignments/senior-react-engineer/);
      diff against `assignment-prd.md`; note changes incl. any AI-use policy
      -> **No drift.** Brief still requires: React + WordCamp Central WP REST API,
      calendar view (map optional), no scaffold/no CRA, Jest or Enzyme >=60% coverage,
      public GitHub/GitLab repo (no zips - commit history is the point), hosted demo,
      read-only, UI/UX at own discretion, CSS frameworks allowed.
      **No AI-use policy stated** -> the 2026-07-18 transparency decision stands unchanged.
- [x] `curl` real records from `https://central.wordcamp.org/wp-json/wp/v2/wordcamps`;
      verify date meta key/format + `X-WP-TotalPages` pagination; save 2-3 real
      records as test fixtures (they seed every suite below)
      -> fixtures in `src/test/wordcamps.fixtures.js` (5 real records covering
      upcoming / past / named entity / numeric entity / dateless+locationless)

#### API findings (verified live 2026-07-18 - these override the PRD's assumptions)
- **Meta is TOP-LEVEL on each record, not nested under `meta`.** Read
  `record["Start Date (YYYY-mm-dd)"]`, not `record.meta[...]`.
- **`Start Date (YYYY-mm-dd)` is a Unix timestamp in SECONDS, as a STRING**
  (e.g. `"1786233600"`) - the key name lies about the format. Same for `End Date`.
- Absent meta returns **`""`**, not `null`/`undefined` - normalizer must treat
  empty string as missing.
- Pagination confirmed: `X-WP-TotalPages` = **15** at `per_page=100`
  (`X-WP-Total` = 1480 records). Both headers are CORS-exposed, so the browser
  can read them.
- Useful fields: `title.rendered`, `link`, `URL` (event site), `Website URL`,
  `Location` (`"City, Country"`), `Venue Name`, `Event Timezone`, `status`
  (`wcpt-scheduled` / `wcpt-closed`).
- `_host_coordinates` / `_host_country_name` are frequently **empty** - the
  optional map view must tolerate missing geo. Partition on the parsed start
  date, **not** on `status`.

### Phase 1 - Toolchain - DONE 2026-07-18 (commit `f4e3f8c`)
- [x] Hand-written, commented: webpack.config.js, babel.config.js, postcss/tailwind config (no
      init generators), jest.config.js with `coverageThreshold: {global: {branches: 60,
      functions: 60, lines: 60, statements: 60}}` and `testMatch` limited to `*.test.js(x)`
      (avoids the fixtures-in-__tests__ trap)
- [x] ESLint (react, react-hooks, **jsx-a11y**) + Prettier - jsx-a11y feeds the
      Lighthouse a11y score later
- [x] npm scripts: `start`, `build`, `test`, `test:coverage`, `lint`
- [x] **Gate:** hello-world serves via `npm start`; one sample test passes; lint runs clean
      -> dev server 200s (incl. deep-link history fallback), prod build compiles,
      4 tests pass, lint clean; verified in-browser that OKLCH tokens resolve and
      dark mode initializes from `prefers-color-scheme`

#### Phase 1 deviations from the plan (deliberate)
- **Base UI package renamed.** `@base-ui-components/react` stalled at `1.0.0-rc.0`;
  the library shipped 1.0 as **`@base-ui/react`** (now 1.6.x). Same library, new
  scope - installed the renamed package. CLAUDE.md updated to match.
- **`babel.config.js`, not `.babelrc`** (PRD §4 said `.babelrc`). A root config
  applies project-wide; `.babelrc` is file-relative and does not reliably cover
  everything Jest pulls in.
- **React 18 kept** (per CLAUDE.md) even though 19 is current - Base UI 1.6
  supports `^17 || ^18 || ^19`, so there is no forcing reason to swap the
  decided stack.
- **Tailwind v3, not v4** - the design-system skill specifies mapping tokens in
  `tailwind.config.js`, which is the v3 model; v4 is CSS-first and would move
  the token contract.
- **Markdown excluded from Prettier** - the docs are hand-wrapped prose; letting
  Prettier reflow them would bury real changes in whitespace churn.

#### Phase 1 addendum - DONE 2026-07-18 (commit `f469f24`)
- [x] **Complexity lint gate** - follow-up `chore(lint)` commit: add
      `complexity: ["error", 10]` and `max-depth: ["error", 3]` to the src rules
      block in eslint.config.js (with a short comment: this is the complexity
      half of a CRAP-style risk bound; the coverage/mutation half lives in
      Phase 7). Run `npm run lint` - existing hello-world code should already
      pass; if anything trips, simplify the code rather than raising the limit.
      -> dropped into the existing flat-config src block unchanged; no code
      tripped either rule, then or through all of Phase 2.

### Phase 2 - Data layer (test-FIRST) - DONE 2026-07-18
Unit suites to write (fixtures from Phase 0):
- [x] `decodeEntities.test` - entities (`&#8211;`, `&amp;`) decode to plain TEXT;
      **assert output contains no HTML** (this is the XSS guard: decode must be
      text-only, never innerHTML/dangerouslySetInnerHTML on API data)
      -> `8133146`. Pure string transform, no DOM: the usual
      `textarea.innerHTML` / `DOMParser` decode tricks route untrusted API text
      through an HTML parser, the exact sink to avoid.
- [x] `parseDate.test` - Unix-seconds, ISO string, missing/garbage -> null ("Date TBD" path)
      -> `c234f0c`. Returns null, never an Invalid Date (truthy AND
      `instanceof Date`, so it survives null checks and fails later).
- [x] `normalize.test` - full record -> view model; every meta field optional/defaulted
      -> `ec31535`
- [x] `partition.test` - upcoming vs past split at injectable `now`; sort order;
      dateless camps land in past/TBD deterministically
      -> `82b9fde`
- [x] `groupByMonth.test` + formatter tests -> `1415f86`
- [x] `api.test` - builds correct URL (`?per_page=100&page=N`), reads `X-WP-TotalPages`,
      loops all pages, throws on non-ok - all with mocked fetch (no network in tests, ever)
      -> `2c2032e`. A `jest.setup.js` tripwire fails any test that reaches for
      global fetch, so "no network in tests" is enforced, not just intended.
- [x] Implementation commits paired with each suite (six `feat` commits, each
      shipping green with its own suite)

**Coverage after Phase 2: 98.7% statements / 95.1% branches / 97.4% functions**
(73 tests, 9 suites) - already well clear of the 60% floor before any UI exists.

#### Phase 2 findings that affect later phases
- **Day-granularity partitioning was not theoretical.** Run against live data,
  the soonest upcoming camp was *today* - a naive `startDate >= now` would have
  filed a camp happening right now under Past. Split compares UTC day
  boundaries.
- **`_fields` payload trimming is unusable.** The endpoint silently drops any
  field whose name contains a space or parentheses, and `Start Date
  (YYYY-mm-dd)` is exactly that - a field list returns records with NO dates.
  Full records are the only option; noted for the Phase 6 perf discussion.
- **Live pipeline check (whole data layer, 1,480 real records):** 1,480/1,480
  normalized, 37 upcoming / 1,443 past, 219 past month sections, 7 dateless in
  the trailing TBD section, zero empty titles or URLs, zero tags or entities
  leaking through. Fetch of all 15 pages takes ~3.7s.
- **Phase 4 - Past is ~1,443 cards across 219 month sections.** Rendering that
  in one list will hurt the Lighthouse performance target and is unusable to
  scroll. The data layer returns the full set; the UI decides what to show.

#### Phase 2 review outcomes - RESOLVED 2026-07-19
- [x] **URL sanitization** (`98faf5d`) - the normalizer passed `URL`/`link`
      through unsanitized and Phase 4 renders them as `<a href>`, an executable
      sink. Now scheme-checked to http(s); anything else becomes `""` and
      renders as an unlinked title. Zero false positives across all 1,480 live
      records (feed is https/http only).
- [x] **parseDate branch** (`98faf5d`) - over-range seconds now covered;
      `src/utils` is at 100% branch coverage.
- **Past list - DECIDED: progressive reveal.** Render the most recent ~12 months
  of Past; a "Show earlier" button appends older month sections. **No
  virtualization dependency** - keeps the bundle and the reasoning small.
- **Loading - DECIDED: skeleton-first**, treated as load-bearing (a full load is
  ~3.7s). Page-1-first streaming is OPTIONAL and only worth it if it does not
  complicate `useWordCamps`; default to not doing it.

### Phase 3 - State + hook - DONE 2026-07-19 (commit `63b3c2d`)
- [x] TanStack Query wired; `useWordCamps` hook
      -> hook owns fetch -> normalize -> partition, so components never see an
      API field name. `createQueryClient()` is a FACTORY (a module singleton is
      a global cache that leaks between tests) and is mounted at the
      composition root in `index.js`, letting tests supply their own client.
- [x] `useWordCamps.test` - loading -> success, loading -> error, with injectable
      fetch + fixed clock (deterministic)
      -> plus: abort-signal forwarding, one-fetch-per-mount, stable list
      identity across re-renders, and a bare `useWordCamps()` call so the
      injectable DEFAULTS are exercised rather than shipped untested.

**Coverage after Phase 3: 100% statements / 100% functions / 100% lines /
98.9% branches** (91 tests, 11 suites).

### Phase 4 - UI - DONE 2026-07-19 (commits `39ab085`, `73d75fe`, `5982aec`, `9921816`)
- [x] Tabs (upcoming/past) - real `role="tab"`/`tablist`, keyboard operable
      -> Base UI. **Manual activation kept** (its default): with automatic
      activation, arrowing across tabs would render the Past panel - 12 month
      sections of cards - just to pass over it.
- [x] CalendarView (month-grouped; REQUIRED, primary view) + empty state
      -> progressive reveal, 12 months per batch, per the Phase 2 decision
- [x] WordCampCard - external links get `rel="noopener noreferrer"`; empty location hidden
- [x] Explicit loading (`role="status"`) / error (`role="alert"`) / empty states
      -> skeleton cards (not a spinner); error shows plain-language text AND
      the underlying reason, plus a retry
- [x] Semantic landmarks + heading hierarchy (`<main>`, one `<h1>`, ordered `<h2>`s)
- [x] Component tests: WordCampCard, CalendarView, Tabs, ThemeToggle, states, primitives

#### :warning: Two browser-only bugs found in Phase 4 - jsdom could not see either
Both passed their unit tests while being visibly broken in a real browser.
Lesson for Phases 6-7: **UI work needs a browser check, not just green tests.**
1. **Both tab panels visible at once.** Base UI keeps a deactivated panel
   mounted while it "animates out" (`data-ending-style`), waiting on a CSS
   transition this app never runs. jsdom applies no CSS and unmounts the panel,
   so tests were green. Fixed by hiding the exiting panel explicitly.
2. **Active tab never highlighted.** The pill was styled against
   `data-selected`; Base UI actually sets **`data-active`**. Styling keyed to an
   attribute that never appears is invisible to jsdom, which applies no CSS.
Both are now pinned by class-presence assertions - weaker than a visual check,
but jsdom cannot express the real one. A Playwright test (Phase 7) is the
proper guard.

### Phase 5 - Integration + coverage gate - DONE 2026-07-19 (commit `9921816`)
- [x] RTL app-level tests: initial loading state; upcoming renders by default; tab
      switch shows past; API failure shows error state (mocked fetch + fixed clock)
      -> plus keyboard tab switching, retry recovery, landmark/heading structure,
      and "a tab switch does not refetch". Shared helper in
      `src/test/renderWithQuery.jsx` (fresh QueryClient per render).
- [x] **Gate:** `npm run test:coverage` >=60% on ALL four metrics
      -> **100% statements / 99.2% branches / 100% functions / 100% lines**
      (142 tests, 17 suites). Far above the 60% floor.

#### Live browser verification (Phase 4/5)
Driven against the real API in both themes: 37 upcoming across 9 month sections,
1,443 past across 219, reveal control appearing only where needed and correctly
counting down (207 -> 195 more months), theme toggle persisting to localStorage,
exactly one visible tab panel.

### Phase 6 - Hardening, SEO, deploy, Lighthouse, README
Security pass:
- [ ] grep confirms zero `dangerouslySetInnerHTML` / `innerHTML` on API data
- [ ] All external links `rel="noopener noreferrer"`
- [ ] `npm audit` - fix, or document known-safe exceptions in README
- [ ] No secrets/tokens anywhere (view-only app - there should be none)
SEO pass (SPA-appropriate; no SSR - deliberate, note it in README limitations):
- [ ] `<title>`, meta description, `lang` attr, favicon
- [ ] OG tags (optional, if time allows)
Deploy + Lighthouse gate:
- [ ] Vercel deploy (SPA rewrite -> /index.html); demo verified in incognito
- [ ] Lighthouse against the PRODUCTION URL: targets Accessibility >=95,
      Best Practices >=95, SEO >=90, Performance >=90 (fetch-heavy SPA - if perf
      lands lower, document why in README rather than hacking it)
- [ ] Record the four scores in the README
README (PRD §8):
- [ ] Setup, architecture + why, from-scratch tooling rationale, testing approach +
      coverage number, API caveats (pagination, date meta), Lighthouse scores,
      limitations / next steps
- [ ] **Limitations: the upcoming/past boundary freezes between data refreshes.**
      `useWordCamps` memoizes the partition on the query data, and the clock is
      deliberately NOT a memo dependency (a ticking clock would re-partition
      ~1,500 records on every render). So a tab left open overnight keeps
      yesterday's split until the next refetch. Deliberate and accepted -
      document it, don't "fix" it.
- [ ] Test-quality rationale line: no maintained CRAP reporter exists for Jest,
      so the same risk is bounded from both ends - cyclomatic complexity capped
      via ESLint (`complexity`/`max-depth`), test meaningfulness proven via the
      Stryker mutation score (Phase 7). If Phase 7 is skipped, say "planned"
      rather than claiming it.

### Phase 7 - Stretch (ONLY after Phase 6 gate is green)
- [ ] GitHub Actions CI: lint + test + build on push/PR
- [ ] **Mutation testing** (before Playwright - it hardens the tests that already
      exist): StrykerJS (`@stryker-mutator/core` + `@stryker-mutator/jest-runner`),
      **mutate `src/utils` + `src/api` ONLY** (pure layers - fast, honest mutants;
      UI mutants are slow noise). Separate `npm run test:mutation` script; target
      kill score >=85% in scope; kill survivors by strengthening assertions, not
      by excluding files. NOT in the blocking CI path (non-blocking/manual
      workflow if CI exists). Record the score in the README next to coverage.
- [ ] Playwright E2E: load happy-path, tab switch, error state (3 scenarios, no more)
- [ ] TanStack Router routes (/upcoming, /past), map view, search/filter,
      sessionStorage cache - pick by remaining energy, in that order

### Phase 8 - Submit (back in this repo)
- [ ] Paste repo URL + demo URL into `applications/rtcamp/cover-letter.md`
- [ ] Rebuild cover letter .docx if changed: `build/make-cv.sh applications/rtcamp/cover-letter.md`
- [ ] Submit at https://careers.rtcamp.com/assignments/senior-react-engineer/
      (CV .docx + cover letter + repo + demo links)
- [ ] Flip `tracking/applications.csv` rtCamp row to Applied; follow-up = submit
      date + 5 working days (guaranteed screening response window)

## Effort estimate

Core (Phases 0-6): one to two focused sessions. Stretch: optional third session.
Do not start Phase 7 until Phases 5 and 6 gates are green.

## Working agreement

Build in this repo. Opening prompt for a fresh session: "Read CLAUDE.md,
docs/PRD.md, docs/ASSESSMENT.md, and docs/BUILD-PLAN.md, then start Phase 0.
Tick checkboxes in BUILD-PLAN.md as tasks complete." Phase 8 (submission) happens
in the private job-search workspace - see ASSESSMENT.md for the cross-reference.
