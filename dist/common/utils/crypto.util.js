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
    get decrypt () {
        return decrypt;
    },
    get encrypt () {
        return encrypt;
    },
    get generateDeviceFingerprint () {
        return generateDeviceFingerprint;
    },
    get generateHash () {
        return generateHash;
    },
    get generateHmacSignature () {
        return generateHmacSignature;
    },
    get generateJwtSecret () {
        return generateJwtSecret;
    },
    get generateMfaBackupCodes () {
        return generateMfaBackupCodes;
    },
    get generateSalt () {
        return generateSalt;
    },
    get generateShortId () {
        return generateShortId;
    },
    get generateToken () {
        return generateToken;
    },
    get generateTotpSecret () {
        return generateTotpSecret;
    },
    get generateUuid () {
        return generateUuid;
    },
    get hashPassword () {
        return hashPassword;
    },
    get verifyHash () {
        return verifyHash;
    },
    get verifyHmacSignature () {
        return verifyHmacSignature;
    },
    get verifyPassword () {
        return verifyPassword;
    }
});
const _crypto = /*#__PURE__*/ _interop_require_wildcard(require("crypto"));
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
async function generateSalt(length = 32) {
    return (0, _crypto.randomBytes)(length).toString("hex");
}
async function hashPassword(password, salt, keylen = 64) {
    return new Promise((resolve, reject)=>{
        (0, _crypto.scrypt)(password, salt, keylen, (err, derivedKey)=>{
            if (err) reject(err);
            else resolve(derivedKey.toString("hex"));
        });
    });
}
async function verifyPassword(password, salt, hash) {
    const computedHash = await hashPassword(password, salt);
    const expectedHash = Buffer.from(hash, "hex");
    const computedHashBuffer = Buffer.from(computedHash, "hex");
    // Constant-time comparison to prevent timing attacks
    return _crypto.timingSafeEqual(expectedHash, computedHashBuffer);
}
function generateToken(length = 32) {
    return (0, _crypto.randomBytes)(length).toString("hex");
}
function generateUuid() {
    return _crypto.randomUUID();
}
function generateJwtSecret() {
    return (0, _crypto.randomBytes)(64).toString("hex");
}
function encrypt(text, key) {
    const iv = (0, _crypto.randomBytes)(16);
    const cipher = (0, _crypto.createCipheriv)("aes-256-gcm", Buffer.from(key, "hex"), iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag();
    return {
        iv: iv.toString("hex"),
        data: encrypted + ":" + authTag.toString("hex")
    };
}
function decrypt(encryptedData, key) {
    const [encrypted, authTag] = encryptedData.split(":");
    const iv = Buffer.from(encryptedData.substring(0, 32), "hex");
    const decipher = (0, _crypto.createDecipheriv)("aes-256-gcm", Buffer.from(key, "hex"), iv);
    decipher.setAuthTag(Buffer.from(authTag, "hex"));
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}
function generateHash(data, algorithm = "sha256") {
    return _crypto.createHash(algorithm).update(data).digest("hex");
}
function verifyHash(data, hash) {
    const computedHash = generateHash(data);
    const expectedHash = Buffer.from(hash, "hex");
    const computedHashBuffer = Buffer.from(computedHash, "hex");
    return _crypto.timingSafeEqual(expectedHash, computedHashBuffer);
}
function generateTotpSecret() {
    const buffer = (0, _crypto.randomBytes)(20);
    const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let secret = "";
    for(let i = 0; i < buffer.length; i += 5){
        const chunk = buffer.slice(i, i + 5);
        secret += base32Chars[(chunk[0] & 0xf8) >> 3];
        secret += base32Chars[(chunk[0] & 0x07) << 2 | (chunk[1] & 0xc0) >> 6];
        secret += base32Chars[(chunk[1] & 0x3e) >> 1];
        secret += base32Chars[(chunk[1] & 0x01) << 4 | (chunk[2] & 0xf0) >> 4];
        secret += base32Chars[(chunk[2] & 0x0f) << 1 | (chunk[3] & 0x80) >> 7];
        secret += base32Chars[(chunk[3] & 0x7c) >> 2];
        secret += base32Chars[(chunk[3] & 0x03) << 3 | (chunk[4] & 0xe0) >> 5];
        secret += base32Chars[chunk[4] & 0x1f];
    }
    return secret;
}
function generateMfaBackupCodes(count = 10) {
    const codes = [];
    for(let i = 0; i < count; i++){
        const code = (0, _crypto.randomBytes)(4).toString("hex").toUpperCase();
        codes.push(`${code.substring(0, 4)}-${code.substring(4, 8)}`);
    }
    return codes;
}
function generateHmacSignature(payload, secret, algorithm = "sha256") {
    return _crypto.createHmac(algorithm, secret).update(payload).digest("hex");
}
function verifyHmacSignature(payload, signature, secret, algorithm = "sha256") {
    const expectedSignature = generateHmacSignature(payload, secret, algorithm);
    return _crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}
function generateShortId(length = 16) {
    return (0, _crypto.randomBytes)(Math.ceil(length / 2)).toString("hex").substring(0, length);
}
function generateDeviceFingerprint(userAgent, ip) {
    const data = `${userAgent}-${ip}-${Date.now()}`;
    return generateHash(data);
}

//# sourceMappingURL=crypto.util.js.map