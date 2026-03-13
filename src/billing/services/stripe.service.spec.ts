import { ConfigService } from "@nestjs/config";
import { ModuleRef } from "@nestjs/core";
import { AuditService } from "../../auth/services/audit.service";
import {
  SubscriptionPlan,
  SubscriptionProvider,
  SubscriptionStatus,
} from "../../database/entities/enums/subscription.enum";
import { BillingService } from "./billing.service";
import { StripeService } from "./stripe.service";

const mockConstructEvent = jest.fn();
const mockInvoicesList = jest.fn();
const mockPaymentMethodsList = jest.fn();
const mockCustomersRetrieve = jest.fn();

jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: mockConstructEvent,
    },
    invoices: {
      list: mockInvoicesList,
    },
    paymentMethods: {
      list: mockPaymentMethodsList,
    },
    customers: {
      retrieve: mockCustomersRetrieve,
      list: jest.fn().mockResolvedValue({ data: [] }),
      create: jest.fn(),
    },
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
    billingPortal: {
      sessions: {
        create: jest.fn(),
      },
    },
    subscriptions: {
      update: jest.fn(),
      retrieve: jest.fn(),
    },
    prices: {
      retrieve: jest.fn(),
    },
  }));
});

describe("StripeService", () => {
  let service: StripeService;
  let billingService: jest.Mocked<BillingService>;

  beforeEach(() => {
    billingService = {
      synchronizeSubscriptionFromWebhook: jest.fn(),
    } as unknown as jest.Mocked<BillingService>;

    service = new StripeService(
      createConfigService({
        STRIPE_SECRET_KEY: "sk_test_123",
        STRIPE_WEBHOOK_SECRET: "whsec_123",
        STRIPE_PRICE_BASIC: "price_basic",
        STRIPE_PRICE_PROFESSIONAL: "price_professional",
        STRIPE_PRICE_ENTERPRISE: "price_enterprise",
      }),
      {
        log: jest.fn(),
      } as unknown as AuditService,
      {
        get: jest.fn().mockReturnValue(billingService),
      } as unknown as ModuleRef,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("synchronizes Stripe subscription.updated webhook payloads into billing storage", async () => {
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_123",
          status: "active",
          metadata: {
            tenantId: "tenant-1",
            plan: SubscriptionPlan.PROFESSIONAL,
          },
          customer: "cus_123",
          trial_start: null,
          trial_end: null,
          current_period_start: 1710000000,
          current_period_end: 1712592000,
          cancel_at_period_end: false,
          canceled_at: null,
          currency: "usd",
          items: {
            data: [
              {
                price: {
                  id: "price_professional",
                  unit_amount: 2999,
                },
              },
            ],
          },
        },
      },
    });

    await service.handleWebhook("payload", "signature");

    expect(
      billingService.synchronizeSubscriptionFromWebhook,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-1",
        externalId: "sub_123",
        customerExternalId: "cus_123",
        provider: SubscriptionProvider.STRIPE,
        status: SubscriptionStatus.ACTIVE,
        plan: SubscriptionPlan.PROFESSIONAL,
        amountCents: 2999,
        currency: "USD",
      }),
    );
  });

  it("returns normalized invoices from Stripe API", async () => {
    mockInvoicesList.mockResolvedValue({
      data: [
        {
          id: "in_123",
          number: "INV-123",
          amount_due: 2999,
          amount_paid: 2999,
          currency: "usd",
          status: "paid",
          due_date: 1712592000,
          invoice_pdf: "https://example.com/invoice.pdf",
          status_transitions: {
            paid_at: 1712592000,
          },
        },
      ],
    });

    const result = await service.getInvoices("cus_123", "sub_123");

    expect(result).toEqual([
      expect.objectContaining({
        id: "in_123",
        number: "INV-123",
        amount: 2999,
        currency: "USD",
        status: "paid",
        pdfUrl: "https://example.com/invoice.pdf",
      }),
    ]);
  });

  it("returns normalized payment methods from Stripe API", async () => {
    mockPaymentMethodsList.mockResolvedValue({
      data: [
        {
          id: "pm_123",
          type: "card",
          card: {
            last4: "4242",
            brand: "visa",
            exp_month: 12,
            exp_year: 2030,
          },
        },
      ],
    });
    mockCustomersRetrieve.mockResolvedValue({
      id: "cus_123",
      invoice_settings: {
        default_payment_method: "pm_123",
      },
    });

    const result = await service.getPaymentMethods("cus_123");

    expect(result).toEqual([
      expect.objectContaining({
        id: "pm_123",
        type: "card",
        last4: "4242",
        brand: "visa",
        expMonth: 12,
        expYear: 2030,
        isDefault: true,
      }),
    ]);
  });
});

function createConfigService(values: Record<string, string>): ConfigService {
  return {
    get: jest.fn((key: string, defaultValue?: string) =>
      key in values ? values[key] : defaultValue,
    ),
  } as unknown as ConfigService;
}
