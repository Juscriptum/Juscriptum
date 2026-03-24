"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DashboardController", {
    enumerable: true,
    get: function() {
        return DashboardController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _dashboardservice = require("../services/dashboard.service");
const _dashboardstatsdto = require("../dto/dashboard-stats.dto");
const _dashboardresponsedto = require("../dto/dashboard-response.dto");
const _guards = require("../../auth/guards");
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
let DashboardController = class DashboardController {
    async getStats(query, req) {
        const tenantId = req.user?.tenant_id;
        return this.dashboardService.getDashboardStats(tenantId, query);
    }
    constructor(dashboardService){
        this.dashboardService = dashboardService;
    }
};
_ts_decorate([
    (0, _common.Get)("stats"),
    (0, _swagger.ApiOperation)({
        summary: "Get dashboard statistics"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Dashboard statistics retrieved successfully",
        type: _dashboardresponsedto.DashboardStatsResponseDto
    }),
    (0, _swagger.ApiQuery)({
        name: "days",
        required: false,
        type: Number,
        description: "Number of days to look back (default: 30)"
    }),
    (0, _swagger.ApiQuery)({
        name: "startDate",
        required: false,
        type: Date,
        description: "Custom start date"
    }),
    (0, _swagger.ApiQuery)({
        name: "endDate",
        required: false,
        type: Date,
        description: "Custom end date"
    }),
    _ts_param(0, (0, _common.Query)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dashboardstatsdto.GetDashboardStatsDto === "undefined" ? Object : _dashboardstatsdto.GetDashboardStatsDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], DashboardController.prototype, "getStats", null);
DashboardController = _ts_decorate([
    (0, _swagger.ApiTags)("Dashboard"),
    (0, _common.Controller)("dashboard"),
    (0, _common.UseGuards)(_guards.JwtAuthGuard, _guards.TenantGuard),
    (0, _swagger.ApiBearerAuth)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dashboardservice.DashboardService === "undefined" ? Object : _dashboardservice.DashboardService
    ])
], DashboardController);

//# sourceMappingURL=dashboard.controller.js.map