import { accessToken } from '../store/auth';

const API_BASE = import.meta.env.VITE_API_URL || '';

function authHeaders() {
  const token = accessToken();
  if (!token) throw new Error('You must be logged in.');
  return { Authorization: `Bearer ${token}` };
}

async function handle(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// Returns { hasKey, lastFour }. The full key is never returned by the backend.
export async function getKeyStatus() {
  const res = await fetch(`${API_BASE}/api/keys`, { headers: authHeaders() });
  return handle(res);
}

export async function saveKey(apiKey) {
  const res = await fetch(`${API_BASE}/api/keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ apiKey }),
  });
  return handle(res);
}

export async function deleteKey() {
  const res = await fetch(`${API_BASE}/api/keys`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handle(res);
}
