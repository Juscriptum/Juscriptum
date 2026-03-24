"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CdnController", {
    enumerable: true,
    get: function() {
        return CdnController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _cdnservice = require("../services/cdn.service");
const _guards = require("../../../auth/guards");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let CdnController = class CdnController {
    getConfig() {
        return this.cdnService.getConfig();
    }
    async purgeCache(body) {
        return this.cdnService.purge(body);
    }
    async purgeTenantCache(req) {
        return this.cdnService.purgeTenantCache(req.user.tenant_id);
    }
    async purgeStaticCache() {
        return this.cdnService.purgeStaticCache();
    }
    async warmCache(body) {
        return this.cdnService.warmCache(body.urls);
    }
    getCdnUrl(path) {
        return {
            original: path,
            cdnUrl: this.cdnService.getCdnUrl(path)
        };
    }
    constructor(cdnService){
        this.cdnService = cdnService;
    }
};
_ts_decorate([
    (0, _common.Get)("config"),
    (0, _common.UseGuards)(_guards.SuperAdminGuard),
    (0, _swagger.ApiOperation)({
        summary: "Get CDN configuration"
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", void 0)
], CdnController.prototype, "getConfig", null);
_ts_decorate([
    (0, _common.Post)("purge"),
    (0, _common.UseGuards)(_guards.SuperAdminGuard),
    (0, _swagger.ApiOperation)({
        summary: "Purge CDN cache"
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], CdnController.prototype, "purgeCache", null);
_ts_decorate([
    (0, _common.Post)("purge/tenant"),
    (0, _swagger.ApiOperation)({
        summary: "Purge tenant CDN cache"
    }),
    _ts_param(0, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], CdnController.prototype, "purgeTenantCache", null);
_ts_decorate([
    (0, _common.Post)("purge/static"),
    (0, _common.UseGuards)(_guards.SuperAdminGuard),
    (0, _swagger.ApiOperation)({
        summary: "Purge static assets cache"
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], CdnController.prototype, "purgeStaticCache", null);
_ts_decorate([
    (0, _common.Post)("warm"),
    (0, _common.UseGuards)(_guards.SuperAdminGuard),
    (0, _swagger.ApiOperation)({
        summary: "Warm CDN cache"
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], CdnController.prototype, "warmCache", null);
_ts_decorate([
    (0, _common.Get)("url"),
    (0, _swagger.ApiOperation)({
        summary: "Get CDN URL for path"
    }),
    _ts_param(0, (0, _common.Query)("path")),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], CdnController.prototype, "getCdnUrl", null);
CdnController = _ts_decorate([
    (0, _swagger.ApiTags)("CDN"),
    (0, _swagger.ApiBearerAuth)(),
    (0, _common.Controller)("v1/cdn"),
    (0, _common.UseGuards)(_guards.JwtAuthGuard),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _cdnservice.CdnService === "undefined" ? Object : _cdnservice.CdnService
    ])
], CdnController);

//# sourceMappingURL=cdn.controller.js.map