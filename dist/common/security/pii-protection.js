"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get computeEmailBlindIndex () {
        return computeEmailBlindIndex;
    },
    get computeIdentifierBlindIndex () {
        return computeIdentifierBlindIndex;
    },
    get computePhoneBlindIndex () {
        return computePhoneBlindIndex;
    },
    get computePlatformAdminEmailBlindIndex () {
        return computePlatformAdminEmailBlindIndex;
    },
    get createBlindIndex () {
        return createBlindIndex;
    },
    get createEncryptedStringTransformer () {
        return createEncryptedStringTransformer;
    },
    get decryptFieldValue () {
        return decryptFieldValue;
    },
    get detectSearchablePiiKind () {
        return detectSearchablePiiKind;
    },
    get encryptFieldValue () {
        return encryptFieldValue;
    },
    get isEncryptedValue () {
        return isEncryptedValue;
    },
    get normalizeEmail () {
        return normalizeEmail;
    },
    get normalizeIdentifier () {
        return normalizeIdentifier;
    },
    get normalizePhone () {
        return normalizePhone;
    },
    get redactPiiData () {
        return redactPiiData;
    }
});
const _crypto = require("crypto");
const ENCRYPTION_PREFIX = "enc:v1";
const DEV_ENCRYPTION_KEY = (0, _crypto.createHash)("sha256").update("law-organizer-dev-only-encryption-key").digest("hex");
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
    /edrpou/i
];
function getEncryptionKey() {
    return process.env.ENCRYPTION_KEY?.trim() || DEV_ENCRYPTION_KEY;
}
function getCipherKey() {
    const key = getEncryptionKey();
    if (!/^[0-9a-fA-F]{64}$/.test(key)) {
        throw new Error("ENCRYPTION_KEY must be a 64-character hex string for field-level encryption");
    }
    return Buffer.from(key, "hex");
}
function isEncryptedValue(value) {
    return typeof value === "string" && value.startsWith(`${ENCRYPTION_PREFIX}:`);
}
function encryptFieldValue(value) {
    const iv = (0, _crypto.randomBytes)(12);
    const cipher = (0, _crypto.createCipheriv)("aes-256-gcm", getCipherKey(), iv);
    const encrypted = Buffer.concat([
        cipher.update(value, "utf8"),
        cipher.final()
    ]);
    const authTag = cipher.getAuthTag();
    return `${ENCRYPTION_PREFIX}:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}
function decryptFieldValue(value) {
    if (!isEncryptedValue(value)) {
        return value;
    }
    const [, version, ivHex, authTagHex, encryptedHex] = value.split(":");
    if (version !== "v1") {
        throw new Error(`Unsupported encrypted payload version: ${version}`);
    }
    const decipher = (0, _crypto.createDecipheriv)("aes-256-gcm", getCipherKey(), Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedHex, "hex")),
        decipher.final()
    ]);
    return decrypted.toString("utf8");
}
function createEncryptedStringTransformer() {
    return {
        to (value) {
            if (value === null || value === undefined || value === "") {
                return value;
            }
            return isEncryptedValue(value) ? value : encryptFieldValue(value);
        },
        from (value) {
            if (value === null || value === undefined || value === "") {
                return value;
            }
            return decryptFieldValue(value);
        }
    };
}
function normalizeEmail(value) {
    return value.trim().toLowerCase();
}
function normalizePhone(value) {
    return value.replace(/\D+/g, "");
}
function normalizeIdentifier(value) {
    return value.replace(/[^0-9a-zA-Z]+/g, "").toUpperCase();
}
function createBlindIndex(value, purpose) {
    return (0, _crypto.createHmac)("sha256", getCipherKey()).update(`${purpose}:${value}`).digest("hex");
}
function computeEmailBlindIndex(value, purpose) {
    if (!value) {
        return null;
    }
    return createBlindIndex(normalizeEmail(value), purpose);
}
function computePlatformAdminEmailBlindIndex(value) {
    if (!value) {
        return null;
    }
    return createBlindIndex(normalizeEmail(value), "platform_admin_email");
}
function computePhoneBlindIndex(value) {
    if (!value) {
        return null;
    }
    const normalized = normalizePhone(value);
    return normalized ? createBlindIndex(normalized, "client_phone") : null;
}
function computeIdentifierBlindIndex(value, purpose) {
    if (!value) {
        return null;
    }
    const normalized = normalizeIdentifier(value);
    return normalized ? createBlindIndex(normalized, purpose) : null;
}
function detectSearchablePiiKind(value) {
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
function redactPiiData(data) {
    if (data === null || data === undefined) {
        return data;
    }
    if (typeof data !== "object") {
        if (isEncryptedValue(data)) {
            return "[ENCRYPTED]";
        }
        return data;
    }
    if (Array.isArray(data)) {
        return data.map((item)=>redactPiiData(item));
    }
    const redacted = {};
    for (const [key, value] of Object.entries(data)){
        const isSensitiveKey = PII_KEY_PATTERNS.some((pattern)=>pattern.test(key));
        if (isSensitiveKey) {
            redacted[key] = "[REDACTED]";
            continue;
        }
        redacted[key] = redactPiiData(value);
    }
    return redacted;
}

//# sourceMappingURL=pii-protection.js.map