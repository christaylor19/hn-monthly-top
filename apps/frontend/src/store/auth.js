import { createClient } from '@supabase/supabase-js';
import { createSignal } from 'solid-js';

// Supabase client (browser). Uses the anon/publishable key, which is safe to
// ship — it only permits what Row-Level Security allows. The OpenAI key never
// touches Supabase from the browser; it's sent to our own backend over the JWT.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const [session, setSession] = createSignal(null);
export { session };

export const isConfigured = () => !!supabase;

if (supabase) {
  supabase.auth.getSession().then(({ data }) => setSession(data.session));
  supabase.auth.onAuthStateChange((_event, s) => setSession(s));
}

// The JWT to attach to backend requests, or null if signed out.
export function accessToken() {
  return session()?.access_token ?? null;
}

export async function signInWithEmail(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

export async function signUpWithEmail(email, password) {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
}

export async function signOut() {
  await supabase.auth.signOut();
}
