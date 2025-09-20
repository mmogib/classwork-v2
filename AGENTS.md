# Repository Guidelines

## Project Structure & Module Organization
- `src/pages/` routes (Astro pages and API in `src/pages/api/*/*.json.ts`).
- `src/components/` reusable `.astro` components; `src/layouts/` page layouts.
- `src/content/` YAML data (papers, projects, courses, education, employment, terms, authors, teacher).
- `src/utils/` helpers (e.g., `airtable_fns.ts`); `src/types/` shared TS types.
- `public/` static assets; `src/assets/` author images, etc.

## Build, Test, and Development Commands
- `npm install` — install dependencies (Node 22.x required).
- `npm run dev` — start local dev at `http://localhost:4321`.
- `npm run build` — type-checks (`astro check`) then builds to `dist/`.
- `npm run preview` — serve the production build locally.
- Env: copy `env.example` to `.env` and populate `AIRTABLE_TOKEN`, `MCR_AIRTABLE_BASE`, `GRADES_AIRTABLE_BASE`.

## Coding Style & Naming Conventions
- TypeScript + ESM; 2-space indentation; avoid unused exports.
- Astro components PascalCase (e.g., `FrontPageCard.astro`).
- API route files end with `.json.ts` and may use dynamic segments (e.g., `[id].json.ts`).
- Tailwind for styling; prefer utility-first classes; project colors: `kfupm-*` (see `tailwind.config.mjs`).
- Content YAML naming examples: `src/content/papers/J23.yaml`, `src/content/course/T241MATH208.yaml`.

## Testing Guidelines
- No formal test runner; use:
  - `npm run build` and `astro check` for type/route validation.
  - Hit APIs locally, e.g.: `curl http://localhost:4321/api/publications.json`.
  - Verify dynamic routes: `/api/employment/current.json`, `/api/grades/{base}/{hid}.json`.

## Commit & Pull Request Guidelines
- Prefer Conventional Commits (`feat:`, `fix:`, `chore:`) as seen in history.
- Scope commits narrowly; update docs/content schemas when relevant.
- PRs: clear description (what/why), linked issues, screenshots for UI changes, test notes, and confirmation that build passes.

## Security & Configuration Tips
- Never commit `.env` or secrets. Keep APIs read-only; avoid introducing mutating endpoints.
- Validate and sanitize query params in API handlers; set cache headers appropriately.

## Architecture Notes
- Astro SSR with Netlify adapter; content-driven via YAML; Airtable integration for assignments/grades (`src/utils/airtable_fns.ts`).
