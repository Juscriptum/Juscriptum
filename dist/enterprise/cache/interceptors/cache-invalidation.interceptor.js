"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CacheInvalidationInterceptor", {
    enumerable: true,
    get: function() {
        return CacheInvalidationInterceptor;
    }
});
const _common = require("@nestjs/common");
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
let CacheInvalidationInterceptor = class CacheInvalidationInterceptor {
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        return next.handle().pipe((0, _operators.tap)(async ()=>{
            if (!user?.tenant_id) return;
            // Invalidate based on method and path
            await this.invalidateCache(request, user.tenant_id);
        }));
    }
    /**
   * Invalidate relevant cache entries
   */ async invalidateCache(request, tenantId) {
        const method = request.method;
        const path = request.route?.path || request.path;
        // Only invalidate on mutations
        if (![
            "POST",
            "PUT",
            "PATCH",
            "DELETE"
        ].includes(method)) {
            return;
        }
        // Invalidate by entity type
        if (path.includes("/clients")) {
            await this.cacheService.invalidateByTag(`clients:${tenantId}`);
        }
        if (path.includes("/cases")) {
            await this.cacheService.invalidateByTag(`cases:${tenantId}`);
        }
        if (path.includes("/documents")) {
            await this.cacheService.invalidateByTag(`documents:${tenantId}`);
        }
        if (path.includes("/events")) {
            await this.cacheService.invalidateByTag(`events:${tenantId}`);
        }
        if (path.includes("/invoices")) {
            await this.cacheService.invalidateByTag(`invoices:${tenantId}`);
        }
        if (path.includes("/calculations")) {
            await this.cacheService.invalidateByTag(`calculations:${tenantId}`);
        }
        // Always invalidate dashboard stats on any mutation
        await this.cacheService.del(`api:${tenantId}:/v1/dashboard:`);
    }
    constructor(cacheService){
        this.cacheService = cacheService;
    }
};
CacheInvalidationInterceptor = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _rediscacheservice.RedisCacheService === "undefined" ? Object : _rediscacheservice.RedisCacheService
    ])
], CacheInvalidationInterceptor);

//# sourceMappingURL=cache-invalidation.interceptor.js.map