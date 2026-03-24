"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ClientsController", {
    enumerable: true,
    get: function() {
        return ClientsController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _clientservice = require("../services/client.service");
const _courtregistryservice = require("../services/court-registry.service");
const _clientdto = require("../dto/client.dto");
const _guards = require("../../auth/guards");
const _accesscontroldecorators = require("../../auth/decorators/access-control.decorators");
const _subscriptionenum = require("../../database/entities/enums/subscription.enum");
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
let ClientsController = class ClientsController {
    async findAll(filters, req) {
        const tenantId = req.user?.tenant_id;
        return this.clientService.findAll(tenantId, filters, req.user);
    }
    async getStatistics(req) {
        const tenantId = req.user?.tenant_id;
        return this.clientService.getStatistics(tenantId, req.user);
    }
    async getNextClientNumber(req) {
        const tenantId = req.user?.tenant_id;
        return this.clientService.getNextClientNumber(tenantId, req.user);
    }
    async searchCourtRegistry(query, dateFrom, dateTo, source, caseNumber, institutionName, role, status, judge, proceedingNumber, proceedingType) {
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
    async findById(id, req) {
        const tenantId = req.user?.tenant_id;
        return this.clientService.findById(tenantId, id, req.user);
    }
    async create(dto, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.clientService.create(tenantId, userId, dto, req.user);
    }
    async bulkImport(dto, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.clientService.bulkImport(tenantId, userId, dto.clients, req.user);
    }
    async update(id, dto, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.clientService.update(tenantId, id, userId, dto, req.user);
    }
    async patch(id, dto, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.clientService.update(tenantId, id, userId, dto, req.user);
    }
    async delete(id, dto, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.clientService.delete(tenantId, id, userId, dto, req.user);
    }
    async restore(id, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.clientService.restore(tenantId, id, userId, req.user);
    }
    constructor(clientService, courtRegistryService){
        this.clientService = clientService;
        this.courtRegistryService = courtRegistryService;
    }
};
_ts_decorate([
    (0, _common.Get)(),
    (0, _swagger.ApiOperation)({
        summary: "Get all clients"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Clients retrieved"
    }),
    _ts_param(0, (0, _common.Query)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _clientdto.ClientFiltersDto === "undefined" ? Object : _clientdto.ClientFiltersDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], ClientsController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)("statistics"),
    (0, _swagger.ApiOperation)({
        summary: "Get client statistics"
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
], ClientsController.prototype, "getStatistics", null);
_ts_decorate([
    (0, _common.Get)("next-number"),
    (0, _swagger.ApiOperation)({
        summary: "Preview next available client number"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Next client number retrieved"
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], ClientsController.prototype, "getNextClientNumber", null);
_ts_decorate([
    (0, _common.Get)("court-registry/search"),
    (0, _swagger.ApiOperation)({
        summary: "Search court and enforcement registry CSV files by participant"
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
], ClientsController.prototype, "searchCourtRegistry", null);
_ts_decorate([
    (0, _common.Get)(":id"),
    (0, _swagger.ApiOperation)({
        summary: "Get client by ID"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Client retrieved"
    }),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], ClientsController.prototype, "findById", null);
_ts_decorate([
    (0, _common.Post)(),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN, _subscriptionenum.UserRole.LAWYER),
    (0, _swagger.ApiOperation)({
        summary: "Create new client"
    }),
    (0, _swagger.ApiResponse)({
        status: 201,
        description: "Client created"
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _clientdto.CreateClientDto === "undefined" ? Object : _clientdto.CreateClientDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], ClientsController.prototype, "create", null);
_ts_decorate([
    (0, _common.Post)("import"),
    (0, _common.UseGuards)(_guards.RbacGuard, _guards.SubscriptionGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN, _subscriptionenum.UserRole.LAWYER),
    (0, _accesscontroldecorators.RequirePlan)(_subscriptionenum.SubscriptionPlan.PROFESSIONAL),
    (0, _swagger.ApiOperation)({
        summary: "Bulk import clients"
    }),
    (0, _swagger.ApiResponse)({
        status: 201,
        description: "Clients imported"
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _clientdto.BulkImportClientsDto === "undefined" ? Object : _clientdto.BulkImportClientsDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], ClientsController.prototype, "bulkImport", null);
_ts_decorate([
    (0, _common.Put)(":id"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN, _subscriptionenum.UserRole.LAWYER),
    (0, _swagger.ApiOperation)({
        summary: "Update client"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Client updated"
    }),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _clientdto.UpdateClientDto === "undefined" ? Object : _clientdto.UpdateClientDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], ClientsController.prototype, "update", null);
_ts_decorate([
    (0, _common.Patch)(":id"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN, _subscriptionenum.UserRole.LAWYER),
    (0, _swagger.ApiOperation)({
        summary: "Patch client (partial update)"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Client patched"
    }),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof Partial === "undefined" ? Object : Partial,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], ClientsController.prototype, "patch", null);
_ts_decorate([
    (0, _common.Delete)(":id"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN, _subscriptionenum.UserRole.LAWYER),
    (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT),
    (0, _swagger.ApiOperation)({
        summary: "Delete client"
    }),
    (0, _swagger.ApiResponse)({
        status: 204,
        description: "Client deleted"
    }),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _clientdto.DeleteClientDto === "undefined" ? Object : _clientdto.DeleteClientDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], ClientsController.prototype, "delete", null);
_ts_decorate([
    (0, _common.Post)(":id/restore"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN, _subscriptionenum.UserRole.LAWYER),
    (0, _swagger.ApiOperation)({
        summary: "Restore deleted client"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Client restored"
    }),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], ClientsController.prototype, "restore", null);
ClientsController = _ts_decorate([
    (0, _swagger.ApiTags)("Clients"),
    (0, _common.Controller)("clients"),
    (0, _common.UseGuards)(_guards.JwtAuthGuard, _guards.TenantGuard),
    (0, _swagger.ApiBearerAuth)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _clientservice.ClientService === "undefined" ? Object : _clientservice.ClientService,
        typeof _courtregistryservice.CourtRegistryService === "undefined" ? Object : _courtregistryservice.CourtRegistryService
    ])
], ClientsController);

//# sourceMappingURL=clients.controller.js.map