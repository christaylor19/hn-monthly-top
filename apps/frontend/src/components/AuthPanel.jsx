import { createSignal, Show } from 'solid-js';
import {
  session,
  isConfigured,
  signInWithEmail,
  signUpWithEmail,
  signOut,
} from '../store/auth';

export default function AuthPanel() {
  const [open, setOpen] = createSignal(false);
  const [mode, setMode] = createSignal('signin'); // 'signin' | 'signup'
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [error, setError] = createSignal(null);
  const [busy, setBusy] = createSignal(false);
  const [info, setInfo] = createSignal(null);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode() === 'signup') {
        await signUpWithEmail(email(), password());
        setInfo('Check your email to confirm your account.');
      } else {
        await signInWithEmail(email(), password());
        setOpen(false);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Hidden entirely if Supabase isn't configured (e.g. local dev without env).
  return (
    <Show when={isConfigured()}>
      <div class="auth-wrap">
        <Show
          when={session()}
          fallback={
            <button class="auth-btn" onClick={() => setOpen((v) => !v)}>
              Log in
            </button>
          }
        >
          <button class="auth-btn" onClick={() => signOut()} title={session()?.user?.email}>
            Log out
          </button>
        </Show>

        <Show when={open() && !session()}>
          <div class="auth-panel">
            <form onSubmit={submit}>
              <input
                type="email"
                name="email"
                id="auth-email"
                placeholder="email"
                autocomplete="email"
                value={email()}
                onInput={(e) => setEmail(e.target.value)}
                required
                class="auth-input"
              />
              <input
                type="password"
                name="password"
                id="auth-password"
                placeholder="password"
                autocomplete={mode() === 'signup' ? 'new-password' : 'current-password'}
                value={password()}
                onInput={(e) => setPassword(e.target.value)}
                required
                class="auth-input"
              />
              <button type="submit" class="auth-submit" disabled={busy()}>
                {busy() ? '…' : mode() === 'signup' ? 'Sign up' : 'Sign in'}
              </button>
            </form>
            <button
              class="auth-toggle"
              onClick={() => setMode((m) => (m === 'signin' ? 'signup' : 'signin'))}
            >
              {mode() === 'signin' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
            </button>
            <Show when={error()}>
              <div class="auth-error">{error()}</div>
            </Show>
            <Show when={info()}>
              <div class="auth-info">{info()}</div>
            </Show>
          </div>
        </Show>
      </div>
    </Show>
  );
}
