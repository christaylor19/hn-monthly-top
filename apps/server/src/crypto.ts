import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';

// AES-256-GCM. The encryption key is held only on the server (Railway env
// ENCRYPTION_KEY), so ciphertext at rest is useless without it — even a full
// database dump does not expose any user's OpenAI key.
//
// ENCRYPTION_KEY must be 32 bytes, base64-encoded. Generate with:
//   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

const ALGO = 'aes-256-gcm';

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error('ENCRYPTION_KEY is not configured on the server.');
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (base64-encoded).');
  }
  return key;
}

export interface Encrypted {
  ciphertext: string; // base64
  iv: string; // base64
}

export function encrypt(plaintext: string): Encrypted {
  const key = getKey();
  const iv = randomBytes(12); // 96-bit nonce, recommended for GCM
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Store ciphertext || authTag together; split on decrypt.
  return {
    ciphertext: Buffer.concat([enc, tag]).toString('base64'),
    iv: iv.toString('base64'),
  };
}

export function decrypt({ ciphertext, iv }: Encrypted): string {
  const key = getKey();
  const data = Buffer.from(ciphertext, 'base64');
  const tag = data.subarray(data.length - 16); // last 16 bytes = GCM auth tag
  const enc = data.subarray(0, data.length - 16);
  const decipher = createDecipheriv(ALGO, key, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}
