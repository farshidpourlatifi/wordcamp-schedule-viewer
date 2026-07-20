# PRD — rtCamp Senior React Engineer Assignment

**Deliverable:** A React app, the "WordCamp Schedule Viewer," submitted as a public
Git repo + a hosted live demo, in response to rtCamp's Senior React Engineer
coding assignment.

**Assignment brief (source of truth):** https://careers.rtcamp.com/assignments/senior-react-engineer/

> Hand this file to a fresh Claude Code (or build it yourself). It is
> self-contained. Confirm every requirement against the live brief above before
> submitting — rtCamp may update it.

---

## 1. Context & why this matters

rtCamp assesses this assignment on **code quality, coding standards, testing
practices, and development process (commit history)** — not just "does it work."
Treat it as a portfolio piece. The repo itself is the interview. A working app
with messy commits and no tests scores worse than a slightly smaller app that is
clean, tested, and well-documented.

The reviewer is a human engineer, not an ATS. Optimize for *their* reading
experience: a clear README, a sensible file layout, meaningful commits.

---

## 2. Hard requirements (from the brief — do not deviate)

1. **React** app that **fetches data from the WordCamp Central site via the WP
   REST API** and displays **upcoming and past WordCamps**.
2. **Calendar view is REQUIRED.** Map view is **optional** (nice-to-have).
3. **View-only.** No write operations, no auth, no mutations.
4. **Build from scratch — NO toolchain scaffold, explicitly NOT
   create-react-app.** You must hand-configure the build (Webpack + Babel, or a
   manually-configured Vite — document the choice). Do not `npx create-react-app`
   or `npm create vite@latest` and commit the template.
5. **Testing: Jest or Enzyme**, **minimum 60% test coverage.** (Prefer Jest +
   React Testing Library; Enzyme is legacy. The brief says "Jest or Enzyme," so
   Jest satisfies it.)
6. **Source in a public GitHub or GitLab repo.** No zip files.
7. **Hosted demo** on **GitHub Pages or Vercel** (Vercel is simplest for an SPA).
8. **UI/UX is your discretion** — but make it clean and legible.
9. **Commit history is assessed** — commit in small, logical, well-messaged steps.
   Do NOT squash everything into one "initial commit."

### Acceptance checklist (all must be true before submitting)

_Status as of 2026-07-20. Two items outstanding, both downstream of the deploy._

- [x] `git clone && npm install && npm start` runs the app locally with zero extra steps
- [x] App calls the real WordCamp Central WP REST API at runtime
- [x] Upcoming and past WordCamps both display, correctly split by date
      (verified live: 37 upcoming / 1,443 past)
- [x] Calendar view present and is the primary view (real month grid; list is a companion)
- [x] `npm test` passes; `npm run test:coverage` reports **≥ 60%** on all metrics
      (245 tests; 100% stmts / 99.5% branches / 100% fns / 100% lines)
- [x] No create-react-app / scaffold artifacts; build config is hand-written and commented
- [x] Public repo, clean incremental commit history, no `node_modules` committed — pushed
- [x] Live hosted demo URL works: <https://wordcamp-schedule-viewer.vercel.app>
      (production Lighthouse: 100 / 100 / 100 / 100)
- [x] README explains setup, architecture, the from-scratch tooling choice, and the demo link
      — written; the demo link is marked pending until the deploy happens

---

## 3. The data source (research findings — verify at build time)

**Endpoint:** `https://central.wordcamp.org/wp-json/wp/v2/wordcamps`

WordCamps are a **custom post type** exposed through the standard WP REST API.

- **Pagination:** the endpoint paginates. Read the **`X-WP-TotalPages`** response
  header and loop pages (`?per_page=100&page=N`) to get the full set.
- **Titles** come HTML-rendered as `{ rendered: "..." }` and contain HTML
  entities (e.g. `&#8211;`, `&amp;`) — decode/strip them for display.
- **Dates:** the start date lives in post meta. It has historically been a
  **Unix timestamp in seconds** under a key like `Start Date (YYYY-mm-dd)`.
  **⚠️ Verify the exact meta key and format against a live response before
  coding** — the WordCamp meta schema has changed over time and some fields may
  be restricted/absent depending on API permissions. Handle a **missing date**
  gracefully (treat as historical/past, show "Date TBD").
- **Location / URL:** also in meta (`Location`, `URL`) and/or the post `link`.
  Treat all meta as optional and defensively defaulted.

**Recommendation:** write a tiny throwaway script (or curl) first to inspect one
real record's shape, then model your normalizer to the *actual* payload rather
than to this PRD's assumptions.

---

## 4. Suggested architecture (guidance, not mandate)

Keep concerns separated so each piece is independently testable:

```
src/
  api/          # WP REST fetch client (pagination, error handling). Injectable fetch for tests.
  utils/        # PURE functions: normalize record, parse date, partition upcoming/past,
                #   group-by-month, calendar grid math, format helpers.
                #   <- easiest place to earn coverage.
  hooks/        # useWordCamps: loading/success/error state; injectable fetch + clock.
  components/   # App, MonthCalendar (required primary view), ListView
                #   (month-grouped companion), Tabs (filter the list only),
                #   ViewToggle, WordCampCard.
  __tests__/    # co-located or here; shared fixtures modeled on the real payload.
  index.js      # createRoot entry
  styles.css
public/index.html
webpack.config.js  (hand-written, commented) or hand-configured vite.config.js
.babelrc           (@babel/preset-env + preset-react)
jest.config.js     (jsdom env, coverageThreshold.global = 60)
```

**Design principles the reviewer will reward:**
- **Pure, dependency-free utils** for all data transformation → deterministic,
  trivially unit-tested, and where most of your 60% coverage should come from.
- **Injectable `fetch` and `now`/clock** into the API layer and hook so tests are
  deterministic and never hit the network.
- **Explicit loading / error / empty states** in the UI (reviewers look for this).
- **Accessibility basics:** real `<button role="tab">`, `role="status"` /
  `role="alert"` for loading/error, semantic headings.

### Testing plan to clear 60% comfortably
- **Utils:** title decode, date parse (seconds / ISO / missing), normalize,
  partition (sort order + dateless handling), group-by-month, formatters.
- **API client:** builds correct URL, reads `X-WP-TotalPages`, pages through
  multi-page results, throws on non-ok — all with a mocked fetch.
- **Components:** WordCampCard (link vs. plain title, hidden empty location),
  ListView (month headings + empty state), MonthCalendar (grid shape, day
  placement, multi-day spans, clamped navigation) with an injected clock.
- **App integration (RTL):** loading state, calendar by default, view toggle,
  tabs filtering the list, error state on API failure — with a mocked fetch.

> **Gotcha:** if you keep a shared `fixtures.js` inside a `__tests__/` folder,
> Jest will try to run it as a suite and fail with "must contain at least one
> test." Fix by setting `testMatch` to only `**/*.test.js(x)` (or move fixtures
> out of `__tests__/`, or name it `*.fixtures.js` and exclude it).

---

## 5. Build-from-scratch requirement — how to satisfy it credibly

The point is to prove you can wire a toolchain yourself. Do this explicitly:

- **Webpack** + `babel-loader` + `@babel/preset-env` + `@babel/preset-react`
  (`runtime: automatic` so no `import React`), `html-webpack-plugin`,
  `style-loader`/`css-loader`, `webpack-dev-server` with `hot` + history
  fallback. Content-hash output filenames for production.
- **Comment the webpack config** to explain each loader/plugin — this is where
  you *show your reasoning* to the reviewer.
- In the README, state plainly: *"Toolchain configured by hand (Webpack +
  Babel); create-react-app and other scaffolds deliberately not used, per the
  assignment."*

(Alternative: a hand-authored Vite config also satisfies "from scratch," but
Webpack makes the manual wiring more visibly deliberate.)

---

## 6. Deployment

- **Vercel** (recommended): `buildCommand: npm run build`, `outputDirectory:
  dist`, SPA rewrite of `/(.*)` → `/index.html`. Connect the GitHub repo for
  auto-deploy; put the resulting URL in the README and in the cover letter.
- **GitHub Pages** (alt): build to `dist/`, publish via Actions or the `gh-pages`
  branch; mind the base path for asset URLs.

---

## 7. Commit-history strategy (explicitly assessed)

Commit incrementally with conventional, meaningful messages, e.g.:

```
chore: initialize project with hand-configured webpack + babel
feat(api): add paginated WordCamp Central REST client
feat(utils): normalize records and partition upcoming vs past
test(utils): cover date parsing and partitioning
feat(hooks): add useWordCamps data hook with injectable fetch/clock
feat(ui): calendar (month-grouped) view with upcoming/past tabs
test(app): integration tests for loading, tabs, and error states
docs: README with setup, architecture, tooling rationale, demo link
ci: deploy to Vercel
```

Avoid: a single giant commit, "wip"/"fix" noise, committing `node_modules` or
`dist`.

---

## 8. README must include

1. One-line description + **live demo link**.
2. Setup: `npm install`, `npm start`, `npm test`, `npm run test:coverage`,
   `npm run build`.
3. **Architecture overview** (api / utils / hooks / components) and *why*.
4. **Tooling rationale** — the from-scratch Webpack+Babel choice, no CRA.
5. **Testing approach** and the coverage number (screenshot or text).
6. Notes on the WordCamp API (endpoint, pagination, date-meta caveat).
7. Known limitations / what you'd do next (e.g. optional map view, caching).

---

## 9. Optional stretch (only after the required app is solid)

- **Map view** (the brief's optional extra) — Leaflet/react-leaflet plotting
  camp locations; guard for camps without geo data.
- Client-side search/filter by name or country.
- Caching the API response in `sessionStorage` to avoid refetching on tab switch.
- A small GitHub Actions CI running `npm test` on push.

Do not let stretch goals delay a clean, tested, deployed core.

---

## 10. Definition of done

A public repo with clean incremental commits, a hand-configured build (no CRA),
a required calendar view showing upcoming + past WordCamps from the live WP REST
API, ≥60% Jest coverage that passes, a working hosted demo, and a README that
explains all of the above — with the demo + repo links pasted into
`applications/rtcamp/cover-letter.md` before submitting.
