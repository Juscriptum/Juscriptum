import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ThrottlerStorage, ThrottlerStorageService } from "@nestjs/throttler";
import { RedisClientType, createClient } from "redis";

type ThrottlerStorageRecord = {
  totalHits: number;
  timeToExpire: number;
};

export class RedisThrottlerStorage implements ThrottlerStorage {
  private readonly logger = new Logger(RedisThrottlerStorage.name);
  private readonly fallbackStorage = new ThrottlerStorageService();
  private client: RedisClientType | null = null;
  private enabled = false;

  constructor(private readonly configService: ConfigService) {}

  async initialize(): Promise<void> {
    const nodeEnv = this.configService.get<string>("NODE_ENV", "development");
    const defaultRedis = nodeEnv === "production" ? "true" : "false";
    const redisEnabled = this.configService.get<string>(
      "REDIS_ENABLED",
      defaultRedis,
    );

    if (redisEnabled === "false" || redisEnabled === "0") {
      this.logger.log(
        "Redis throttler storage disabled. Falling back to in-memory throttling.",
      );
      return;
    }

    try {
      this.client = createClient(this.getRedisConfig()) as RedisClientType;
      this.client.on("error", (error) => {
        this.logger.error("Redis throttler client error", error as Error);
      });
      await this.client.connect();
      this.enabled = true;
      this.logger.log("Redis throttler storage connected");
    } catch (error) {
      this.logger.warn(
        "Redis throttler unavailable; falling back to in-memory throttling.",
      );
      this.enabled = false;
      this.client = null;
    }
  }

  async increment(key: string, ttl: number): Promise<ThrottlerStorageRecord> {
    if (!this.enabled || !this.client) {
      return this.fallbackStorage.increment(key, ttl);
    }

    try {
      const now = Date.now();
      const redisKey = `throttle:${key}`;
      const member = `${now}-${Math.random().toString(36).slice(2, 10)}`;
      const windowStart = now - ttl;

      await this.client.zRemRangeByScore(redisKey, 0, windowStart);
      await this.client.zAdd(redisKey, [{ score: now, value: member }]);
      await this.client.pExpire(redisKey, ttl);

      const totalHits = await this.client.zCard(redisKey);
      const ttlMs = await this.client.pTTL(redisKey);

      return {
        totalHits,
        timeToExpire: Math.max(1, Math.ceil((ttlMs > 0 ? ttlMs : ttl) / 1000)),
      };
    } catch (error) {
      this.logger.warn(
        "Redis throttler increment failed; falling back to in-memory throttling.",
      );
      return this.fallbackStorage.increment(key, ttl);
    }
  }

  async shutdown(): Promise<void> {
    this.fallbackStorage.onApplicationShutdown();

    if (this.client?.isOpen) {
      await this.client.quit();
    }

    this.client = null;
    this.enabled = false;
  }

  private getRedisConfig():
    | { url: string }
    | {
        socket: { host: string; port: number; connectTimeout: number };
        password?: string;
        database: number;
      } {
    const redisUrl = this.configService.get<string>("REDIS_URL");

    if (redisUrl) {
      return { url: redisUrl };
    }

    return {
      socket: {
        host: this.configService.get<string>("REDIS_HOST", "localhost"),
        port: this.configService.get<number>("REDIS_PORT", 6379),
        connectTimeout: 3000,
      },
      password: this.configService.get<string>("REDIS_PASSWORD"),
      database: this.configService.get<number>("REDIS_DB", 0),
    };
  }
}
