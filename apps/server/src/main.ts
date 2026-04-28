import Fastify from 'fastify';
import cors from '@fastify/cors';
import { summariseArticle, summariseComments } from './summarise.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.CORS_ORIGIN?.split(',') ?? true,
});

app.get('/health', async () => ({ ok: true }));

app.post<{ Body: { title: string; url?: string; verbosity?: string } }>(
  '/api/summarise/article',
  async (req, reply) => {
    const { title, url, verbosity } = req.body ?? {};
    if (!title) return reply.status(400).send({ error: 'title is required' });

    try {
      const result = await summariseArticle(title, url, verbosity);
      return result;
    } catch (e) {
      req.log.error(e);
      return reply.status(500).send({ error: (e as Error).message });
    }
  }
);

app.post<{
  Body: { title: string; comments: { author: string; text: string }[]; verbosity?: string };
}>('/api/summarise/comments', async (req, reply) => {
  const { title, comments, verbosity } = req.body ?? {};
  if (!title || !Array.isArray(comments)) {
    return reply.status(400).send({ error: 'title and comments are required' });
  }

  try {
    const text = await summariseComments(title, comments, verbosity);
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
