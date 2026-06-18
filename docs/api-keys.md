# User login + bring-your-own OpenAI key

Browsing the monthly top stories is fully anonymous and unchanged. The
**summariser** requires logging in and supplying your own OpenAI API key.
Anonymous and key-less usage of the summariser is intentionally blocked so the
app owner pays nothing for it.

## How it works

```
Browser (Solid)                 Fastify (Railway)              Supabase
───────────────                 ─────────────────              ────────
log in ──────────────────────▶  (Supabase Auth issues JWT)  ◀─ auth.users
paste OpenAI key ────────────▶  verify JWT (jose + JWKS)
                                AES-256-GCM encrypt  ◀── ENCRYPTION_KEY
                                store ciphertext ───────────▶ user_api_keys
summarise (JWT attached) ─────▶ verify JWT
                                decrypt user's key
                                call OpenAI with it
                                return summary ◀─────────────
```

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
  A full Supabase dump yields ciphertext that is useless without that key.
- **Only ever plaintext at two moments:** when the user types it, and the
  instant the server uses it to call OpenAI.
- **RLS backstop.** The `user_api_keys` table has RLS enabled with no policies,
  so even a leaked anon key cannot read it from the browser. Only the
  server-side service-role key can.

### Residual risks (honest list)

- The running Fastify process holds `ENCRYPTION_KEY` in memory and sees keys in
  plaintext while calling OpenAI — a compromised server can read keys. This is
  inherent to a server proxying the key; it's the standard trade-off.
- GCM auth tag protects against tampering, but we do not currently bind the
  ciphertext to the `user_id` (no AAD). A DB-level row swap by an attacker with
  write access would not be detected by decryption alone — RLS + service-role
  scoping is what prevents that. Adding `user_id` as AAD is a cheap future
  hardening.

## Setup

### 1. Supabase
1. Create a project at supabase.com.
2. Apply the schema: `supabase link --project-ref <ref>` then `supabase db push`
   (migration lives in `supabase/migrations/`). Or paste the migration SQL into
   the dashboard SQL editor.
3. Auth → enable Email provider. (Email confirmation on is recommended.)
4. Project Settings → API → copy the **URL**, **anon key**, **service_role key**.

### 2. Server env (Railway)
```
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role key>   # secret — server only
ENCRYPTION_KEY=<node -e "console.log(require('crypto').randomBytes(32).toString('base64'))">
OPENAI_MODEL=gpt-4.1-mini
```

### 3. Frontend env (Vercel)
```
VITE_API_URL=https://<your-railway-app>.up.railway.app
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>             # safe to expose
```

## Key rotation

- **A user's OpenAI key:** they paste a new one in settings → overwrites the row.
- **The server `ENCRYPTION_KEY`:** rotating it invalidates *all* stored keys
  (they can no longer be decrypted). There is no re-encryption migration yet —
  users would simply re-enter their keys. Only rotate if the key is compromised.

## Local development

If `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are unset, the login and
API-key UI hide themselves and the app runs in anonymous-only mode (browse
works, summarise is unavailable). This lets you run the frontend without a
Supabase project.
