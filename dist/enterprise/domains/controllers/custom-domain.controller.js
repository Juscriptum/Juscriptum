"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CustomDomainController", {
    enumerable: true,
    get: function() {
        return CustomDomainController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _customdomainservice = require("../services/custom-domain.service");
const _guards = require("../../../auth/guards");
const _customdomaindto = require("../dto/custom-domain.dto");
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
let CustomDomainController = class CustomDomainController {
    async getDomains(req) {
        return this.customDomainService.getDomains(req.user.tenant_id);
    }
    async addDomain(req, dto) {
        return this.customDomainService.addDomain(req.user.tenant_id, dto.domain);
    }
    async verifyDomain(req, id) {
        return this.customDomainService.verifyDomain(req.user.tenant_id, id);
    }
    async setPrimaryDomain(req, id) {
        return this.customDomainService.setPrimaryDomain(req.user.tenant_id, id);
    }
    async generateSsl(req, id) {
        return this.customDomainService.generateSslCertificate(req.user.tenant_id, id);
    }
    async removeDomain(req, id) {
        await this.customDomainService.removeDomain(req.user.tenant_id, id);
        return {
            success: true
        };
    }
    constructor(customDomainService){
        this.customDomainService = customDomainService;
    }
};
_ts_decorate([
    (0, _common.Get)(),
    (0, _swagger.ApiOperation)({
        summary: "Get all custom domains for organization"
    }),
    _ts_param(0, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], CustomDomainController.prototype, "getDomains", null);
_ts_decorate([
    (0, _common.Post)(),
    (0, _swagger.ApiOperation)({
        summary: "Add custom domain"
    }),
    _ts_param(0, (0, _common.Request)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        typeof _customdomaindto.AddDomainDto === "undefined" ? Object : _customdomaindto.AddDomainDto
    ]),
    _ts_metadata("design:returntype", Promise)
], CustomDomainController.prototype, "addDomain", null);
_ts_decorate([
    (0, _common.Post)(":id/verify"),
    (0, _swagger.ApiOperation)({
        summary: "Verify domain ownership"
    }),
    _ts_param(0, (0, _common.Request)()),
    _ts_param(1, (0, _common.Param)("id")),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], CustomDomainController.prototype, "verifyDomain", null);
_ts_decorate([
    (0, _common.Post)(":id/primary"),
    (0, _swagger.ApiOperation)({
        summary: "Set domain as primary"
    }),
    _ts_param(0, (0, _common.Request)()),
    _ts_param(1, (0, _common.Param)("id")),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], CustomDomainController.prototype, "setPrimaryDomain", null);
_ts_decorate([
    (0, _common.Post)(":id/ssl"),
    (0, _swagger.ApiOperation)({
        summary: "Generate SSL certificate"
    }),
    _ts_param(0, (0, _common.Request)()),
    _ts_param(1, (0, _common.Param)("id")),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], CustomDomainController.prototype, "generateSsl", null);
_ts_decorate([
    (0, _common.Delete)(":id"),
    (0, _swagger.ApiOperation)({
        summary: "Remove custom domain"
    }),
    _ts_param(0, (0, _common.Request)()),
    _ts_param(1, (0, _common.Param)("id")),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], CustomDomainController.prototype, "removeDomain", null);
CustomDomainController = _ts_decorate([
    (0, _swagger.ApiTags)("Custom Domains"),
    (0, _swagger.ApiBearerAuth)(),
    (0, _common.Controller)("v1/domains"),
    (0, _common.UseGuards)(_guards.JwtAuthGuard),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _customdomainservice.CustomDomainService === "undefined" ? Object : _customdomainservice.CustomDomainService
    ])
], CustomDomainController);

//# sourceMappingURL=custom-domain.controller.js.map