# HN Monthly Top — Tasks

## In Progress
_Nothing currently in progress._

---

## Backlog

### Features

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

- [ ] **`npm audit fix` after dep bumps** — run after any package update; current audit is clean as of Apr 2026.
- [ ] **Pin Node version** — add `.nvmrc` or `engines` field in `package.json` so the expected Node version is explicit.
- [ ] **Extract `timeAgo` to a util** — currently lives in `StoryRow.jsx`; should be in `src/utils/` if any other component needs it.
- [ ] **Remove `hashchange` listener leak** — `App.jsx:73` adds a global listener on every render without cleanup. Wrap in `onCleanup`.
- [ ] **CI** — add a basic GitHub Actions workflow: `npm ci`, `npm run build`. No tests yet but at least catches broken builds.
- [ ] **Deploy** — ship to Vercel / Netlify / GitHub Pages. Currently only runs locally.

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
