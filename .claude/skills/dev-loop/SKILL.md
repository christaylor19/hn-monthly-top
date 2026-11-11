---
name: dev-loop
description: The hn-monthly-top working loop. Use it at the start of a build session to triage Chris's ideas, brief subagents, ship and wrap up.
user-invocable: true
---

# Dev loop

Chris steers; Claude orchestrates small changes that deploy to Railway (backend) and Vercel (frontend) from `main`.

## 1. Start

- `git fetch`. Read from `origin/main`, never the local checkout.
- Read `TASKS.md` for what is decided and what is next.
- Check the latest deploys are green: `gh api repos/christaylor19/hn-monthly-top/deployments --jq '.[0]'` and `curl -s https://<railway-url>/health`.

## 2. Intake

| Kind               | Action                                                            |
| ------------------ | ----------------------------------------------------------------- |
| Small fix          | Do it now in a worktree                                           |
| Idea for later     | Add it to the `TASKS.md` Backlog with enough detail to build from |
| New view or big UI | Artifact mockup first; build after approval                       |
| Display detail     | Decide and ship, report after                                     |
| Question           | Answer only                                                       |

Keep a `Parked:` line for anything set aside.

## 3. Build

- Fresh worktree off `origin/main`, with its own `pnpm install`. Never `git stash`.
- No code comments. TypeScript strict, never `any`.
- One logical change per commit.
- Run `pnpm verify`, then check the app in a real browser at desktop and mobile widths.
- Ship straight to `main`, no PR: `git fetch && git rebase origin/main && pnpm verify && git push origin HEAD:main`. A rejected push means rebase, verify and push again. Never force-push `main`.
- A push to `main` deploys both apps. Check the Railway deploy and the Vercel deploy are green, `/health` returns ok, and the live app loads and browses a month. A failed build leaves the last good deploy live; fix forward.
- Use a PR when the change alters how Railway or Vercel build, or when Chris asks to see it first. Check the Vercel preview with `gh pr checks`.

## 4. Agent briefs

Every brief includes: the `TASKS.md` item, a fresh worktree off `origin/main`, no code comments, no `git stash`, the verify and browser checks above, the push-to-`main` steps, no production writes (Railway, Vercel, Supabase settings, env vars, data), and "if any action is denied, stop and report". Name any other running agents and the files they own. Use Sonnet for builds to a clear brief.

## 5. Pause

Push WIP, update `TASKS.md` (Backlog, In Progress, Done), remove finished worktrees and merged branches, and give a short "where we got to / what's next".
