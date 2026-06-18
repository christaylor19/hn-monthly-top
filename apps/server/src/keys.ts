import { createClient } from '@supabase/supabase-js';
import { encrypt, decrypt } from './crypto.js';

// Stores users' OpenAI API keys as ciphertext in Supabase. The key is encrypted
// app-side (see crypto.ts) before it ever touches the database, so the stored
// row is useless without the server's ENCRYPTION_KEY.
//
// Uses the Supabase SERVICE ROLE key (server-only, never sent to the browser),
// which bypasses RLS — access control is enforced here by always scoping to the
// authenticated req.userId. RLS on the table is a defence-in-depth backstop.
//
// Table:
//   create table user_api_keys (
//     user_id uuid primary key references auth.users(id) on delete cascade,
//     ciphertext text not null,
//     iv text not null,
//     last_four text not null,
//     updated_at timestamptz not null default now()
//   );
//   alter table user_api_keys enable row level security;

// Row shape of the user_api_keys table. The Supabase client is left untyped
// (its strict generic inference falls back to `never` without generated DB
// types), so we assert this shape at the read boundary instead.
interface UserApiKeyRow {
  user_id: string;
  ciphertext: string;
  iv: string;
  last_four: string;
  updated_at: string;
}

let client: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured.');
  }
  client = createClient(url, serviceKey, { auth: { persistSession: false } });
  return client;
}

export async function setUserKey(userId: string, plaintextKey: string): Promise<{ lastFour: string }> {
  const trimmed = plaintextKey.trim();
  if (!trimmed.startsWith('sk-')) {
    throw new Error('That does not look like an OpenAI key (expected to start with "sk-").');
  }
  const { ciphertext, iv } = encrypt(trimmed);
  const lastFour = trimmed.slice(-4);

  const row: UserApiKeyRow = {
    user_id: userId,
    ciphertext,
    iv,
    last_four: lastFour,
    updated_at: new Date().toISOString(),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped client infers never[] for upsert without generated DB types
  const { error } = await getClient().from('user_api_keys').upsert(row as any);

  if (error) throw new Error(`Failed to store key: ${error.message}`);
  return { lastFour };
}

// Returns the decrypted plaintext key for server-side use only. Never returned
// to the client.
export async function getUserKey(userId: string): Promise<string | null> {
  const { data, error } = await getClient()
    .from('user_api_keys')
    .select('ciphertext, iv')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(`Failed to read key: ${error.message}`);
  if (!data) return null;
  const row = data as Pick<UserApiKeyRow, 'ciphertext' | 'iv'>;
  return decrypt({ ciphertext: row.ciphertext, iv: row.iv });
}

// Returns only the masked last-four for display. Safe to send to the client.
export async function getUserKeyMeta(userId: string): Promise<{ lastFour: string } | null> {
  const { data, error } = await getClient()
    .from('user_api_keys')
    .select('last_four')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(`Failed to read key: ${error.message}`);
  if (!data) return null;
  const row = data as Pick<UserApiKeyRow, 'last_four'>;
  return { lastFour: row.last_four };
}

export async function deleteUserKey(userId: string): Promise<void> {
  const { error } = await getClient().from('user_api_keys').delete().eq('user_id', userId);
  if (error) throw new Error(`Failed to delete key: ${error.message}`);
}
