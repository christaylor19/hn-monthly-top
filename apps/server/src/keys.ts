import { eq } from 'drizzle-orm';
import { db } from './db/index.js';
import { userApiKeys } from './db/schema.js';
import { encrypt, decrypt } from './crypto.js';

export async function setUserKey(
  userId: string,
  plaintextKey: string,
): Promise<{ lastFour: string }> {
  const trimmed = plaintextKey.trim();
  if (!trimmed.startsWith('sk-')) {
    throw new Error('That does not look like an OpenAI key (expected to start with "sk-").');
  }
  const { ciphertext, iv } = encrypt(trimmed);
  const lastFour = trimmed.slice(-4);
  const updatedAt = new Date();

  await db
    .insert(userApiKeys)
    .values({ userId, ciphertext, iv, lastFour, updatedAt })
    .onConflictDoUpdate({
      target: userApiKeys.userId,
      set: { ciphertext, iv, lastFour, updatedAt },
    });

  return { lastFour };
}

// Returns the decrypted plaintext key for server-side use only. Never returned
// to the client.
export async function getUserKey(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ ciphertext: userApiKeys.ciphertext, iv: userApiKeys.iv })
    .from(userApiKeys)
    .where(eq(userApiKeys.userId, userId))
    .limit(1);
  if (!row) return null;
  return decrypt(row);
}

// Returns only the masked last-four for display. Safe to send to the client.
export async function getUserKeyMeta(userId: string): Promise<{ lastFour: string } | null> {
  const [row] = await db
    .select({ lastFour: userApiKeys.lastFour })
    .from(userApiKeys)
    .where(eq(userApiKeys.userId, userId))
    .limit(1);
  return row ?? null;
}

export async function deleteUserKey(userId: string): Promise<void> {
  await db.delete(userApiKeys).where(eq(userApiKeys.userId, userId));
}
