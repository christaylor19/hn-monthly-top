# Monitoring usage

Two independent signals answer "is anyone using this, and are they using the
summariser?" — a client-side one on Vercel (visitors) and a server-side one on
Railway (summaries actually served). They overlap deliberately: the Vercel
number is easy but undercounts (ad-blockers, Hobby-tier limits), the Railway
number is ground-truth for the feature that matters.

## Frontend — Vercel Web Analytics (visitors)

Answers *how many people visited*. Cookieless, no consent banner needed.

- **Wiring:** `inject()` is called once at app boot in
  `apps/frontend/src/index.jsx`. There is no Solid-specific binding, so we use
  the framework-agnostic vanilla `@vercel/analytics` entry. Nothing to run — it
  ships with the normal Vercel deploy.
- **Enable it:** Vercel project → **Analytics** tab → **Enable** (one-time). On
  the **Hobby** plan you get pageviews, 50k events/month, 30-day history.
- **Read it:** the **Analytics** tab. Pageviews are the headline number.
- **Caveats:**
  - This is a hash-routed SPA, so pageviews are a coarse "visits" signal, not
    per-view routing detail.
  - **Custom events are Pro-only** ($20/mo). We *do* fire
    `track('summarise', { kind, verbosity })` in `apps/frontend/src/api/summarise.js`,
    but on Hobby those calls are silently dropped — they light up only if the
    project is upgraded to Pro. They are harmless no-ops otherwise, so they stay
    in the code. For the summarise count on Hobby, use the Railway logs below.
  - Client-side, so ad-blockers undercount — expect that with a technical
    audience.

## Backend — Railway logs (summaries served)

Answers *how many summaries were served, to how many distinct people* — the real
"is the feature landing" question. Server-side, so no ad-blocker gap and no
paywall.

Both summarise routes in `apps/server/src/main.ts` emit one structured
(Pino/JSON) log line **after a summary succeeds** — the `403 no key` and
`500 error` paths deliberately do not log, so the count is honest:

```json
{
  "evt": "summarise",
  "kind": "article",        // or "comments"
  "verbosity": "detailed",  // concise | balanced | detailed
  "userId": "a1b2c3d4-...",  // Supabase user id
  "titleOnly": false,        // article only: true = Jina content fetch failed
  "msg": "summarise"
}
```

Because the fields are real JSON (not baked into a message string), you can
filter and group on them.

### Reading them

- **Dashboard:** Railway → `hn-monthly` service → **Observability / Logs** →
  search `summarise`.
- **CLI:** `railway logs | grep summarise`

### What each field gives you

| Question | How |
|---|---|
| How many summaries served? | count of `evt:"summarise"` lines |
| **How many distinct people?** | count of **unique `userId`** values |
| Repeat use or one-and-done? | summaries ÷ distinct users |
| Article vs comments? | group by `kind` |
| Does anyone touch the verbosity slider? | group by `verbosity` (all `balanced` = nobody found it) |
| Is free-tier Jina failing? | ratio of `titleOnly:true` (high → add prod `JINA_API_KEY`) |

The distinct-`userId` count is the "N people have used the summariser" number.

### Retention caveat

Railway logs are a rolling window (days, not months), so this answers "is it
being used now / this week", not long-term trends. For durable counts, write a
row per summary to a Supabase table (auth + Postgres are already wired up) — not
built yet, add it if long-term analytics are ever needed.
