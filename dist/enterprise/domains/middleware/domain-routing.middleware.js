"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DomainRoutingMiddleware", {
    enumerable: true,
    get: function() {
        return DomainRoutingMiddleware;
    }
});
const _common = require("@nestjs/common");
const _customdomainservice = require("../services/custom-domain.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let DomainRoutingMiddleware = class DomainRoutingMiddleware {
    async use(req, res, next) {
        const host = req.get("host")?.split(":")[0]; // Remove port
        if (!host) {
            return next();
        }
        // Check if it's a custom domain (not the base domain)
        const baseDomain = process.env.BASE_DOMAIN || "law-organizer.ua";
        if (!host.endsWith(baseDomain)) {
            // This might be a custom domain
            const organization = await this.customDomainService.getTenantByDomain(host);
            if (organization) {
                // Attach tenant info to request
                req.tenantFromDomain = organization;
                req.isCustomDomain = true;
            }
        }
        next();
    }
    constructor(customDomainService){
        this.customDomainService = customDomainService;
    }
};
DomainRoutingMiddleware = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _customdomainservice.CustomDomainService === "undefined" ? Object : _customdomainservice.CustomDomainService
    ])
], DomainRoutingMiddleware);

//# sourceMappingURL=domain-routing.middleware.js.map