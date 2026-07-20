# WordCamp Schedule Viewer

Browse upcoming and past **WordCamps** worldwide, loaded live from the
[WordCamp Central WordPress REST API](https://central.wordcamp.org/wp-json/wp/v2/wordcamps).

**Live demo:** _pending deploy — see [Deployment](#deployment)_

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
| `npm run lint`          | ESLint (react, react-hooks, jsx-a11y)           |
| `npm run format`        | Prettier                                        |

No environment variables, no API keys — the WordCamp API is public and the app
is strictly read-only.

---

## Architecture

```
src/
  api/         WP REST client: pagination, error handling, injectable fetch
  utils/       Pure functions: decode, parse, normalize, partition, group, format
  hooks/       useWordCamps — owns fetch → normalize → partition
  components/  App, CalendarView, WordCampCard, states, header/footer
    ui/        Hand-written primitives (Card, Button, Skeleton, Tabs)
  lib/         cn() class merger, QueryClient factory
  test/        Shared fixtures (real API records) and render helpers
```

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

**142 tests across 17 suites. Coverage: 100% statements, 99.2% branches, 100%
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
`toBeTruthy()`) — partly for clarity, partly because the planned mutation
testing rewards it.

### Test quality

Coverage says which lines ran, not whether the tests would notice a bug. This
project bounds that risk from both ends:

- **Complexity is capped** by ESLint (`complexity: 10`, `max-depth: 3`), so no
  function grows past the point where tests can realistically cover its paths.
- **Test strength** is the other half. There is no maintained CRAP-metric
  reporter for Jest, so the planned check is a **StrykerJS mutation score** over
  `src/utils` and `src/api` — the pure layers, where mutants are fast and
  honest. _Planned, not yet run;_ this README will state the score when it is.

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

_Production scores pending deploy._ Against the production bundle served
locally (mobile emulation, 4× CPU throttling), in both light and dark themes:

| Category       | Score                      |
| -------------- | -------------------------- |
| Accessibility  | 100                        |
| Best Practices | 100                        |
| SEO            | 100                        |
| Performance    | 75–77 (local; see below)   |

Performance is dominated by one thing: the app downloads **4.35 MB of JSON**
from the WordCamp API before it can show a complete schedule, and as noted
above the API offers no working way to trim that payload. First Contentful
Paint (0.9 s), Largest Contentful Paint (1.8 s) and Cumulative Layout Shift (0)
are all excellent; the score is pulled down by main-thread time spent
processing those 15 responses under 4× throttling. The app's own data
processing is not the culprit — parsing, normalizing and partitioning all 1,480
records takes ~26 ms.

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
- **Mutation testing is planned, not run** (see [Test quality](#test-quality)).

### What I would do next

1. Run the StrykerJS mutation pass and publish the score.
2. Playwright end-to-end tests — two bugs (both tab panels visible at once; the
   active tab never highlighting) passed their jsdom tests while being visibly
   broken in a browser. That class of bug needs a real browser to catch.
3. Cache the response in `sessionStorage` so a reload skips the 4.35 MB fetch.
4. The optional map view. Note that `_host_coordinates` is empty on most
   records, so it would need geocoding from the `Location` string.

---

## Development notes

This project was planned and built with AI assistance (Claude Code), documented
openly in this repository (`CLAUDE.md`, `docs/`, `prompts/`, `.claude/skills/`)
as a deliberate transparency decision. All code is reviewed, understood and
owned by the author.

## Licence

MIT
