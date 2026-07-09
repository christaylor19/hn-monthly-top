import { track } from '@vercel/analytics';
import { verbosity } from '../store/settings';
import { accessToken } from '../store/auth';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function postJson(path, body) {
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
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function summariseArticle(title, url) {
  track('summarise', { kind: 'article', verbosity: verbosity().value });
  return postJson('/api/summarise/article', {
    title,
    url,
    verbosity: verbosity().value,
  });
}

export async function summariseComments(title, comments) {
  if (!comments.length) throw new Error('No comments to summarise.');
  track('summarise', { kind: 'comments', verbosity: verbosity().value });
  const { text } = await postJson('/api/summarise/comments', {
    title,
    comments: comments.map((c) => ({ author: c.author, text: c.text })),
    verbosity: verbosity().value,
  });
  return text;
}
