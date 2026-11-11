import { accessToken } from '../store/auth';

const API_BASE = import.meta.env.VITE_API_URL || '';

export interface KeyStatus {
  hasKey: boolean;
  lastFour?: string | null;
}

function authHeaders(): Record<string, string> {
  const token = accessToken();
  if (!token) throw new Error('You must be logged in.');
  return { Authorization: `Bearer ${token}` };
}

async function handle(res: Response): Promise<KeyStatus> {
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return (await res.json()) as KeyStatus;
}

// Returns { hasKey, lastFour }. The full key is never returned by the backend.
export async function getKeyStatus(): Promise<KeyStatus> {
  const res = await fetch(`${API_BASE}/api/keys`, { headers: authHeaders() });
  return handle(res);
}

export async function saveKey(apiKey: string): Promise<KeyStatus> {
  const res = await fetch(`${API_BASE}/api/keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ apiKey }),
  });
  return handle(res);
}

export async function deleteKey(): Promise<KeyStatus> {
  const res = await fetch(`${API_BASE}/api/keys`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handle(res);
}
