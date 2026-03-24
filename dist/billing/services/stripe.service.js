"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "StripeService", {
    enumerable: true,
    get: function() {
        return StripeService;
    }
});
const _common = require("@nestjs/common");
const _core = require("@nestjs/core");
const _config = require("@nestjs/config");
const _stripe = /*#__PURE__*/ _interop_require_default(require("stripe"));
const _subscriptionenum = require("../../database/entities/enums/subscription.enum");
const _auditservice = require("../../auth/services/audit.service");
const _billingtypes = require("./billing.types");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let StripeService = class StripeService {
    getStripe() {
        if (!this.stripe) {
            throw new _common.BadRequestException("Stripe is not configured");
        }
        return this.stripe;
    }
    getBillingSyncPort() {
        return this.moduleRef.get(_billingtypes.BILLING_SYNC_PORT, {
            strict: false
        });
    }
    /**
   * Create checkout session
   */ async createCheckoutSession(tenantId, dto) {
        const prices = await this.getPlanPrices(dto.plan);
        // Check if customer exists
        let customerId = await this.getCustomerId(tenantId);
        if (!customerId) {
            // Create customer
            const customer = await this.getStripe().customers.create({
                metadata: {
                    tenantId
                }
            });
            customerId = customer.id;
        }
        // Create checkout session
        const session = await this.getStripe().checkout.sessions.create({
            customer: customerId,
            payment_method_types: [
                "card"
            ],
            line_items: prices.map((price)=>({
                    price: price.id,
                    quantity: 1
                })),
            mode: "subscription",
            success_url: dto.successUrl || `${this.configService.get("APP_URL")}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: dto.cancelUrl || `${this.configService.get("APP_URL")}/billing/cancel`,
            subscription_data: {
                trial_period_days: dto.trial ? 14 : undefined,
                metadata: {
                    tenantId,
                    plan: dto.plan
                }
            },
            allow_promotion_codes: true
        });
        // Log audit
        await this.auditService.log({
            tenantId,
            action: "create",
            entityType: "CheckoutSession",
            entityId: session.id,
            metadata: {
                plan: dto.plan,
                trial: dto.trial
            }
        });
        return {
            checkoutUrl: session.url,
            sessionId: session.id
        };
    }
    /**
   * Create customer portal session
   */ async createPortalSession(tenantId, returnUrl) {
        const customerId = await this.getCustomerId(tenantId);
        if (!customerId) {
            throw new _common.BadRequestException("Customer not found");
        }
        const session = await this.getStripe().billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl
        });
        return {
            url: session.url
        };
    }
    /**
   * Cancel subscription
   */ async cancelSubscription(subscriptionId, atPeriodEnd = true) {
        return this.getStripe().subscriptions.update(subscriptionId, {
            cancel_at_period_end: atPeriodEnd
        });
    }
    /**
   * Resume subscription
   */ async resumeSubscription(subscriptionId) {
        return this.getStripe().subscriptions.update(subscriptionId, {
            cancel_at_period_end: false
        });
    }
    /**
   * Upgrade/Downgrade plan
   */ async updateSubscriptionPlan(subscriptionId, plan) {
        const price = await this.getPlanPrice(plan);
        return this.getStripe().subscriptions.update(subscriptionId, {
            items: [
                {
                    id: (await this.getStripe().subscriptions.retrieve(subscriptionId)).items.data[0].id,
                    price: price.id
                }
            ],
            proration_behavior: "create_prorations"
        });
    }
    async getInvoices(customerId, subscriptionId) {
        if (!customerId && !subscriptionId) {
            return [];
        }
        const invoices = await this.getStripe().invoices.list({
            ...customerId ? {
                customer: customerId
            } : {},
            ...subscriptionId ? {
                subscription: subscriptionId
            } : {},
            limit: 20
        });
        return invoices.data.map((invoice)=>({
                id: invoice.id,
                number: invoice.number || invoice.id,
                amount: invoice.amount_due ?? invoice.amount_paid ?? 0,
                currency: (invoice.currency || "usd").toUpperCase(),
                status: mapInvoiceStatus(invoice.status),
                dueDate: toDate(invoice.due_date),
                paidAt: toDate(invoice.status_transitions?.paid_at),
                pdfUrl: invoice.invoice_pdf || undefined,
                provider: _subscriptionenum.SubscriptionProvider.STRIPE
            }));
    }
    async getPaymentMethods(customerId) {
        if (!customerId) {
            return [];
        }
        const [paymentMethods, customer] = await Promise.all([
            this.getStripe().paymentMethods.list({
                customer: customerId,
                type: "card"
            }),
            this.getStripe().customers.retrieve(customerId)
        ]);
        const defaultPaymentMethodId = typeof customer === "object" && !("deleted" in customer && customer.deleted) ? getCustomerDefaultPaymentMethodId(customer) : null;
        return paymentMethods.data.map((method)=>({
                id: method.id,
                type: method.type === "us_bank_account" ? "bank_account" : "card",
                last4: method.type === "card" ? method.card?.last4 || undefined : method.us_bank_account?.last4 || undefined,
                brand: method.type === "card" ? method.card?.brand || undefined : undefined,
                expMonth: method.type === "card" ? method.card?.exp_month : undefined,
                expYear: method.type === "card" ? method.card?.exp_year : undefined,
                isDefault: method.id === defaultPaymentMethodId,
                provider: _subscriptionenum.SubscriptionProvider.STRIPE
            }));
    }
    /**
   * Handle webhook event
   */ async handleWebhook(payload, signature) {
        const webhookSecret = this.configService.get("STRIPE_WEBHOOK_SECRET");
        if (!webhookSecret) {
            throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
        }
        let event;
        try {
            event = this.getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
        } catch (error) {
            throw new _common.BadRequestException("Invalid webhook signature");
        }
        // Handle different event types
        switch(event.type){
            case "checkout.session.completed":
                await this.handleCheckoutSessionCompleted(event.data.object);
                break;
            case "customer.subscription.created":
                await this.handleSubscriptionCreated(event.data.object);
                break;
            case "customer.subscription.updated":
                await this.handleSubscriptionUpdated(event.data.object);
                break;
            case "customer.subscription.deleted":
                await this.handleSubscriptionDeleted(event.data.object);
                break;
            case "invoice.paid":
                await this.handleInvoicePaid(event.data.object);
                break;
            case "invoice.payment_failed":
                await this.handleInvoicePaymentFailed(event.data.object);
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
    }
    /**
   * Handle checkout session completed
   */ async handleCheckoutSessionCompleted(session) {
        const tenantId = session.metadata?.tenantId;
        const plan = session.metadata?.plan;
        if (!tenantId || !plan) {
            throw new _common.InternalServerErrorException("Missing metadata");
        }
        await this.getBillingSyncPort().synchronizeSubscriptionFromWebhook({
            tenantId,
            externalId: typeof session.subscription === "string" ? session.subscription : session.id,
            customerExternalId: typeof session.customer === "string" ? session.customer : undefined,
            provider: _subscriptionenum.SubscriptionProvider.STRIPE,
            webhookEventId: `checkout.session.completed:${session.id}`,
            plan,
            status: dtoTrialStatus(session),
            metadata: {
                stripe: {
                    checkoutSessionId: session.id,
                    paymentStatus: session.payment_status
                }
            }
        });
    }
    /**
   * Handle subscription created
   */ async handleSubscriptionCreated(subscription) {
        const tenantId = subscription.metadata?.tenantId;
        const plan = subscription.metadata?.plan;
        if (!tenantId) {
            throw new _common.InternalServerErrorException("Missing tenant_id in metadata");
        }
        await this.syncStripeSubscription(subscription, `customer.subscription.created:${subscription.id}:${subscription.status}`, tenantId, plan);
    }
    /**
   * Handle subscription updated
   */ async handleSubscriptionUpdated(subscription) {
        const tenantId = subscription.metadata?.tenantId;
        if (!tenantId) {
            return;
        }
        // Map Stripe status to our status
        const statusMap = {
            active: _subscriptionenum.SubscriptionStatus.ACTIVE,
            trialing: _subscriptionenum.SubscriptionStatus.TRIALING,
            past_due: _subscriptionenum.SubscriptionStatus.PAST_DUE,
            canceled: _subscriptionenum.SubscriptionStatus.CANCELED,
            unpaid: _subscriptionenum.SubscriptionStatus.UNPAID
        };
        const status = statusMap[subscription.status];
        if (!status) {
            return;
        }
        await this.syncStripeSubscription(subscription, `customer.subscription.updated:${subscription.id}:${subscription.status}:${subscription.current_period_end}`, tenantId, mapStripePlan(subscription, this.configService) || undefined, status);
    }
    /**
   * Handle subscription deleted
   */ async handleSubscriptionDeleted(subscription) {
        const tenantId = subscription.metadata?.tenantId;
        if (!tenantId) {
            return;
        }
        await this.syncStripeSubscription(subscription, `customer.subscription.deleted:${subscription.id}`, tenantId, mapStripePlan(subscription, this.configService) || undefined, _subscriptionenum.SubscriptionStatus.CANCELED);
    }
    /**
   * Handle invoice paid
   */ async handleInvoicePaid(invoice) {
        const subscriptionId = invoice.subscription;
        if (!subscriptionId) {
            return;
        }
        await this.getBillingSyncPort().synchronizeSubscriptionFromWebhook({
            externalId: subscriptionId,
            provider: _subscriptionenum.SubscriptionProvider.STRIPE,
            webhookEventId: `invoice.paid:${invoice.id}`,
            status: _subscriptionenum.SubscriptionStatus.ACTIVE,
            amountCents: invoice.amount_paid ?? invoice.amount_due ?? undefined,
            currency: invoice.currency?.toUpperCase(),
            metadata: {
                stripe: {
                    latestInvoiceId: invoice.id,
                    latestInvoiceStatus: invoice.status,
                    latestInvoicePdf: invoice.invoice_pdf
                }
            }
        });
    }
    /**
   * Handle invoice payment failed
   */ async handleInvoicePaymentFailed(invoice) {
        const subscriptionId = invoice.subscription;
        if (!subscriptionId) {
            return;
        }
        await this.getBillingSyncPort().synchronizeSubscriptionFromWebhook({
            externalId: subscriptionId,
            provider: _subscriptionenum.SubscriptionProvider.STRIPE,
            webhookEventId: `invoice.payment_failed:${invoice.id}`,
            status: _subscriptionenum.SubscriptionStatus.PAST_DUE,
            amountCents: invoice.amount_due ?? undefined,
            currency: invoice.currency?.toUpperCase(),
            metadata: {
                stripe: {
                    latestInvoiceId: invoice.id,
                    latestInvoiceStatus: invoice.status,
                    latestFailureMessage: invoice.last_finalization_error?.message
                }
            }
        });
    }
    /**
   * Get customer ID for tenant
   */ async getCustomerId(tenantId) {
        const customers = await this.getStripe().customers.list({
            email: undefined,
            limit: 1
        });
        const customer = customers.data.find((c)=>c.metadata?.tenantId === tenantId);
        return customer?.id || null;
    }
    /**
   * Get price for plan
   */ async getPlanPrice(plan) {
        const priceMap = {
            [_subscriptionenum.SubscriptionPlan.BASIC]: this.configService.get("STRIPE_PRICE_BASIC"),
            [_subscriptionenum.SubscriptionPlan.PROFESSIONAL]: this.configService.get("STRIPE_PRICE_PROFESSIONAL"),
            [_subscriptionenum.SubscriptionPlan.ENTERPRISE]: this.configService.get("STRIPE_PRICE_ENTERPRISE")
        };
        const priceId = priceMap[plan];
        if (!priceId) {
            throw new _common.InternalServerErrorException(`Price not configured for plan: ${plan}`);
        }
        return this.getStripe().prices.retrieve(priceId);
    }
    /**
   * Get all prices for plan
   */ async getPlanPrices(plan) {
        const price = await this.getPlanPrice(plan);
        return [
            price
        ];
    }
    async syncStripeSubscription(subscription, webhookEventId, tenantId, plan, statusOverride) {
        const statusMap = {
            active: _subscriptionenum.SubscriptionStatus.ACTIVE,
            trialing: _subscriptionenum.SubscriptionStatus.TRIALING,
            past_due: _subscriptionenum.SubscriptionStatus.PAST_DUE,
            canceled: _subscriptionenum.SubscriptionStatus.CANCELED,
            unpaid: _subscriptionenum.SubscriptionStatus.UNPAID
        };
        await this.getBillingSyncPort().synchronizeSubscriptionFromWebhook({
            tenantId,
            externalId: subscription.id,
            customerExternalId: typeof subscription.customer === "string" ? subscription.customer : undefined,
            provider: _subscriptionenum.SubscriptionProvider.STRIPE,
            webhookEventId,
            plan: plan || mapStripePlan(subscription, this.configService) || undefined,
            status: statusOverride || statusMap[subscription.status],
            trialStartAt: toDate(subscription.trial_start),
            trialEndAt: toDate(subscription.trial_end),
            currentPeriodStartAt: toDate(subscription.current_period_start),
            currentPeriodEndAt: toDate(subscription.current_period_end),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            canceledAt: toDate(subscription.canceled_at),
            amountCents: subscription.items.data[0]?.price?.unit_amount ?? undefined,
            currency: subscription.currency?.toUpperCase(),
            metadata: {
                stripe: {
                    latestStatus: subscription.status,
                    customerId: typeof subscription.customer === "string" ? subscription.customer : null
                }
            }
        });
    }
    constructor(configService, auditService, moduleRef){
        this.configService = configService;
        this.auditService = auditService;
        this.moduleRef = moduleRef;
        this.logger = new _common.Logger(StripeService.name);
        this.stripe = null;
        const secretKey = this.configService.get("STRIPE_SECRET_KEY");
        if (!secretKey) {
            this.logger.warn("Stripe is not configured - billing functionality will be limited");
            return;
        }
        this.stripe = new _stripe.default(secretKey, {
            apiVersion: "2023-08-16"
        });
    }
};
StripeService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService,
        typeof _auditservice.AuditService === "undefined" ? Object : _auditservice.AuditService,
        typeof _core.ModuleRef === "undefined" ? Object : _core.ModuleRef
    ])
], StripeService);
function mapStripePlan(subscription, configService) {
    const priceId = subscription.items.data[0]?.price?.id;
    const planMap = {
        [configService.get("STRIPE_PRICE_BASIC") || ""]: _subscriptionenum.SubscriptionPlan.BASIC,
        [configService.get("STRIPE_PRICE_PROFESSIONAL") || ""]: _subscriptionenum.SubscriptionPlan.PROFESSIONAL,
        [configService.get("STRIPE_PRICE_ENTERPRISE") || ""]: _subscriptionenum.SubscriptionPlan.ENTERPRISE
    };
    if (priceId && planMap[priceId]) {
        return planMap[priceId];
    }
    const metadataPlan = subscription.metadata?.plan;
    return metadataPlan || null;
}
function toDate(value) {
    return typeof value === "number" ? new Date(value * 1000) : undefined;
}
function mapInvoiceStatus(status) {
    switch(status){
        case "paid":
            return "paid";
        case "void":
            return "void";
        case "draft":
            return "draft";
        case "uncollectible":
            return "uncollectible";
        default:
            return "open";
    }
}
function dtoTrialStatus(session) {
    return session.payment_status === "paid" ? _subscriptionenum.SubscriptionStatus.ACTIVE : _subscriptionenum.SubscriptionStatus.TRIALING;
}
function getCustomerDefaultPaymentMethodId(customer) {
    const invoiceSettings = customer.invoice_settings;
    const defaultPaymentMethod = invoiceSettings?.default_payment_method;
    return typeof defaultPaymentMethod === "string" ? defaultPaymentMethod : defaultPaymentMethod?.id || null;
}

//# sourceMappingURL=stripe.service.js.map