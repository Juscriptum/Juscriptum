"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _testing = require("@nestjs/testing");
const _typeorm = require("@nestjs/typeorm");
const _billingservice = require("./billing.service");
const _stripeservice = require("./stripe.service");
const _wayforpayservice = require("./wayforpay.service");
const _Subscriptionentity = require("../../database/entities/Subscription.entity");
const _Organizationentity = require("../../database/entities/Organization.entity");
const _subscriptionenum = require("../../database/entities/enums/subscription.enum");
describe("BillingService", ()=>{
    let service;
    let subscriptionRepository;
    let organizationRepository;
    let stripeService;
    let wayForPayService;
    const mockTenantId = "test-tenant-id";
    const mockSubscriptionId = "test-subscription-id";
    const mockExternalId = "ext_sub_123456";
    const mockSubscription = {
        id: mockSubscriptionId,
        tenantId: mockTenantId,
        provider: _subscriptionenum.SubscriptionProvider.STRIPE,
        externalId: "cus_123",
        subscriptionExternalId: mockExternalId,
        plan: _subscriptionenum.SubscriptionPlan.PROFESSIONAL,
        status: _subscriptionenum.SubscriptionStatus.ACTIVE,
        trialStartAt: new Date(),
        trialEndAt: new Date(),
        currentPeriodStartAt: new Date(),
        currentPeriodEndAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
        canceledAt: null,
        amountCents: 2999,
        currency: "USD",
        latestWebhookEventId: null,
        lastSyncedAt: new Date(),
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        organization: {}
    };
    beforeEach(async ()=>{
        const module = await _testing.Test.createTestingModule({
            providers: [
                _billingservice.BillingService,
                {
                    provide: (0, _typeorm.getRepositoryToken)(_Subscriptionentity.Subscription),
                    useValue: {
                        findOne: jest.fn(),
                        update: jest.fn(),
                        save: jest.fn(),
                        create: jest.fn()
                    }
                },
                {
                    provide: (0, _typeorm.getRepositoryToken)(_Organizationentity.Organization),
                    useValue: {
                        update: jest.fn()
                    }
                },
                {
                    provide: _stripeservice.StripeService,
                    useValue: {
                        cancelSubscription: jest.fn(),
                        resumeSubscription: jest.fn(),
                        updateSubscriptionPlan: jest.fn(),
                        getInvoices: jest.fn(),
                        getPaymentMethods: jest.fn()
                    }
                },
                {
                    provide: _wayforpayservice.WayForPayService,
                    useValue: {
                        getInvoices: jest.fn(),
                        getPaymentMethods: jest.fn()
                    }
                }
            ]
        }).compile();
        service = module.get(_billingservice.BillingService);
        subscriptionRepository = module.get((0, _typeorm.getRepositoryToken)(_Subscriptionentity.Subscription));
        organizationRepository = module.get((0, _typeorm.getRepositoryToken)(_Organizationentity.Organization));
        stripeService = module.get(_stripeservice.StripeService);
        wayForPayService = module.get(_wayforpayservice.WayForPayService);
    });
    afterEach(()=>{
        jest.clearAllMocks();
    });
    describe("getSubscription", ()=>{
        it("should return subscription for tenant", async ()=>{
            subscriptionRepository.findOne.mockResolvedValue(mockSubscription);
            const result = await service.getSubscription(mockTenantId);
            expect(result).toEqual(mockSubscription);
            expect(subscriptionRepository.findOne).toHaveBeenCalledWith({
                where: {
                    tenantId: mockTenantId
                }
            });
        });
        it("should return null if subscription not found", async ()=>{
            subscriptionRepository.findOne.mockResolvedValue(null);
            const result = await service.getSubscription(mockTenantId);
            expect(result).toBeNull();
        });
    });
    describe("cancelSubscription", ()=>{
        it("should cancel subscription immediately via Stripe", async ()=>{
            subscriptionRepository.findOne.mockResolvedValue(mockSubscription);
            stripeService.cancelSubscription.mockResolvedValue({});
            subscriptionRepository.update.mockResolvedValue({});
            await service.cancelSubscription(mockTenantId, false);
            expect(stripeService.cancelSubscription).toHaveBeenCalledWith(mockExternalId, false);
            expect(subscriptionRepository.update).toHaveBeenCalledWith({
                id: mockSubscriptionId
            }, {
                status: _subscriptionenum.SubscriptionStatus.CANCELED,
                canceledAt: expect.any(Date)
            });
        });
        it("should cancel subscription at period end via Stripe", async ()=>{
            subscriptionRepository.findOne.mockResolvedValue(mockSubscription);
            stripeService.cancelSubscription.mockResolvedValue({});
            subscriptionRepository.update.mockResolvedValue({});
            await service.cancelSubscription(mockTenantId, true);
            expect(stripeService.cancelSubscription).toHaveBeenCalledWith(mockExternalId, true);
            expect(subscriptionRepository.update).toHaveBeenCalledWith({
                id: mockSubscriptionId
            }, {
                cancelAtPeriodEnd: true
            });
        });
        it("should handle subscription without Stripe external ID", async ()=>{
            const localSubscription = {
                ...mockSubscription,
                provider: _subscriptionenum.SubscriptionProvider.WAYFORPAY,
                subscriptionExternalId: ""
            };
            subscriptionRepository.findOne.mockResolvedValue(localSubscription);
            subscriptionRepository.update.mockResolvedValue({});
            await service.cancelSubscription(mockTenantId, false);
            expect(stripeService.cancelSubscription).not.toHaveBeenCalled();
            expect(subscriptionRepository.update).toHaveBeenCalled();
        });
    });
    describe("resumeSubscription", ()=>{
        it("should resume subscription via Stripe", async ()=>{
            const canceledSubscription = {
                ...mockSubscription,
                status: _subscriptionenum.SubscriptionStatus.CANCELED,
                cancelAtPeriodEnd: true
            };
            subscriptionRepository.findOne.mockResolvedValue(canceledSubscription);
            stripeService.resumeSubscription.mockResolvedValue({});
            subscriptionRepository.update.mockResolvedValue({});
            await service.resumeSubscription(mockTenantId);
            expect(stripeService.resumeSubscription).toHaveBeenCalledWith(mockExternalId);
            expect(subscriptionRepository.update).toHaveBeenCalledWith({
                id: mockSubscriptionId
            }, {
                status: _subscriptionenum.SubscriptionStatus.ACTIVE,
                plan: canceledSubscription.plan,
                cancelAtPeriodEnd: false,
                canceledAt: undefined
            });
        });
        it("should resume and upgrade subscription plan", async ()=>{
            subscriptionRepository.findOne.mockResolvedValue(mockSubscription);
            stripeService.resumeSubscription.mockResolvedValue({});
            stripeService.updateSubscriptionPlan.mockResolvedValue({});
            subscriptionRepository.update.mockResolvedValue({});
            await service.resumeSubscription(mockTenantId, _subscriptionenum.SubscriptionPlan.ENTERPRISE);
            expect(stripeService.updateSubscriptionPlan).toHaveBeenCalledWith(mockExternalId, _subscriptionenum.SubscriptionPlan.ENTERPRISE);
            expect(subscriptionRepository.update).toHaveBeenCalledWith({
                id: mockSubscriptionId
            }, {
                status: _subscriptionenum.SubscriptionStatus.ACTIVE,
                plan: _subscriptionenum.SubscriptionPlan.ENTERPRISE,
                cancelAtPeriodEnd: false,
                canceledAt: undefined
            });
        });
    });
    describe("getInvoices", ()=>{
        it("should return Stripe invoices for Stripe subscription", async ()=>{
            subscriptionRepository.findOne.mockResolvedValue(mockSubscription);
            stripeService.getInvoices.mockResolvedValue([
                {
                    id: "in_1",
                    number: "INV-001",
                    amount: 2999,
                    currency: "USD",
                    status: "paid",
                    provider: _subscriptionenum.SubscriptionProvider.STRIPE
                }
            ]);
            const result = await service.getInvoices(mockTenantId);
            expect(result).toHaveLength(1);
            expect(stripeService.getInvoices).toHaveBeenCalledWith(mockSubscription.externalId, mockSubscription.subscriptionExternalId);
        });
        it("should return WayForPay invoices for non-Stripe subscription", async ()=>{
            const wayforpaySubscription = {
                ...mockSubscription,
                provider: _subscriptionenum.SubscriptionProvider.WAYFORPAY
            };
            subscriptionRepository.findOne.mockResolvedValue(wayforpaySubscription);
            wayForPayService.getInvoices.mockImplementation(()=>[
                    {
                        id: "wfp_1",
                        number: "WFP-001",
                        amount: 49900,
                        currency: "UAH",
                        status: "paid",
                        provider: _subscriptionenum.SubscriptionProvider.WAYFORPAY
                    }
                ]);
            const result = await service.getInvoices(mockTenantId);
            expect(result).toHaveLength(1);
            expect(wayForPayService.getInvoices).toHaveBeenCalledWith(wayforpaySubscription);
        });
    });
    describe("getPaymentMethods", ()=>{
        it("should return Stripe payment methods for Stripe subscription", async ()=>{
            subscriptionRepository.findOne.mockResolvedValue(mockSubscription);
            stripeService.getPaymentMethods.mockResolvedValue([
                {
                    id: "pm_1",
                    type: "card",
                    last4: "4242",
                    isDefault: true,
                    provider: _subscriptionenum.SubscriptionProvider.STRIPE
                }
            ]);
            const result = await service.getPaymentMethods(mockTenantId);
            expect(result).toHaveLength(1);
            expect(stripeService.getPaymentMethods).toHaveBeenCalledWith(mockSubscription.externalId);
        });
    });
    describe("synchronizeSubscriptionFromWebhook", ()=>{
        it("should update an existing subscription and organization snapshot", async ()=>{
            subscriptionRepository.findOne.mockResolvedValueOnce(mockSubscription);
            subscriptionRepository.save.mockImplementation(async (value)=>value);
            const result = await service.synchronizeSubscriptionFromWebhook({
                externalId: mockExternalId,
                provider: _subscriptionenum.SubscriptionProvider.STRIPE,
                webhookEventId: "evt_1",
                status: _subscriptionenum.SubscriptionStatus.ACTIVE,
                plan: _subscriptionenum.SubscriptionPlan.ENTERPRISE,
                currentPeriodEndAt: new Date("2024-12-31"),
                amountCents: 4999,
                currency: "USD"
            });
            expect(result.ignored).toBe(false);
            expect(subscriptionRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                status: _subscriptionenum.SubscriptionStatus.ACTIVE,
                plan: _subscriptionenum.SubscriptionPlan.ENTERPRISE,
                latestWebhookEventId: "evt_1",
                amountCents: 4999
            }));
            expect(organizationRepository.update).toHaveBeenCalledWith({
                id: mockTenantId
            }, expect.objectContaining({
                subscriptionPlan: _subscriptionenum.SubscriptionPlan.ENTERPRISE,
                subscriptionStatus: _subscriptionenum.SubscriptionStatus.ACTIVE
            }));
        });
        it("should ignore duplicate webhook events", async ()=>{
            subscriptionRepository.findOne.mockResolvedValueOnce({
                ...mockSubscription,
                latestWebhookEventId: "evt_dup"
            });
            const result = await service.synchronizeSubscriptionFromWebhook({
                externalId: mockExternalId,
                provider: _subscriptionenum.SubscriptionProvider.STRIPE,
                webhookEventId: "evt_dup",
                status: _subscriptionenum.SubscriptionStatus.ACTIVE
            });
            expect(result.ignored).toBe(true);
            expect(subscriptionRepository.save).not.toHaveBeenCalled();
            expect(organizationRepository.update).not.toHaveBeenCalled();
        });
        it("should create subscription from webhook data", async ()=>{
            subscriptionRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
            subscriptionRepository.create.mockImplementation((value)=>value);
            subscriptionRepository.save.mockImplementation(async (value)=>value);
            await service.synchronizeSubscriptionFromWebhook({
                tenantId: mockTenantId,
                externalId: mockExternalId,
                provider: _subscriptionenum.SubscriptionProvider.WAYFORPAY,
                webhookEventId: "wfp_evt_1",
                plan: _subscriptionenum.SubscriptionPlan.BASIC,
                status: _subscriptionenum.SubscriptionStatus.TRIALING
            });
            expect(subscriptionRepository.create).toHaveBeenCalledWith(expect.objectContaining({
                tenantId: mockTenantId,
                provider: _subscriptionenum.SubscriptionProvider.WAYFORPAY,
                subscriptionExternalId: mockExternalId,
                latestWebhookEventId: "wfp_evt_1"
            }));
            expect(organizationRepository.update).toHaveBeenCalled();
        });
    });
});

//# sourceMappingURL=billing.service.spec.js.map