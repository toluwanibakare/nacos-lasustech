import crypto from 'node:crypto';

/**
 * Encrypts small private values (an anonymous sender's reply email) before they are stored.
 * AES-256-GCM, so a changed value fails to decrypt. The key comes from FEEDBACK_ENCRYPTION_KEY
 * (set it on the host and keep it safe); without it, a key is derived from JWT_SECRET so the
 * feature still works. Whoever reads the database only ever sees ciphertext.
 */
const PREFIX = 'enc:v1:';

const key = () => {
  const secret = process.env.FEEDBACK_ENCRYPTION_KEY || process.env.JWT_SECRET || 'nacos_secret_2025';
  return Buffer.from(crypto.hkdfSync('sha256', secret, 'nacos-lasustech', 'feedback-reply-email', 32));
};

export const encryptText = (plain) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const data = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  return PREFIX + Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64url');
};

/** Returns the original text, or null when the value is missing, not ours, or has been altered. */
export const decryptText = (value) => {
  try {
    if (typeof value !== 'string' || !value.startsWith(PREFIX)) return null;
    const raw = Buffer.from(value.slice(PREFIX.length), 'base64url');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key(), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
};
