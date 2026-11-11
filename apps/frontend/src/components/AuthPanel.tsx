import { createSignal, Show } from 'solid-js';
import { session, signUpEnabled, signInWithEmail, signUpWithEmail, signOut } from '../store/auth';

export default function AuthPanel() {
  const [open, setOpen] = createSignal(false);
  const [mode, setMode] = createSignal<'signin' | 'signup'>('signin');
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [error, setError] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);
  const signingUp = () => mode() === 'signup' && signUpEnabled();

  async function submit(e: SubmitEvent & { currentTarget: HTMLFormElement }) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (signingUp()) {
        await signUpWithEmail(email(), password());
      } else {
        await signInWithEmail(email(), password());
      }
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
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
          <form name="login" action="#" method="post" onSubmit={submit}>
            <input
              type="email"
              name="email"
              id="auth-email"
              placeholder="email"
              autocomplete="email"
              value={email()}
              onInput={(e) => setEmail(e.currentTarget.value)}
              required
              class="auth-input"
            />
            <input
              type="password"
              name="password"
              id="auth-password"
              placeholder="password"
              autocomplete={signingUp() ? 'new-password' : 'current-password'}
              value={password()}
              onInput={(e) => setPassword(e.currentTarget.value)}
              required
              class="auth-input"
            />
            <button type="submit" class="auth-submit" disabled={busy()}>
              {busy() ? '…' : signingUp() ? 'Sign up' : 'Sign in'}
            </button>
          </form>
          <Show when={signUpEnabled()}>
            <button
              class="auth-toggle"
              onClick={() => setMode((m) => (m === 'signin' ? 'signup' : 'signin'))}
            >
              {mode() === 'signin' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
            </button>
          </Show>
          <Show when={error()}>
            <div class="auth-error">{error()}</div>
          </Show>
        </div>
      </Show>
    </div>
  );
}
