export interface KeyStatus {
  hasKey: boolean;
  lastFour?: string | null;
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
  const res = await fetch('/api/keys', { credentials: 'same-origin' });
  return handle(res);
}

export async function saveKey(apiKey: string): Promise<KeyStatus> {
  const res = await fetch('/api/keys', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey }),
  });
  return handle(res);
}

export async function deleteKey(): Promise<KeyStatus> {
  const res = await fetch('/api/keys', { method: 'DELETE', credentials: 'same-origin' });
  return handle(res);
}
