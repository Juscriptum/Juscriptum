"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RedisThrottlerStorage", {
    enumerable: true,
    get: function() {
        return RedisThrottlerStorage;
    }
});
const _common = require("@nestjs/common");
const _throttler = require("@nestjs/throttler");
const _redis = require("redis");
let RedisThrottlerStorage = class RedisThrottlerStorage {
    async initialize() {
        const nodeEnv = this.configService.get("NODE_ENV", "development");
        const defaultRedis = nodeEnv === "production" ? "true" : "false";
        const redisEnabled = this.configService.get("REDIS_ENABLED", defaultRedis);
        if (redisEnabled === "false" || redisEnabled === "0") {
            this.logger.log("Redis throttler storage disabled. Falling back to in-memory throttling.");
            return;
        }
        try {
            this.client = (0, _redis.createClient)(this.getRedisConfig());
            this.client.on("error", (error)=>{
                this.logger.error("Redis throttler client error", error);
            });
            await this.client.connect();
            this.enabled = true;
            this.logger.log("Redis throttler storage connected");
        } catch (error) {
            this.logger.warn("Redis throttler unavailable; falling back to in-memory throttling.");
            this.enabled = false;
            this.client = null;
        }
    }
    async increment(key, ttl) {
        if (!this.enabled || !this.client) {
            return this.fallbackStorage.increment(key, ttl);
        }
        try {
            const now = Date.now();
            const redisKey = `throttle:${key}`;
            const member = `${now}-${Math.random().toString(36).slice(2, 10)}`;
            const windowStart = now - ttl;
            await this.client.zRemRangeByScore(redisKey, 0, windowStart);
            await this.client.zAdd(redisKey, [
                {
                    score: now,
                    value: member
                }
            ]);
            await this.client.pExpire(redisKey, ttl);
            const totalHits = await this.client.zCard(redisKey);
            const ttlMs = await this.client.pTTL(redisKey);
            return {
                totalHits,
                timeToExpire: Math.max(1, Math.ceil((ttlMs > 0 ? ttlMs : ttl) / 1000))
            };
        } catch (error) {
            this.logger.warn("Redis throttler increment failed; falling back to in-memory throttling.");
            return this.fallbackStorage.increment(key, ttl);
        }
    }
    async shutdown() {
        this.fallbackStorage.onApplicationShutdown();
        if (this.client?.isOpen) {
            await this.client.quit();
        }
        this.client = null;
        this.enabled = false;
    }
    getRedisConfig() {
        const redisUrl = this.configService.get("REDIS_URL");
        if (redisUrl) {
            return {
                url: redisUrl
            };
        }
        return {
            socket: {
                host: this.configService.get("REDIS_HOST", "localhost"),
                port: this.configService.get("REDIS_PORT", 6379),
                connectTimeout: 3000
            },
            password: this.configService.get("REDIS_PASSWORD"),
            database: this.configService.get("REDIS_DB", 0)
        };
    }
    constructor(configService){
        this.configService = configService;
        this.logger = new _common.Logger(RedisThrottlerStorage.name);
        this.fallbackStorage = new _throttler.ThrottlerStorageService();
        this.client = null;
        this.enabled = false;
    }
};

//# sourceMappingURL=redis-throttler.storage.js.map