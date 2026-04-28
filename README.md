# HN Monthly Top

SolidJS app showing top Hacker News stories by month, with LLM-powered article and comment summaries.

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

### `apps/server/.env`

```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-mini
JINA_API_KEY=          # optional, falls back to free tier
CORS_ORIGIN=           # comma-separated allowed origins for prod
PORT=3000
```

### `apps/frontend/.env`

```
VITE_API_URL=          # leave empty in dev, set to Railway URL in prod
```

## Deployment

### Backend (Railway)

`railway.json` and `nixpacks.toml` at the repo root configure Railway to install with Yarn 4 and run `yarn start:server`. Set the env vars from `apps/server/.env.example` in Railway.

### Frontend (Vercel)

Build config lives in `vercel.json` at the repo root. Just set the env var in Vercel:
- `VITE_API_URL` = Railway backend URL

If your Vercel project was previously configured with a custom root directory, clear that in Settings → General so the dashboard config doesn't override `vercel.json`.
