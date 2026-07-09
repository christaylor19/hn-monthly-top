# HN Monthly Top

SolidJS app showing top Hacker News stories by month, with LLM-powered article and comment summaries.

Browsing is anonymous. The summariser requires logging in and bringing your own
OpenAI API key — see [docs/api-keys.md](docs/api-keys.md).

## Structure

Yarn workspaces monorepo:

- `apps/frontend` — SolidJS + Vite SPA (deploys to Vercel)
- `apps/server` — Fastify API proxying OpenAI and Jina (deploys to Railway)

## Development

```bash
yarn install
yarn dev               # runs frontend + server in parallel
yarn dev:frontend      # frontend only
yarn dev:server        # server only
```

Frontend runs on `http://localhost:5173`. Server runs on `http://localhost:3000`. Vite proxies `/api/*` to the server in dev — no extra config needed.

## Environment

See `.env.example` in each app for the full list. Auth + per-user key storage
setup is documented in [docs/api-keys.md](docs/api-keys.md).

### `apps/server/.env`

```
OPENAI_MODEL=gpt-4.1-mini
JINA_API_KEY=                 # optional, falls back to free tier
CORS_ORIGIN=                  # comma-separated allowed origins for prod
PORT=3000
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=    # secret — server only
ENCRYPTION_KEY=               # 32-byte base64, encrypts users' OpenAI keys at rest
```

### `apps/frontend/.env`

```
VITE_API_URL=                 # leave empty in dev, set to Railway URL in prod
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=       # safe to expose
```

## Deployment

### Backend (Railway)

`railway.json` at the repo root configures Railway (Railpack builder) to install with Yarn 4 and run `yarn start:server`. Set the env vars from `apps/server/.env.example` in Railway.

### Frontend (Vercel)

Build config lives in `vercel.json` at the repo root. Just set the env var in Vercel:
- `VITE_API_URL` = Railway backend URL

If your Vercel project was previously configured with a custom root directory, clear that in Settings → General so the dashboard config doesn't override `vercel.json`.

## Monitoring usage

Visitor numbers (Vercel Web Analytics) and summaries-served counts (Railway
logs) — how to enable and read both — are documented in
[docs/monitoring.md](docs/monitoring.md).
