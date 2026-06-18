# HN Monthly Top — Tasks

## In Progress

- [ ] **Auth + user-supplied API keys** — built (Supabase auth, AES-256-GCM-encrypted per-user OpenAI keys, summariser gated behind login + own key). Code merged. **Remaining:** add `VITE_*` env vars on Vercel + redeploy, then verify the live flow. See `docs/api-keys.md`.

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
- [ ] **Scroll-to-top on month change** — currently stays at scroll position when navigating between months.
- [ ] **Visible rank numbers on load more** — ranks continue correctly but double-check they hold up with all pagination edge cases.

### Tech / Maintenance

- [ ] **Migrate frontend to TypeScript** — the server (`apps/server`) is fully TS, but `apps/frontend` is all JS/JSX (6 `.js` + 8 `.jsx`, no tsconfig). Convert `.js`→`.ts` and `.jsx`→`.tsx`, add `tsconfig.json` + `tsconfig.node.json`, ensure `vite-plugin-solid` handles TS, and type the Solid signals + Supabase client. Do as one focused pass and re-verify `yarn build`. Lower-risk to do after auth is verified live. Files added this session that are currently JS: `store/auth.js`, `api/keys.js`, `api/summarise.js`, `api/hn.js`, `api/comments.js`, `store/settings.js`, plus all `.jsx` components.
- [ ] **Lock down CORS** — `CORS_ORIGIN` env var on Railway is currently unset, so the backend allows all origins. Set it to the Vercel URL only.
- [ ] **Add Jina prod API key** — currently using free tier. Add `JINA_API_KEY` on Railway once the app gets meaningful traffic.
- [ ] **Rate limiting on backend** — `/api/summarise/*` endpoints currently have no rate limit, so anyone hitting the Vercel URL could rack up OpenAI costs. Add a simple per-IP rate limiter (`@fastify/rate-limit`).
- [ ] **Pin Node version** — add `.nvmrc` or `engines` field in `package.json` so the expected Node version is explicit.
- [ ] **Extract `timeAgo` to a util** — currently lives in `StoryRow.jsx`; should be in `src/utils/` if any other component needs it.
- [ ] **Remove `hashchange` listener leak** — adds a global listener on every render without cleanup. Wrap in `onCleanup`.
- [ ] **CI** — add a basic GitHub Actions workflow: `yarn install`, `yarn build`. No tests yet but at least catches broken builds.
- [ ] **Auto-deploy Railway from GitHub** — currently deploys via `railway up` (manual). Connect the GitHub repo in Railway dashboard so pushes trigger backend deploys, matching Vercel's behaviour for the frontend.

### Ideas / Maybe

- [ ] **Compare two months** — side-by-side view of top stories from two different months.
- [ ] **RSS/Atom feed** — generate a feed for a given month so people can subscribe.
- [ ] **All-time leaderboard** — aggregate across all months to show the highest-scoring HN stories ever.

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
