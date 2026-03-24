"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "BillingService", {
    enumerable: true,
    get: function() {
        return BillingService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _Subscriptionentity = require("../../database/entities/Subscription.entity");
const _Organizationentity = require("../../database/entities/Organization.entity");
const _subscriptionenum = require("../../database/entities/enums/subscription.enum");
const _stripeservice = require("./stripe.service");
const _wayforpayservice = require("./wayforpay.service");
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
let BillingService = class BillingService {
    /**
   * Get subscription by tenant
   */ async getSubscription(tenantId) {
        return this.subscriptionRepository.findOne({
            where: {
                tenantId
            }
        });
    }
    /**
   * Cancel subscription
   */ async cancelSubscription(tenantId, atPeriodEnd) {
        const subscription = await this.getSubscription(tenantId);
        if (!subscription) {
            throw new Error("Subscription not found");
        }
        if (subscription.provider === "stripe" && subscription.subscriptionExternalId) {
            await this.stripeService.cancelSubscription(subscription.subscriptionExternalId, atPeriodEnd);
        }
        // Update local status
        if (!atPeriodEnd) {
            await this.subscriptionRepository.update({
                id: subscription.id
            }, {
                status: _subscriptionenum.SubscriptionStatus.CANCELED,
                canceledAt: new Date()
            });
        } else {
            await this.subscriptionRepository.update({
                id: subscription.id
            }, {
                cancelAtPeriodEnd: true
            });
        }
    }
    /**
   * Resume subscription
   */ async resumeSubscription(tenantId, newPlan) {
        const subscription = await this.getSubscription(tenantId);
        if (!subscription) {
            throw new Error("Subscription not found");
        }
        if (subscription.provider === "stripe" && subscription.subscriptionExternalId) {
            await this.stripeService.resumeSubscription(subscription.subscriptionExternalId);
            if (newPlan) {
                await this.stripeService.updateSubscriptionPlan(subscription.subscriptionExternalId, newPlan);
            }
        }
        // Update local status
        await this.subscriptionRepository.update({
            id: subscription.id
        }, {
            status: _subscriptionenum.SubscriptionStatus.ACTIVE,
            plan: newPlan || subscription.plan,
            cancelAtPeriodEnd: false,
            canceledAt: undefined
        });
    }
    /**
   * Get invoices
   */ async getInvoices(tenantId) {
        const subscription = await this.getSubscription(tenantId);
        if (!subscription) {
            return [];
        }
        if (subscription.provider === _subscriptionenum.SubscriptionProvider.STRIPE) {
            return this.stripeService.getInvoices(subscription.externalId, subscription.subscriptionExternalId);
        }
        return this.wayForPayService.getInvoices(subscription);
    }
    /**
   * Get payment methods
   */ async getPaymentMethods(tenantId) {
        const subscription = await this.getSubscription(tenantId);
        if (!subscription) {
            return [];
        }
        if (subscription.provider === _subscriptionenum.SubscriptionProvider.STRIPE) {
            return this.stripeService.getPaymentMethods(subscription.externalId);
        }
        return this.wayForPayService.getPaymentMethods(subscription);
    }
    /**
   * Synchronize subscription from provider webhook
   */ async synchronizeSubscriptionFromWebhook(data) {
        let subscription = await this.subscriptionRepository.findOne({
            where: {
                subscriptionExternalId: data.externalId,
                provider: data.provider
            }
        });
        if (!subscription && data.tenantId) {
            subscription = await this.subscriptionRepository.findOne({
                where: {
                    tenantId: data.tenantId,
                    provider: data.provider
                }
            });
        }
        if (subscription && data.webhookEventId && subscription.latestWebhookEventId === data.webhookEventId) {
            return {
                ignored: true,
                subscription
            };
        }
        const patch = {
            ...data.status ? {
                status: data.status
            } : {},
            ...data.plan ? {
                plan: data.plan
            } : {},
            ...data.trialStartAt ? {
                trialStartAt: data.trialStartAt
            } : {},
            ...data.trialEndAt ? {
                trialEndAt: data.trialEndAt
            } : {},
            ...data.currentPeriodStartAt ? {
                currentPeriodStartAt: data.currentPeriodStartAt
            } : {},
            ...data.currentPeriodEndAt ? {
                currentPeriodEndAt: data.currentPeriodEndAt
            } : {},
            ...data.cancelAtPeriodEnd !== undefined ? {
                cancelAtPeriodEnd: data.cancelAtPeriodEnd
            } : {},
            ...data.canceledAt !== undefined ? {
                canceledAt: data.canceledAt
            } : {},
            ...data.amountCents !== undefined ? {
                amountCents: data.amountCents
            } : {},
            ...data.currency ? {
                currency: data.currency
            } : {},
            ...data.customerExternalId !== undefined ? {
                externalId: data.customerExternalId
            } : {},
            ...data.metadata ? {
                metadata: {
                    ...subscription?.metadata || {},
                    ...data.metadata
                }
            } : {},
            ...data.webhookEventId ? {
                latestWebhookEventId: data.webhookEventId
            } : {},
            subscriptionExternalId: data.externalId,
            lastSyncedAt: new Date()
        };
        if (subscription) {
            Object.assign(subscription, patch);
            await this.subscriptionRepository.save(subscription);
        } else {
            if (!data.tenantId || !data.plan || !data.status) {
                throw new Error("tenantId, plan, and status are required to create a subscription from webhook");
            }
            subscription = this.subscriptionRepository.create({
                tenantId: data.tenantId,
                provider: data.provider,
                externalId: data.customerExternalId || data.externalId,
                subscriptionExternalId: data.externalId,
                plan: data.plan,
                status: data.status,
                trialStartAt: data.trialStartAt,
                trialEndAt: data.trialEndAt,
                currentPeriodStartAt: data.currentPeriodStartAt,
                currentPeriodEndAt: data.currentPeriodEndAt,
                cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
                canceledAt: data.canceledAt ?? null,
                amountCents: data.amountCents,
                currency: data.currency || "UAH",
                latestWebhookEventId: data.webhookEventId || null,
                lastSyncedAt: new Date(),
                metadata: data.metadata || {}
            });
            subscription = await this.subscriptionRepository.save(subscription);
        }
        await this.updateOrganizationSubscriptionSnapshot(subscription);
        return {
            ignored: false,
            subscription
        };
    }
    /**
   * Backwards-compatible wrapper
   */ async updateSubscriptionFromWebhook(externalId, provider, data) {
        await this.synchronizeSubscriptionFromWebhook({
            externalId,
            provider,
            ...data
        });
    }
    async createSubscriptionFromWebhook(tenantId, externalId, provider, data) {
        await this.synchronizeSubscriptionFromWebhook({
            tenantId,
            externalId,
            provider,
            ...data
        });
    }
    async updateOrganizationSubscriptionSnapshot(subscription) {
        await this.organizationRepository.update({
            id: subscription.tenantId
        }, {
            subscriptionPlan: subscription.plan,
            subscriptionStatus: subscription.status,
            currentPeriodEndAt: subscription.currentPeriodEndAt,
            trialEndAt: subscription.trialEndAt
        });
    }
    constructor(subscriptionRepository, organizationRepository, stripeService, wayForPayService){
        this.subscriptionRepository = subscriptionRepository;
        this.organizationRepository = organizationRepository;
        this.stripeService = stripeService;
        this.wayForPayService = wayForPayService;
    }
};
BillingService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_Subscriptionentity.Subscription)),
    _ts_param(1, (0, _typeorm.InjectRepository)(_Organizationentity.Organization)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _stripeservice.StripeService === "undefined" ? Object : _stripeservice.StripeService,
        typeof _wayforpayservice.WayForPayService === "undefined" ? Object : _wayforpayservice.WayForPayService
    ])
], BillingService);

//# sourceMappingURL=billing.service.js.map