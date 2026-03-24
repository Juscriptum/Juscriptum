"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TrustCallbackAuthService", {
    enumerable: true,
    get: function() {
        return TrustCallbackAuthService;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _crypto = require("crypto");
const _redis = require("redis");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let TrustCallbackAuthService = class TrustCallbackAuthService {
    async assertAuthenticCallback(context) {
        const providerSecret = this.getProviderSecret(context.provider);
        if (!providerSecret) {
            this.assertLegacySharedSecret(context.legacySecret);
            return;
        }
        if (!context.signature || !context.timestamp || !context.nonce) {
            throw new _common.UnauthorizedException("Provider callback signature, timestamp, and nonce are required");
        }
        this.assertTimestamp(context.timestamp);
        const payload = `${context.provider}.${context.timestamp}.${context.nonce}.${canonicalizeJson(context.body)}`;
        const expectedSignature = (0, _crypto.createHmac)("sha256", providerSecret).update(payload).digest("hex");
        if (!safeEqualHex(context.signature, expectedSignature)) {
            throw new _common.UnauthorizedException("Invalid trust-provider callback signature");
        }
        await this.assertNonceNotReplayed(context.provider, context.nonce);
    }
    getProviderSecret(provider) {
        const providerKeyMap = {
            acsk: "ACSK_TRUST_CALLBACK_SECRET",
            diia: "DIIA_CALLBACK_SECRET",
            bankid_nbu: "BANKID_NBU_CALLBACK_SECRET",
            manual: undefined
        };
        const configKey = providerKeyMap[provider];
        if (!configKey) {
            return undefined;
        }
        return this.configService.get(configKey) || undefined;
    }
    assertLegacySharedSecret(providedSecret) {
        const expectedSecret = this.configService.get("TRUST_PROVIDER_WEBHOOK_SECRET");
        if (!expectedSecret) {
            return;
        }
        if (!providedSecret || !safeEqualUtf8(providedSecret, expectedSecret)) {
            throw new _common.UnauthorizedException("Invalid trust-provider webhook secret");
        }
    }
    assertTimestamp(timestamp) {
        const parsed = Number(timestamp);
        if (!Number.isFinite(parsed)) {
            throw new _common.BadRequestException("Invalid trust-provider callback timestamp");
        }
        const toleranceSeconds = Number(this.configService.get("TRUST_PROVIDER_CALLBACK_TOLERANCE_SECONDS", "300"));
        const deltaMs = Math.abs(Date.now() - parsed * 1000);
        if (deltaMs > toleranceSeconds * 1000) {
            throw new _common.UnauthorizedException("Stale trust-provider callback timestamp");
        }
    }
    async assertNonceNotReplayed(provider, nonce) {
        const ttlSeconds = Number(this.configService.get("TRUST_PROVIDER_CALLBACK_NONCE_TTL_SECONDS", "600"));
        const cacheKey = `trust-callback:${provider}:${nonce}`;
        const expiresAt = Date.now() + ttlSeconds * 1000;
        const client = await this.getRedisClient();
        if (client) {
            const result = await client.set(cacheKey, "1", {
                NX: true,
                EX: ttlSeconds
            });
            if (result !== "OK") {
                throw new _common.UnauthorizedException("Replayed trust-provider callback");
            }
            return;
        }
        this.cleanupNonceCache();
        const existing = this.nonceCache.get(cacheKey);
        if (existing && existing > Date.now()) {
            throw new _common.UnauthorizedException("Replayed trust-provider callback");
        }
        this.nonceCache.set(cacheKey, expiresAt);
    }
    cleanupNonceCache() {
        const now = Date.now();
        for (const [key, expiresAt] of this.nonceCache.entries()){
            if (expiresAt <= now) {
                this.nonceCache.delete(key);
            }
        }
    }
    async getRedisClient() {
        if (this.redisReady && this.redisClient?.isOpen) {
            return this.redisClient;
        }
        const redisEnabled = this.configService.get("REDIS_ENABLED", "false");
        if (redisEnabled === "false" || redisEnabled === "0") {
            return null;
        }
        try {
            if (!this.redisClient) {
                const redisUrl = this.configService.get("REDIS_URL");
                this.redisClient = redisUrl ? (0, _redis.createClient)({
                    url: redisUrl
                }) : (0, _redis.createClient)({
                    socket: {
                        host: this.configService.get("REDIS_HOST", "localhost"),
                        port: this.configService.get("REDIS_PORT", 6379),
                        connectTimeout: 3000
                    },
                    password: this.configService.get("REDIS_PASSWORD"),
                    database: this.configService.get("REDIS_DB", 0)
                });
                this.redisClient.on("error", (error)=>{
                    this.logger.warn(`Trust callback replay guard Redis error: ${String(error)}`);
                });
            }
            if (!this.redisClient.isOpen) {
                await this.redisClient.connect();
            }
            this.redisReady = true;
            return this.redisClient;
        } catch (error) {
            this.logger.warn(`Trust callback replay guard falling back to in-memory nonce storage: ${String(error)}`);
            this.redisReady = false;
            this.redisClient = null;
            return null;
        }
    }
    constructor(configService){
        this.configService = configService;
        this.logger = new _common.Logger(TrustCallbackAuthService.name);
        this.nonceCache = new Map();
        this.redisClient = null;
        this.redisReady = false;
    }
};
TrustCallbackAuthService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], TrustCallbackAuthService);
function canonicalizeJson(value) {
    if (value === null || value === undefined) {
        return "null";
    }
    if (Array.isArray(value)) {
        return `[${value.map((item)=>canonicalizeJson(item)).join(",")}]`;
    }
    if (typeof value === "object") {
        const entries = Object.entries(value).sort(([left], [right])=>left.localeCompare(right));
        return `{${entries.map(([key, item])=>`${JSON.stringify(key)}:${canonicalizeJson(item)}`).join(",")}}`;
    }
    return JSON.stringify(value);
}
function safeEqualHex(left, right) {
    return safeEqualUtf8(left.toLowerCase(), right.toLowerCase());
}
function safeEqualUtf8(left, right) {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    if (leftBuffer.length !== rightBuffer.length) {
        return false;
    }
    return (0, _crypto.timingSafeEqual)(leftBuffer, rightBuffer);
}

//# sourceMappingURL=trust-callback-auth.service.js.map