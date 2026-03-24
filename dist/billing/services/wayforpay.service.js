"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "WayForPayService", {
    enumerable: true,
    get: function() {
        return WayForPayService;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _crypto = /*#__PURE__*/ _interop_require_wildcard(require("crypto"));
const _Subscriptionentity = require("../../database/entities/Subscription.entity");
const _Organizationentity = require("../../database/entities/Organization.entity");
const _subscriptionenum = require("../../database/entities/enums/subscription.enum");
const _auditservice = require("../../auth/services/audit.service");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
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
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let WayForPayService = class WayForPayService {
    /**
   * Create checkout session for subscription
   */ async createCheckoutSession(tenantId, dto) {
        if (!this.merchantAccount || !this.merchantSecretKey) {
            throw new _common.InternalServerErrorException("WayForPay is not configured");
        }
        const orderReference = this.generateOrderReference(tenantId, dto.plan);
        const planDetails = this.getPlanDetails(dto.plan);
        const amount = planDetails.amount;
        // Store pending order for webhook processing
        this.pendingOrders.set(orderReference, {
            tenantId,
            plan: dto.plan,
            createdAt: new Date(),
            email: dto.successUrl ? this.extractEmailFromUrl(dto.successUrl) : undefined
        });
        const orderDate = Math.floor(Date.now() / 1000);
        // Generate signature according to WayForPay documentation
        const signatureString = [
            this.merchantAccount,
            this.merchantDomain,
            orderReference,
            orderDate.toString(),
            amount.toString(),
            "UAH",
            planDetails.name,
            "1",
            amount.toString()
        ].join(";");
        const merchantSignature = this.generateWayForPaySignature(signatureString);
        // Build request data
        const requestData = {
            merchantAccount: this.merchantAccount,
            merchantDomainName: this.merchantDomain,
            merchantSignature,
            orderReference,
            orderDate,
            amount,
            currency: "UAH",
            productName: [
                planDetails.name
            ],
            productCount: [
                1
            ],
            productPrice: [
                amount
            ],
            language: "UA",
            serviceUrl: `${this.serviceUrl}/api/billing/webhooks/wayforpay`,
            returnURL: dto.successUrl || `${this.returnUrl}/billing/success?session_id=${orderReference}`,
            cancelURL: dto.cancelUrl || `${this.returnUrl}/billing/cancel?session_id=${orderReference}`,
            defaultPaymentSystem: "card"
        };
        try {
            this.logger.log(`Creating WayForPay checkout session for tenant ${tenantId}, plan ${dto.plan}`);
            // WayForPay uses form submission, so we construct the payment URL
            const checkoutUrl = this.buildPaymentUrl(requestData);
            // Log audit
            await this.auditService.log({
                tenantId,
                action: "create",
                entityType: "CheckoutSession",
                entityId: orderReference,
                metadata: {
                    plan: dto.plan,
                    provider: "wayforpay",
                    amount,
                    currency: "UAH"
                }
            });
            this.logger.log(`WayForPay checkout session created: ${orderReference}`);
            return {
                checkoutUrl,
                sessionId: orderReference
            };
        } catch (error) {
            this.logger.error("Failed to create WayForPay checkout session", error);
            throw new _common.InternalServerErrorException("Failed to create checkout session");
        }
    }
    /**
   * Handle webhook callback from WayForPay
   */ async handleWebhook(payload) {
        this.logger.log(`Received WayForPay webhook for order ${payload.orderReference}`);
        // Verify signature
        if (!this.verifyWebhookSignature(payload)) {
            this.logger.error("Invalid webhook signature");
            throw new _common.BadRequestException("Invalid signature");
        }
        // Extract tenant ID and plan from order reference
        const orderInfo = this.parseOrderReference(payload.orderReference);
        // Try to get from cache first
        let pendingOrder = this.pendingOrders.get(payload.orderReference);
        // If not in cache, try to find subscription by order reference
        if (!pendingOrder) {
            const existingSubscription = await this.subscriptionRepository.findOne({
                where: {
                    externalId: payload.orderReference
                }
            });
            if (existingSubscription) {
                pendingOrder = {
                    tenantId: existingSubscription.tenantId,
                    plan: existingSubscription.plan,
                    createdAt: existingSubscription.createdAt
                };
            } else {
                // Fallback to parsed order reference
                pendingOrder = {
                    tenantId: orderInfo.tenantId,
                    plan: orderInfo.plan,
                    createdAt: new Date()
                };
            }
        }
        const { tenantId, plan } = pendingOrder;
        // Map WayForPay status to our enum
        const statusMap = {
            Approved: _subscriptionenum.SubscriptionStatus.ACTIVE,
            "Awaiting Confirmation": _subscriptionenum.SubscriptionStatus.TRIALING,
            "In Progress": _subscriptionenum.SubscriptionStatus.TRIALING,
            Canceled: _subscriptionenum.SubscriptionStatus.CANCELED,
            Declined: _subscriptionenum.SubscriptionStatus.PAST_DUE,
            Expired: _subscriptionenum.SubscriptionStatus.CANCELED,
            Refunded: _subscriptionenum.SubscriptionStatus.CANCELED,
            "Partial Refunded": _subscriptionenum.SubscriptionStatus.ACTIVE,
            Processing: _subscriptionenum.SubscriptionStatus.TRIALING,
            "Waiting Auth Complete": _subscriptionenum.SubscriptionStatus.TRIALING
        };
        const status = statusMap[payload.orderStatus];
        if (!status) {
            this.logger.warn(`Unhandled WayForPay order status: ${payload.orderStatus}`);
            return {
                status: "ignored"
            };
        }
        try {
            const webhookEventId = [
                payload.orderReference,
                payload.orderStatus,
                payload.amount,
                payload.currency
            ].join(":");
            // Check if subscription exists
            let subscription = await this.subscriptionRepository.findOne({
                where: {
                    tenantId
                }
            });
            if (subscription && subscription.latestWebhookEventId === webhookEventId) {
                this.logger.log(`Ignoring duplicate WayForPay webhook ${webhookEventId} for tenant ${tenantId}`);
                return {
                    status: "ok"
                };
            }
            const currentPeriodEndAt = new Date();
            currentPeriodEndAt.setMonth(currentPeriodEndAt.getMonth() + 1);
            const paymentHistoryEntry = {
                orderReference: payload.orderReference,
                orderStatus: payload.orderStatus,
                amount: payload.amount,
                currency: payload.currency,
                card: payload.card,
                cardType: payload.cardType,
                clientName: payload.clientName,
                clientEmail: payload.clientEmail,
                reason: payload.reason,
                reasonCode: payload.reasonCode,
                processedAt: new Date().toISOString()
            };
            if (subscription) {
                // Update existing subscription
                subscription.status = status;
                subscription.plan = plan;
                subscription.externalId = payload.orderReference;
                subscription.lastSyncedAt = new Date();
                subscription.amountCents = Math.round(payload.amount * 100);
                subscription.currency = payload.currency;
                if (status === _subscriptionenum.SubscriptionStatus.ACTIVE) {
                    subscription.currentPeriodStartAt = new Date();
                    subscription.currentPeriodEndAt = currentPeriodEndAt;
                    subscription.canceledAt = null;
                    subscription.cancelAtPeriodEnd = false;
                } else if (status === _subscriptionenum.SubscriptionStatus.CANCELED) {
                    subscription.canceledAt = new Date();
                }
                subscription.latestWebhookEventId = webhookEventId;
                subscription.metadata = {
                    ...subscription.metadata,
                    wayforpay: {
                        ...subscription.metadata?.wayforpay || {},
                        card: payload.card,
                        cardType: payload.cardType,
                        clientName: payload.clientName,
                        clientEmail: payload.clientEmail,
                        lastWebhookAt: new Date().toISOString(),
                        orderStatus: payload.orderStatus,
                        reason: payload.reason,
                        reasonCode: payload.reasonCode,
                        history: [
                            ...subscription.metadata?.wayforpay?.history || [],
                            paymentHistoryEntry
                        ].slice(-20)
                    }
                };
                await this.subscriptionRepository.save(subscription);
                this.logger.log(`Updated subscription ${subscription.id} for tenant ${tenantId}`);
            } else {
                // Create new subscription
                subscription = this.subscriptionRepository.create({
                    tenantId,
                    provider: _subscriptionenum.SubscriptionProvider.WAYFORPAY,
                    externalId: payload.orderReference,
                    subscriptionExternalId: payload.orderReference,
                    plan,
                    status,
                    amountCents: Math.round(payload.amount * 100),
                    currency: payload.currency,
                    currentPeriodStartAt: status === _subscriptionenum.SubscriptionStatus.ACTIVE ? new Date() : undefined,
                    currentPeriodEndAt: status === _subscriptionenum.SubscriptionStatus.ACTIVE ? currentPeriodEndAt : undefined,
                    lastSyncedAt: new Date(),
                    latestWebhookEventId: webhookEventId,
                    metadata: {
                        wayforpay: {
                            card: payload.card,
                            cardType: payload.cardType,
                            clientName: payload.clientName,
                            clientEmail: payload.clientEmail,
                            lastWebhookAt: new Date().toISOString(),
                            orderStatus: payload.orderStatus,
                            reason: payload.reason,
                            reasonCode: payload.reasonCode,
                            history: [
                                paymentHistoryEntry
                            ]
                        }
                    }
                });
                await this.subscriptionRepository.save(subscription);
                this.logger.log(`Created subscription ${subscription.id} for tenant ${tenantId}`);
            }
            // Update organization subscription fields
            await this.organizationRepository.update({
                id: tenantId
            }, {
                subscriptionPlan: plan,
                subscriptionStatus: status,
                currentPeriodEndAt: status === _subscriptionenum.SubscriptionStatus.ACTIVE ? currentPeriodEndAt : undefined
            });
            // Log audit
            await this.auditService.log({
                tenantId,
                action: "update",
                entityType: "Subscription",
                entityId: subscription.id,
                metadata: {
                    provider: "wayforpay",
                    status,
                    plan,
                    orderReference: payload.orderReference,
                    orderStatus: payload.orderStatus,
                    amount: payload.amount,
                    currency: payload.currency
                }
            });
            // Clean up pending order
            this.pendingOrders.delete(payload.orderReference);
            this.logger.log(`WayForPay webhook processed successfully for order ${payload.orderReference}`);
            return {
                status: "ok"
            };
        } catch (error) {
            this.logger.error(`Failed to process webhook for order ${payload.orderReference}`, error);
            throw new _common.InternalServerErrorException("Failed to process webhook");
        }
    }
    /**
   * Verify WayForPay webhook signature
   */ verifyWebhookSignature(payload) {
        if (!this.merchantSecretKey) {
            return false;
        }
        try {
            // Build signature string according to WayForPay documentation
            const signatureFields = [
                payload.merchantAccount,
                payload.merchantDomainName,
                payload.orderReference,
                payload.orderDate.toString(),
                payload.amount.toString(),
                payload.currency,
                payload.productCount.toString()
            ];
            // Add product names
            payload.productName.forEach((name)=>signatureFields.push(name));
            // Add product prices
            payload.productPrice.forEach((price)=>signatureFields.push(price.toString()));
            // Add USD prices if available
            if (payload.productPriceUsd && payload.productPriceUsd.length > 0) {
                payload.productPriceUsd.forEach((price)=>signatureFields.push(price.toString()));
            }
            const signatureString = signatureFields.join(";");
            const expectedSignature = this.generateWayForPaySignature(signatureString);
            return _crypto.timingSafeEqual(Buffer.from(payload.signature, "hex"), Buffer.from(expectedSignature, "hex"));
        } catch (error) {
            this.logger.error("Error verifying webhook signature", error);
            return false;
        }
    }
    /**
   * Generate response signature for WayForPay callback
   */ generateCallbackResponse(orderReference, status) {
        const signatureString = orderReference + ";" + status + ";" + this.merchantSecretKey;
        return this.generateWayForPaySignature(signatureString);
    }
    /**
   * Get subscription status by order reference
   */ async getPaymentStatus(orderReference) {
        const subscription = await this.subscriptionRepository.findOne({
            where: {
                externalId: orderReference
            }
        });
        if (!subscription) {
            return {
                status: null,
                plan: null,
                amount: null
            };
        }
        return {
            status: subscription.status,
            plan: subscription.plan,
            amount: subscription.amountCents ? subscription.amountCents / 100 : null
        };
    }
    getInvoices(subscription) {
        const history = this.getWayForPayHistory(subscription);
        return history.map((entry, index)=>({
                id: `${entry.orderReference}-${index}`,
                number: entry.orderReference,
                amount: Math.round(Number(entry.amount || 0) * 100),
                currency: String(entry.currency || subscription.currency || "UAH"),
                status: mapWayForPayInvoiceStatus(String(entry.orderStatus || "")),
                paidAt: entry.orderStatus === "Approved" ? new Date(entry.processedAt) : undefined,
                provider: _subscriptionenum.SubscriptionProvider.WAYFORPAY
            }));
    }
    getPaymentMethods(subscription) {
        const wayforpayMetadata = subscription.metadata?.wayforpay || {};
        if (!wayforpayMetadata.card) {
            return [];
        }
        return [
            {
                id: subscription.externalId || subscription.subscriptionExternalId,
                type: "card",
                last4: String(wayforpayMetadata.card).slice(-4),
                brand: wayforpayMetadata.cardType || undefined,
                isDefault: true,
                provider: _subscriptionenum.SubscriptionProvider.WAYFORPAY
            }
        ];
    }
    /**
   * Generate order reference with encoded tenant and plan
   */ generateOrderReference(tenantId, plan) {
        const timestamp = Date.now();
        const random = _crypto.randomBytes(4).toString("hex");
        // Format: WFP-{tenantPrefix}-{plan}-{timestamp}-{random}
        return `WFP-${tenantId.substring(0, 8)}-${plan}-${timestamp}-${random}`;
    }
    /**
   * Parse order reference to extract tenant ID and plan
   */ parseOrderReference(reference) {
        const parts = reference.split("-");
        // Format: WFP-{tenantPrefix}-{plan}-{timestamp}-{random}
        if (parts.length >= 4 && parts[0] === "WFP") {
            const tenantPrefix = parts[1];
            const planStr = parts[2];
            // Try to find subscription by order reference
            return {
                tenantId: tenantPrefix,
                plan: Object.values(_subscriptionenum.SubscriptionPlan).includes(planStr) ? planStr : _subscriptionenum.SubscriptionPlan.BASIC
            };
        }
        // Legacy format fallback
        return {
            tenantId: parts[0],
            plan: parts[1] || _subscriptionenum.SubscriptionPlan.BASIC
        };
    }
    /**
   * Generate WayForPay signature (HMAC-MD5)
   */ generateWayForPaySignature(data) {
        return _crypto.createHmac("md5", this.merchantSecretKey).update(data).digest("hex");
    }
    /**
   * Build payment URL for redirect
   */ buildPaymentUrl(requestData) {
        const params = new URLSearchParams();
        Object.entries(requestData).forEach(([key, value])=>{
            if (Array.isArray(value)) {
                value.forEach((item, index)=>{
                    params.append(`${key}[${index}]`, String(item));
                });
            } else {
                params.append(key, String(value));
            }
        });
        return `${this.apiUrl}?${params.toString()}`;
    }
    /**
   * Get plan details for WayForPay
   */ getPlanDetails(plan) {
        const plans = {
            [_subscriptionenum.SubscriptionPlan.BASIC]: {
                name: "Law Organizer Basic",
                amount: 0
            },
            [_subscriptionenum.SubscriptionPlan.PROFESSIONAL]: {
                name: "Law Organizer Professional",
                amount: 499
            },
            [_subscriptionenum.SubscriptionPlan.ENTERPRISE]: {
                name: "Law Organizer Enterprise",
                amount: 1499
            }
        };
        return plans[plan];
    }
    /**
   * Extract email from URL query params
   */ extractEmailFromUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.searchParams.get("email") || "";
        } catch  {
            return "";
        }
    }
    /**
   * Clean up expired pending orders (call periodically)
   */ cleanupExpiredOrders() {
        const now = Date.now();
        const expirationTime = 24 * 60 * 60 * 1000; // 24 hours
        for (const [orderRef, order] of this.pendingOrders.entries()){
            if (now - order.createdAt.getTime() > expirationTime) {
                this.pendingOrders.delete(orderRef);
                this.logger.log(`Cleaned up expired pending order: ${orderRef}`);
            }
        }
    }
    getWayForPayHistory(subscription) {
        const history = subscription.metadata?.wayforpay?.history;
        return Array.isArray(history) ? [
            ...history
        ].reverse() : [];
    }
    constructor(configService, auditService, subscriptionRepository, organizationRepository){
        this.configService = configService;
        this.auditService = auditService;
        this.subscriptionRepository = subscriptionRepository;
        this.organizationRepository = organizationRepository;
        this.logger = new _common.Logger(WayForPayService.name);
        // In-memory cache for pending orders (in production, use Redis)
        this.pendingOrders = new Map();
        this.merchantAccount = this.configService.get("WAYFORPAY_MERCHANT_ACCOUNT");
        this.merchantDomain = this.configService.get("WAYFORPAY_MERCHANT_DOMAIN");
        this.merchantSecretKey = this.configService.get("WAYFORPAY_MERCHANT_SECRET_KEY");
        this.apiUrl = this.configService.get("WAYFORPAY_API_URL", "https://secure.wayforpay.com/pay");
        this.returnUrl = this.configService.get("APP_URL", "https://laworganizer.ua");
        this.serviceUrl = this.configService.get("APP_URL", "https://laworganizer.ua");
        if (!this.merchantAccount || !this.merchantSecretKey) {
            this.logger.warn("WayForPay is not configured - payment functionality will be limited");
        }
    }
};
WayForPayService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(2, (0, _typeorm.InjectRepository)(_Subscriptionentity.Subscription)),
    _ts_param(3, (0, _typeorm.InjectRepository)(_Organizationentity.Organization)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService,
        typeof _auditservice.AuditService === "undefined" ? Object : _auditservice.AuditService,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository
    ])
], WayForPayService);
function mapWayForPayInvoiceStatus(orderStatus) {
    if (orderStatus === "Approved") {
        return "paid";
    }
    if ([
        "Declined",
        "Canceled",
        "Expired"
    ].includes(orderStatus)) {
        return "void";
    }
    if ([
        "Refunded",
        "Partial Refunded"
    ].includes(orderStatus)) {
        return "uncollectible";
    }
    return "open";
}

//# sourceMappingURL=wayforpay.service.js.map