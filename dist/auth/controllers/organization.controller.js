"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "OrganizationController", {
    enumerable: true,
    get: function() {
        return OrganizationController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _throttler = require("@nestjs/throttler");
const _authservice = require("../services/auth.service");
const _organizationservice = require("../services/organization.service");
const _registerdto = require("../dto/register.dto");
const _guards = require("../guards");
const _accesscontroldecorators = require("../decorators/access-control.decorators");
const _subscriptionenum = require("../../database/entities/enums/subscription.enum");
const _registryindexservice = require("../../registry-index/services/registry-index.service");
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
let OrganizationController = class OrganizationController {
    async register(dto) {
        return this.authService.registerOrganization(dto);
    }
    async getOrganization(req) {
        const tenantId = req.user?.tenant_id;
        return this.organizationService.getOrganizationById(tenantId);
    }
    async getRegistryImports() {
        return this.registryIndexService.getImportStateSummaries();
    }
    async updateOrganization(req, data) {
        const tenantId = req.user?.tenant_id;
        return this.organizationService.updateOrganization(tenantId, data);
    }
    async getSubscription(req) {
        const tenantId = req.user?.tenant_id;
        return this.organizationService.getSubscriptionStatus(tenantId);
    }
    async getOnboardingProgress(req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.organizationService.getOnboardingProgress(tenantId, userId);
    }
    async updateOnboardingStep(step, req, data) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        await this.organizationService.updateOnboardingStep(tenantId, userId, step, data.completed, data.data);
    }
    constructor(authService, organizationService, registryIndexService){
        this.authService = authService;
        this.organizationService = organizationService;
        this.registryIndexService = registryIndexService;
    }
};
_ts_decorate([
    (0, _common.Post)("register"),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    (0, _throttler.Throttle)({
        default: {
            limit: 3,
            ttl: 3600000
        }
    }),
    (0, _swagger.ApiOperation)({
        summary: "Register new organization"
    }),
    (0, _swagger.ApiResponse)({
        status: 201,
        description: "Organization registered successfully"
    }),
    (0, _swagger.ApiResponse)({
        status: 400,
        description: "Validation error"
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _registerdto.RegisterOrganizationDto === "undefined" ? Object : _registerdto.RegisterOrganizationDto
    ]),
    _ts_metadata("design:returntype", Promise)
], OrganizationController.prototype, "register", null);
_ts_decorate([
    (0, _common.Get)("me"),
    (0, _common.UseGuards)(_guards.JwtAuthGuard),
    (0, _swagger.ApiBearerAuth)(),
    (0, _swagger.ApiOperation)({
        summary: "Get current organization info"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Organization info retrieved"
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof Request === "undefined" ? Object : Request
    ]),
    _ts_metadata("design:returntype", Promise)
], OrganizationController.prototype, "getOrganization", null);
_ts_decorate([
    (0, _common.Get)("me/registry-imports"),
    (0, _common.UseGuards)(_guards.JwtAuthGuard, _guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN),
    (0, _swagger.ApiBearerAuth)(),
    (0, _swagger.ApiOperation)({
        summary: "Get registry dataset metadata and last import state"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Registry metadata retrieved"
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], OrganizationController.prototype, "getRegistryImports", null);
_ts_decorate([
    (0, _common.Put)("me"),
    (0, _common.UseGuards)(_guards.JwtAuthGuard, _guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN),
    (0, _swagger.ApiBearerAuth)(),
    (0, _swagger.ApiOperation)({
        summary: "Update organization info"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Organization updated"
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof Request === "undefined" ? Object : Request,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], OrganizationController.prototype, "updateOrganization", null);
_ts_decorate([
    (0, _common.Get)("subscription"),
    (0, _common.UseGuards)(_guards.JwtAuthGuard),
    (0, _swagger.ApiBearerAuth)(),
    (0, _swagger.ApiOperation)({
        summary: "Get subscription status"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Subscription info retrieved"
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof Request === "undefined" ? Object : Request
    ]),
    _ts_metadata("design:returntype", Promise)
], OrganizationController.prototype, "getSubscription", null);
_ts_decorate([
    (0, _common.Get)("onboarding"),
    (0, _common.UseGuards)(_guards.JwtAuthGuard),
    (0, _swagger.ApiBearerAuth)(),
    (0, _swagger.ApiOperation)({
        summary: "Get onboarding progress"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Onboarding progress retrieved"
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof Request === "undefined" ? Object : Request
    ]),
    _ts_metadata("design:returntype", Promise)
], OrganizationController.prototype, "getOnboardingProgress", null);
_ts_decorate([
    (0, _common.Patch)("onboarding/:step"),
    (0, _common.UseGuards)(_guards.JwtAuthGuard),
    (0, _swagger.ApiBearerAuth)(),
    (0, _swagger.ApiOperation)({
        summary: "Update onboarding step"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Onboarding step updated"
    }),
    _ts_param(0, (0, _common.Param)("step")),
    _ts_param(1, (0, _common.Req)()),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof Request === "undefined" ? Object : Request,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], OrganizationController.prototype, "updateOnboardingStep", null);
OrganizationController = _ts_decorate([
    (0, _swagger.ApiTags)("Organizations"),
    (0, _common.Controller)("organizations"),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _authservice.AuthService === "undefined" ? Object : _authservice.AuthService,
        typeof _organizationservice.OrganizationService === "undefined" ? Object : _organizationservice.OrganizationService,
        typeof _registryindexservice.RegistryIndexService === "undefined" ? Object : _registryindexservice.RegistryIndexService
    ])
], OrganizationController);

//# sourceMappingURL=organization.controller.js.map