import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { passwordResetEnabled, sendPasswordResetEmail } from './email.js';

const baseURL = process.env.BETTER_AUTH_URL;
if (!baseURL) throw new Error('BETTER_AUTH_URL is not configured on the server.');

export const authBaseURL = baseURL;

export const signUpEnabled = process.env.AUTH_SIGNUP_ENABLED === 'true';

export { passwordResetEnabled };

const RESET_EMAIL_COOLDOWN_MS = 60_000;
const recentResetEmails = new Map<string, number>();

function claimResetEmailSlot(email: string, now = Date.now()): boolean {
  for (const [key, sentAt] of recentResetEmails) {
    if (now - sentAt >= RESET_EMAIL_COOLDOWN_MS) recentResetEmails.delete(key);
  }
  const key = email.toLowerCase();
  if (recentResetEmails.has(key)) return false;
  recentResetEmails.set(key, now);
  return true;
}

export const CLIENT_IP_HEADER = 'x-hn-client-ip';

export const auth = betterAuth({
  baseURL,
  basePath: '/api/auth',
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [new URL(baseURL).origin],
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    disableSignUp: !signUpEnabled,
    revokeSessionsOnPasswordReset: true,
    ...(passwordResetEnabled && {
      sendResetPassword: async ({ user, url }) => {
        if (!claimResetEmailSlot(user.email)) return;
        sendPasswordResetEmail(user.email, url).catch((err: unknown) => {
          console.error('password reset email failed', err);
        });
      },
    }),
  },
  advanced: {
    ipAddress: { ipAddressHeaders: [CLIENT_IP_HEADER] },
  },
});

export async function findResetEmail(token: string): Promise<string | null> {
  const ctx = await auth.$context;
  const verification = await ctx.internalAdapter.findVerificationValue(`reset-password:${token}`);
  if (!verification || verification.expiresAt < new Date()) return null;
  const user = await ctx.internalAdapter.findUserById(verification.value);
  return user?.email ?? null;
}
