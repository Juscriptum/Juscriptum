"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get CancelSubscriptionDto () {
        return CancelSubscriptionDto;
    },
    get CheckoutSessionResponseDto () {
        return CheckoutSessionResponseDto;
    },
    get CreateCheckoutSessionDto () {
        return CreateCheckoutSessionDto;
    },
    get PaymentMethodDto () {
        return PaymentMethodDto;
    },
    get ResumeSubscriptionDto () {
        return ResumeSubscriptionDto;
    },
    get WebhookDto () {
        return WebhookDto;
    }
});
const _classvalidator = require("class-validator");
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
let CreateCheckoutSessionDto = class CreateCheckoutSessionDto {
};
_ts_decorate([
    (0, _classvalidator.IsEnum)(_subscriptionenum.SubscriptionPlan),
    _ts_metadata("design:type", typeof _subscriptionenum.SubscriptionPlan === "undefined" ? Object : _subscriptionenum.SubscriptionPlan)
], CreateCheckoutSessionDto.prototype, "plan", void 0);
_ts_decorate([
    (0, _classvalidator.IsEnum)(_subscriptionenum.SubscriptionProvider),
    _ts_metadata("design:type", typeof _subscriptionenum.SubscriptionProvider === "undefined" ? Object : _subscriptionenum.SubscriptionProvider)
], CreateCheckoutSessionDto.prototype, "provider", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], CreateCheckoutSessionDto.prototype, "successUrl", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], CreateCheckoutSessionDto.prototype, "cancelUrl", void 0);
_ts_decorate([
    (0, _classvalidator.IsBoolean)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Boolean)
], CreateCheckoutSessionDto.prototype, "trial", void 0);
let CheckoutSessionResponseDto = class CheckoutSessionResponseDto {
};
let CancelSubscriptionDto = class CancelSubscriptionDto {
};
_ts_decorate([
    (0, _classvalidator.IsBoolean)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Boolean)
], CancelSubscriptionDto.prototype, "atPeriodEnd", void 0);
let ResumeSubscriptionDto = class ResumeSubscriptionDto {
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", typeof _subscriptionenum.SubscriptionPlan === "undefined" ? Object : _subscriptionenum.SubscriptionPlan)
], ResumeSubscriptionDto.prototype, "plan", void 0);
let WebhookDto = class WebhookDto {
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], WebhookDto.prototype, "signature", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], WebhookDto.prototype, "payload", void 0);
let PaymentMethodDto = class PaymentMethodDto {
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], PaymentMethodDto.prototype, "type", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], PaymentMethodDto.prototype, "token", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], PaymentMethodDto.prototype, "last4", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], PaymentMethodDto.prototype, "expMonth", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], PaymentMethodDto.prototype, "expYear", void 0);
_ts_decorate([
    (0, _classvalidator.IsBoolean)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Boolean)
], PaymentMethodDto.prototype, "isDefault", void 0);

//# sourceMappingURL=billing.dto.js.map