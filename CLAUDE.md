# CLAUDE.md

Guidance for Claude Code working in this repo.

## What this is

Chris Taylor's HN Monthly Top: browse the top Hacker News stories by week, month or year, with
LLM article and comment summaries. pnpm workspaces monorepo:

- `apps/frontend`: SolidJS + Vite SPA in strict TypeScript, deployed to Vercel from the root `vercel.json`.
- `apps/server`: Fastify API in strict TypeScript that proxies OpenAI and Jina, deployed to Railway
  (Railpack), configured in `.railway/railway.ts`.

`TASKS.md` is the source of truth for what is decided, in progress and next. Update it as work
happens.

## Decisions already made (don't re-litigate)

- **pnpm workspaces, not Yarn.** `packageManager` pins pnpm and Railpack reads it. Never
  reintroduce Yarn or `yarn.lock`.
- **Browsing is anonymous; summarising needs login and the user's own OpenAI key.** Keys are
  AES-256-GCM encrypted server-side. See `docs/api-keys.md`.
- **Frontend and backend deploy separately.** Vercel serves the SPA and rewrites `/api/*` to the
  Railway API (`vercel.json`), so the SPA calls same-origin `/api` and the session cookie is
  first-party. The server rejects `/api/*` without the `x-origin-secret` Vercel adds.
- **Auth is Better Auth on Drizzle and Railway Postgres.** Email and password, cookie sessions, no
  email verification or reset. Sign-up is gated by `AUTH_SIGNUP_ENABLED`. Migrations live in
  `apps/server/drizzle/` and run in Railway's pre-deploy step.
- **Node 24 LTS** (`.nvmrc`, `engines.node`).
- **Railway config lives in `.railway/railway.ts`, not `railway.json`.** Railway stops reading
  `railway.json` on 2026-12-01. Changes apply only through `railway config plan` and
  `railway config apply`, never on push. Env vars stay unmanaged.

## Dev Rules

- **Run `pnpm verify` before pushing.** It lints and prettier-checks changed files, typechecks both
  apps and builds both apps.
- **TypeScript strict. Never use `any`.** Config files are TypeScript too (`eslint.config.ts`,
  `prettier.config.ts`).
- **No inline comments** in code you write. Rationale goes in the PR description or commit. Don't
  remove existing comments unless the code they describe is deleted.
- **Solid, not React.** Use `<For>` and `<Show>`, call signals as functions, don't destructure props.
- **Check the result in a real browser** at desktop and mobile widths before calling a UI change done.
- **Never print secrets.** `.env` files are gitignored.

### Commits

Single line only: `type(scope): brief description`. Imperative mood, under 72 characters, no body
text. Types: feat, fix, docs, style, refactor, perf, test, chore, ci. End with the Co-Authored-By
line.

### Shipping: push straight to `main`, no PRs

- Work in a worktree off latest `origin/main`. When done: `git fetch`, `git rebase origin/main`,
  `pnpm verify`, then `git push origin HEAD:main`.
- **A push to `main` deploys both apps:** the backend to Railway and the frontend to Vercel.
- A rejected push means `main` moved: rebase, re-run `pnpm verify`, push again. Never force-push `main`.
- One logical change per commit, so one `git revert` undoes it.
- After the push, confirm the Railway deploy and the Vercel deploy are green and the live app works:
  load https://hn-monthly-top.vercel.app, browse a month, and check the Railway `/health` endpoint.
  A failed deploy leaves the last good one live; fix forward with a new commit.
- CI runs on every push to `main` as a backstop. A red run on `main` is fixed before anything else ships.
- Open a PR only when Chris asks to see a change first, or when a change alters how Railway or
  Vercel build; it gets a Vercel preview.

## Commands

| Command             | Purpose                                           |
| ------------------- | ------------------------------------------------- |
| `pnpm dev`          | Frontend (5173) and server (3000) in parallel     |
| `pnpm dev:frontend` | Frontend only                                     |
| `pnpm dev:server`   | Server only                                       |
| `pnpm build`        | Build both apps                                   |
| `pnpm build:server` | Build the server (what Railway runs)              |
| `pnpm start:server` | Run the built server                              |
| `pnpm check`        | `tsc --noEmit` in both apps                       |
| `pnpm lint`         | ESLint                                            |
| `pnpm format`       | Prettier                                          |
| `pnpm verify`       | Lint and format check changed files, check, build |

## Tooling

- **ESLint flat config** in `eslint.config.ts`: `@eslint/js`, `typescript-eslint` and
  `eslint-plugin-solid` for the frontend.
- **Prettier** in `prettier.config.ts`: single quotes, semicolons, print width 100.
- **Lefthook** (`lefthook.yml`) runs Prettier and ESLint on staged files; `pnpm install` installs the hook.
- **CI** in `.github/workflows/ci.yml`: install, lint, `prettier --check`, typecheck, build.
- **Context7 and Jina MCP servers** are configured in `.mcp.json`. Use Context7 for current Solid,
  Vite and Fastify docs instead of relying on memory.
- **Skills:** `/dev-loop` (how a build session runs), `/whats-next` (next work from `TASKS.md`),
  `/commit-msg`.

## What NOT to Do

- Don't change Railway or Vercel settings, env vars or data without being asked.
- Don't hand-edit generated migrations in `apps/server/drizzle/`; change the schema and run
  `pnpm --filter @hn-monthly-top/server db:generate`.
- Don't add comments to code.
- Don't use `any`.
- Don't create new doc files without checking whether one exists to update.
