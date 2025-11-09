/**
 * Encryption utilities for sensitive data
 * Uses AES-256-GCM for encrypting user API keys
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

/**
 * Get or generate encryption key
 * For development, uses a default key. For production, use env variable.
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    // Development fallback - DO NOT use in production
    console.warn("⚠️  Using development encryption key. Set ENCRYPTION_KEY in production!");
    return crypto.scryptSync("dev-secret-key-change-in-prod", "salt", 32);
  }

  return Buffer.from(key, "hex");
}

/**
 * Encrypt sensitive text (like API keys)
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format: iv:authTag:encrypted
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Return format: iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt encrypted text
 * @param encrypted - Encrypted string in format: iv:authTag:encrypted
 * @returns Decrypted plain text
 */
export function decrypt(encrypted: string): string {
  const parts = encrypted.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted data format");
  }

  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encryptedText = parts[2];

  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Validate API key format (Anthropic keys)
 * @param apiKey - API key to validate
 * @returns true if format is valid
 */
export function isValidAnthropicKeyFormat(apiKey: string): boolean {
  // Anthropic keys start with sk-ant-api03-
  return /^sk-ant-api03-[A-Za-z0-9_-]{95,}$/.test(apiKey);
}
