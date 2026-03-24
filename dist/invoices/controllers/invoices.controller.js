"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "InvoicesController", {
    enumerable: true,
    get: function() {
        return InvoicesController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _invoiceservice = require("../services/invoice.service");
const _invoicedto = require("../dto/invoice.dto");
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
let InvoicesController = class InvoicesController {
    async findAll(filters, req) {
        const tenantId = req.user?.tenant_id;
        return this.invoiceService.findAll(tenantId, filters);
    }
    async getStatistics(req) {
        const tenantId = req.user?.tenant_id;
        return this.invoiceService.getStatistics(tenantId);
    }
    async findById(id, req) {
        const tenantId = req.user?.tenant_id;
        return this.invoiceService.findById(tenantId, id);
    }
    async create(dto, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.invoiceService.create(tenantId, userId, dto);
    }
    async update(id, dto, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.invoiceService.update(tenantId, id, userId, dto);
    }
    async send(id, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.invoiceService.send(tenantId, id, userId);
    }
    async generatePdf(id, dto, req) {
        const tenantId = req.user?.tenant_id;
        return this.invoiceService.generatePdf(tenantId, id, dto);
    }
    async recordPayment(id, dto, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.invoiceService.recordPayment(tenantId, id, userId, dto);
    }
    async delete(id, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.invoiceService.delete(tenantId, id, userId);
    }
    constructor(invoiceService){
        this.invoiceService = invoiceService;
    }
};
_ts_decorate([
    (0, _common.Get)(),
    (0, _swagger.ApiOperation)({
        summary: "Get all invoices"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Invoices retrieved"
    }),
    _ts_param(0, (0, _common.Query)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _invoicedto.InvoiceFiltersDto === "undefined" ? Object : _invoicedto.InvoiceFiltersDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], InvoicesController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)("statistics"),
    (0, _swagger.ApiOperation)({
        summary: "Get invoice statistics"
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
], InvoicesController.prototype, "getStatistics", null);
_ts_decorate([
    (0, _common.Get)(":id"),
    (0, _swagger.ApiOperation)({
        summary: "Get invoice by ID"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Invoice retrieved"
    }),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], InvoicesController.prototype, "findById", null);
_ts_decorate([
    (0, _common.Post)(),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN, _subscriptionenum.UserRole.ACCOUNTANT),
    (0, _swagger.ApiOperation)({
        summary: "Create new invoice"
    }),
    (0, _swagger.ApiResponse)({
        status: 201,
        description: "Invoice created"
    }),
    (0, _auditservice.Audit)("create"),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _invoicedto.CreateInvoiceDto === "undefined" ? Object : _invoicedto.CreateInvoiceDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], InvoicesController.prototype, "create", null);
_ts_decorate([
    (0, _common.Put)(":id"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN, _subscriptionenum.UserRole.ACCOUNTANT),
    (0, _swagger.ApiOperation)({
        summary: "Update invoice"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Invoice updated"
    }),
    (0, _auditservice.Audit)("update"),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _invoicedto.UpdateInvoiceDto === "undefined" ? Object : _invoicedto.UpdateInvoiceDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], InvoicesController.prototype, "update", null);
_ts_decorate([
    (0, _common.Post)(":id/send"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN, _subscriptionenum.UserRole.ACCOUNTANT),
    (0, _swagger.ApiOperation)({
        summary: "Send invoice to client"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Invoice sent"
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
], InvoicesController.prototype, "send", null);
_ts_decorate([
    (0, _common.Post)(":id/pdf"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN, _subscriptionenum.UserRole.ACCOUNTANT),
    (0, _swagger.ApiOperation)({
        summary: "Generate invoice PDF"
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
        typeof _invoicedto.GenerateInvoicePdfDto === "undefined" ? Object : _invoicedto.GenerateInvoicePdfDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], InvoicesController.prototype, "generatePdf", null);
_ts_decorate([
    (0, _common.Post)(":id/payment"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN, _subscriptionenum.UserRole.ACCOUNTANT),
    (0, _swagger.ApiOperation)({
        summary: "Record payment"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Payment recorded"
    }),
    (0, _auditservice.Audit)("update"),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _invoicedto.RecordPaymentDto === "undefined" ? Object : _invoicedto.RecordPaymentDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], InvoicesController.prototype, "recordPayment", null);
_ts_decorate([
    (0, _common.Delete)(":id"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN, _subscriptionenum.UserRole.ACCOUNTANT),
    (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT),
    (0, _swagger.ApiOperation)({
        summary: "Delete invoice"
    }),
    (0, _swagger.ApiResponse)({
        status: 204,
        description: "Invoice deleted"
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
], InvoicesController.prototype, "delete", null);
InvoicesController = _ts_decorate([
    (0, _swagger.ApiTags)("Invoices"),
    (0, _common.Controller)("invoices"),
    (0, _common.UseGuards)(_guards.JwtAuthGuard, _guards.TenantGuard),
    (0, _swagger.ApiBearerAuth)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _invoiceservice.InvoiceService === "undefined" ? Object : _invoiceservice.InvoiceService
    ])
], InvoicesController);

//# sourceMappingURL=invoices.controller.js.map