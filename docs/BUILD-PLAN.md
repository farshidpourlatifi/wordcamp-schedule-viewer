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

### Phase 0 - Pre-flight (~30 min)
- [ ] Re-read the live brief (https://careers.rtcamp.com/assignments/senior-react-engineer/);
      diff against `assignment-prd.md`; note changes incl. any AI-use policy
- [ ] `curl` real records from `https://central.wordcamp.org/wp-json/wp/v2/wordcamps`;
      verify date meta key/format + `X-WP-TotalPages` pagination; save 2-3 real
      records as test fixtures (they seed every suite below)

### Phase 1 - Toolchain (commit: `chore: initialize hand-configured webpack + babel toolchain`)
- [ ] Hand-written, commented: webpack.config.js, .babelrc, postcss/tailwind config (no
      init generators), jest.config.js with `coverageThreshold: {global: {branches: 60,
      functions: 60, lines: 60, statements: 60}}` and `testMatch` limited to `*.test.js(x)`
      (avoids the fixtures-in-__tests__ trap)
- [ ] ESLint (react, react-hooks, **jsx-a11y**) + Prettier - jsx-a11y feeds the
      Lighthouse a11y score later
- [ ] npm scripts: `start`, `build`, `test`, `test:coverage`, `lint`
- [ ] **Gate:** hello-world serves via `npm start`; one sample test passes; lint runs clean

### Phase 2 - Data layer (test-FIRST)
Unit suites to write (fixtures from Phase 0):
- [ ] `decodeEntities.test` - entities (`&#8211;`, `&amp;`) decode to plain TEXT;
      **assert output contains no HTML** (this is the XSS guard: decode must be
      text-only, never innerHTML/dangerouslySetInnerHTML on API data)
- [ ] `parseDate.test` - Unix-seconds, ISO string, missing/garbage -> null ("Date TBD" path)
- [ ] `normalize.test` - full record -> view model; every meta field optional/defaulted
- [ ] `partition.test` - upcoming vs past split at injectable `now`; sort order;
      dateless camps land in past/TBD deterministically
- [ ] `groupByMonth.test` + formatter tests
- [ ] `api.test` - builds correct URL (`?per_page=100&page=N`), reads `X-WP-TotalPages`,
      loops all pages, throws on non-ok - all with mocked fetch (no network in tests, ever)
- [ ] Implementation commits paired with each suite

### Phase 3 - State + hook
- [ ] TanStack Query wired; `useWordCamps` hook
- [ ] `useWordCamps.test` - loading -> success, loading -> error, with injectable
      fetch + fixed clock (deterministic)

### Phase 4 - UI (invoke the wordcamp-design-system skill; commit per component)
- [ ] Tabs (upcoming/past) - real `role="tab"`/`tablist`, keyboard operable
- [ ] CalendarView (month-grouped; REQUIRED, primary view) + empty state
- [ ] WordCampCard - external links get `rel="noopener noreferrer"`; empty location hidden
- [ ] Explicit loading (`role="status"`) / error (`role="alert"`) / empty states
- [ ] Semantic landmarks + heading hierarchy (`<main>`, one `<h1>`, ordered `<h2>`s)
- [ ] Component tests: WordCampCard (link vs plain title, entity-decoded title renders
      as text not markup), CalendarView (month headings, empty state)

### Phase 5 - Integration + coverage gate
- [ ] RTL app-level tests: initial loading state; upcoming renders by default; tab
      switch shows past; API failure shows error state (mocked fetch + fixed clock)
- [ ] **Gate:** `npm run test:coverage` >=60% on ALL four metrics. If short, add
      util/component tests - do not chase branches in UI glue

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

### Phase 7 - Stretch (ONLY after Phase 6 gate is green)
- [ ] GitHub Actions CI: lint + test + build on push/PR
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
