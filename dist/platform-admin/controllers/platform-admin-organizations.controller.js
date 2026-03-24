"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PlatformAdminOrganizationsController", {
    enumerable: true,
    get: function() {
        return PlatformAdminOrganizationsController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _guards = require("../guards");
const _platformadminreadservice = require("../services/platform-admin-read.service");
const _platformadminreadmodeldto = require("../dto/platform-admin-read-model.dto");
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
let PlatformAdminOrganizationsController = class PlatformAdminOrganizationsController {
    async listOrganizations(query) {
        return this.platformAdminReadService.getOrganizations(query);
    }
    async getOrganization(organizationId) {
        return this.platformAdminReadService.getOrganizationDetail(organizationId);
    }
    async getOrganizationUsers(organizationId) {
        return this.platformAdminReadService.getOrganizationUsers(organizationId);
    }
    constructor(platformAdminReadService){
        this.platformAdminReadService = platformAdminReadService;
    }
};
_ts_decorate([
    (0, _common.Get)(),
    (0, _swagger.ApiOperation)({
        summary: "List organizations through a metadata-only platform-admin read model"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Platform-admin organizations registry retrieved",
        type: _platformadminreadmodeldto.PlatformAdminOrganizationListResponseDto
    }),
    _ts_param(0, (0, _common.Query)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _platformadminreadmodeldto.PlatformAdminOrganizationsQueryDto === "undefined" ? Object : _platformadminreadmodeldto.PlatformAdminOrganizationsQueryDto
    ]),
    _ts_metadata("design:returntype", Promise)
], PlatformAdminOrganizationsController.prototype, "listOrganizations", null);
_ts_decorate([
    (0, _common.Get)(":id"),
    (0, _swagger.ApiOperation)({
        summary: "Return a single organization metadata card for support, billing, and security review"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Platform-admin organization detail retrieved",
        type: _platformadminreadmodeldto.PlatformAdminOrganizationDetailDto
    }),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], PlatformAdminOrganizationsController.prototype, "getOrganization", null);
_ts_decorate([
    (0, _common.Get)(":id/users"),
    (0, _swagger.ApiOperation)({
        summary: "Return a masked organization-user roster for owner back-office review"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Masked organization users retrieved",
        type: _platformadminreadmodeldto.PlatformAdminOrganizationUserDto,
        isArray: true
    }),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], PlatformAdminOrganizationsController.prototype, "getOrganizationUsers", null);
PlatformAdminOrganizationsController = _ts_decorate([
    (0, _swagger.ApiTags)("Platform Admin Organizations"),
    (0, _swagger.ApiBearerAuth)(),
    (0, _common.Controller)("platform-admin/organizations"),
    (0, _common.UseGuards)(_guards.PlatformAdminJwtAuthGuard),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _platformadminreadservice.PlatformAdminReadService === "undefined" ? Object : _platformadminreadservice.PlatformAdminReadService
    ])
], PlatformAdminOrganizationsController);

//# sourceMappingURL=platform-admin-organizations.controller.js.map