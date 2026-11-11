import { createAuthClient } from 'better-auth/solid';
import { createSignal } from 'solid-js';

export const authClient = createAuthClient({ basePath: '/api/auth' });

const sessionState = authClient.useSession();

export const session = () => sessionState().data;

const [signUpEnabled, setSignUpEnabled] = createSignal(false);
const [passwordResetEnabled, setPasswordResetEnabled] = createSignal(false);
export { signUpEnabled, passwordResetEnabled };

type AuthConfig = { signUpEnabled?: boolean; passwordResetEnabled?: boolean };

fetch('/api/auth-config')
  .then((res) => (res.ok ? (res.json() as Promise<AuthConfig>) : null))
  .then((config) => {
    setSignUpEnabled(config?.signUpEnabled === true);
    setPasswordResetEnabled(config?.passwordResetEnabled === true);
  })
  .catch(() => {
    setSignUpEnabled(false);
    setPasswordResetEnabled(false);
  });

export const INVALID_LINK = 'This reset link is invalid or has expired.';

export type ResetLink = { token: string } | { error: string };

export function takeResetLink(): ResetLink | null {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  if (!token && !params.has('error')) return null;
  window.history.replaceState(null, '', window.location.pathname + window.location.hash);
  return token ? { token } : { error: INVALID_LINK };
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const { error } = await authClient.signIn.email({ email, password });
  if (error) throw new Error(error.message ?? 'Sign in failed.');
}

export async function signUpWithEmail(email: string, password: string): Promise<void> {
  const { error } = await authClient.signUp.email({ email, password, name: email });
  if (error) throw new Error(error.message ?? 'Sign up failed.');
}

export async function signOut(): Promise<void> {
  await authClient.signOut();
}

export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await authClient.requestPasswordReset({
    email,
    redirectTo: `${window.location.origin}/`,
  });
  if (error) throw new Error(error.message ?? 'Could not send the reset email.');
}

export async function fetchResetEmail(token: string): Promise<string | null> {
  try {
    const res = await fetch('/api/password-reset/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { email?: unknown };
    return typeof body.email === 'string' ? body.email : null;
  } catch {
    return null;
  }
}

export async function resetPassword(
  token: string,
  newPassword: string,
  email: string | null,
): Promise<boolean> {
  const { error } = await authClient.resetPassword({ token, newPassword });
  if (error) {
    throw new Error(
      error.code === 'INVALID_TOKEN'
        ? INVALID_LINK
        : (error.message ?? 'Could not reset the password.'),
    );
  }
  await authClient.signOut();
  if (!email) return false;
  const signIn = await authClient.signIn.email({ email, password: newPassword });
  return !signIn.error;
}
