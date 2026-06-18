import type { FastifyRequest, FastifyReply } from 'fastify';
import { createRemoteJWKSet, jwtVerify } from 'jose';

// Verifies a Supabase-issued JWT from the Authorization: Bearer header against
// Supabase's JWKS endpoint. On success, attaches req.userId (the Supabase user
// id, i.e. the JWT `sub` claim). On failure, replies 401 and the route is not run.
//
// SUPABASE_URL example: https://abcdefgh.supabase.co
// JWKS is served at <SUPABASE_URL>/auth/v1/.well-known/jwks.json

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
  }
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (jwks) return jwks;
  const url = process.env.SUPABASE_URL;
  if (!url) throw new Error('SUPABASE_URL is not configured on the server.');
  jwks = createRemoteJWKSet(new URL(`${url}/auth/v1/.well-known/jwks.json`));
  return jwks;
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    reply.status(401).send({ error: 'Authentication required.' });
    return;
  }

  try {
    const { payload } = await jwtVerify(token, getJwks());
    if (!payload.sub) throw new Error('token missing sub');
    req.userId = payload.sub;
  } catch (e) {
    req.log.warn({ err: e }, 'jwt verification failed');
    reply.status(401).send({ error: 'Invalid or expired session.' });
  }
}
