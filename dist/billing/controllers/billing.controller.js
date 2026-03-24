"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "BillingController", {
    enumerable: true,
    get: function() {
        return BillingController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _billingservice = require("../services/billing.service");
const _stripeservice = require("../services/stripe.service");
const _wayforpayservice = require("../services/wayforpay.service");
const _billingdto = require("../dto/billing.dto");
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
let BillingController = class BillingController {
    async createCheckoutSession(dto, req) {
        const tenantId = req.user?.tenant_id;
        if (dto.provider === "stripe") {
            return this.stripeService.createCheckoutSession(tenantId, dto);
        } else {
            return this.wayForPayService.createCheckoutSession(tenantId, dto);
        }
    }
    async createPortalSession(body, req) {
        const tenantId = req.user?.tenant_id;
        return this.stripeService.createPortalSession(tenantId, body.returnUrl);
    }
    async cancelSubscription(dto, req) {
        const tenantId = req.user?.tenant_id;
        await this.billingService.cancelSubscription(tenantId, dto.atPeriodEnd ?? true);
    }
    async resumeSubscription(dto, req) {
        const tenantId = req.user?.tenant_id;
        await this.billingService.resumeSubscription(tenantId, dto.plan);
    }
    async getSubscription(req) {
        const tenantId = req.user?.tenant_id;
        return this.billingService.getSubscription(tenantId);
    }
    async getInvoices(req) {
        const tenantId = req.user?.tenant_id;
        return this.billingService.getInvoices(tenantId);
    }
    async getPaymentMethods(req) {
        const tenantId = req.user?.tenant_id;
        return this.billingService.getPaymentMethods(tenantId);
    }
    constructor(billingService, stripeService, wayForPayService){
        this.billingService = billingService;
        this.stripeService = stripeService;
        this.wayForPayService = wayForPayService;
    }
};
_ts_decorate([
    (0, _common.Post)("checkout"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN),
    (0, _swagger.ApiOperation)({
        summary: "Create checkout session"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Checkout session created"
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _billingdto.CreateCheckoutSessionDto === "undefined" ? Object : _billingdto.CreateCheckoutSessionDto,
        typeof Request === "undefined" ? Object : Request
    ]),
    _ts_metadata("design:returntype", Promise)
], BillingController.prototype, "createCheckoutSession", null);
_ts_decorate([
    (0, _common.Post)("portal"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN),
    (0, _swagger.ApiOperation)({
        summary: "Create customer portal session"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Portal session created"
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        typeof Request === "undefined" ? Object : Request
    ]),
    _ts_metadata("design:returntype", Promise)
], BillingController.prototype, "createPortalSession", null);
_ts_decorate([
    (0, _common.Post)("cancel"),
    (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN),
    (0, _swagger.ApiOperation)({
        summary: "Cancel subscription"
    }),
    (0, _swagger.ApiResponse)({
        status: 204,
        description: "Subscription canceled"
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _billingdto.CancelSubscriptionDto === "undefined" ? Object : _billingdto.CancelSubscriptionDto,
        typeof Request === "undefined" ? Object : Request
    ]),
    _ts_metadata("design:returntype", Promise)
], BillingController.prototype, "cancelSubscription", null);
_ts_decorate([
    (0, _common.Post)("resume"),
    (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN),
    (0, _swagger.ApiOperation)({
        summary: "Resume subscription"
    }),
    (0, _swagger.ApiResponse)({
        status: 204,
        description: "Subscription resumed"
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _billingdto.ResumeSubscriptionDto === "undefined" ? Object : _billingdto.ResumeSubscriptionDto,
        typeof Request === "undefined" ? Object : Request
    ]),
    _ts_metadata("design:returntype", Promise)
], BillingController.prototype, "resumeSubscription", null);
_ts_decorate([
    (0, _common.Get)("subscription"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN, _subscriptionenum.UserRole.ACCOUNTANT),
    (0, _swagger.ApiOperation)({
        summary: "Get subscription details"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Subscription details"
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof Request === "undefined" ? Object : Request
    ]),
    _ts_metadata("design:returntype", Promise)
], BillingController.prototype, "getSubscription", null);
_ts_decorate([
    (0, _common.Get)("invoices"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN, _subscriptionenum.UserRole.ACCOUNTANT),
    (0, _swagger.ApiOperation)({
        summary: "Get invoices"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Invoices retrieved"
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof Request === "undefined" ? Object : Request
    ]),
    _ts_metadata("design:returntype", Promise)
], BillingController.prototype, "getInvoices", null);
_ts_decorate([
    (0, _common.Get)("payment-methods"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN, _subscriptionenum.UserRole.ACCOUNTANT),
    (0, _swagger.ApiOperation)({
        summary: "Get payment methods"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Payment methods retrieved"
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof Request === "undefined" ? Object : Request
    ]),
    _ts_metadata("design:returntype", Promise)
], BillingController.prototype, "getPaymentMethods", null);
BillingController = _ts_decorate([
    (0, _swagger.ApiTags)("Billing"),
    (0, _common.Controller)("billing"),
    (0, _common.UseGuards)(_guards.JwtAuthGuard),
    (0, _swagger.ApiBearerAuth)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _billingservice.BillingService === "undefined" ? Object : _billingservice.BillingService,
        typeof _stripeservice.StripeService === "undefined" ? Object : _stripeservice.StripeService,
        typeof _wayforpayservice.WayForPayService === "undefined" ? Object : _wayforpayservice.WayForPayService
    ])
], BillingController);

//# sourceMappingURL=billing.controller.js.map