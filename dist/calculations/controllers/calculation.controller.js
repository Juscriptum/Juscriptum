"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CalculationsController", {
    enumerable: true,
    get: function() {
        return CalculationsController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _calculationservice = require("../services/calculation.service");
const _calculationdto = require("../dto/calculation.dto");
const _guards = require("../../auth/guards");
const _auditservice = require("../../auth/services/audit.service");
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
let CalculationsController = class CalculationsController {
    async findAll(filters, req) {
        const tenantId = req.user?.tenant_id;
        return this.calculationService.findAll(tenantId, filters);
    }
    async getStatistics(req) {
        const tenantId = req.user?.tenant_id;
        return this.calculationService.getStatistics(tenantId);
    }
    async findById(id, req) {
        const tenantId = req.user?.tenant_id;
        return this.calculationService.findById(tenantId, id);
    }
    async create(dto, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.calculationService.create(tenantId, userId, dto);
    }
    async update(id, dto, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.calculationService.update(tenantId, id, userId, dto);
    }
    async delete(id, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.calculationService.delete(tenantId, id, userId);
    }
    async sendForApproval(id, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.calculationService.sendForApproval(tenantId, id, userId);
    }
    async approve(id, dto, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.calculationService.approve(tenantId, id, userId, dto);
    }
    async reject(id, dto, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.calculationService.reject(tenantId, id, userId, dto);
    }
    async generatePdf(id, dto, req) {
        const tenantId = req.user?.tenant_id;
        return this.calculationService.generatePdf(tenantId, id, dto);
    }
    async exportToExcel(id, req, res) {
        const tenantId = req.user?.tenant_id;
        const excelBuffer = await this.calculationService.exportToExcel(tenantId, id);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=calculation-${id}.xlsx`);
        res.send(excelBuffer);
    }
    async exportToPdf(id, req, res) {
        const tenantId = req.user?.tenant_id;
        const { pdfUrl } = await this.calculationService.generatePdf(tenantId, id, {
            calculationId: id
        });
        // Redirect to PDF URL or serve file
        res.redirect(pdfUrl);
    }
    constructor(calculationService){
        this.calculationService = calculationService;
    }
};
CalculationsController.EDITOR_ROLES = [
    _subscriptionenum.UserRole.ORGANIZATION_OWNER,
    _subscriptionenum.UserRole.ORGANIZATION_ADMIN,
    _subscriptionenum.UserRole.LAWYER,
    _subscriptionenum.UserRole.ACCOUNTANT
];
_ts_decorate([
    (0, _common.Get)(),
    (0, _swagger.ApiOperation)({
        summary: "Get all calculations"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Calculations retrieved"
    }),
    _ts_param(0, (0, _common.Query)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _calculationdto.CalculationFiltersDto === "undefined" ? Object : _calculationdto.CalculationFiltersDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], CalculationsController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)("statistics"),
    (0, _swagger.ApiOperation)({
        summary: "Get calculation statistics"
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
], CalculationsController.prototype, "getStatistics", null);
_ts_decorate([
    (0, _common.Get)(":id"),
    (0, _swagger.ApiOperation)({
        summary: "Get calculation by ID"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Calculation retrieved"
    }),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], CalculationsController.prototype, "findById", null);
_ts_decorate([
    (0, _common.Post)(),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(...CalculationsController.EDITOR_ROLES),
    (0, _swagger.ApiOperation)({
        summary: "Create new calculation"
    }),
    (0, _swagger.ApiResponse)({
        status: 201,
        description: "Calculation created"
    }),
    (0, _auditservice.Audit)("create"),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _calculationdto.CreateCalculationDto === "undefined" ? Object : _calculationdto.CreateCalculationDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], CalculationsController.prototype, "create", null);
_ts_decorate([
    (0, _common.Put)(":id"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(...CalculationsController.EDITOR_ROLES),
    (0, _swagger.ApiOperation)({
        summary: "Update calculation"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Calculation updated"
    }),
    (0, _auditservice.Audit)("update"),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _calculationdto.UpdateCalculationDto === "undefined" ? Object : _calculationdto.UpdateCalculationDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], CalculationsController.prototype, "update", null);
_ts_decorate([
    (0, _common.Delete)(":id"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(...CalculationsController.EDITOR_ROLES),
    (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT),
    (0, _swagger.ApiOperation)({
        summary: "Delete calculation"
    }),
    (0, _swagger.ApiResponse)({
        status: 204,
        description: "Calculation deleted"
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
], CalculationsController.prototype, "delete", null);
_ts_decorate([
    (0, _common.Post)(":id/send-for-approval"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(...CalculationsController.EDITOR_ROLES),
    (0, _swagger.ApiOperation)({
        summary: "Send calculation for approval"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Calculation sent for approval"
    }),
    (0, _auditservice.Audit)("update"),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], CalculationsController.prototype, "sendForApproval", null);
_ts_decorate([
    (0, _common.Post)(":id/approve"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(...CalculationsController.EDITOR_ROLES),
    (0, _swagger.ApiOperation)({
        summary: "Approve calculation"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Calculation approved"
    }),
    (0, _auditservice.Audit)("update"),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _calculationdto.ApproveCalculationDto === "undefined" ? Object : _calculationdto.ApproveCalculationDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], CalculationsController.prototype, "approve", null);
_ts_decorate([
    (0, _common.Post)(":id/reject"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(...CalculationsController.EDITOR_ROLES),
    (0, _swagger.ApiOperation)({
        summary: "Reject calculation"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Calculation rejected"
    }),
    (0, _auditservice.Audit)("update"),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _calculationdto.RejectCalculationDto === "undefined" ? Object : _calculationdto.RejectCalculationDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], CalculationsController.prototype, "reject", null);
_ts_decorate([
    (0, _common.Post)(":id/pdf"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(...CalculationsController.EDITOR_ROLES),
    (0, _swagger.ApiOperation)({
        summary: "Generate calculation PDF"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "PDF generated"
    }),
    (0, _auditservice.Audit)("update"),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _calculationdto.GeneratePdfDto === "undefined" ? Object : _calculationdto.GeneratePdfDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], CalculationsController.prototype, "generatePdf", null);
_ts_decorate([
    (0, _common.Get)(":id/export/excel"),
    (0, _swagger.ApiOperation)({
        summary: "Export calculation to Excel"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Excel exported",
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Req)()),
    _ts_param(2, (0, _common.Res)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], CalculationsController.prototype, "exportToExcel", null);
_ts_decorate([
    (0, _common.Get)(":id/export/pdf"),
    (0, _swagger.ApiOperation)({
        summary: "Export calculation to PDF"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "PDF exported",
        type: "application/pdf"
    }),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Req)()),
    _ts_param(2, (0, _common.Res)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], CalculationsController.prototype, "exportToPdf", null);
CalculationsController = _ts_decorate([
    (0, _swagger.ApiTags)("Calculations"),
    (0, _common.Controller)("calculations"),
    (0, _common.UseGuards)(_guards.JwtAuthGuard, _guards.TenantGuard),
    (0, _swagger.ApiBearerAuth)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _calculationservice.CalculationService === "undefined" ? Object : _calculationservice.CalculationService
    ])
], CalculationsController);

//# sourceMappingURL=calculation.controller.js.map