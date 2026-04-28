import { verbosity } from '../store/settings';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function postJson(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function summariseArticle(title, url) {
  return postJson('/api/summarise/article', {
    title,
    url,
    verbosity: verbosity().value,
  });
}

export async function summariseComments(title, comments) {
  if (!comments.length) throw new Error('No comments to summarise.');
  const { text } = await postJson('/api/summarise/comments', {
    title,
    comments: comments.map((c) => ({ author: c.author, text: c.text })),
    verbosity: verbosity().value,
  });
  return text;
}
