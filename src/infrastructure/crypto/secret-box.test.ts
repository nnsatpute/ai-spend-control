import { randomBytes } from "crypto";
import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret, loadEncryptionKey } from "./secret-box";

const key = randomBytes(32);

describe("secret-box", () => {
  it("round-trips a secret", () => {
    const encrypted = encryptSecret("key_super_secret_value", key);
    expect(encrypted).not.toContain("super_secret");
    expect(decryptSecret(encrypted, key)).toBe("key_super_secret_value");
  });

  it("uses a fresh IV each time", () => {
    expect(encryptSecret("same", key)).not.toBe(encryptSecret("same", key));
  });

  it("fails with the wrong key", () => {
    const encrypted = encryptSecret("secret", key);
    expect(() => decryptSecret(encrypted, randomBytes(32))).toThrow();
  });

  it("fails when the ciphertext is tampered with", () => {
    const [v, iv, tag, data = ""] = encryptSecret("secret", key).split(":");
    const flipped = Buffer.from(data, "base64");
    flipped.writeUInt8(flipped.readUInt8(0) ^ 0xff, 0);
    expect(() => decryptSecret([v, iv, tag, flipped.toString("base64")].join(":"), key)).toThrow();
  });

  it("validates the configured key length", () => {
    expect(() => loadEncryptionKey(undefined)).toThrow();
    expect(() => loadEncryptionKey(randomBytes(16).toString("base64"))).toThrow();
    expect(loadEncryptionKey(key.toString("base64")).length).toBe(32);
  });
});
