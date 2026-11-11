import type { FastifyRequest, FastifyReply } from 'fastify';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from './lib/auth.js';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
  }
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session) {
      reply.status(401).send({ error: 'Authentication required.' });
      return;
    }
    req.userId = session.user.id;
  } catch (e) {
    req.log.warn({ err: e }, 'session lookup failed');
    reply.status(401).send({ error: 'Invalid or expired session.' });
  }
}
