import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * AES-256-GCM encryption for provider admin keys at rest.
 * Format: "v1:<iv b64>:<auth tag b64>:<ciphertext b64>".
 * The key comes only from ENCRYPTION_KEY (base64, 32 bytes) — never the DB or repo.
 */

const VERSION = "v1";
const IV_BYTES = 12;

export function loadEncryptionKey(raw: string | undefined = process.env.ENCRYPTION_KEY): Buffer {
  if (!raw) {
    throw new Error("ENCRYPTION_KEY is not set");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be base64 for exactly 32 bytes");
  }
  return key;
}

export function encryptSecret(plaintext: string, key: Buffer = loadEncryptionKey()): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64"), tag.toString("base64"), ciphertext.toString("base64")].join(":");
}

export function decryptSecret(payload: string, key: Buffer = loadEncryptionKey()): string {
  const [version, ivB64, tagB64, dataB64] = payload.split(":");
  if (version !== VERSION || !ivB64 || !tagB64 || dataB64 === undefined) {
    throw new Error("Unrecognized encrypted secret format");
  }
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
