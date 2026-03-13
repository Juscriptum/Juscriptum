import * as crypto from "crypto";
import { scrypt, randomBytes, createCipheriv, createDecipheriv } from "crypto";

/**
 * Generate a random salt
 */
export async function generateSalt(length: number = 32): Promise<string> {
  return randomBytes(length).toString("hex");
}

/**
 * Hash password using scrypt
 */
export async function hashPassword(
  password: string,
  salt: string,
  keylen: number = 64,
): Promise<string> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey.toString("hex"));
    });
  });
}

/**
 * Verify password
 */
export async function verifyPassword(
  password: string,
  salt: string,
  hash: string,
): Promise<boolean> {
  const computedHash = await hashPassword(password, salt);
  const expectedHash = Buffer.from(hash, "hex");
  const computedHashBuffer = Buffer.from(computedHash, "hex");

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(expectedHash, computedHashBuffer);
}

/**
 * Generate a random token
 */
export function generateToken(length: number = 32): string {
  return randomBytes(length).toString("hex");
}

/**
 * Generate a secure UUID v4
 */
export function generateUuid(): string {
  return crypto.randomUUID();
}

/**
 * Generate JWT secret
 */
export function generateJwtSecret(): string {
  return randomBytes(64).toString("hex");
}

/**
 * Encrypt sensitive data (field-level encryption)
 */
export function encrypt(
  text: string,
  key: string,
): { iv: string; data: string } {
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(key, "hex"), iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString("hex"),
    data: encrypted + ":" + authTag.toString("hex"),
  };
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedData: string, key: string): string {
  const [encrypted, authTag] = encryptedData.split(":");
  const iv = Buffer.from(encryptedData.substring(0, 32), "hex");
  const decipher = createDecipheriv("aes-256-gcm", Buffer.from(key, "hex"), iv);

  decipher.setAuthTag(Buffer.from(authTag, "hex"));

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Generate a hash for data integrity
 */
export function generateHash(
  data: string,
  algorithm: string = "sha256",
): string {
  return crypto.createHash(algorithm).update(data).digest("hex");
}

/**
 * Verify data integrity
 */
export function verifyHash(data: string, hash: string): boolean {
  const computedHash = generateHash(data);
  const expectedHash = Buffer.from(hash, "hex");
  const computedHashBuffer = Buffer.from(computedHash, "hex");

  return crypto.timingSafeEqual(expectedHash, computedHashBuffer);
}

/**
 * Generate TOTP secret for MFA
 */
export function generateTotpSecret(): string {
  const buffer = randomBytes(20);
  const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";

  for (let i = 0; i < buffer.length; i += 5) {
    const chunk = buffer.slice(i, i + 5);
    secret += base32Chars[(chunk[0] & 0xf8) >> 3];
    secret += base32Chars[((chunk[0] & 0x07) << 2) | ((chunk[1] & 0xc0) >> 6)];
    secret += base32Chars[(chunk[1] & 0x3e) >> 1];
    secret += base32Chars[((chunk[1] & 0x01) << 4) | ((chunk[2] & 0xf0) >> 4)];
    secret += base32Chars[((chunk[2] & 0x0f) << 1) | ((chunk[3] & 0x80) >> 7)];
    secret += base32Chars[(chunk[3] & 0x7c) >> 2];
    secret += base32Chars[((chunk[3] & 0x03) << 3) | ((chunk[4] & 0xe0) >> 5)];
    secret += base32Chars[chunk[4] & 0x1f];
  }

  return secret;
}

/**
 * Generate backup codes for MFA
 */
export function generateMfaBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = randomBytes(4).toString("hex").toUpperCase();
    codes.push(`${code.substring(0, 4)}-${code.substring(4, 8)}`);
  }
  return codes;
}

/**
 * Generate HMAC signature for webhooks
 */
export function generateHmacSignature(
  payload: string,
  secret: string,
  algorithm: string = "sha256",
): string {
  return crypto.createHmac(algorithm, secret).update(payload).digest("hex");
}

/**
 * Verify HMAC signature
 */
export function verifyHmacSignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: string = "sha256",
): boolean {
  const expectedSignature = generateHmacSignature(payload, secret, algorithm);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );
}

/**
 * Generate a random ID for short-lived tokens
 */
export function generateShortId(length: number = 16): string {
  return randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .substring(0, length);
}

/**
 * Generate a device fingerprint
 */
export function generateDeviceFingerprint(
  userAgent: string,
  ip: string,
): string {
  const data = `${userAgent}-${ip}-${Date.now()}`;
  return generateHash(data);
}
