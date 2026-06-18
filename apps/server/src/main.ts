import Fastify from 'fastify';
import cors from '@fastify/cors';
import { summariseArticle, summariseComments } from './summarise.js';
import { requireAuth } from './auth.js';
import { setUserKey, getUserKey, getUserKeyMeta, deleteUserKey } from './keys.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.CORS_ORIGIN?.split(',') ?? true,
  // Pin methods explicitly. Left unset, the preflight only advertises the
  // methods derived at registration time, which silently dropped DELETE and
  // made the browser block the "remove key" request before it was sent.
  methods: ['GET', 'HEAD', 'POST', 'DELETE', 'OPTIONS'],
});

app.get('/health', async () => ({ ok: true }));

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
  }
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
  { preHandler: requireAuth },
  async (req, reply) => {
    const { title, url, verbosity } = req.body ?? {};
    if (!title) return reply.status(400).send({ error: 'title is required' });

    try {
      const key = await getUserKey(req.userId!);
      if (!key) return reply.status(403).send({ error: NO_KEY_MSG });
      const result = await summariseArticle(key, title, url, verbosity);
      return result;
    } catch (e) {
      req.log.error(e);
      return reply.status(500).send({ error: (e as Error).message });
    }
  }
);

app.post<{
  Body: { title: string; comments: { author: string; text: string }[]; verbosity?: string };
}>('/api/summarise/comments', { preHandler: requireAuth }, async (req, reply) => {
  const { title, comments, verbosity } = req.body ?? {};
  if (!title || !Array.isArray(comments)) {
    return reply.status(400).send({ error: 'title and comments are required' });
  }

  try {
    const key = await getUserKey(req.userId!);
    if (!key) return reply.status(403).send({ error: NO_KEY_MSG });
    const text = await summariseComments(key, title, comments, verbosity);
    return { text };
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: (e as Error).message });
  }
});

try {
  await app.listen({ port: PORT, host: HOST });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
