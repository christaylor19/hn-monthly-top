import { createAuthClient } from 'better-auth/solid';
import { createSignal } from 'solid-js';

export const authClient = createAuthClient({ basePath: '/api/auth' });

const sessionState = authClient.useSession();

export const session = () => sessionState().data;

const [signUpEnabled, setSignUpEnabled] = createSignal(false);
export { signUpEnabled };

fetch('/api/auth-config')
  .then((res) => (res.ok ? (res.json() as Promise<{ signUpEnabled?: boolean }>) : null))
  .then((config) => setSignUpEnabled(config?.signUpEnabled === true))
  .catch(() => setSignUpEnabled(false));

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
