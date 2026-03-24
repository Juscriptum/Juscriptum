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
    get CacheEvict () {
        return CacheEvict;
    },
    get Cached () {
        return Cached;
    }
});
function Cached(ttl = 3600, tags = []) {
    return function(target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function(...args) {
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
function CacheEvict(...tags) {
    return function(target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function(...args) {
            const cacheService = this.cacheService;
            // Execute method first
            const result = await originalMethod.apply(this, args);
            // Evict cache by tags
            if (cacheService && tags.length > 0) {
                for (const tag of tags){
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

//# sourceMappingURL=cache.decorator.js.map