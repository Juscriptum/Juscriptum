"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CacheInterceptor", {
    enumerable: true,
    get: function() {
        return CacheInterceptor;
    }
});
const _common = require("@nestjs/common");
const _rxjs = require("rxjs");
const _operators = require("rxjs/operators");
const _rediscacheservice = require("../services/redis-cache.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let CacheInterceptor = class CacheInterceptor {
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        // Only cache GET requests
        if (request.method !== "GET") {
            return next.handle();
        }
        // Skip caching for non-authenticated requests
        if (!user?.tenant_id) {
            return next.handle();
        }
        // Build cache key
        const cacheKey = this.buildCacheKey(request, user.tenant_id);
        // Check for cache bypass header
        if (request.headers["cache-control"] === "no-cache") {
            return next.handle().pipe((0, _operators.tap)((response)=>{
                this.cacheService.set(cacheKey, response, this.getTTL(request));
            }));
        }
        // Try to get from cache first
        return new _rxjs.Observable((subscriber)=>{
            this.cacheService.get(cacheKey).then((cached)=>{
                if (cached !== null) {
                    subscriber.next(cached);
                    subscriber.complete();
                } else {
                    // Cache miss, execute handler and cache result
                    next.handle().pipe((0, _operators.tap)((response)=>{
                        this.cacheService.set(cacheKey, response, this.getTTL(request), this.getTags(request, user.tenant_id));
                    })).subscribe(subscriber);
                }
            });
        });
    }
    /**
   * Build cache key from request
   */ buildCacheKey(request, tenantId) {
        const path = request.route?.path || request.path;
        const query = Object.keys(request.query).length > 0 ? JSON.stringify(request.query) : "";
        const params = Object.keys(request.params).length > 0 ? JSON.stringify(request.params) : "";
        return `api:${tenantId}:${path}:${params}:${query}`;
    }
    /**
   * Get TTL based on endpoint
   */ getTTL(request) {
        const path = request.route?.path || request.path;
        // Dashboard stats - short TTL
        if (path.includes("/dashboard")) {
            return 60; // 1 minute
        }
        // List endpoints - medium TTL
        if (path.includes("/list") || request.query.page) {
            return 300; // 5 minutes
        }
        // Default TTL
        return 3600; // 1 hour
    }
    /**
   * Get cache tags for invalidation
   */ getTags(request, tenantId) {
        const path = request.route?.path || request.path;
        const tags = [];
        // Add entity-based tags
        if (path.includes("/clients")) {
            tags.push(`clients:${tenantId}`);
        }
        if (path.includes("/cases")) {
            tags.push(`cases:${tenantId}`);
        }
        if (path.includes("/documents")) {
            tags.push(`documents:${tenantId}`);
        }
        if (path.includes("/events")) {
            tags.push(`events:${tenantId}`);
        }
        return tags;
    }
    constructor(cacheService){
        this.cacheService = cacheService;
    }
};
CacheInterceptor = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _rediscacheservice.RedisCacheService === "undefined" ? Object : _rediscacheservice.RedisCacheService
    ])
], CacheInterceptor);

//# sourceMappingURL=cache.interceptor.js.map