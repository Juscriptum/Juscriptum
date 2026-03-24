"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuditLogsController", {
    enumerable: true,
    get: function() {
        return AuditLogsController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _guards = require("../guards");
const _accesscontroldecorators = require("../decorators/access-control.decorators");
const _subscriptionenum = require("../../database/entities/enums/subscription.enum");
const _auditservice = require("../services/audit.service");
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
let AuditLogsController = class AuditLogsController {
    async getLogs(req, userId, action, entityType, entityId, startDate, endDate, page, limit) {
        const currentPage = Number(page || 1);
        const pageLimit = Number(limit || 50);
        const result = await this.auditService.getTenantAuditLogs(req.user?.tenant_id, {
            userId,
            action,
            entityType,
            entityId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            page: Number.isFinite(currentPage) ? currentPage : 1,
            limit: Number.isFinite(pageLimit) ? pageLimit : 50
        });
        return {
            ...result,
            page: Number.isFinite(currentPage) ? currentPage : 1,
            limit: Number.isFinite(pageLimit) ? pageLimit : 50
        };
    }
    constructor(auditService){
        this.auditService = auditService;
    }
};
_ts_decorate([
    (0, _common.Get)(),
    (0, _swagger.ApiOperation)({
        summary: "List tenant audit logs"
    }),
    (0, _swagger.ApiQuery)({
        name: "userId",
        required: false
    }),
    (0, _swagger.ApiQuery)({
        name: "action",
        required: false
    }),
    (0, _swagger.ApiQuery)({
        name: "entityType",
        required: false
    }),
    (0, _swagger.ApiQuery)({
        name: "entityId",
        required: false
    }),
    (0, _swagger.ApiQuery)({
        name: "startDate",
        required: false
    }),
    (0, _swagger.ApiQuery)({
        name: "endDate",
        required: false
    }),
    (0, _swagger.ApiQuery)({
        name: "page",
        required: false
    }),
    (0, _swagger.ApiQuery)({
        name: "limit",
        required: false
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Query)("userId")),
    _ts_param(2, (0, _common.Query)("action")),
    _ts_param(3, (0, _common.Query)("entityType")),
    _ts_param(4, (0, _common.Query)("entityId")),
    _ts_param(5, (0, _common.Query)("startDate")),
    _ts_param(6, (0, _common.Query)("endDate")),
    _ts_param(7, (0, _common.Query)("page")),
    _ts_param(8, (0, _common.Query)("limit")),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof Request === "undefined" ? Object : Request,
        String,
        String,
        String,
        String,
        String,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AuditLogsController.prototype, "getLogs", null);
AuditLogsController = _ts_decorate([
    (0, _swagger.ApiTags)("Audit Logs"),
    (0, _swagger.ApiBearerAuth)(),
    (0, _common.Controller)("audit-logs"),
    (0, _common.UseGuards)(_guards.JwtAuthGuard, _guards.RbacGuard, _guards.SubscriptionGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN),
    (0, _accesscontroldecorators.RequirePlan)(_subscriptionenum.SubscriptionPlan.PROFESSIONAL),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _auditservice.AuditService === "undefined" ? Object : _auditservice.AuditService
    ])
], AuditLogsController);

//# sourceMappingURL=audit-logs.controller.js.map