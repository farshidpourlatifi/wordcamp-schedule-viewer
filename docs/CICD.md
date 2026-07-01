# CI/CD & Deployment

The pipeline shape: **GitHub Actions** runs quality gates on every PR; **Vercel**
owns deploys via its native Git integration (preview per PR, production on
`main`); **semantic version tags + GitHub Releases** provide the versioned
record. This is the idiomatic Vercel setup — we do not hand Vercel a build
artifact or duplicate its deploy in Actions.

## GitHub Actions — CI (`.github/workflows/ci.yml`)

Runs on pull requests and pushes to `main`:

1. Checkout, setup Node (pin a version, e.g. 20 LTS), `npm ci`.
2. `npm run lint`
3. `npm test -- --coverage` (fails if coverage < 60% via `coverageThreshold`)
4. `npm run build` (proves the production bundle compiles)
5. (optional) `npm run test:e2e` against the built app, or defer E2E to a
   separate workflow to keep PR feedback fast.

Branch protection on `main`: require this workflow green + at least the CI check
before merge.

## Vercel — deployment (native Git integration)

- Connect the GitHub repo in the Vercel dashboard (or `vercel link`).
- **Framework preset:** Other. **Build command:** `npm run build`.
  **Output directory:** `dist`.
- **Preview deployments:** automatic on every PR (unique URL per PR).
- **Production deployment:** automatic on merge to `main`.
- SPA routing: `vercel.json` rewrites `/(.*)` → `/index.html` so TanStack Router
  deep links resolve.

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## Versioning & Releases (`.github/workflows/release.yml`)

For the "versioned deployment packages" requirement, done the Git-native way:

- Adopt **SemVer** tags: `v1.0.0`, `v1.1.0`, ...
- On pushing a tag matching `v*`, a release workflow:
  1. builds (`npm run build`),
  2. zips `dist/` as `wordcamp-schedule-viewer-<tag>.zip` (a concrete versioned
     artifact for the record),
  3. creates a **GitHub Release** for the tag with auto-generated notes and the
     zip attached.
- Each production Vercel deploy corresponds to the `main` commit the tag points
  at, so the Release ↔ deployed version mapping is traceable.

> KISS note: the zipped artifact is for provenance/records, not for deploying —
> Vercel builds from Git. Don't wire the zip into the deploy path.

## Secrets

- No secrets needed for CI (public API, no auth).
- Vercel Git integration needs no secrets in the repo. Only add a `VERCEL_TOKEN`
  if you later move deploys into Actions (not the chosen approach).

## Suggested build order for the agent

1. App scaffold + Webpack/Babel + Tailwind, one passing test.
2. `ci.yml` (lint/test/build) — get the gate green early.
3. Feature work behind PRs.
4. Connect Vercel; verify a preview deploy on a PR.
5. `vercel.json`; verify production on `main`.
6. `release.yml`; cut `v1.0.0` when the acceptance checklist is green.
