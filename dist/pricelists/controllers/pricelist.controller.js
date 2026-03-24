"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PricelistsController", {
    enumerable: true,
    get: function() {
        return PricelistsController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _guards = require("../../auth/guards");
const _auditservice = require("../../auth/services/audit.service");
const _accesscontroldecorators = require("../../auth/decorators/access-control.decorators");
const _subscriptionenum = require("../../database/entities/enums/subscription.enum");
const _pricelistdto = require("../dto/pricelist.dto");
const _pricelistservice = require("../services/pricelist.service");
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
let PricelistsController = class PricelistsController {
    async findAll(filters, req) {
        const tenantId = req.user?.tenant_id;
        return this.pricelistService.findAll(tenantId, filters);
    }
    async getDefault(req) {
        const tenantId = req.user?.tenant_id;
        return this.pricelistService.getDefaultPricelist(tenantId);
    }
    async getItemsByCategory(category, req) {
        const tenantId = req.user?.tenant_id;
        return this.pricelistService.getItemsByCategory(tenantId, category);
    }
    async findById(id, req) {
        const tenantId = req.user?.tenant_id;
        return this.pricelistService.findById(tenantId, id);
    }
    async create(dto, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.pricelistService.create(tenantId, userId, dto);
    }
    async update(id, dto, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.pricelistService.update(tenantId, id, userId, dto);
    }
    async delete(id, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.pricelistService.delete(tenantId, id, userId);
    }
    async addCategory(id, dto, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.pricelistService.addCategory(tenantId, userId, id, dto);
    }
    async updateCategory(categoryId, dto, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.pricelistService.updateCategory(tenantId, categoryId, userId, dto);
    }
    async deleteCategory(categoryId, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.pricelistService.deleteCategory(tenantId, categoryId, userId);
    }
    async addItem(id, dto, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.pricelistService.addItem(tenantId, userId, id, dto);
    }
    async updateItem(itemId, dto, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.pricelistService.updateItem(tenantId, itemId, userId, dto);
    }
    async deleteItem(itemId, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.pricelistService.deleteItem(tenantId, itemId, userId);
    }
    async duplicate(id, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.pricelistService.duplicatePricelist(tenantId, userId, id);
    }
    constructor(pricelistService){
        this.pricelistService = pricelistService;
    }
};
PricelistsController.EDITOR_ROLES = [
    _subscriptionenum.UserRole.ORGANIZATION_OWNER,
    _subscriptionenum.UserRole.ORGANIZATION_ADMIN,
    _subscriptionenum.UserRole.LAWYER,
    _subscriptionenum.UserRole.ACCOUNTANT
];
_ts_decorate([
    (0, _common.Get)(),
    (0, _swagger.ApiOperation)({
        summary: "Get all pricelists"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Pricelists retrieved"
    }),
    _ts_param(0, (0, _common.Query)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _pricelistdto.PricelistFiltersDto === "undefined" ? Object : _pricelistdto.PricelistFiltersDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], PricelistsController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)("default"),
    (0, _swagger.ApiOperation)({
        summary: "Get default pricelist"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Default pricelist retrieved"
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], PricelistsController.prototype, "getDefault", null);
_ts_decorate([
    (0, _common.Get)("items"),
    (0, _swagger.ApiOperation)({
        summary: "Get items by category"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Items retrieved"
    }),
    _ts_param(0, (0, _common.Query)("category")),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], PricelistsController.prototype, "getItemsByCategory", null);
_ts_decorate([
    (0, _common.Get)(":id"),
    (0, _swagger.ApiOperation)({
        summary: "Get pricelist by ID"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Pricelist retrieved"
    }),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], PricelistsController.prototype, "findById", null);
_ts_decorate([
    (0, _common.Post)(),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(...PricelistsController.EDITOR_ROLES),
    (0, _swagger.ApiOperation)({
        summary: "Create new pricelist"
    }),
    (0, _swagger.ApiResponse)({
        status: 201,
        description: "Pricelist created"
    }),
    (0, _auditservice.Audit)("create"),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _pricelistdto.CreatePricelistDto === "undefined" ? Object : _pricelistdto.CreatePricelistDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], PricelistsController.prototype, "create", null);
_ts_decorate([
    (0, _common.Put)(":id"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(...PricelistsController.EDITOR_ROLES),
    (0, _swagger.ApiOperation)({
        summary: "Update pricelist"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Pricelist updated"
    }),
    (0, _auditservice.Audit)("update"),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _pricelistdto.UpdatePricelistDto === "undefined" ? Object : _pricelistdto.UpdatePricelistDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], PricelistsController.prototype, "update", null);
_ts_decorate([
    (0, _common.Delete)(":id"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(...PricelistsController.EDITOR_ROLES),
    (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT),
    (0, _swagger.ApiOperation)({
        summary: "Delete pricelist"
    }),
    (0, _swagger.ApiResponse)({
        status: 204,
        description: "Pricelist deleted"
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
], PricelistsController.prototype, "delete", null);
_ts_decorate([
    (0, _common.Post)(":id/categories"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(...PricelistsController.EDITOR_ROLES),
    (0, _swagger.ApiOperation)({
        summary: "Add category to pricelist"
    }),
    (0, _swagger.ApiResponse)({
        status: 201,
        description: "Category added"
    }),
    (0, _auditservice.Audit)("create"),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _pricelistdto.CreatePricelistCategoryDto === "undefined" ? Object : _pricelistdto.CreatePricelistCategoryDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], PricelistsController.prototype, "addCategory", null);
_ts_decorate([
    (0, _common.Put)("categories/:categoryId"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(...PricelistsController.EDITOR_ROLES),
    (0, _swagger.ApiOperation)({
        summary: "Update pricelist category"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Category updated"
    }),
    (0, _auditservice.Audit)("update"),
    _ts_param(0, (0, _common.Param)("categoryId")),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _pricelistdto.UpdatePricelistCategoryDto === "undefined" ? Object : _pricelistdto.UpdatePricelistCategoryDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], PricelistsController.prototype, "updateCategory", null);
_ts_decorate([
    (0, _common.Delete)("categories/:categoryId"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(...PricelistsController.EDITOR_ROLES),
    (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT),
    (0, _swagger.ApiOperation)({
        summary: "Delete pricelist category"
    }),
    (0, _swagger.ApiResponse)({
        status: 204,
        description: "Category deleted"
    }),
    (0, _auditservice.Audit)("delete"),
    _ts_param(0, (0, _common.Param)("categoryId")),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], PricelistsController.prototype, "deleteCategory", null);
_ts_decorate([
    (0, _common.Post)(":id/items"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(...PricelistsController.EDITOR_ROLES),
    (0, _swagger.ApiOperation)({
        summary: "Add item to pricelist"
    }),
    (0, _swagger.ApiResponse)({
        status: 201,
        description: "Item added"
    }),
    (0, _auditservice.Audit)("create"),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _pricelistdto.CreatePricelistItemDto === "undefined" ? Object : _pricelistdto.CreatePricelistItemDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], PricelistsController.prototype, "addItem", null);
_ts_decorate([
    (0, _common.Put)("items/:itemId"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(...PricelistsController.EDITOR_ROLES),
    (0, _swagger.ApiOperation)({
        summary: "Update pricelist item"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Item updated"
    }),
    (0, _auditservice.Audit)("update"),
    _ts_param(0, (0, _common.Param)("itemId")),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _pricelistdto.UpdatePricelistItemDto === "undefined" ? Object : _pricelistdto.UpdatePricelistItemDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], PricelistsController.prototype, "updateItem", null);
_ts_decorate([
    (0, _common.Delete)("items/:itemId"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(...PricelistsController.EDITOR_ROLES),
    (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT),
    (0, _swagger.ApiOperation)({
        summary: "Delete pricelist item"
    }),
    (0, _swagger.ApiResponse)({
        status: 204,
        description: "Item deleted"
    }),
    (0, _auditservice.Audit)("delete"),
    _ts_param(0, (0, _common.Param)("itemId")),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], PricelistsController.prototype, "deleteItem", null);
_ts_decorate([
    (0, _common.Post)(":id/duplicate"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(...PricelistsController.EDITOR_ROLES),
    (0, _swagger.ApiOperation)({
        summary: "Duplicate pricelist"
    }),
    (0, _swagger.ApiResponse)({
        status: 201,
        description: "Pricelist duplicated"
    }),
    (0, _auditservice.Audit)("create"),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], PricelistsController.prototype, "duplicate", null);
PricelistsController = _ts_decorate([
    (0, _swagger.ApiTags)("Pricelists"),
    (0, _common.Controller)("pricelists"),
    (0, _common.UseGuards)(_guards.JwtAuthGuard, _guards.TenantGuard),
    (0, _swagger.ApiBearerAuth)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _pricelistservice.PricelistService === "undefined" ? Object : _pricelistservice.PricelistService
    ])
], PricelistsController);

//# sourceMappingURL=pricelist.controller.js.map