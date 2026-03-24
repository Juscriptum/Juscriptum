"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PlatformAdminDashboardController", {
    enumerable: true,
    get: function() {
        return PlatformAdminDashboardController;
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
let PlatformAdminDashboardController = class PlatformAdminDashboardController {
    async getSummary() {
        return this.platformAdminReadService.getDashboardSummary();
    }
    constructor(platformAdminReadService){
        this.platformAdminReadService = platformAdminReadService;
    }
};
_ts_decorate([
    (0, _common.Get)("summary"),
    (0, _swagger.ApiOperation)({
        summary: "Return safe platform-wide KPIs and alerts for the owner back office"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Platform-admin dashboard summary retrieved",
        type: _platformadminreadmodeldto.PlatformAdminDashboardSummaryDto
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], PlatformAdminDashboardController.prototype, "getSummary", null);
PlatformAdminDashboardController = _ts_decorate([
    (0, _swagger.ApiTags)("Platform Admin Dashboard"),
    (0, _swagger.ApiBearerAuth)(),
    (0, _common.Controller)("platform-admin/dashboard"),
    (0, _common.UseGuards)(_guards.PlatformAdminJwtAuthGuard),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _platformadminreadservice.PlatformAdminReadService === "undefined" ? Object : _platformadminreadservice.PlatformAdminReadService
    ])
], PlatformAdminDashboardController);

//# sourceMappingURL=platform-admin-dashboard.controller.js.map