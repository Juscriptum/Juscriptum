"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RedisCacheService", {
    enumerable: true,
    get: function() {
        return RedisCacheService;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _redis = require("redis");
const _cacheinterface = require("../interfaces/cache.interface");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let RedisCacheService = class RedisCacheService {
    async onModuleInit() {
        const nodeEnv = this.configService.get("NODE_ENV", "development");
        const defaultRedis = nodeEnv === "production" ? "true" : "false";
        const redisEnabled = this.configService.get("REDIS_ENABLED", defaultRedis);
        if (redisEnabled === "false" || redisEnabled === "0") {
            this.logger.log("Redis cache disabled. Using no-op cache.");
            return;
        }
        try {
            await Promise.race([
                this.initializeClients(),
                new Promise((_, reject)=>setTimeout(()=>reject(new Error("Redis connection timeout 3s")), 3000))
            ]);
            this.enabled = true;
        } catch (err) {
            this.logger.warn("Redis unavailable; cache disabled. Set REDIS_ENABLED=false to suppress.");
        }
    }
    async onModuleDestroy() {
        await this.closeClients();
    }
    /**
   * Initialize Redis clients
   */ async initializeClients() {
        const clientConfig = {
            socket: {
                host: this.config.host,
                port: this.config.port,
                connectTimeout: 3000,
                reconnectStrategy: (retries)=>{
                    if (retries > 5) {
                        return new Error("Redis connection failed");
                    }
                    return Math.min(retries * 100, 2000);
                }
            },
            password: this.config.password,
            database: this.config.db
        };
        this.client = (0, _redis.createClient)(clientConfig);
        this.subscriber = (0, _redis.createClient)(clientConfig);
        this.publisher = (0, _redis.createClient)(clientConfig);
        this.client.on("error", (err)=>this.logger.error("Redis Client Error:", err));
        this.client.on("connect", ()=>this.logger.log("Redis Client Connected"));
        await Promise.all([
            this.client.connect(),
            this.subscriber.connect(),
            this.publisher.connect()
        ]);
    }
    /**
   * Close Redis clients
   */ async closeClients() {
        if (!this.enabled) return;
        await Promise.all([
            this.client?.quit().catch(()=>{}),
            this.subscriber?.quit().catch(()=>{}),
            this.publisher?.quit().catch(()=>{})
        ]);
        this.client = this.subscriber = this.publisher = null;
        this.enabled = false;
    }
    /**
   * Get value from cache
   */ async get(key) {
        if (!this.enabled || !this.client) return null;
        try {
            const fullKey = this.getFullKey(key);
            const data = await this.client.get(fullKey);
            if (!data) {
                this.stats.misses++;
                return null;
            }
            this.stats.hits++;
            const entry = JSON.parse(data);
            // Check if entry has expired (additional check)
            if (entry.timestamp + entry.ttl < Date.now()) {
                await this.client.del(fullKey);
                return null;
            }
            return entry.data;
        } catch (error) {
            this.logger.error(`Cache get error for key ${key}:`, error);
            return null;
        }
    }
    /**
   * Set value in cache
   */ async set(key, value, ttl = this.config.ttl || _cacheinterface.DEFAULT_TTL, tags = []) {
        if (!this.enabled || !this.client) return false;
        try {
            const fullKey = this.getFullKey(key);
            const entry = {
                data: value,
                timestamp: Date.now(),
                ttl: ttl * 1000,
                tags
            };
            await this.client.setEx(fullKey, ttl, JSON.stringify(entry));
            // Store tag references for invalidation
            if (tags.length > 0) {
                for (const tag of tags){
                    await this.client.sAdd(this.getTagKey(tag), fullKey);
                }
            }
            return true;
        } catch (error) {
            this.logger.error(`Cache set error for key ${key}:`, error);
            return false;
        }
    }
    /**
   * Delete key from cache
   */ async del(key) {
        if (!this.enabled || !this.client) return false;
        try {
            const fullKey = this.getFullKey(key);
            await this.client.del(fullKey);
            return true;
        } catch (error) {
            this.logger.error(`Cache del error for key ${key}:`, error);
            return false;
        }
    }
    /**
   * Delete multiple keys by pattern
   */ async delByPattern(pattern) {
        if (!this.enabled || !this.client) return 0;
        try {
            const fullPattern = this.getFullKey(pattern);
            const keys = await this.client.keys(fullPattern);
            if (keys.length === 0) {
                return 0;
            }
            await this.client.del(keys);
            return keys.length;
        } catch (error) {
            this.logger.error(`Cache delByPattern error for pattern ${pattern}:`, error);
            return 0;
        }
    }
    /**
   * Invalidate cache by tag
   */ async invalidateByTag(tag) {
        if (!this.enabled || !this.client) return 0;
        try {
            const tagKey = this.getTagKey(tag);
            const keys = await this.client.sMembers(tagKey);
            if (keys.length === 0) {
                return 0;
            }
            await this.client.del(keys);
            await this.client.del(tagKey);
            return keys.length;
        } catch (error) {
            this.logger.error(`Cache invalidateByTag error for tag ${tag}:`, error);
            return 0;
        }
    }
    /**
   * Invalidate all cache for tenant
   */ async invalidateTenantCache(tenantId) {
        return this.delByPattern(`*:${tenantId}:*`);
    }
    /**
   * Get or set pattern (cache-aside)
   */ async getOrSet(key, factory, ttl = this.config.ttl || _cacheinterface.DEFAULT_TTL, tags = []) {
        const cached = await this.get(key);
        if (cached !== null) {
            return cached;
        }
        const value = await factory();
        await this.set(key, value, ttl, tags);
        return value;
    }
    /**
   * Increment counter
   */ async incr(key) {
        if (!this.enabled || !this.client) return 0;
        const fullKey = this.getFullKey(key);
        return this.client.incr(fullKey);
    }
    /**
   * Set with expiration (for rate limiting)
   */ async setEx(key, value, ttl) {
        if (!this.enabled || !this.client) return false;
        try {
            const fullKey = this.getFullKey(key);
            await this.client.setEx(fullKey, ttl, value);
            return true;
        } catch (error) {
            this.logger.error(`Cache setEx error for key ${key}:`, error);
            return false;
        }
    }
    /**
   * Get TTL for key
   */ async getTtl(key) {
        if (!this.enabled || !this.client) return -1;
        const fullKey = this.getFullKey(key);
        return this.client.ttl(fullKey);
    }
    /**
   * Check if key exists
   */ async exists(key) {
        if (!this.enabled || !this.client) return false;
        const fullKey = this.getFullKey(key);
        const result = await this.client.exists(fullKey);
        return result === 1;
    }
    /**
   * Publish message to channel
   */ async publish(channel, message) {
        if (!this.enabled || !this.publisher) return 0;
        return this.publisher.publish(channel, JSON.stringify(message));
    }
    /**
   * Subscribe to channel
   */ async subscribe(channel, callback) {
        if (!this.enabled || !this.subscriber) return;
        await this.subscriber.subscribe(channel, (message)=>{
            try {
                callback(JSON.parse(message));
            } catch (error) {
                this.logger.error(`Subscribe callback error for channel ${channel}:`, error);
            }
        });
    }
    /**
   * Get cache statistics
   */ async getStats() {
        if (!this.enabled || !this.client) {
            return {
                hits: 0,
                misses: 0,
                hitRate: 0,
                totalKeys: 0,
                memoryUsage: 0
            };
        }
        const info = await this.client.info("memory");
        const memoryMatch = info.match(/used_memory:(\d+)/);
        const memoryUsage = memoryMatch ? parseInt(memoryMatch[1]) : 0;
        const dbSize = await this.client.dbSize();
        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            hitRate: this.stats.hits + this.stats.misses > 0 ? this.stats.hits / (this.stats.hits + this.stats.misses) : 0,
            totalKeys: dbSize,
            memoryUsage
        };
    }
    /**
   * Reset statistics
   */ resetStats() {
        this.stats = {
            hits: 0,
            misses: 0
        };
    }
    /**
   * Flush all cache (use with caution)
   */ async flushAll() {
        if (!this.enabled || !this.client) return;
        await this.client.flushDb();
        this.logger.warn("Cache flushed");
    }
    /**
   * Build full key with prefix
   */ getFullKey(key) {
        return `${this.config.keyPrefix}${key}`;
    }
    /**
   * Get tag key for storage
   */ getTagKey(tag) {
        return this.getFullKey(`tag:${tag}`);
    }
    /**
   * Get raw Redis client for advanced operations
   */ getClient() {
        return this.client;
    }
    constructor(configService){
        this.configService = configService;
        this.logger = new _common.Logger(RedisCacheService.name);
        this.client = null;
        this.subscriber = null;
        this.publisher = null;
        this.stats = {
            hits: 0,
            misses: 0
        };
        this.enabled = false;
        this.config = {
            host: this.configService.get("REDIS_HOST", "localhost"),
            port: this.configService.get("REDIS_PORT", 6379),
            password: this.configService.get("REDIS_PASSWORD"),
            db: this.configService.get("REDIS_DB", 0),
            keyPrefix: this.configService.get("REDIS_PREFIX", "law-org:"),
            ttl: _cacheinterface.DEFAULT_TTL
        };
    }
};
RedisCacheService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], RedisCacheService);

//# sourceMappingURL=redis-cache.service.js.map