# WordCamp Schedule Viewer

Browse upcoming and past **WordCamps** worldwide, loaded live from the
[WordCamp Central WordPress REST API](https://central.wordcamp.org/wp-json/wp/v2/wordcamps).

**Live demo:** <https://wordcamp-schedule-viewer.vercel.app>

A React app built for rtCamp's Senior React Engineer assignment. The toolchain
is hand-configured (Webpack + Babel); no scaffold was used.

---

## Quick start

```bash
git clone https://github.com/farshidpourlatifi/wordcamp-schedule-viewer.git
cd wordcamp-schedule-viewer
npm install
npm start            # dev server on http://localhost:3000
```

| Command                 | What it does                                    |
| ----------------------- | ----------------------------------------------- |
| `npm start`             | Dev server with hot reload                      |
| `npm run build`         | Production bundle → `dist/`                     |
| `npm test`              | Jest unit + integration suite                   |
| `npm run test:coverage` | Suite with coverage, enforcing the 60% floor    |
| `npm run test:mutation` | StrykerJS mutation testing (utils + api)        |
| `npm run test:e2e`      | Playwright end-to-end (3 scenarios)             |
| `npm run lint`          | ESLint (react, react-hooks, jsx-a11y)           |
| `npm run format`        | Prettier                                        |

No environment variables, no API keys — the WordCamp API is public and the app
is strictly read-only.

---

## Architecture

```
src/
  api/         WP REST client: pagination, status filter, injectable fetch
  utils/       Pure functions: decode, parse, normalize, partition, group,
               format, calendar grid math, continent, filter
  hooks/       useWordCamps (scheduled + archive), useCampFilters, useDarkTheme
  components/  App, MonthCalendar, ListView, MapView (lazy), Filters,
               WordCampCard, states, header/footer, theme + view toggles
    ui/        Hand-written primitives (Card, Button, Skeleton, Tabs)
  lib/         cn() class merger, QueryClient factory
  test/        Shared fixtures (real API records) and render helpers
```

### Three views, and why there are three

Each answers a different question about the same list, and a toggle switches
between them, persisted to `localStorage`.

**`MonthCalendar` is the calendar view** and the app's default — a real month
grid, Monday-first, one month at a time, over one continuous timeline. It
answers _when_.

**`ListView`** scans the archive in one scroll. The calendar cannot serve it on
its own: there are ~1,445 past camps across ~219 months, so paging a month at a
time means ~219 clicks to cross it. It answers _what has there been_.

**`MapView`** plots camps as pins on a world map. It answers _where_. Built on
react-leaflet with theme-following CARTO tiles (light/dark); ~1,445 past markers
are far too many to place individually, so they cluster into counted groups that
split on zoom.
~4% of records have no usable coordinates (virtual events, old records) and are
counted in a note rather than dropped. It is **lazily loaded** — Leaflet and its
cluster plugin are ~150 KiB the calendar and list never touch, so they download
only when the map is opened, keeping the two primary views off that weight.

**The upcoming/past tabs belong to the list and the map, not the calendar.**
They are a filter: the list and the map each read one already-split side. A
calendar is continuous time — with tabs, July 2026 rendered twice, camps before
the 20th under one tab and after it under the other — so it marks today instead
and shows both sides of it in the same grid.

**Search and region filter all three views at once.** A search box (title,
location, country, venue — token-AND, so "rome italy" matches on either field)
and a continent select feed one pure `filterCamps`, so the three views can
never disagree about what a query means; the tab counts and an aria-live result
count follow along. Continent is derived from the venue country code through a
local lookup — no geocoding.

**Loading is two-tier.** The scheduled feed (`?status=wcpt-scheduled`, ~40
records in one request) drives the first paint; the full ~1,500-record archive
streams in behind it, so upcoming events are usable in a blink instead of
waiting on 15 requests and 4.35 MB.

Decisions in the calendar that came from looking at the live data rather than
guessing at it:

- **It opens on today's month**, clamped into the range that holds camps —
  that is where the reader already is, with recent camps one click back and
  the next ones in view. Navigation is clamped to the same range, so it cannot
  page into empty decades, and a Today control returns from wherever you get to.
- **Long-running entries are not drawn across the grid.** 16% of dated records
  span 15+ days — "WordPress Campus Connect" entries are multi-month campus
  programmes, not events you attend on a day, and the longest runs 149 days.
  Expanding those buried the single-day camps around them, so anything past a
  week sits on its start day and states its end date instead. Conference-length
  camps (the feed tops out at 8 days) still appear on every day they cover.
- **It is a `<table>`, not `role="grid"`.** This is a read-only display of
  events, not a date picker, so the grid pattern's roving tabindex and
  arrow-key navigation would be machinery with no user benefit. A table gives
  screen readers row and column context for free and leaves the camp links in
  the natural tab order.

**The shape, and why:**

- **Pure utils carry the data logic.** Every transformation — entity decoding,
  date parsing, normalizing, partitioning, grouping — is a pure function with
  no React and no I/O. They are trivially testable, which is where most of the
  coverage comes from, and they can be reasoned about in isolation.
- **One module knows the API's field names.** `normalizeWordCamp` maps raw
  records to a view model. Components never touch an API field, so a change to
  the WordPress meta schema is a one-file edit.
- **`fetch` and the clock are injected.** The API client takes a `fetchImpl`;
  the hook takes `fetchImpl` and `now`. Tests drive every path — multi-page,
  HTTP error, network failure — with no network and a frozen clock, so they
  cannot rot tomorrow or flake on a bad connection.
- **The hook owns the data path.** `useWordCamps` returns two ready-to-render
  lists plus loading/error state. `App` only decides which state to show.
- **State management is TanStack Query and nothing else.** For a read-only app
  with one query, a state library would be ceremony.

---

## Tooling: built from scratch

The assignment rules out `create-react-app` and other scaffolds, so every
config file here was written by hand and is commented to explain each choice:

- **`webpack.config.js`** — one config for both modes. `babel-loader` for app
  source only, `style-loader` in dev (hot CSS swap) vs `MiniCssExtractPlugin`
  in production (parallel download, separate caching), content-hashed
  filenames, a vendor split chunk, and a history-API fallback so deep links
  work.
- **`babel.config.js`** — a root config rather than `.babelrc`, so webpack and
  Jest transpile identically. Automatic JSX runtime; browser targets come from
  the `browserslist` field so the policy lives in one place.
- **`tailwind.config.js`** — maps semantic names (`background`, `card`,
  `primary`) onto the OKLCH custom properties in `globals.css`. Dark mode is a
  variable swap, not `dark:` on every element.
- **`jest.config.js`** — jsdom, the 60% floor enforced via `coverageThreshold`,
  and `testMatch` scoped to `*.test.js(x)` so shared fixtures can live in
  `src/test/` without Jest trying to run them as suites.
- **`eslint.config.js`** — flat config with react, react-hooks and jsx-a11y,
  plus `complexity: 10` and `max-depth: 3` (see [Test quality](#test-quality)).

UI primitives are hand-written into `src/components/ui/` on top of
[Base UI](https://base-ui.com) — no component CLI, no generated files. Only
Tabs needs a headless primitive; Card, Button and Skeleton are plain
token-styled elements.

---

## Testing

**330 tests across 26 suites. Coverage: 100% statements, 99%+ branches, 100%
functions, 100% lines** — against a required floor of 60%, enforced in
`jest.config.js` so a shortfall fails the build rather than relying on someone
to check.

```bash
npm run test:coverage
```

The approach, layer by layer:

- **Utils** — exhaustive unit tests, including the ugly inputs: double-encoded
  entities, out-of-range code points, garbage dates, missing meta.
- **API client** — a mocked `fetch` drives multi-page pagination, a mid-walk
  page failure, non-array payloads and network errors. A tripwire in
  `jest.setup.js` fails any test that reaches for the global `fetch`, so "no
  network in tests" is enforced rather than merely intended.
- **Components** — React Testing Library, asserting on roles and user-visible
  text rather than implementation details.
- **App integration** — the real hook, utils and components with only the
  network faked: loading, success, tab switch (mouse _and_ keyboard), empty,
  error, and retry recovery.

Assertions are exact-value wherever possible (`toBe("Sat, 14 Mar 2026")`, not
`toBeTruthy()`) — partly for clarity, partly because the mutation testing below
rewards it.

### Test quality

Coverage says which lines ran, not whether the tests would notice a bug. This
project bounds that risk from both ends:

- **Complexity is capped** by ESLint (`complexity: 10`, `max-depth: 3`), so no
  function grows past the point where tests can realistically cover its paths.
- **Test strength** is measured by a **StrykerJS mutation score of ~95%** over
  `src/utils` and `src/api` — the pure layers, where mutants are fast and
  honest. Stryker rewrites the code in small ways (a `>` to `>=`, a return to
  `null`) and re-runs the suite; a mutant that survives is a line the tests only
  execute rather than guard. Run it with `npm run test:mutation`. Getting there
  meant strengthening real gaps — array-hole robustness, boundary conditions,
  entity-table completeness, token-AND search — and it surfaced a genuinely
  dead map entry along the way. The remaining survivors are equivalent mutants
  (e.g. `month < first` vs `<=`, identical when the operands are equal), which
  no test can kill honestly.

### End-to-end

Five Playwright scenarios (`npm run test:e2e`) cover what jsdom cannot see: a
real browser rendering the calendar `<table>` on load, switching to the list
and between its tabs, search narrowing the schedule, the map rendering a real
Leaflet marker (the one view jsdom cannot lay out at all), and the error state
on a real network failure. The WordCamp API is mocked per test, so the suite is
deterministic and never touches the live feed. Deliberately few — the 330 Jest
tests already cover the fine grain far faster; E2E earns its keep only on
cross-cutting browser
behaviour.

---

## Notes on the WordCamp API

Three things about this API cost real debugging time, all verified against live
responses rather than documentation:

1. **Meta fields are top-level, not nested under `meta`.** Read
   `record["Start Date (YYYY-mm-dd)"]`, not `record.meta[...]`.
2. **`Start Date (YYYY-mm-dd)` is a Unix timestamp in seconds, as a string**
   (e.g. `"1786233600"`). The key name is misleading; trusting it parses every
   date as `NaN`.
3. **Unset meta comes back as `""`**, not `null` — so `??` alone will not
   default it.

Pagination follows the `X-WP-TotalPages` header: 15 pages at `per_page=100`
(~1,480 records). Page 1 is fetched first because its headers reveal the count;
the rest go out concurrently.

**Payload trimming is not available.** The endpoint supports `_fields`, but it
silently drops any field whose name contains a space or parentheses — and
`Start Date (YYYY-mm-dd)` is exactly that shape, so a field list returns records
with no dates at all. The app therefore downloads full records (~4.35 MB).

Roughly 7 camps have no start date. They are treated as past and shown under a
"Date TBD" section rather than hidden.

---

## Accessibility

- Semantic landmarks (`<header>`, `<main>`, `<footer>`), one `<h1>`, and an
  unbroken heading order: month labels are `<h2>`, card titles `<h3>`.
- Tabs are built on Base UI, so roles, `aria-selected`, roving tabindex and
  arrow-key navigation come from the primitive.
- **Manual tab activation is deliberate.** Arrow keys move focus; Enter or
  Space activates. Both this and automatic activation are valid ARIA patterns,
  but with automatic activation, arrowing across the tabs would render the Past
  panel — twelve month sections of cards — just to pass over it.
- Loading is a `role="status"` live region with real text (the skeleton shapes
  themselves are `aria-hidden`); errors are `role="alert"`.
- Visible focus ring on every interactive element, in both themes.
- Colour contrast meets WCAG AA in **both** themes. This was not free: the
  dark-mode accent originally scored 2.64:1 and had to be lightened — see the
  note in `.claude/skills/wordcamp-design-system/SKILL.md`.

---

## Security

The app is read-only and handles no credentials, but the API is still untrusted
input:

- **No `dangerouslySetInnerHTML` or `innerHTML` anywhere.** API titles arrive
  HTML-encoded and are decoded by a pure string transform — deliberately _not_
  the usual `textarea.innerHTML` / `DOMParser` trick, which routes untrusted
  text through an HTML parser. Output is plain text rendered as React children.
- **URLs are scheme-checked.** `javascript:`, `data:` and other non-http(s)
  values are rejected before they can reach an `<a href>`; such a camp renders
  as an unlinked title. Verified against all 1,480 live records: zero
  legitimate URLs rejected.
- **External links carry `rel="noopener noreferrer"`.**
- `npm audit`: **0 vulnerabilities**.
- No secrets, tokens or API keys — none are needed.

---

## Deployment

Configured for Vercel via `vercel.json`: SPA rewrite to `/index.html`,
immutable caching for content-hashed assets, and basic security headers
(`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`).

```bash
npm run build   # → dist/
```

### Lighthouse

Against the **production deployment** (Lighthouse 12, desktop preset):

| Category       | Score |
| -------------- | ----- |
| Performance    | 100   |
| Accessibility  | 100   |
| Best Practices | 100   |
| SEO            | 100   |

Key metrics: LCP 0.4 s, CLS 0.005, TBT 20 ms. Production beats the local
`serve` numbers (Performance 75–77) for concrete reasons the deploy config
supplies and a local static server does not: Brotli compression on the
assets, and the `Cache-Control: immutable` headers in `vercel.json`.

Two of these scores were earned rather than free. The first production run
came back **Performance 82 / Accessibility 96** — a card-shaped loading
skeleton standing in for the taller calendar table cost 0.36 Cumulative
Layout Shift, and the calendar's day-cell links were 20 px tall, under the
24 px WCAG 2.5.8 target-size minimum. Both were caught by measuring the live
site, not by eye; the skeleton now mirrors the grid it loads into and the
chips clear 24 px.

Under **mobile** emulation with 4× CPU throttling the Performance score drops,
dominated by one thing: the app downloads **~4.35 MB of JSON** from the
WordCamp API before it can show a complete schedule, and the API offers no
working way to trim that payload (see [API notes](#notes-on-the-wordcamp-api)).
The
app's own work is not the bottleneck — parsing, normalizing and partitioning
all ~1,480 records takes ~26 ms.

---

## Known limitations

- **No SSR.** This is a client-rendered SPA, so the initial HTML carries no camp
  data for crawlers. Deliberate: the assignment asks for a React app, and SSR
  would add a server to a static, view-only site.
- **The upcoming/past boundary freezes between data refreshes.** The partition
  is memoized on the fetched data, and the clock is deliberately _not_ a
  dependency — a ticking clock would re-partition ~1,500 records on every
  render. A tab left open overnight keeps yesterday's split until the next
  refetch.
- **Past is revealed progressively** (12 months at a time). With ~1,443 past
  camps across ~219 month sections, rendering them all at once is seconds of
  layout and unusable to scroll. Chosen over virtualization to avoid a
  dependency and to keep revealed content in the DOM for find-in-page.
- **Whole-feed download.** Every load fetches all 15 pages; there is no
  server-side filtering to ask for "just upcoming".

### What I would do next

1. Cache the response in `sessionStorage` so a reload skips the 4.35 MB fetch.
2. Add the E2E suite to CI as a separate job (kept out of the blocking
   lint/test/build path for now, since it needs a browser download).
3. A search/filter box over the list — the one obvious affordance the three
   views don't yet cover.

---

## Development notes

This project was planned and built with AI assistance (Claude Code), documented
openly in this repository (`CLAUDE.md`, `docs/`, `prompts/`, `.claude/skills/`)
as a deliberate transparency decision. All code is reviewed, understood and
owned by the author.

## Licence

MIT
