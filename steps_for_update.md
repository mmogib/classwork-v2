# Infrastructure Update Plan

This plan modernizes and hardens the repo’s delivery pipeline, runtime, and ops without changing app features. It’s sequenced to be safe, incremental, and easy to verify.

## 0) Baseline Assessment (one-time)

- Verify hosting and build: Netlify with `@astrojs/netlify`, Node `22.x`, `astro build`.
- Inventory secrets in use: `AIRTABLE_TOKEN`, `MCR_AIRTABLE_BASE`, `GRADES_AIRTABLE_BASE`.
- Note risky files: `.env` exists in repo — rotate secrets and remove committed copy.

## 1) Secrets Management

- Rotate any secrets possibly committed to `.env`.
- Ensure `.gitignore` includes `.env` (already present) and remove the tracked file from git history.
  - On a fresh branch: `git rm --cached .env` then commit and force-remove from history later if needed using `git filter-repo` or GitHub’s secret scanning remediation.
- Set Netlify environment variables (Site settings → Build & deploy → Environment) for `AIRTABLE_TOKEN`, `MCR_AIRTABLE_BASE`, `GRADES_AIRTABLE_BASE`.
- Add `.env.example` completeness and comments (keep placeholders only).

## 2) Pin Runtimes and Package Hygiene

- Add `.nvmrc` with `v22` to match `package.json#engines.node`.
- Use a single package manager consistently (npm is fine; lockfile exists). Document it in README.
- Add scheduled dependency updates via Dependabot or Renovate.

Example `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: "/"
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
    versioning-strategy: increase
```

## 3) CI/CD (GitHub Actions)

- Add a CI pipeline that runs on PR and main:
  - Install deps with caching
  - Type-check (`astro check`), build (`astro build`)
  - Optional: lint (when ESLint is added below)
- Add a production deploy job that uses Netlify deploy token OR rely on Netlify’s Git integration. If using token, store it as `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` secrets.

Example `.github/workflows/ci.yml`:

```yaml
name: ci
on:
  pull_request:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist

  # Optional Netlify deploy via token (alternatively use Netlify Git integration)
  deploy:
    if: github.ref == 'refs/heads/main'
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
        env:
          AIRTABLE_TOKEN: ${{ secrets.AIRTABLE_TOKEN }}
          MCR_AIRTABLE_BASE: ${{ secrets.MCR_AIRTABLE_BASE }}
          GRADES_AIRTABLE_BASE: ${{ secrets.GRADES_AIRTABLE_BASE }}
      - name: Deploy to Netlify
        run: npx netlify deploy --dir=dist --prod --site $NETLIFY_SITE_ID --auth $NETLIFY_AUTH_TOKEN
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## 4) Netlify Configuration (IaC)

- Add `netlify.toml` to codify build settings, headers, and redirects.
- Keep `adapter: netlify()` with `output: 'server'`. Consider `output: 'hybrid'` later for more static pages if compatible.
- Add security headers by default.

Example `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    Referrer-Policy = "no-referrer-when-downgrade"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/api/*"
  [headers.values]
    Cache-Control = "private, no-store"

[[redirects]]
  from = "http://*"
  to = "https://:splat"
  status = 301
  force = true
```

## 5) Security Hardening

- Add Subresource Integrity (SRI) for the `htmx` CDN script or self-host it in `public/` and pin version.
- Validate and constrain API input more strictly:
  - Current checks are good for `base_id` and presence of `hid`. Add length/pattern checks for `hid`.
  - Normalize all response shapes and remove overly detailed stack traces in production.
- Rate limiting for `/api/*`:
  - Implement simple IP-based rate limiting using Netlify Edge functions or Netlify Blobs for counters.
- Ensure Airtable API key is never exposed client-side (keep server-only imports for Airtable utils).

## 6) Observability and Logging

- Centralized error reporting (optional): Sentry (server-only DSN) for API routes.
- Structure logs (JSON) and avoid leaking tokens.
- In CI and production, surface build warnings from `astro check`.

Example Sentry minimal server init (optional):

```ts
// src/utils/observability.ts
export const logError = (e: unknown, context?: Record<string, unknown>) => {
  const base = { level: 'error', ...context };
  console.error(JSON.stringify({ ...base, message: e instanceof Error ? e.message : String(e) }));
};
```

Use `logError` in API routes instead of raw `console.error`.

## 7) Caching Strategy

- Static assets: long TTL + immutable (via `netlify.toml` headers above).
- API endpoints: `no-store` (already set above) while Airtable remains the source of truth.
- Consider micro-caching assignments/grades for 30–60s in-memory within each function invocation context if Airtable rate limits become an issue (careful with serverless cold starts).

## 8) Dev Experience (DX)

- Add ESLint + Prettier with TypeScript and Astro plugins; run in CI.
- Keep `@astrojs/check` in CI (already used in build script via `astro check && astro build`).
- Add `README` section: local dev, env vars, deployment, troubleshooting.

Example `.eslintrc.cjs` (optional):

```js
module.exports = {
  root: true,
  env: { es2022: true, node: true, browser: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:astro/recommended',
    'plugin:prettier/recommended',
  ],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  overrides: [{ files: ['*.astro'], parser: 'astro-eslint-parser' }],
};
```

## 9) Astro Build Output Review

- Keep `output: 'server'` with Netlify adapter for API routes.
- Optionally explore `output: 'hybrid'` to pre-render static pages (home, resume, research) while keeping API/function routes dynamic. Validate routes render correctly before switching.

## 10) Airtable Integration Safety

- Validate Airtable base IDs and field names via config to avoid runtime typos.
- Add clearer error messages for common Airtable failures (invalid base, table missing, rate limited) while keeping details out of responses in production.
- Consider a healthcheck route `/api/health` that verifies env presence and simple Airtable connectivity (without exposing secrets).

## 11) Optional: Staging Environment

- Create a staging Netlify site wired to a staging branch and, if needed, a separate Airtable base or read-only token.
- Use branch-based env overrides in Netlify for safe testing.

---

## Quick Checklist (do in order)

1. Rotate Airtable keys; remove `.env` from git; set Netlify env vars.
2. Add `.nvmrc`; add Dependabot; document npm usage.
3. Add GitHub Actions CI (`build` + optional `deploy`).
4. Add `netlify.toml` with headers, redirects, caching.
5. Add SRI or self-host `htmx`.
6. Tighten API validation and logging; consider basic rate limiting.
7. Add ESLint + Prettier; run in CI.
8. Consider `output: 'hybrid'` after validating static pages.
9. Add staging site with branch-based env.

## Verification

- PR checks pass: type-check + build.
- Netlify deploy shows security headers and caching.
- API routes function with valid Airtable bases and no secret leakage.
- Rollback plan: revert to prior Netlify deploy via the dashboard if necessary.

