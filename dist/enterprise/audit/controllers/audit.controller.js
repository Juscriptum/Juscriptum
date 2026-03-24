"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuditController", {
    enumerable: true,
    get: function() {
        return AuditController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _wormauditservice = require("../services/worm-audit.service");
const _guards = require("../../../auth/guards");
const _wormauditinterface = require("../interfaces/worm-audit.interface");
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
let AuditController = class AuditController {
    async getLogs(req, userId, action, entityType, entityId, startDate, endDate, page, limit) {
        return this.auditService.getLogs(req.user.tenant_id, {
            userId,
            action,
            entityType,
            entityId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            page: page || 1,
            limit: limit || 100
        });
    }
    async verifyChain(req) {
        return this.auditService.verifyChainIntegrity(req.user.tenant_id);
    }
    async exportLogs(req, res, format = "json", startDate, endDate) {
        const data = await this.auditService.exportLogs(req.user.tenant_id, format, {
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined
        });
        const filename = `audit-export-${new Date().toISOString().split("T")[0]}.${format}`;
        const contentType = format === "json" ? "application/json" : "text/csv";
        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.send(data);
    }
    async getRetention(req) {
        const days = await this.auditService.getRetentionPeriod(req.user.tenant_id);
        return {
            retentionDays: days,
            retentionYears: (days / 365).toFixed(1)
        };
    }
    constructor(auditService){
        this.auditService = auditService;
    }
};
_ts_decorate([
    (0, _common.Get)(),
    (0, _swagger.ApiOperation)({
        summary: "Get audit logs"
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
        required: false,
        example: 1
    }),
    (0, _swagger.ApiQuery)({
        name: "limit",
        required: false,
        example: 100
    }),
    _ts_param(0, (0, _common.Request)()),
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
        Object,
        String,
        typeof _wormauditinterface.AuditActionType === "undefined" ? Object : _wormauditinterface.AuditActionType,
        String,
        String,
        String,
        String,
        Number,
        Number
    ]),
    _ts_metadata("design:returntype", Promise)
], AuditController.prototype, "getLogs", null);
_ts_decorate([
    (0, _common.Get)("verify"),
    (0, _swagger.ApiOperation)({
        summary: "Verify audit chain integrity"
    }),
    _ts_param(0, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], AuditController.prototype, "verifyChain", null);
_ts_decorate([
    (0, _common.Get)("export"),
    (0, _swagger.ApiOperation)({
        summary: "Export audit logs (for compliance)"
    }),
    (0, _swagger.ApiQuery)({
        name: "format",
        required: false,
        enum: [
            "json",
            "csv"
        ]
    }),
    (0, _swagger.ApiQuery)({
        name: "startDate",
        required: false
    }),
    (0, _swagger.ApiQuery)({
        name: "endDate",
        required: false
    }),
    _ts_param(0, (0, _common.Request)()),
    _ts_param(1, (0, _common.Response)()),
    _ts_param(2, (0, _common.Query)("format")),
    _ts_param(3, (0, _common.Query)("startDate")),
    _ts_param(4, (0, _common.Query)("endDate")),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        Object,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AuditController.prototype, "exportLogs", null);
_ts_decorate([
    (0, _common.Get)("retention"),
    (0, _swagger.ApiOperation)({
        summary: "Get audit retention period"
    }),
    _ts_param(0, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], AuditController.prototype, "getRetention", null);
AuditController = _ts_decorate([
    (0, _swagger.ApiTags)("Audit Logs"),
    (0, _swagger.ApiBearerAuth)(),
    (0, _common.Controller)("v1/audit"),
    (0, _common.UseGuards)(_guards.JwtAuthGuard),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _wormauditservice.WormAuditService === "undefined" ? Object : _wormauditservice.WormAuditService
    ])
], AuditController);

//# sourceMappingURL=audit.controller.js.map