# CLAUDE.md — WordCamp Schedule Viewer

Guidance for Claude Code working in this repository. Read this first, then
`docs/PRD.md` (the source of truth for scope), then start work.

---

## What this project is

A **React app** that displays **upcoming and past WordCamps**, fetched live from
the **WordCamp Central WP REST API**. It is rtCamp's Senior React Engineer coding
assignment — the repo itself is the interview. Reviewers grade **code quality,
coding standards, testing, and commit history**, not just whether it works.

**Full requirements:** [`docs/PRD.md`](docs/PRD.md). If anything here conflicts
with the PRD, the PRD wins. If the PRD conflicts with the live brief
(https://careers.rtcamp.com/assignments/senior-react-engineer/), the brief wins.

---

## Non-negotiables (from the assignment brief — do NOT violate)

1. **React** app consuming the **WordCamp Central WP REST API** at runtime.
2. **Calendar view is required** (primary view). Map view is optional.
3. **View-only.** No writes, no auth, no mutations.
4. **Build from scratch — NO scaffold.** Do **not** run `create-react-app`,
   `npm create vite`, `npx shadcn init`, or any generator that writes a project
   template. The build is **hand-configured Webpack + Babel** — author every
   config file yourself and comment it.
5. **Jest** for tests, **≥ 60% coverage on all metrics** (enforced via
   `coverageThreshold`). E2E via **Playwright**.
6. **Public repo, clean incremental commit history.** Small, logical commits
   with conventional messages. Never one giant "initial commit."
7. `git clone && npm install && npm start` must run with zero extra steps.

---

## Tech stack (decided — do not swap without asking)

| Concern | Choice | Notes |
|---|---|---|
| UI framework | **React 18** | |
| Build | **Webpack 5 + Babel** | Hand-wired. No CRA/Vite scaffold. Comment the config. |
| Styling | **Tailwind CSS + Base UI** | Primitives on **Base UI** (`@base-ui/react`), **not Radix**. Components hand-written into `src/components/ui/` — no shadcn CLI, no scaffold. Set up Tailwind + the `cn()` util by hand. |
| Theme | **shadcn-style OKLCH tokens, light + dark** | Neutral zinc + blue `--primary`. `.dark` on `<html>`; header theme toggle persists to localStorage, respects `prefers-color-scheme`. Sidebar/chart tokens trimmed. |
| Data fetching | **TanStack Query** | Caching, loading/error state for WordCamp records. |
| Routing | **TanStack Router (code-based)** | `createRouter`/`createRoute` in code. No file-based routing plugin (that needs Vite). Routes: upcoming / past. |
| Unit tests | **Jest + React Testing Library** | jsdom env, Babel transform. |
| E2E tests | **Playwright** | Core happy-path + tab switch + error state. |
| Deploy | **Vercel** | Auto-deploy: preview per PR, production on `main`. |
| CI | **GitHub Actions** | lint + unit + build on PR; semver tags + GitHub Releases for versioning. |

**Design system:** a shadcn-style OKLCH token theme (neutral zinc + blue
`--primary`) with light and dark modes. See the `wordcamp-design-system` skill in
`.claude/skills/` — invoke it whenever building or restyling UI. It holds the
full token set and is the source of truth for colors.

---

## Software principles (enforce in review)

- **SOLID** — single-responsibility modules; depend on abstractions (inject
  `fetch`/clock into the API layer and hooks so they're swappable and testable).
- **DRY** — one source of truth for data-normalization, formatting, and tokens.
  No copy-pasted transforms across components.
- **KISS** — this is a small, view-only app. Resist over-engineering. No state
  library beyond TanStack Query; no abstraction without a second caller.

When a choice trades these off (e.g. an abstraction that adds indirection for
one caller), prefer KISS and say so in the commit/PR.

---

## Architecture

```
src/
  api/          # WP REST client: pagination via X-WP-TotalPages, error handling.
                #   fetch is injectable (SOLID/testability).
  lib/          # cn() util, query client, router setup.
  utils/        # PURE functions: normalize record, parse date, partition
                #   upcoming/past, group-by-month, formatters. Most coverage lives here.
  hooks/        # useWordCamps etc. — injectable fetch + clock.
  components/
    ui/         # hand-written primitives (button, card, skeleton; base-ui tabs).
    ...         # App, CalendarView, WordCampCard, etc.
  routes/       # TanStack Router route definitions (code-based).
  test/         # shared fixtures (NOT under a __tests__ folder — see gotcha).
```

**Testing strategy to clear 60% cleanly:** pure utils carry most coverage; API
client tested with a mocked fetch; components with RTL; one App integration test
per state (loading / success / tab-switch / error) with mocked fetch + fixed clock.

---

## Gotchas (learned — save yourself the debugging)

- **No shadcn CLI / no Radix.** Primitives are built on **Base UI** and written
  by hand; set up `tailwind.config.js`, `postcss.config.js`, and `lib/cn.js`
  manually. Only Tabs needs a headless primitive; Button/Card/Skeleton are plain.
- **OKLCH + dark mode.** Tokens live in `:root` + `.dark`; every component must be
  checked in both themes. The theme toggle writes `.dark` on `<html>` and persists.
- **TanStack Router file-based routing needs Vite.** Use **code-based** routes.
- **Jest + fixtures:** do not put a non-test helper file inside a `__tests__/`
  folder — Jest treats it as a suite and fails with "must contain at least one
  test." Keep fixtures in `src/test/` and scope `testMatch` to `**/*.test.{js,jsx}`.
- **WordCamp date meta:** verify the exact meta key/format against a live API
  response before coding the parser — it has changed over time. Handle missing
  dates gracefully (treat as past / "Date TBD").
- **Titles** come HTML-rendered with entities (`&#8211;`) — decode for display.

---

## Commit & PR conventions

- Conventional commits: `feat:`, `fix:`, `test:`, `docs:`, `chore:`, `ci:`,
  `refactor:`. Scope where useful: `feat(api): ...`.
- Small, logical commits — the history is graded. No `wip`/`fix typo` noise on
  `main`; squash those before pushing.
- Never commit `node_modules/`, `dist/`, or `coverage/`.
- Open a PR per feature; CI (lint + test + build) must be green before merge.

---

## Commands (once set up)

```bash
npm install
npm start            # webpack-dev-server
npm test             # jest
npm run test:coverage
npm run test:e2e     # playwright
npm run build        # production bundle -> dist/
npm run lint
```

---

## Reference

- **PRD:** [`docs/PRD.md`](docs/PRD.md)
- **Assignment brief (SoT):** https://careers.rtcamp.com/assignments/senior-react-engineer/
- **Application package** (CV, cover letter, fit analysis) lives in the
  job-search repo: `Job Search Accelerator - Senior Full Stack/applications/rtcamp/`.
  See [`docs/ASSESSMENT.md`](docs/ASSESSMENT.md) for the cross-reference.
- **Design system skill:** `.claude/skills/wordcamp-design-system/SKILL.md`
