import { Injectable } from "@nestjs/common";
import { RedisCacheService } from "../services/redis-cache.service";

/**
 * Cache Decorator
 * Method-level caching with automatic key generation
 */
export function Cached(ttl: number = 3600, tags: string[] = []) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (
      this: { cacheService?: RedisCacheService },
      ...args: any[]
    ) {
      const cacheService = this.cacheService;

      if (!cacheService) {
        return originalMethod.apply(this, args);
      }

      // Build cache key from method name and arguments
      const cacheKey = `${propertyKey}:${JSON.stringify(args)}`;

      // Try cache first
      const cached = await cacheService.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Execute method and cache result
      const result = await originalMethod.apply(this, args);
      await cacheService.set(cacheKey, result, ttl, tags);

      return result;
    };

    return descriptor;
  };
}

/**
 * Cache Evict Decorator
 * Evicts cache entries after method execution
 */
export function CacheEvict(...tags: string[]) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (
      this: { cacheService?: RedisCacheService },
      ...args: any[]
    ) {
      const cacheService = this.cacheService;

      // Execute method first
      const result = await originalMethod.apply(this, args);

      // Evict cache by tags
      if (cacheService && tags.length > 0) {
        for (const tag of tags) {
          // Replace placeholders with actual values from first arg (usually tenant-based)
          const actualTag = tag.replace("{0}", args[0] || "");
          await cacheService.invalidateByTag(actualTag);
        }
      }

      return result;
    };

    return descriptor;
  };
}
