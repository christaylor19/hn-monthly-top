import { timingSafeEqual } from 'node:crypto';
import Fastify, { type FastifyRequest } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { fromNodeHeaders } from 'better-auth/node';
import { summariseArticle, summariseComments } from './summarise.js';
import { requireAuth } from './auth.js';
import {
  auth,
  authBaseURL,
  signUpEnabled,
  passwordResetEnabled,
  findResetEmail,
  CLIENT_IP_HEADER,
} from './lib/auth.js';
import { setUserKey, getUserKey, getUserKeyMeta, deleteUserKey } from './keys.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const ORIGIN_SECRET = process.env.ORIGIN_SECRET;

// trustProxy lets the rate limiter (and req.ip) read the real client IP from
// X-Forwarded-For. On Railway every request arrives via the platform proxy, so
// without this the limiter would bucket all users under one address.
const app = Fastify({ logger: true, trustProxy: true });

function hasOriginSecret(req: FastifyRequest): boolean {
  if (!ORIGIN_SECRET) return false;
  const sent = req.headers['x-origin-secret'];
  if (typeof sent !== 'string') return false;
  const a = Buffer.from(sent);
  const b = Buffer.from(ORIGIN_SECRET);
  return a.length === b.length && timingSafeEqual(a, b);
}

function clientIp(req: FastifyRequest): string {
  const vercelIp = req.headers['x-vercel-forwarded-for'];
  if (typeof vercelIp === 'string' && hasOriginSecret(req)) {
    const first = vercelIp.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.ip;
}

app.addHook('onRequest', async (req, reply) => {
  if (!ORIGIN_SECRET || !req.url.startsWith('/api/')) return;
  if (!hasOriginSecret(req)) return reply.status(403).send({ error: 'Forbidden.' });
});

// Per-IP rate limit. Generous global default; the summarise routes (which fan
// out to OpenAI/Jina) tighten this via their own config.rateLimit below.
await app.register(rateLimit, {
  global: true,
  max: 120,
  timeWindow: '1 minute',
  keyGenerator: clientIp,
});

// Tighter limit shared by both summarise endpoints.
const SUMMARISE_RATE_LIMIT = {
  rateLimit: { max: 20, timeWindow: '1 minute' },
};

app.get('/health', async () => ({ ok: true }));

app.get('/api/auth-config', async () => ({ signUpEnabled, passwordResetEnabled }));

const RESET_TOKEN_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

app.post<{ Body: { token?: unknown } }>(
  '/api/password-reset/email',
  { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
  async (req, reply) => {
    const token = req.body?.token;
    if (!passwordResetEnabled || typeof token !== 'string' || !RESET_TOKEN_PATTERN.test(token)) {
      return reply.status(404).send({ error: 'INVALID_TOKEN' });
    }
    try {
      const email = await findResetEmail(token);
      if (!email) return reply.status(404).send({ error: 'INVALID_TOKEN' });
      return { email };
    } catch (e) {
      req.log.error(e);
      return reply.status(404).send({ error: 'INVALID_TOKEN' });
    }
  },
);

app.route({
  method: ['GET', 'POST'],
  url: '/api/auth/*',
  async handler(req, reply) {
    const headers = fromNodeHeaders(req.headers);
    headers.set(CLIENT_IP_HEADER, clientIp(req));
    const hasBody = req.method !== 'GET' && req.body !== undefined;
    const response = await auth.handler(
      new Request(new URL(req.url, authBaseURL), {
        method: req.method,
        headers,
        body: hasBody ? JSON.stringify(req.body) : undefined,
      }),
    );
    reply.status(response.status);
    response.headers.forEach((value, key) => {
      if (key !== 'set-cookie') reply.header(key, value);
    });
    const cookies = response.headers.getSetCookie();
    if (cookies.length) reply.header('set-cookie', cookies);
    return reply.send(response.body ? await response.text() : null);
  },
});

const NO_KEY_MSG = 'Add your OpenAI API key in settings to use the summariser.';

// --- API key management (all require auth) -------------------------------

app.get('/api/keys', { preHandler: requireAuth }, async (req, reply) => {
  try {
    const meta = await getUserKeyMeta(req.userId!);
    return { hasKey: !!meta, lastFour: meta?.lastFour ?? null };
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: (e as Error).message });
  }
});

app.post<{ Body: { apiKey?: string } }>(
  '/api/keys',
  { preHandler: requireAuth },
  async (req, reply) => {
    const apiKey = req.body?.apiKey;
    if (!apiKey) return reply.status(400).send({ error: 'apiKey is required' });
    try {
      const { lastFour } = await setUserKey(req.userId!, apiKey);
      return { hasKey: true, lastFour };
    } catch (e) {
      req.log.error(e);
      return reply.status(400).send({ error: (e as Error).message });
    }
  },
);

app.delete('/api/keys', { preHandler: requireAuth }, async (req, reply) => {
  try {
    await deleteUserKey(req.userId!);
    return { hasKey: false, lastFour: null };
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: (e as Error).message });
  }
});

// --- Summarise (require auth + a stored key) -----------------------------

app.post<{ Body: { title: string; url?: string; verbosity?: string } }>(
  '/api/summarise/article',
  { preHandler: requireAuth, config: SUMMARISE_RATE_LIMIT },
  async (req, reply) => {
    const { title, url, verbosity } = req.body ?? {};
    if (!title) return reply.status(400).send({ error: 'title is required' });

    try {
      const key = await getUserKey(req.userId!);
      if (!key) return reply.status(403).send({ error: NO_KEY_MSG });
      const result = await summariseArticle(key, title, url, verbosity);
      // Usage signal: one line per served summary. userId lets us count
      // distinct users; titleOnly tells us how often Jina fetch failed.
      req.log.info(
        {
          evt: 'summarise',
          kind: 'article',
          verbosity: verbosity ?? 'balanced',
          userId: req.userId,
          titleOnly: result.titleOnly,
        },
        'summarise',
      );
      return result;
    } catch (e) {
      req.log.error(e);
      return reply.status(500).send({ error: (e as Error).message });
    }
  },
);

app.post<{
  Body: { title: string; comments: { author: string; text: string }[]; verbosity?: string };
}>(
  '/api/summarise/comments',
  { preHandler: requireAuth, config: SUMMARISE_RATE_LIMIT },
  async (req, reply) => {
    const { title, comments, verbosity } = req.body ?? {};
    if (!title || !Array.isArray(comments)) {
      return reply.status(400).send({ error: 'title and comments are required' });
    }

    try {
      const key = await getUserKey(req.userId!);
      if (!key) return reply.status(403).send({ error: NO_KEY_MSG });
      const text = await summariseComments(key, title, comments, verbosity);
      req.log.info(
        {
          evt: 'summarise',
          kind: 'comments',
          verbosity: verbosity ?? 'balanced',
          userId: req.userId,
        },
        'summarise',
      );
      return { text };
    } catch (e) {
      req.log.error(e);
      return reply.status(500).send({ error: (e as Error).message });
    }
  },
);

try {
  await app.listen({ port: PORT, host: HOST });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
