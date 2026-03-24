"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CasesController", {
    enumerable: true,
    get: function() {
        return CasesController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _caseservice = require("../services/case.service");
const _casedto = require("../dto/case.dto");
const _guards = require("../../auth/guards");
const _auditservice = require("../../auth/services/audit.service");
const _accesscontroldecorators = require("../../auth/decorators/access-control.decorators");
const _subscriptionenum = require("../../database/entities/enums/subscription.enum");
const _courtregistryservice = require("../../clients/services/court-registry.service");
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
let CasesController = class CasesController {
    async findAll(filters, req) {
        const tenantId = req.user?.tenant_id;
        return this.caseService.findAll(tenantId, filters, req.user);
    }
    async getStatistics(req) {
        const tenantId = req.user?.tenant_id;
        return this.caseService.getStatistics(tenantId, req.user);
    }
    async getUpcomingDeadlines(days, req) {
        const tenantId = req.user?.tenant_id;
        return this.caseService.getUpcomingDeadlines(tenantId, days ? parseInt(days) : 30, req.user);
    }
    async getNextCaseNumber(clientId, req) {
        const tenantId = req.user?.tenant_id;
        return this.caseService.getNextCaseNumber(tenantId, clientId, req.user);
    }
    async searchRegistries(query, dateFrom, dateTo, source, caseNumber, institutionName, role, status, judge, proceedingNumber, proceedingType) {
        return this.courtRegistryService.searchInCaseRegistries({
            query,
            dateFrom,
            dateTo,
            source,
            caseNumber,
            institutionName,
            role,
            status,
            judge,
            proceedingNumber,
            proceedingType
        });
    }
    async getRegistryHearingNotifications(req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.caseService.getRegistryHearingNotifications(tenantId, userId, req.user);
    }
    async findById(id, req) {
        const tenantId = req.user?.tenant_id;
        return this.caseService.findById(tenantId, id, req.user);
    }
    async getTimeline(id, req) {
        const tenantId = req.user?.tenant_id;
        return this.caseService.getTimeline(tenantId, id, req.user);
    }
    async getRegistryHearingSuggestion(id, req) {
        const tenantId = req.user?.tenant_id;
        return this.caseService.getRegistryHearingSuggestion(tenantId, id, req.user);
    }
    async createRegistryHearingEvent(id, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.caseService.createRegistryHearingEvent(tenantId, id, userId, req.user);
    }
    async create(dto, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.caseService.create(tenantId, userId, dto, req.user);
    }
    async update(id, dto, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.caseService.update(tenantId, id, userId, dto, req.user);
    }
    async changeStatus(id, status, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.caseService.changeStatus(tenantId, id, userId, status, req.user);
    }
    async restore(id, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.caseService.restore(tenantId, id, userId, req.user);
    }
    async delete(id, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.caseService.delete(tenantId, id, userId, req.user);
    }
    constructor(caseService, courtRegistryService){
        this.caseService = caseService;
        this.courtRegistryService = courtRegistryService;
    }
};
_ts_decorate([
    (0, _common.Get)(),
    (0, _swagger.ApiOperation)({
        summary: "Get all cases"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Cases retrieved"
    }),
    _ts_param(0, (0, _common.Query)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _casedto.CaseFiltersDto === "undefined" ? Object : _casedto.CaseFiltersDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], CasesController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)("statistics"),
    (0, _swagger.ApiOperation)({
        summary: "Get case statistics"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Statistics retrieved"
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], CasesController.prototype, "getStatistics", null);
_ts_decorate([
    (0, _common.Get)("upcoming-deadlines"),
    (0, _swagger.ApiOperation)({
        summary: "Get upcoming deadlines"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Upcoming deadlines retrieved"
    }),
    _ts_param(0, (0, _common.Query)("days")),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], CasesController.prototype, "getUpcomingDeadlines", null);
_ts_decorate([
    (0, _common.Get)("next-number"),
    (0, _swagger.ApiOperation)({
        summary: "Preview next case number for selected client"
    }),
    (0, _swagger.ApiQuery)({
        name: "clientId",
        required: true,
        type: String
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Next case number retrieved"
    }),
    _ts_param(0, (0, _common.Query)("clientId")),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], CasesController.prototype, "getNextCaseNumber", null);
_ts_decorate([
    (0, _common.Get)("registry-search"),
    (0, _swagger.ApiOperation)({
        summary: "Search court and enforcement registries for cases"
    }),
    (0, _swagger.ApiQuery)({
        name: "query",
        required: false,
        type: String
    }),
    (0, _swagger.ApiQuery)({
        name: "dateFrom",
        required: false,
        type: String
    }),
    (0, _swagger.ApiQuery)({
        name: "dateTo",
        required: false,
        type: String
    }),
    (0, _swagger.ApiQuery)({
        name: "source",
        required: false,
        type: String
    }),
    (0, _swagger.ApiQuery)({
        name: "caseNumber",
        required: false,
        type: String
    }),
    (0, _swagger.ApiQuery)({
        name: "institutionName",
        required: false,
        type: String
    }),
    (0, _swagger.ApiQuery)({
        name: "role",
        required: false,
        type: String
    }),
    (0, _swagger.ApiQuery)({
        name: "status",
        required: false,
        type: String
    }),
    (0, _swagger.ApiQuery)({
        name: "judge",
        required: false,
        type: String
    }),
    (0, _swagger.ApiQuery)({
        name: "proceedingNumber",
        required: false,
        type: String
    }),
    (0, _swagger.ApiQuery)({
        name: "proceedingType",
        required: false,
        type: String
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Registry search results returned"
    }),
    _ts_param(0, (0, _common.Query)("query")),
    _ts_param(1, (0, _common.Query)("dateFrom")),
    _ts_param(2, (0, _common.Query)("dateTo")),
    _ts_param(3, (0, _common.Query)("source")),
    _ts_param(4, (0, _common.Query)("caseNumber")),
    _ts_param(5, (0, _common.Query)("institutionName")),
    _ts_param(6, (0, _common.Query)("role")),
    _ts_param(7, (0, _common.Query)("status")),
    _ts_param(8, (0, _common.Query)("judge")),
    _ts_param(9, (0, _common.Query)("proceedingNumber")),
    _ts_param(10, (0, _common.Query)("proceedingType")),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String,
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
], CasesController.prototype, "searchRegistries", null);
_ts_decorate([
    (0, _common.Get)("registry-hearing-notifications"),
    (0, _swagger.ApiOperation)({
        summary: "Get case hearing suggestions from court_dates for the current user"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Registry hearing suggestions returned"
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], CasesController.prototype, "getRegistryHearingNotifications", null);
_ts_decorate([
    (0, _common.Get)(":id"),
    (0, _swagger.ApiOperation)({
        summary: "Get case by ID"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Case retrieved"
    }),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], CasesController.prototype, "findById", null);
_ts_decorate([
    (0, _common.Get)(":id/timeline"),
    (0, _swagger.ApiOperation)({
        summary: "Get case timeline"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Timeline retrieved"
    }),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], CasesController.prototype, "getTimeline", null);
_ts_decorate([
    (0, _common.Get)(":id/registry-hearing-suggestion"),
    (0, _swagger.ApiOperation)({
        summary: "Get the nearest court_dates hearing suggestion for a case"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Registry hearing suggestion returned"
    }),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], CasesController.prototype, "getRegistryHearingSuggestion", null);
_ts_decorate([
    (0, _common.Post)(":id/registry-hearing-event"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN, _subscriptionenum.UserRole.LAWYER, _subscriptionenum.UserRole.ASSISTANT),
    (0, _swagger.ApiOperation)({
        summary: "Create a case event from the nearest court_dates hearing suggestion"
    }),
    (0, _swagger.ApiResponse)({
        status: 201,
        description: "Registry hearing event created"
    }),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], CasesController.prototype, "createRegistryHearingEvent", null);
_ts_decorate([
    (0, _common.Post)(),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN, _subscriptionenum.UserRole.LAWYER),
    (0, _swagger.ApiOperation)({
        summary: "Create new case"
    }),
    (0, _swagger.ApiResponse)({
        status: 201,
        description: "Case created"
    }),
    (0, _auditservice.Audit)("create"),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _casedto.CreateCaseDto === "undefined" ? Object : _casedto.CreateCaseDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], CasesController.prototype, "create", null);
_ts_decorate([
    (0, _common.Put)(":id"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN, _subscriptionenum.UserRole.LAWYER),
    (0, _swagger.ApiOperation)({
        summary: "Update case"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Case updated"
    }),
    (0, _auditservice.Audit)("update"),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _casedto.UpdateCaseDto === "undefined" ? Object : _casedto.UpdateCaseDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], CasesController.prototype, "update", null);
_ts_decorate([
    (0, _common.Put)(":id/status"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN, _subscriptionenum.UserRole.LAWYER),
    (0, _swagger.ApiOperation)({
        summary: "Change case status"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Status changed"
    }),
    (0, _auditservice.Audit)("update"),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Body)("status")),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], CasesController.prototype, "changeStatus", null);
_ts_decorate([
    (0, _common.Post)(":id/restore"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN, _subscriptionenum.UserRole.LAWYER),
    (0, _swagger.ApiOperation)({
        summary: "Restore deleted case"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Case restored"
    }),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], CasesController.prototype, "restore", null);
_ts_decorate([
    (0, _common.Delete)(":id"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN, _subscriptionenum.UserRole.LAWYER),
    (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT),
    (0, _swagger.ApiOperation)({
        summary: "Delete case"
    }),
    (0, _swagger.ApiResponse)({
        status: 204,
        description: "Case deleted"
    }),
    (0, _auditservice.Audit)("delete"),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], CasesController.prototype, "delete", null);
CasesController = _ts_decorate([
    (0, _swagger.ApiTags)("Cases"),
    (0, _common.Controller)("cases"),
    (0, _common.UseGuards)(_guards.JwtAuthGuard, _guards.TenantGuard),
    (0, _swagger.ApiBearerAuth)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _caseservice.CaseService === "undefined" ? Object : _caseservice.CaseService,
        typeof _courtregistryservice.CourtRegistryService === "undefined" ? Object : _courtregistryservice.CourtRegistryService
    ])
], CasesController);

//# sourceMappingURL=cases.controller.js.map