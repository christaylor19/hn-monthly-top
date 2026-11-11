import { createSignal, Show } from 'solid-js';
import {
  session,
  signUpEnabled,
  passwordResetEnabled,
  signInWithEmail,
  signUpWithEmail,
  signOut,
  requestPasswordReset,
  resetPassword,
  takeResetLink,
} from '../store/auth';

type Mode = 'signin' | 'signup' | 'forgot' | 'reset';

export default function AuthPanel() {
  const resetLink = takeResetLink();
  const [open, setOpen] = createSignal(resetLink !== null);
  const [mode, setMode] = createSignal<Mode>(
    resetLink && 'token' in resetLink ? 'reset' : 'signin',
  );
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [confirm, setConfirm] = createSignal('');
  const [error, setError] = createSignal<string | null>(
    resetLink && 'error' in resetLink ? resetLink.error : null,
  );
  const [notice, setNotice] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);
  const resetToken = resetLink && 'token' in resetLink ? resetLink.token : null;
  const signingUp = () => mode() === 'signup' && signUpEnabled();

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
  }

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
      setNotice(null);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function submitForgot(e: SubmitEvent & { currentTarget: HTMLFormElement }) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      await requestPasswordReset(email());
      setNotice("If an account exists for that email, we've sent a link to reset the password.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function submitReset(e: SubmitEvent & { currentTarget: HTMLFormElement }) {
    e.preventDefault();
    setError(null);
    if (password() !== confirm()) {
      setError("The passwords don't match.");
      return;
    }
    if (!resetToken) {
      setError('This reset link is invalid or has expired.');
      return;
    }
    setBusy(true);
    try {
      await resetPassword(resetToken, password());
      setPassword('');
      setConfirm('');
      setMode('signin');
      setNotice('Password changed. Log in with your new password.');
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

      <Show when={open() && (!session() || mode() === 'reset')}>
        <div class="auth-panel">
          <Show when={mode() === 'signin' || mode() === 'signup'}>
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
            <Show when={mode() === 'signin' && passwordResetEnabled()}>
              <button class="auth-toggle" onClick={() => switchMode('forgot')}>
                Forgot password?
              </button>
            </Show>
            <Show when={signUpEnabled()}>
              <button
                class="auth-toggle"
                onClick={() => switchMode(mode() === 'signin' ? 'signup' : 'signin')}
              >
                {mode() === 'signin' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
              </button>
            </Show>
          </Show>

          <Show when={mode() === 'forgot'}>
            <form name="forgot-password" action="#" method="post" onSubmit={submitForgot}>
              <input
                type="email"
                name="email"
                id="auth-forgot-email"
                placeholder="email"
                autocomplete="email"
                value={email()}
                onInput={(e) => setEmail(e.currentTarget.value)}
                required
                class="auth-input"
              />
              <button type="submit" class="auth-submit" disabled={busy()}>
                {busy() ? '…' : 'Send reset link'}
              </button>
            </form>
            <button class="auth-toggle" onClick={() => switchMode('signin')}>
              Back to sign in
            </button>
          </Show>

          <Show when={mode() === 'reset'}>
            <form name="reset-password" action="#" method="post" onSubmit={submitReset}>
              <input
                type="password"
                name="new-password"
                id="auth-new-password"
                placeholder="new password"
                autocomplete="new-password"
                value={password()}
                onInput={(e) => setPassword(e.currentTarget.value)}
                required
                minLength={8}
                class="auth-input"
              />
              <input
                type="password"
                name="confirm-password"
                id="auth-confirm-password"
                placeholder="confirm new password"
                autocomplete="new-password"
                value={confirm()}
                onInput={(e) => setConfirm(e.currentTarget.value)}
                required
                minLength={8}
                class="auth-input"
              />
              <button type="submit" class="auth-submit" disabled={busy()}>
                {busy() ? '…' : 'Set new password'}
              </button>
            </form>
          </Show>

          <Show when={notice()}>
            <div class="auth-notice">{notice()}</div>
          </Show>
          <Show when={error()}>
            <div class="auth-error">{error()}</div>
          </Show>
        </div>
      </Show>
    </div>
  );
}
