# HN Monthly Top — Tasks

## In Progress

_(nothing active)_

---

## Backlog

### Features

- [ ] **User leaderboards** — per-month leaderboards showing: top submitters by number of stories, top submitters by total points, and top commenters by number of comments. Data is all available from Algolia. Clicking a username could link to their HN profile.
- [ ] **Q&A within summary panel** — a text input at the bottom of the summary accordion letting you ask follow-up questions to the LLM. Context includes both the article content (if fetched) and the comments. Maintains a short conversation history within the session so follow-up questions work naturally.
- [ ] **Year view** — show all 12 months as a grid, each cell showing the #1 story for that month. Good entry point for browsing a whole year.
- [ ] **"Ask HN" / "Show HN" filter** — toggle to narrow to just those post types using the Algolia `tags` filter.
- [ ] **Search within results** — client-side filter on the fetched stories list (title keyword search).
- [ ] **Top domains chart** — sidebar or toggle showing which domains appear most in a given month (github.com, youtube.com, etc).
- [ ] **Keyboard navigation** — `j/k` to move between stories, `o` to open, `c` to open comments. Standard HN muscle memory.
- [ ] **"Copy link" button** — one-click copy of the shareable hash URL for the current month.
- [ ] **Comment count threshold filter** — alongside the points filter, allow filtering by minimum comment count.
- [ ] **Dark mode** — respect `prefers-color-scheme`, toggle override stored in `localStorage`.

### UX / Polish

- [ ] **Skeleton loading state** — replace the spinner with placeholder rows so layout doesn't jump on load.
- [ ] **Error retry button** — currently errors just show a message; add a retry action.
- [ ] **"No stories" empty state** — improve the empty state for months with no results above the threshold (e.g. very early HN months).
- [x] **Scroll-to-top on month change** — DONE (Jun 2026). `window.scrollTo({ top: 0 })` after each successful fetch in `App.jsx`.
- [ ] **Visible rank numbers on load more** — ranks continue correctly but double-check they hold up with all pagination edge cases.

### Tech / Maintenance

- [ ] **Migrate frontend to TypeScript** — the server (`apps/server`) is fully TS, but `apps/frontend` is all JS/JSX (6 `.js` + 8 `.jsx`, no tsconfig). Convert `.js`→`.ts` and `.jsx`→`.tsx`, add `tsconfig.json` + `tsconfig.node.json`, ensure `vite-plugin-solid` handles TS, and type the Solid signals + Supabase client. Do as one focused pass and re-verify `yarn build`. Lower-risk to do after auth is verified live. Files added this session that are currently JS: `store/auth.js`, `api/keys.js`, `api/summarise.js`, `api/hn.js`, `api/comments.js`, `store/settings.js`, plus all `.jsx` components.
- [ ] **Add Jina prod API key** — currently using free tier. Add `JINA_API_KEY` on Railway once the app gets meaningful traffic.
- [ ] **CI** — add a basic GitHub Actions workflow: `yarn install`, `yarn build`. No tests yet but at least catches broken builds.
- [x] **Auto-deploy Railway from GitHub** — DONE (Jul 2026). Service connected to `christaylor19/hn-monthly-top` (branch `main`) via Settings → Source. Pushes to `main` now auto-deploy the backend; verified empirically — an empty commit produced a deployment that appeared on its own with `repo`/`commitAuthor` in its meta (no `cliCaller`), and the old CLI build was retired. `railway up` still works as a manual fallback.
- [x] **Auto-deploy Vercel from GitHub** — DONE/already working. Git integration has been connected since Feb 26 (Settings → Git, `christaylor19/hn-monthly-top`, production branch `main`). Pushes to `main` auto-deploy to prod; verified empirically — a push produced a deployment with the `hn-monthly-top-git-main-…` alias (the unforgeable git-trigger tell) without any `vercel --prod`. Earlier "no integration" notes were wrong: manual `vercel --prod` runs were layered on top and masked the auto-deploys in `vercel ls` (all showed `username: ctay`).

### Ideas / Maybe

- [ ] **Compare two months** — side-by-side view of top stories from two different months.
- [ ] **RSS/Atom feed** — generate a feed for a given month so people can subscribe.
- [ ] **All-time leaderboard** — aggregate across all months to show the highest-scoring HN stories ever.
- [ ] **Theme summarisation / trend tagging** — summarise the dominant themes of the stories on the current page (e.g. Crypto/Bitcoin would dominate older periods, AI more recently). Tag stories by topic and surface what's trending for the selected period, ideally trackable over time as a trend view.

---

## Done

- [x] Initial SolidJS + Vite app (Feb 2026)
- [x] Algolia HN Search API integration with auto-threshold scaling
- [x] Month/year picker
- [x] Hash-based shareable URLs
- [x] Pagination (load more)
- [x] HN-style UI
- [x] Fixed npm audit vulnerabilities — picomatch, postcss, vite (Apr 2026)
- [x] LLM article + comment summaries via OpenAI (Apr 2026)
- [x] Markdown-formatted summary output (Apr 2026)
- [x] Settings cog with verbosity slider (Apr 2026)
- [x] Migrated to Yarn workspaces monorepo with `apps/frontend` + `apps/server` (Apr 2026)
- [x] Fastify backend proxy holding OpenAI/Jina keys server-side (Apr 2026)
- [x] Railway deployment config (`railway.json`, `nixpacks.toml`) (Apr 2026)
- [x] Backend deployed to Railway, frontend on Vercel — summarise working end to end in prod (Apr 2026)
- [x] **Auth + user-supplied API keys** (Jun 2026) — Supabase email/password auth, AES-256-GCM-encrypted per-user OpenAI keys stored server-side, summariser gated behind login + own key (zero owner spend). Verified end to end in prod: signup → save key → summarise. See `docs/api-keys.md`.
- [x] Fixed Algolia `points` numericFilter 400 — moved threshold to client-side filter (Jun 2026)
- [x] Password-manager support on login form — added `name`/`id`/`autocomplete`, plus `action`/`method`/`name` on the `<form>` so 1Password detects it; `data-1p-ignore` on the key field so it stops offering to save the OpenAI key as a login (Jun 2026)
- [x] Fixed CORS blocking `DELETE /api/keys` — preflight only advertised `GET,HEAD,POST`; pinned `methods` explicitly so "remove key" works (Jun 2026)
- [x] Made verbosity levels meaningfully distinct — widened per-level prompts and gave each its own `max_tokens` (400/800/1600); previously all capped at 600 so Detailed couldn't be longer (Jun 2026)
- [x] **Week / Month / Year period selection** (Jun 2026) — granularity toggle in `MonthPicker.jsx`; Algolia query driven off a date range via `fetchTopStories(period)` in `api/hn.js`; hash scheme encodes granularity (`2026`, `2026-06`, `2026-W25`, old month links still resolve). ISO-week math is dependency-free (`isoWeek1Monday`, `isoWeeksInYear`) and verified against known 53-week years. Period parse/serialise extracted to `utils/period.js`. Verified all three views + back/forward in the browser.
- [x] **Rate limiting on backend** (Jun 2026) — `@fastify/rate-limit`: global 120/min per IP, summarise endpoints tightened to 20/min via per-route `config.rateLimit`. Enabled Fastify `trustProxy` so the limiter keys on the real client IP behind Railway's proxy.
- [x] **Lock down CORS** (Jun 2026) — set `CORS_ORIGIN=https://hn-monthly-top.vercel.app` on Railway production (was unset = allow-all). Code already read the env var; documented the prod expectation in `.env.example`.
- [x] **Extract `timeAgo` to a util** (Jun 2026) — moved from `StoryRow.jsx` to `src/utils/time.js`.
- [x] **Remove `hashchange` listener leak** (Jun 2026) — moved into `onMount` with an `onCleanup` `removeEventListener` in `App.jsx`.
- [x] **Pin Node version** (Jun 2026) — added `.nvmrc` (`22`) alongside the existing `engines.node` field.
