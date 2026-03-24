"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _redis = require("redis");
const _redisthrottlerstorage = require("./redis-throttler.storage");
jest.mock("redis", ()=>({
        createClient: jest.fn()
    }));
describe("RedisThrottlerStorage", ()=>{
    const mockConfigService = {
        get: jest.fn()
    };
    beforeEach(()=>{
        jest.clearAllMocks();
    });
    it("falls back to in-memory throttling when Redis is disabled", async ()=>{
        mockConfigService.get.mockImplementation((key, defaultValue)=>{
            if (key === "NODE_ENV") {
                return "development";
            }
            if (key === "REDIS_ENABLED") {
                return "false";
            }
            return defaultValue;
        });
        const storage = new _redisthrottlerstorage.RedisThrottlerStorage(mockConfigService);
        await storage.initialize();
        const result = await storage.increment("auth:test", 60000);
        expect(_redis.createClient).not.toHaveBeenCalled();
        expect(result.totalHits).toBe(1);
        expect(result.timeToExpire).toBeGreaterThan(0);
        await storage.shutdown();
    });
    it("uses Redis sliding-window storage when Redis is enabled", async ()=>{
        const mockClient = {
            on: jest.fn(),
            connect: jest.fn().mockResolvedValue(undefined),
            isOpen: true,
            quit: jest.fn().mockResolvedValue(undefined),
            zRemRangeByScore: jest.fn().mockResolvedValue(0),
            zAdd: jest.fn().mockResolvedValue(1),
            pExpire: jest.fn().mockResolvedValue(1),
            zCard: jest.fn().mockResolvedValue(3),
            pTTL: jest.fn().mockResolvedValue(58000)
        };
        _redis.createClient.mockReturnValue(mockClient);
        mockConfigService.get.mockImplementation((key, defaultValue)=>{
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
        });
        const storage = new _redisthrottlerstorage.RedisThrottlerStorage(mockConfigService);
        await storage.initialize();
        const result = await storage.increment("auth:test", 60000);
        expect(_redis.createClient).toHaveBeenCalledWith({
            url: "redis://localhost:6379"
        });
        expect(mockClient.zRemRangeByScore).toHaveBeenCalled();
        expect(mockClient.zAdd).toHaveBeenCalled();
        expect(mockClient.pExpire).toHaveBeenCalledWith(expect.stringContaining("throttle:auth:test"), 60000);
        expect(result).toEqual({
            totalHits: 3,
            timeToExpire: 58
        });
        await storage.shutdown();
    });
});

//# sourceMappingURL=redis-throttler.storage.spec.js.map