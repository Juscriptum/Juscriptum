"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "Subscription", {
    enumerable: true,
    get: function() {
        return Subscription;
    }
});
const _typeorm = require("typeorm");
const _subscriptionenum = require("./enums/subscription.enum");
const _Organizationentity = require("./Organization.entity");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let Subscription = class Subscription {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)("uuid"),
    _ts_metadata("design:type", String)
], Subscription.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "tenant_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], Subscription.prototype, "tenantId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar"
    }),
    _ts_metadata("design:type", typeof _subscriptionenum.SubscriptionProvider === "undefined" ? Object : _subscriptionenum.SubscriptionProvider)
], Subscription.prototype, "provider", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "external_id",
        type: "varchar",
        length: 255,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Subscription.prototype, "externalId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "subscription_external_id",
        type: "varchar",
        length: 255,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Subscription.prototype, "subscriptionExternalId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar"
    }),
    _ts_metadata("design:type", typeof _subscriptionenum.SubscriptionPlan === "undefined" ? Object : _subscriptionenum.SubscriptionPlan)
], Subscription.prototype, "plan", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar"
    }),
    _ts_metadata("design:type", typeof _subscriptionenum.SubscriptionStatus === "undefined" ? Object : _subscriptionenum.SubscriptionStatus)
], Subscription.prototype, "status", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "trial_start_at",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Subscription.prototype, "trialStartAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "trial_end_at",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Subscription.prototype, "trialEndAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "current_period_start_at",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Subscription.prototype, "currentPeriodStartAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "current_period_end_at",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Subscription.prototype, "currentPeriodEndAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "cancel_at_period_end",
        type: "boolean",
        default: false
    }),
    _ts_metadata("design:type", Boolean)
], Subscription.prototype, "cancelAtPeriodEnd", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "canceled_at",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], Subscription.prototype, "canceledAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "amount_cents",
        type: "int",
        nullable: true
    }),
    _ts_metadata("design:type", Number)
], Subscription.prototype, "amountCents", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 3,
        default: "UAH"
    }),
    _ts_metadata("design:type", String)
], Subscription.prototype, "currency", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "latest_webhook_event_id",
        type: "varchar",
        length: 255,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Subscription.prototype, "latestWebhookEventId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "last_synced_at",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Subscription.prototype, "lastSyncedAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "json"
    }),
    _ts_metadata("design:type", typeof Record === "undefined" ? Object : Record)
], Subscription.prototype, "metadata", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: "created_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Subscription.prototype, "createdAt", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: "updated_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Subscription.prototype, "updatedAt", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_Organizationentity.Organization, {
        onDelete: "CASCADE"
    }),
    (0, _typeorm.JoinColumn)({
        name: "tenant_id"
    }),
    _ts_metadata("design:type", typeof _Organizationentity.Organization === "undefined" ? Object : _Organizationentity.Organization)
], Subscription.prototype, "organization", void 0);
Subscription = _ts_decorate([
    (0, _typeorm.Entity)("subscriptions"),
    (0, _typeorm.Index)("idx_subscriptions_tenant_id", [
        "tenantId"
    ]),
    (0, _typeorm.Index)("idx_subscriptions_external_id", [
        "externalId"
    ]),
    (0, _typeorm.Index)("idx_subscriptions_status", [
        "status"
    ]),
    (0, _typeorm.Index)("idx_subscriptions_plan", [
        "plan"
    ])
], Subscription);

//# sourceMappingURL=Subscription.entity.js.map