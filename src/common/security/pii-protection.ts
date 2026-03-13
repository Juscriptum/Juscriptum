import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
} from "crypto";
import { ValueTransformer } from "typeorm";

const ENCRYPTION_PREFIX = "enc:v1";
const DEV_ENCRYPTION_KEY = createHash("sha256")
  .update("law-organizer-dev-only-encryption-key")
  .digest("hex");

const PII_KEY_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /authorization/i,
  /api[_-]?key/i,
  /first[_-]?name/i,
  /last[_-]?name/i,
  /patronymic/i,
  /email/i,
  /phone/i,
  /tax[_-]?number/i,
  /passport/i,
  /address/i,
  /postal[_-]?code/i,
  /inn/i,
  /mfa/i,
  /bar[_-]?number/i,
  /edrpou/i,
];

function getEncryptionKey(): string {
  return process.env.ENCRYPTION_KEY?.trim() || DEV_ENCRYPTION_KEY;
}

function getCipherKey(): Buffer {
  const key = getEncryptionKey();

  if (!/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error(
      "ENCRYPTION_KEY must be a 64-character hex string for field-level encryption",
    );
  }

  return Buffer.from(key, "hex");
}

export function isEncryptedValue(value: unknown): value is string {
  return typeof value === "string" && value.startsWith(`${ENCRYPTION_PREFIX}:`);
}

export function encryptFieldValue(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getCipherKey(), iv);

  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${ENCRYPTION_PREFIX}:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptFieldValue(value: string): string {
  if (!isEncryptedValue(value)) {
    return value;
  }

  const [, version, ivHex, authTagHex, encryptedHex] = value.split(":");
  if (version !== "v1") {
    throw new Error(`Unsupported encrypted payload version: ${version}`);
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getCipherKey(),
    Buffer.from(ivHex, "hex"),
  );
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

export function createEncryptedStringTransformer(): ValueTransformer {
  return {
    to(value: string | null | undefined): string | null | undefined {
      if (value === null || value === undefined || value === "") {
        return value;
      }

      return isEncryptedValue(value) ? value : encryptFieldValue(value);
    },
    from(value: string | null | undefined): string | null | undefined {
      if (value === null || value === undefined || value === "") {
        return value;
      }

      return decryptFieldValue(value);
    },
  };
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizePhone(value: string): string {
  return value.replace(/\D+/g, "");
}

export function normalizeIdentifier(value: string): string {
  return value.replace(/[^0-9a-zA-Z]+/g, "").toUpperCase();
}

export function createBlindIndex(
  value: string,
  purpose:
    | "user_email"
    | "organization_email"
    | "client_email"
    | "client_phone"
    | "client_edrpou"
    | "client_inn",
): string {
  return createHmac("sha256", getCipherKey())
    .update(`${purpose}:${value}`)
    .digest("hex");
}

export function computeEmailBlindIndex(
  value: string | null | undefined,
  purpose: "user_email" | "organization_email" | "client_email",
): string | null {
  if (!value) {
    return null;
  }

  return createBlindIndex(normalizeEmail(value), purpose);
}

export function computePhoneBlindIndex(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  const normalized = normalizePhone(value);
  return normalized ? createBlindIndex(normalized, "client_phone") : null;
}

export function computeIdentifierBlindIndex(
  value: string | null | undefined,
  purpose: "client_edrpou" | "client_inn",
): string | null {
  if (!value) {
    return null;
  }

  const normalized = normalizeIdentifier(value);
  return normalized ? createBlindIndex(normalized, purpose) : null;
}

export function detectSearchablePiiKind(
  value: string,
): "email" | "phone" | "identifier" | null {
  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return "email";
  }

  const phoneDigits = normalizePhone(normalized);
  if (phoneDigits.length >= 10) {
    return "phone";
  }

  const identifier = normalizeIdentifier(normalized);
  if (identifier.length >= 8) {
    return "identifier";
  }

  return null;
}

export function redactPiiData<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data !== "object") {
    if (isEncryptedValue(data)) {
      return "[ENCRYPTED]" as T;
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactPiiData(item)) as T;
  }

  const redacted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const isSensitiveKey = PII_KEY_PATTERNS.some((pattern) =>
      pattern.test(key),
    );

    if (isSensitiveKey) {
      redacted[key] = "[REDACTED]";
      continue;
    }

    redacted[key] = redactPiiData(value);
  }

  return redacted as T;
}
