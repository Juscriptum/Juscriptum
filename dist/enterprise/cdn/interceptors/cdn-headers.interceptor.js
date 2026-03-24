"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CdnHeadersInterceptor", {
    enumerable: true,
    get: function() {
        return CdnHeadersInterceptor;
    }
});
const _common = require("@nestjs/common");
const _operators = require("rxjs/operators");
const _cdnservice = require("../services/cdn.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let CdnHeadersInterceptor = class CdnHeadersInterceptor {
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const user = request.user;
        return next.handle().pipe((0, _operators.tap)(()=>{
            if (!this.cdnService.isEnabled()) {
                return;
            }
            const path = request.route?.path || request.path;
            const cacheHeaders = this.cdnService.getCacheHeaders(path, user?.tenant_id);
            // Set cache headers
            for (const [key, value] of Object.entries(cacheHeaders)){
                response.setHeader(key, value);
            }
            // Set surrogate keys for granular purging
            if (user?.tenant_id) {
                const keys = this.getSurrogateKeys(path, user.tenant_id);
                if (keys.length > 0) {
                    response.setHeader("Surrogate-Key", keys.join(" "));
                }
            }
            // Add ETag for conditional requests
            response.setHeader("Vary", "Accept-Encoding, Authorization");
        }));
    }
    /**
   * Get surrogate keys for path
   */ getSurrogateKeys(path, tenantId) {
        const keys = [
            `tenant:${tenantId}`
        ];
        if (path.includes("/clients")) {
            keys.push(`clients:${tenantId}`);
        }
        if (path.includes("/cases")) {
            keys.push(`cases:${tenantId}`);
        }
        if (path.includes("/documents")) {
            keys.push(`documents:${tenantId}`);
        }
        if (path.includes("/events")) {
            keys.push(`events:${tenantId}`);
        }
        return keys;
    }
    constructor(cdnService){
        this.cdnService = cdnService;
    }
};
CdnHeadersInterceptor = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _cdnservice.CdnService === "undefined" ? Object : _cdnservice.CdnService
    ])
], CdnHeadersInterceptor);

//# sourceMappingURL=cdn-headers.interceptor.js.map