-- User API key storage. Run in the Supabase SQL editor.
--
-- The OpenAI key itself is encrypted application-side (AES-256-GCM) before it
-- reaches this table — the `ciphertext`/`iv` columns are useless without the
-- server's ENCRYPTION_KEY. `last_four` is plaintext, used only for masked
-- display ("sk-…1234").

create table if not exists user_api_keys (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  ciphertext text not null,
  iv         text not null,
  last_four  text not null,
  updated_at timestamptz not null default now()
);

-- Defence in depth: the backend uses the service-role key (which bypasses RLS)
-- and always scopes queries to the authenticated user, but we enable RLS so
-- that even a leaked anon key cannot read or write these rows from the browser.
alter table user_api_keys enable row level security;

-- No policies are created, so with RLS enabled the anon/auth roles have NO
-- access. Only the service-role key (server-side) can touch this table.
