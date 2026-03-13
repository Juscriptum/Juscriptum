import { ConfigService } from "@nestjs/config";
import { createClient } from "redis";
import { RedisThrottlerStorage } from "./redis-throttler.storage";

jest.mock("redis", () => ({
  createClient: jest.fn(),
}));

describe("RedisThrottlerStorage", () => {
  const mockConfigService = {
    get: jest.fn(),
  } as unknown as ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("falls back to in-memory throttling when Redis is disabled", async () => {
    (mockConfigService.get as jest.Mock).mockImplementation(
      (key: string, defaultValue?: string) => {
        if (key === "NODE_ENV") {
          return "development";
        }
        if (key === "REDIS_ENABLED") {
          return "false";
        }
        return defaultValue;
      },
    );

    const storage = new RedisThrottlerStorage(mockConfigService);
    await storage.initialize();

    const result = await storage.increment("auth:test", 60000);

    expect(createClient).not.toHaveBeenCalled();
    expect(result.totalHits).toBe(1);
    expect(result.timeToExpire).toBeGreaterThan(0);

    await storage.shutdown();
  });

  it("uses Redis sliding-window storage when Redis is enabled", async () => {
    const mockClient = {
      on: jest.fn(),
      connect: jest.fn().mockResolvedValue(undefined),
      isOpen: true,
      quit: jest.fn().mockResolvedValue(undefined),
      zRemRangeByScore: jest.fn().mockResolvedValue(0),
      zAdd: jest.fn().mockResolvedValue(1),
      pExpire: jest.fn().mockResolvedValue(1),
      zCard: jest.fn().mockResolvedValue(3),
      pTTL: jest.fn().mockResolvedValue(58000),
    };

    (createClient as jest.Mock).mockReturnValue(mockClient);
    (mockConfigService.get as jest.Mock).mockImplementation(
      (key: string, defaultValue?: string | number) => {
        if (key === "NODE_ENV") {
          return "production";
        }
        if (key === "REDIS_ENABLED") {
          return "true";
        }
        if (key === "REDIS_URL") {
          return "redis://localhost:6379";
        }
        return defaultValue;
      },
    );

    const storage = new RedisThrottlerStorage(mockConfigService);
    await storage.initialize();

    const result = await storage.increment("auth:test", 60000);

    expect(createClient).toHaveBeenCalledWith({
      url: "redis://localhost:6379",
    });
    expect(mockClient.zRemRangeByScore).toHaveBeenCalled();
    expect(mockClient.zAdd).toHaveBeenCalled();
    expect(mockClient.pExpire).toHaveBeenCalledWith(
      expect.stringContaining("throttle:auth:test"),
      60000,
    );
    expect(result).toEqual({
      totalHits: 3,
      timeToExpire: 58,
    });

    await storage.shutdown();
  });
});
