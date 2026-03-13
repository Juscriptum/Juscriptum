import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, timingSafeEqual } from "crypto";
import { RedisClientType, createClient } from "redis";
import { TrustProviderType } from "../../database/entities/UserIdentity.entity";

type CallbackAuthContext = {
  provider: TrustProviderType;
  body: Record<string, any>;
  legacySecret?: string;
  signature?: string;
  timestamp?: string;
  nonce?: string;
};

@Injectable()
export class TrustCallbackAuthService {
  private readonly logger = new Logger(TrustCallbackAuthService.name);
  private readonly nonceCache = new Map<string, number>();
  private redisClient: RedisClientType | null = null;
  private redisReady = false;

  constructor(private readonly configService: ConfigService) {}

  async assertAuthenticCallback(context: CallbackAuthContext): Promise<void> {
    const providerSecret = this.getProviderSecret(context.provider);

    if (!providerSecret) {
      this.assertLegacySharedSecret(context.legacySecret);
      return;
    }

    if (!context.signature || !context.timestamp || !context.nonce) {
      throw new UnauthorizedException(
        "Provider callback signature, timestamp, and nonce are required",
      );
    }

    this.assertTimestamp(context.timestamp);

    const payload = `${context.provider}.${context.timestamp}.${context.nonce}.${canonicalizeJson(
      context.body,
    )}`;
    const expectedSignature = createHmac("sha256", providerSecret)
      .update(payload)
      .digest("hex");

    if (!safeEqualHex(context.signature, expectedSignature)) {
      throw new UnauthorizedException(
        "Invalid trust-provider callback signature",
      );
    }

    await this.assertNonceNotReplayed(context.provider, context.nonce);
  }

  private getProviderSecret(provider: TrustProviderType): string | undefined {
    const providerKeyMap: Record<TrustProviderType, string | undefined> = {
      acsk: "ACSK_TRUST_CALLBACK_SECRET",
      diia: "DIIA_CALLBACK_SECRET",
      bankid_nbu: "BANKID_NBU_CALLBACK_SECRET",
      manual: undefined,
    };

    const configKey = providerKeyMap[provider];
    if (!configKey) {
      return undefined;
    }

    return this.configService.get<string>(configKey) || undefined;
  }

  private assertLegacySharedSecret(providedSecret?: string): void {
    const expectedSecret = this.configService.get<string>(
      "TRUST_PROVIDER_WEBHOOK_SECRET",
    );

    if (!expectedSecret) {
      return;
    }

    if (!providedSecret || !safeEqualUtf8(providedSecret, expectedSecret)) {
      throw new UnauthorizedException("Invalid trust-provider webhook secret");
    }
  }

  private assertTimestamp(timestamp: string): void {
    const parsed = Number(timestamp);
    if (!Number.isFinite(parsed)) {
      throw new BadRequestException(
        "Invalid trust-provider callback timestamp",
      );
    }

    const toleranceSeconds = Number(
      this.configService.get<string>(
        "TRUST_PROVIDER_CALLBACK_TOLERANCE_SECONDS",
        "300",
      ),
    );
    const deltaMs = Math.abs(Date.now() - parsed * 1000);
    if (deltaMs > toleranceSeconds * 1000) {
      throw new UnauthorizedException(
        "Stale trust-provider callback timestamp",
      );
    }
  }

  private async assertNonceNotReplayed(
    provider: TrustProviderType,
    nonce: string,
  ): Promise<void> {
    const ttlSeconds = Number(
      this.configService.get<string>(
        "TRUST_PROVIDER_CALLBACK_NONCE_TTL_SECONDS",
        "600",
      ),
    );
    const cacheKey = `trust-callback:${provider}:${nonce}`;
    const expiresAt = Date.now() + ttlSeconds * 1000;

    const client = await this.getRedisClient();
    if (client) {
      const result = await client.set(cacheKey, "1", {
        NX: true,
        EX: ttlSeconds,
      });
      if (result !== "OK") {
        throw new UnauthorizedException("Replayed trust-provider callback");
      }
      return;
    }

    this.cleanupNonceCache();
    const existing = this.nonceCache.get(cacheKey);
    if (existing && existing > Date.now()) {
      throw new UnauthorizedException("Replayed trust-provider callback");
    }

    this.nonceCache.set(cacheKey, expiresAt);
  }

  private cleanupNonceCache(): void {
    const now = Date.now();
    for (const [key, expiresAt] of this.nonceCache.entries()) {
      if (expiresAt <= now) {
        this.nonceCache.delete(key);
      }
    }
  }

  private async getRedisClient(): Promise<RedisClientType | null> {
    if (this.redisReady && this.redisClient?.isOpen) {
      return this.redisClient;
    }

    const redisEnabled = this.configService.get<string>(
      "REDIS_ENABLED",
      "false",
    );
    if (redisEnabled === "false" || redisEnabled === "0") {
      return null;
    }

    try {
      if (!this.redisClient) {
        const redisUrl = this.configService.get<string>("REDIS_URL");
        this.redisClient = redisUrl
          ? (createClient({ url: redisUrl }) as RedisClientType)
          : (createClient({
              socket: {
                host: this.configService.get<string>("REDIS_HOST", "localhost"),
                port: this.configService.get<number>("REDIS_PORT", 6379),
                connectTimeout: 3000,
              },
              password: this.configService.get<string>("REDIS_PASSWORD"),
              database: this.configService.get<number>("REDIS_DB", 0),
            }) as RedisClientType);
        this.redisClient.on("error", (error) => {
          this.logger.warn(
            `Trust callback replay guard Redis error: ${String(error)}`,
          );
        });
      }

      if (!this.redisClient.isOpen) {
        await this.redisClient.connect();
      }
      this.redisReady = true;
      return this.redisClient;
    } catch (error) {
      this.logger.warn(
        `Trust callback replay guard falling back to in-memory nonce storage: ${String(
          error,
        )}`,
      );
      this.redisReady = false;
      this.redisClient = null;
      return null;
    }
  }
}

function canonicalizeJson(value: unknown): string {
  if (value === null || value === undefined) {
    return "null";
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalizeJson(item)).join(",")}]`;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([left], [right]) => left.localeCompare(right),
    );
    return `{${entries
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalizeJson(item)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function safeEqualHex(left: string, right: string): boolean {
  return safeEqualUtf8(left.toLowerCase(), right.toLowerCase());
}

function safeEqualUtf8(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}
