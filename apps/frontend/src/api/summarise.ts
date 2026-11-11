import { track } from '@vercel/analytics';
import { verbosity } from '../store/settings';
import type { Comment } from './comments';
import { accessToken } from '../store/auth';

const API_BASE = import.meta.env.VITE_API_URL || '';

export interface ArticleSummary {
  text: string;
  titleOnly: boolean;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const token = accessToken();
  if (!token) throw new Error('Log in and add your OpenAI key in settings to summarise.');

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function summariseArticle(
  title: string,
  url?: string | null,
): Promise<ArticleSummary> {
  track('summarise', { kind: 'article', verbosity: verbosity().value });
  return postJson<ArticleSummary>('/api/summarise/article', {
    title,
    url,
    verbosity: verbosity().value,
  });
}

export async function summariseComments(title: string, comments: Comment[]): Promise<string> {
  if (!comments.length) throw new Error('No comments to summarise.');
  track('summarise', { kind: 'comments', verbosity: verbosity().value });
  const { text } = await postJson<{ text: string }>('/api/summarise/comments', {
    title,
    comments: comments.map((c) => ({ author: c.author, text: c.text })),
    verbosity: verbosity().value,
  });
  return text;
}
