"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "BillingWebhooksController", {
    enumerable: true,
    get: function() {
        return BillingWebhooksController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _stripeservice = require("../services/stripe.service");
const _wayforpayservice = require("../services/wayforpay.service");
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
let BillingWebhooksController = class BillingWebhooksController {
    async handleStripeWebhook(body, req) {
        const headers = req.headers;
        const signature = headers["stripe-signature"];
        if (!signature) {
            throw new Error("Missing stripe-signature header");
        }
        const payload = req.rawBody instanceof Buffer ? req.rawBody.toString("utf8") : JSON.stringify(body);
        await this.stripeService.handleWebhook(payload, signature);
    }
    async handleWayForPayWebhook(payload) {
        this.logger.log(`Received WayForPay webhook for order: ${payload.orderReference}`);
        const result = await this.wayForPayService.handleWebhook(payload);
        // Return response in WayForPay expected format
        return {
            status: result.status
        };
    }
    async handleWayForPayServiceCallback(payload) {
        this.logger.log(`Received WayForPay service callback for order: ${payload.orderReference}`);
        try {
            const result = await this.wayForPayService.handleWebhook(payload);
            // Generate response signature
            const signature = this.wayForPayService.generateCallbackResponse(payload.orderReference, result.status === "ok" ? "accept" : "decline");
            return {
                orderReference: payload.orderReference,
                status: result.status === "ok" ? "accept" : "decline",
                time: Math.floor(Date.now() / 1000),
                signature
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to process WayForPay service callback: ${errorMessage}`);
            return {
                orderReference: payload.orderReference,
                status: "decline",
                time: Math.floor(Date.now() / 1000)
            };
        }
    }
    constructor(stripeService, wayForPayService){
        this.stripeService = stripeService;
        this.wayForPayService = wayForPayService;
        this.logger = new _common.Logger(BillingWebhooksController.name);
    }
};
_ts_decorate([
    (0, _common.Post)("stripe"),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _swagger.ApiOperation)({
        summary: "Stripe webhook"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Webhook processed"
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        typeof Request === "undefined" ? Object : Request
    ]),
    _ts_metadata("design:returntype", Promise)
], BillingWebhooksController.prototype, "handleStripeWebhook", null);
_ts_decorate([
    (0, _common.Post)("wayforpay"),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _swagger.ApiOperation)({
        summary: "WayForPay webhook callback"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Webhook processed"
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], BillingWebhooksController.prototype, "handleWayForPayWebhook", null);
_ts_decorate([
    (0, _common.Post)("wayforpay/service"),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _swagger.ApiOperation)({
        summary: "WayForPay service callback (alternative endpoint)"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Service callback processed"
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], BillingWebhooksController.prototype, "handleWayForPayServiceCallback", null);
BillingWebhooksController = _ts_decorate([
    (0, _swagger.ApiTags)("Billing Webhooks"),
    (0, _common.Controller)("billing/webhooks"),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _stripeservice.StripeService === "undefined" ? Object : _stripeservice.StripeService,
        typeof _wayforpayservice.WayForPayService === "undefined" ? Object : _wayforpayservice.WayForPayService
    ])
], BillingWebhooksController);

//# sourceMappingURL=billing-webhooks.controller.js.map