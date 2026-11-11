import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';

const baseURL = process.env.BETTER_AUTH_URL;
if (!baseURL) throw new Error('BETTER_AUTH_URL is not configured on the server.');

export const authBaseURL = baseURL;

export const signUpEnabled = process.env.AUTH_SIGNUP_ENABLED === 'true';

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
  },
  advanced: {
    ipAddress: { ipAddressHeaders: [CLIENT_IP_HEADER] },
  },
});
