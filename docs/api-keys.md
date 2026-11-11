# User login + bring-your-own OpenAI key

Browsing the monthly top stories is fully anonymous and unchanged. The
**summariser** requires logging in and supplying your own OpenAI API key.
Anonymous and key-less usage of the summariser is intentionally blocked so the
app owner pays nothing for it.

## How it works

```
Browser (Solid, Vercel)         Fastify (Railway)              Postgres (Railway)
───────────────────────         ─────────────────              ──────────────────
/api/* is same-origin: Vercel rewrites it to Railway and adds x-origin-secret

log in ──────────────────────▶  Better Auth checks password ◀─ user, account
                                sets session cookie ───────▶  session
paste OpenAI key ────────────▶  look up session from cookie
                                AES-256-GCM encrypt  ◀── ENCRYPTION_KEY
                                store ciphertext ───────────▶ user_api_keys
summarise (cookie sent) ──────▶ look up session from cookie
                                decrypt user's key
                                call OpenAI with it
                                return summary ◀─────────────
```

Auth is [Better Auth](https://www.better-auth.com) (email and password, no email
verification, no password reset) on Drizzle. The browser never talks to Railway
directly: Vercel proxies `/api/*`, so the session cookie is first-party on
`hn-monthly-top.vercel.app` and no CORS is needed.

## Security model

The OpenAI key is a bearer secret with real spend attached. The design keeps it
out of every place it could leak:

- **Never in the browser at rest.** The key is typed into a password field and
  POSTed straight to the backend. It is never written to `localStorage` and is
  cleared from component state immediately after saving.
- **Never returned to the client after saving.** `GET /api/keys` returns only
  `{ hasKey, lastFour }`. The settings UI shows `sk-…1234` and never re-displays
  the full key — replacing overwrites, it doesn't reveal.
- **Encrypted at rest, application-side.** Fastify encrypts with AES-256-GCM
  (`apps/server/src/crypto.ts`) using `ENCRYPTION_KEY`, held only on Railway.
  A full database dump yields ciphertext that is useless without that key.
- **Only ever plaintext at two moments:** when the user types it, and the
  instant the server uses it to call OpenAI.
- **Only the server reaches the database.** Postgres sits on Railway's private
  network and the browser has no credentials for it. Every query is scoped to
  the `user_id` of the session.
- **Only Vercel reaches the API.** With `ORIGIN_SECRET` set, the server rejects
  `/api/*` requests that don't carry the matching `x-origin-secret` header,
  which Vercel adds on every proxied request.

### Residual risks (honest list)

- The running Fastify process holds `ENCRYPTION_KEY` in memory and sees keys in
  plaintext while calling OpenAI — a compromised server can read keys. This is
  inherent to a server proxying the key; it's the standard trade-off.
- GCM auth tag protects against tampering, but we do not currently bind the
  ciphertext to the `user_id` (no AAD). A DB-level row swap by an attacker with
  write access would not be detected by decryption alone — keeping the
  database private to the server is what prevents that. Adding `user_id` as AAD is a cheap future
  hardening.

## Setup

### 1. Database

Railway Postgres is declared in `.railway/railway.ts`. Migrations live in
`apps/server/drizzle/` (generate with `pnpm --filter @hn-monthly-top/server db:generate`
after a schema change) and run in Railway's pre-deploy step
(`node apps/server/dist/migrate.js`), so a deploy only goes live once they pass.

### 2. Server env (Railway)

```
DATABASE_URL=${{Postgres.DATABASE_URL}}        # reference variable
BETTER_AUTH_SECRET=<openssl rand -base64 32>   # secret
BETTER_AUTH_URL=https://hn-monthly-top.vercel.app
AUTH_SIGNUP_ENABLED=true                       # public sign-up on
ORIGIN_SECRET=<openssl rand -hex 32>           # same value as on Vercel
ENCRYPTION_KEY=<node -e "console.log(require('crypto').randomBytes(32).toString('base64'))">
OPENAI_MODEL=gpt-4.1-mini
```

### 3. Frontend env (Vercel)

```
ORIGIN_SECRET=<same value as on Railway>
```

`vercel.json` reads it at request time to set `x-origin-secret` on `/api/*`.

### Sign-up

Sign-up is open to anyone: `AUTH_SIGNUP_ENABLED=true` is set in production on
purpose, so other people can use the summariser with their own OpenAI key.
Removing the variable closes sign-up and hides the "Sign up" option
(`GET /api/auth-config`); existing users can still log in.

There is no email verification or password reset yet. A forgotten password
means deleting the `user` row in Railway's data tab and signing up again.

## Key rotation

- **A user's OpenAI key:** they paste a new one in settings → overwrites the row.
- **The server `ENCRYPTION_KEY`:** rotating it invalidates _all_ stored keys
  (they can no longer be decrypted). There is no re-encryption migration yet —
  users would simply re-enter their keys. Only rotate if the key is compromised.

## Local development

Run a local Postgres, copy `apps/server/.env.example` to `apps/server/.env`, then
apply migrations and start both apps:

```bash
docker run -d --name hnmt-pg -e POSTGRES_USER=hnmt -e POSTGRES_PASSWORD=hnmt \
  -e POSTGRES_DB=hnmt -p 127.0.0.1:5432:5432 postgres:17
pnpm build:server && node --env-file=apps/server/.env apps/server/dist/migrate.js
pnpm dev
```

Vite proxies `/api` to the server, so the cookie is same-origin on
`localhost:5173`, which is also `BETTER_AUTH_URL` locally.
