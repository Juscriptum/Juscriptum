import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, RedisClientType } from "redis";
import {
  CacheConfig,
  CacheEntry,
  CacheStats,
  DEFAULT_TTL,
  CACHE_KEYS,
} from "../interfaces/cache.interface";

/**
 * Redis Cache Service
 * High-performance caching layer with tenant isolation
 */
@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private client: RedisClientType | null = null;
  private subscriber: RedisClientType | null = null;
  private publisher: RedisClientType | null = null;
  private readonly config: CacheConfig;
  private stats = { hits: 0, misses: 0 };
  private enabled = false;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      host: this.configService.get("REDIS_HOST", "localhost"),
      port: this.configService.get("REDIS_PORT", 6379),
      password: this.configService.get("REDIS_PASSWORD"),
      db: this.configService.get("REDIS_DB", 0),
      keyPrefix: this.configService.get("REDIS_PREFIX", "law-org:"),
      ttl: DEFAULT_TTL,
    };
  }

  async onModuleInit() {
    const nodeEnv = this.configService.get<string>("NODE_ENV", "development");
    const defaultRedis = nodeEnv === "production" ? "true" : "false";
    const redisEnabled = this.configService.get<string>(
      "REDIS_ENABLED",
      defaultRedis,
    );
    if (redisEnabled === "false" || redisEnabled === "0") {
      this.logger.log("Redis cache disabled. Using no-op cache.");
      return;
    }
    try {
      await Promise.race([
        this.initializeClients(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Redis connection timeout 3s")),
            3000,
          ),
        ),
      ]);
      this.enabled = true;
    } catch (err) {
      this.logger.warn(
        "Redis unavailable; cache disabled. Set REDIS_ENABLED=false to suppress.",
      );
    }
  }

  async onModuleDestroy() {
    await this.closeClients();
  }

  /**
   * Initialize Redis clients
   */
  private async initializeClients(): Promise<void> {
    const clientConfig = {
      socket: {
        host: this.config.host,
        port: this.config.port,
        connectTimeout: 3000,
        reconnectStrategy: (retries: number) => {
          if (retries > 5) {
            return new Error("Redis connection failed");
          }
          return Math.min(retries * 100, 2000);
        },
      },
      password: this.config.password,
      database: this.config.db,
    };

    this.client = createClient(clientConfig) as RedisClientType;
    this.subscriber = createClient(clientConfig) as RedisClientType;
    this.publisher = createClient(clientConfig) as RedisClientType;

    this.client.on("error", (err) =>
      this.logger.error("Redis Client Error:", err),
    );
    this.client.on("connect", () => this.logger.log("Redis Client Connected"));

    await Promise.all([
      this.client.connect(),
      this.subscriber.connect(),
      this.publisher.connect(),
    ]);
  }

  /**
   * Close Redis clients
   */
  private async closeClients(): Promise<void> {
    if (!this.enabled) return;
    await Promise.all([
      this.client?.quit().catch(() => {}),
      this.subscriber?.quit().catch(() => {}),
      this.publisher?.quit().catch(() => {}),
    ]);
    this.client = this.subscriber = this.publisher = null;
    this.enabled = false;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled || !this.client) return null;
    try {
      const fullKey = this.getFullKey(key);
      const data = await this.client.get(fullKey);

      if (!data) {
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      const entry: CacheEntry<T> = JSON.parse(data);

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
   */
  async set<T>(
    key: string,
    value: T,
    ttl: number = this.config.ttl || DEFAULT_TTL,
    tags: string[] = [],
  ): Promise<boolean> {
    if (!this.enabled || !this.client) return false;
    try {
      const fullKey = this.getFullKey(key);
      const entry: CacheEntry<T> = {
        data: value,
        timestamp: Date.now(),
        ttl: ttl * 1000, // Convert to milliseconds
        tags,
      };

      await this.client.setEx(fullKey, ttl, JSON.stringify(entry));

      // Store tag references for invalidation
      if (tags.length > 0) {
        for (const tag of tags) {
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
   */
  async del(key: string): Promise<boolean> {
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
   */
  async delByPattern(pattern: string): Promise<number> {
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
      this.logger.error(
        `Cache delByPattern error for pattern ${pattern}:`,
        error,
      );
      return 0;
    }
  }

  /**
   * Invalidate cache by tag
   */
  async invalidateByTag(tag: string): Promise<number> {
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
   */
  async invalidateTenantCache(tenantId: string): Promise<number> {
    return this.delByPattern(`*:${tenantId}:*`);
  }

  /**
   * Get or set pattern (cache-aside)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = this.config.ttl || DEFAULT_TTL,
    tags: string[] = [],
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttl, tags);

    return value;
  }

  /**
   * Increment counter
   */
  async incr(key: string): Promise<number> {
    if (!this.enabled || !this.client) return 0;
    const fullKey = this.getFullKey(key);
    return this.client.incr(fullKey);
  }

  /**
   * Set with expiration (for rate limiting)
   */
  async setEx(key: string, value: string, ttl: number): Promise<boolean> {
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
   */
  async getTtl(key: string): Promise<number> {
    if (!this.enabled || !this.client) return -1;
    const fullKey = this.getFullKey(key);
    return this.client.ttl(fullKey);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.enabled || !this.client) return false;
    const fullKey = this.getFullKey(key);
    const result = await this.client.exists(fullKey);
    return result === 1;
  }

  /**
   * Publish message to channel
   */
  async publish(channel: string, message: any): Promise<number> {
    if (!this.enabled || !this.publisher) return 0;
    return this.publisher.publish(channel, JSON.stringify(message));
  }

  /**
   * Subscribe to channel
   */
  async subscribe(
    channel: string,
    callback: (message: any) => void,
  ): Promise<void> {
    if (!this.enabled || !this.subscriber) return;
    await this.subscriber.subscribe(channel, (message) => {
      try {
        callback(JSON.parse(message));
      } catch (error) {
        this.logger.error(
          `Subscribe callback error for channel ${channel}:`,
          error,
        );
      }
    });
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    if (!this.enabled || !this.client) {
      return { hits: 0, misses: 0, hitRate: 0, totalKeys: 0, memoryUsage: 0 };
    }
    const info = await this.client.info("memory");
    const memoryMatch = info.match(/used_memory:(\d+)/);
    const memoryUsage = memoryMatch ? parseInt(memoryMatch[1]) : 0;

    const dbSize = await this.client.dbSize();

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate:
        this.stats.hits + this.stats.misses > 0
          ? this.stats.hits / (this.stats.hits + this.stats.misses)
          : 0,
      totalKeys: dbSize,
      memoryUsage,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Flush all cache (use with caution)
   */
  async flushAll(): Promise<void> {
    if (!this.enabled || !this.client) return;
    await this.client.flushDb();
    this.logger.warn("Cache flushed");
  }

  /**
   * Build full key with prefix
   */
  private getFullKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  /**
   * Get tag key for storage
   */
  private getTagKey(tag: string): string {
    return this.getFullKey(`tag:${tag}`);
  }

  /**
   * Get raw Redis client for advanced operations
   */
  getClient(): RedisClientType | null {
    return this.client;
  }
}
