import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import {
  SubscriptionStatus,
  SubscriptionPlan,
  SubscriptionProvider,
} from "../../database/entities/enums/subscription.enum";
import { CreateCheckoutSessionDto } from "../dto/billing.dto";
import { AuditService } from "../../auth/services/audit.service";
import {
  BILLING_SYNC_PORT,
  BillingSyncPort,
  BillingInvoiceView,
  BillingPaymentMethodView,
} from "./billing.types";

/**
 * Stripe Service
 */
@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly moduleRef: ModuleRef,
  ) {
    const secretKey = this.configService.get<string>("STRIPE_SECRET_KEY");

    if (!secretKey) {
      this.logger.warn(
        "Stripe is not configured - billing functionality will be limited",
      );
      return;
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: "2023-08-16",
    });
  }

  private getStripe(): Stripe {
    if (!this.stripe) {
      throw new BadRequestException("Stripe is not configured");
    }

    return this.stripe;
  }

  private getBillingSyncPort(): BillingSyncPort {
    return this.moduleRef.get<BillingSyncPort>(BILLING_SYNC_PORT, {
      strict: false,
    });
  }

  /**
   * Create checkout session
   */
  async createCheckoutSession(
    tenantId: string,
    dto: CreateCheckoutSessionDto,
  ): Promise<{ checkoutUrl: string; sessionId: string }> {
    const prices = await this.getPlanPrices(dto.plan);

    // Check if customer exists
    let customerId = await this.getCustomerId(tenantId);

    if (!customerId) {
      // Create customer
      const customer = await this.getStripe().customers.create({
        metadata: { tenantId },
      });

      customerId = customer.id;
    }

    // Create checkout session
    const session = await this.getStripe().checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: prices.map((price: Stripe.Price) => ({
        price: price.id,
        quantity: 1,
      })),
      mode: "subscription",
      success_url:
        dto.successUrl ||
        `${this.configService.get("APP_URL")}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        dto.cancelUrl || `${this.configService.get("APP_URL")}/billing/cancel`,
      subscription_data: {
        trial_period_days: dto.trial ? 14 : undefined,
        metadata: { tenantId, plan: dto.plan },
      },
      allow_promotion_codes: true,
    });

    // Log audit
    await this.auditService.log({
      tenantId,
      action: "create",
      entityType: "CheckoutSession",
      entityId: session.id,
      metadata: {
        plan: dto.plan,
        trial: dto.trial,
      },
    });

    return {
      checkoutUrl: session.url!,
      sessionId: session.id,
    };
  }

  /**
   * Create customer portal session
   */
  async createPortalSession(
    tenantId: string,
    returnUrl: string,
  ): Promise<{ url: string }> {
    const customerId = await this.getCustomerId(tenantId);

    if (!customerId) {
      throw new BadRequestException("Customer not found");
    }

    const session = await this.getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return { url: session.url! };
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    atPeriodEnd: boolean = true,
  ): Promise<Stripe.Subscription> {
    return this.getStripe().subscriptions.update(subscriptionId, {
      cancel_at_period_end: atPeriodEnd,
    });
  }

  /**
   * Resume subscription
   */
  async resumeSubscription(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    return this.getStripe().subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
  }

  /**
   * Upgrade/Downgrade plan
   */
  async updateSubscriptionPlan(
    subscriptionId: string,
    plan: SubscriptionPlan,
  ): Promise<Stripe.Subscription> {
    const price = await this.getPlanPrice(plan);

    return this.getStripe().subscriptions.update(subscriptionId, {
      items: [
        {
          id: (await this.getStripe().subscriptions.retrieve(subscriptionId)).items
            .data[0].id,
          price: price.id,
        },
      ],
      proration_behavior: "create_prorations",
    });
  }

  async getInvoices(
    customerId?: string | null,
    subscriptionId?: string | null,
  ): Promise<BillingInvoiceView[]> {
    if (!customerId && !subscriptionId) {
      return [];
    }

    const invoices = await this.getStripe().invoices.list({
      ...(customerId ? { customer: customerId } : {}),
      ...(subscriptionId ? { subscription: subscriptionId } : {}),
      limit: 20,
    });

    return invoices.data.map((invoice) => ({
      id: invoice.id,
      number: invoice.number || invoice.id,
      amount: invoice.amount_due ?? invoice.amount_paid ?? 0,
      currency: (invoice.currency || "usd").toUpperCase(),
      status: mapInvoiceStatus(invoice.status),
      dueDate: toDate(invoice.due_date),
      paidAt: toDate(invoice.status_transitions?.paid_at),
      pdfUrl: invoice.invoice_pdf || undefined,
      provider: SubscriptionProvider.STRIPE,
    }));
  }

  async getPaymentMethods(
    customerId?: string | null,
  ): Promise<BillingPaymentMethodView[]> {
    if (!customerId) {
      return [];
    }

    const [paymentMethods, customer] = await Promise.all([
      this.getStripe().paymentMethods.list({
        customer: customerId,
        type: "card",
      }),
      this.getStripe().customers.retrieve(customerId),
    ]);

    const defaultPaymentMethodId =
      typeof customer === "object" &&
      !("deleted" in customer && customer.deleted)
        ? getCustomerDefaultPaymentMethodId(customer)
        : null;

    return paymentMethods.data.map((method) => ({
      id: method.id,
      type: method.type === "us_bank_account" ? "bank_account" : "card",
      last4:
        method.type === "card"
          ? method.card?.last4 || undefined
          : method.us_bank_account?.last4 || undefined,
      brand:
        method.type === "card" ? method.card?.brand || undefined : undefined,
      expMonth: method.type === "card" ? method.card?.exp_month : undefined,
      expYear: method.type === "card" ? method.card?.exp_year : undefined,
      isDefault: method.id === defaultPaymentMethodId,
      provider: SubscriptionProvider.STRIPE,
    }));
  }

  /**
   * Handle webhook event
   */
  async handleWebhook(payload: string, signature: string): Promise<void> {
    const webhookSecret = this.configService.get<string>(
      "STRIPE_WEBHOOK_SECRET",
    );

    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
    }

    let event: Stripe.Event;

    try {
      event = this.getStripe().webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch (error) {
      throw new BadRequestException("Invalid webhook signature");
    }

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed":
        await this.handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case "customer.subscription.created":
        await this.handleSubscriptionCreated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case "customer.subscription.updated":
        await this.handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case "customer.subscription.deleted":
        await this.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;

      case "invoice.paid":
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await this.handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice,
        );
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  /**
   * Handle checkout session completed
   */
  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const tenantId = session.metadata?.tenantId;
    const plan = session.metadata?.plan as SubscriptionPlan;

    if (!tenantId || !plan) {
      throw new InternalServerErrorException("Missing metadata");
    }

    await this.getBillingSyncPort().synchronizeSubscriptionFromWebhook({
      tenantId,
      externalId:
        typeof session.subscription === "string"
          ? session.subscription
          : session.id,
      customerExternalId:
        typeof session.customer === "string" ? session.customer : undefined,
      provider: SubscriptionProvider.STRIPE,
      webhookEventId: `checkout.session.completed:${session.id}`,
      plan,
      status: dtoTrialStatus(session),
      metadata: {
        stripe: {
          checkoutSessionId: session.id,
          paymentStatus: session.payment_status,
        },
      },
    });
  }

  /**
   * Handle subscription created
   */
  private async handleSubscriptionCreated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const tenantId = subscription.metadata?.tenantId;
    const plan = subscription.metadata?.plan as SubscriptionPlan;

    if (!tenantId) {
      throw new InternalServerErrorException("Missing tenant_id in metadata");
    }

    await this.syncStripeSubscription(
      subscription,
      `customer.subscription.created:${subscription.id}:${subscription.status}`,
      tenantId,
      plan,
    );
  }

  /**
   * Handle subscription updated
   */
  private async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const tenantId = subscription.metadata?.tenantId;

    if (!tenantId) {
      return;
    }

    // Map Stripe status to our status
    const statusMap: Record<string, SubscriptionStatus> = {
      active: SubscriptionStatus.ACTIVE,
      trialing: SubscriptionStatus.TRIALING,
      past_due: SubscriptionStatus.PAST_DUE,
      canceled: SubscriptionStatus.CANCELED,
      unpaid: SubscriptionStatus.UNPAID,
    };

    const status = statusMap[subscription.status];

    if (!status) {
      return;
    }

    await this.syncStripeSubscription(
      subscription,
      `customer.subscription.updated:${subscription.id}:${subscription.status}:${subscription.current_period_end}`,
      tenantId,
      mapStripePlan(subscription, this.configService) || undefined,
      status,
    );
  }

  /**
   * Handle subscription deleted
   */
  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const tenantId = subscription.metadata?.tenantId;

    if (!tenantId) {
      return;
    }

    await this.syncStripeSubscription(
      subscription,
      `customer.subscription.deleted:${subscription.id}`,
      tenantId,
      mapStripePlan(subscription, this.configService) || undefined,
      SubscriptionStatus.CANCELED,
    );
  }

  /**
   * Handle invoice paid
   */
  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const subscriptionId = invoice.subscription as string;

    if (!subscriptionId) {
      return;
    }

    await this.getBillingSyncPort().synchronizeSubscriptionFromWebhook({
      externalId: subscriptionId,
      provider: SubscriptionProvider.STRIPE,
      webhookEventId: `invoice.paid:${invoice.id}`,
      status: SubscriptionStatus.ACTIVE,
      amountCents: invoice.amount_paid ?? invoice.amount_due ?? undefined,
      currency: invoice.currency?.toUpperCase(),
      metadata: {
        stripe: {
          latestInvoiceId: invoice.id,
          latestInvoiceStatus: invoice.status,
          latestInvoicePdf: invoice.invoice_pdf,
        },
      },
    });
  }

  /**
   * Handle invoice payment failed
   */
  private async handleInvoicePaymentFailed(
    invoice: Stripe.Invoice,
  ): Promise<void> {
    const subscriptionId = invoice.subscription as string;

    if (!subscriptionId) {
      return;
    }

    await this.getBillingSyncPort().synchronizeSubscriptionFromWebhook({
      externalId: subscriptionId,
      provider: SubscriptionProvider.STRIPE,
      webhookEventId: `invoice.payment_failed:${invoice.id}`,
      status: SubscriptionStatus.PAST_DUE,
      amountCents: invoice.amount_due ?? undefined,
      currency: invoice.currency?.toUpperCase(),
      metadata: {
        stripe: {
          latestInvoiceId: invoice.id,
          latestInvoiceStatus: invoice.status,
          latestFailureMessage: invoice.last_finalization_error?.message,
        },
      },
    });
  }

  /**
   * Get customer ID for tenant
   */
  private async getCustomerId(tenantId: string): Promise<string | null> {
    const customers = await this.getStripe().customers.list({
      email: undefined,
      limit: 1,
    });

    const customer = customers.data.find(
      (c) => c.metadata?.tenantId === tenantId,
    );
    return customer?.id || null;
  }

  /**
   * Get price for plan
   */
  private async getPlanPrice(plan: SubscriptionPlan): Promise<Stripe.Price> {
    const priceMap: Record<SubscriptionPlan, string> = {
      [SubscriptionPlan.BASIC]: this.configService.get("STRIPE_PRICE_BASIC")!,
      [SubscriptionPlan.PROFESSIONAL]: this.configService.get(
        "STRIPE_PRICE_PROFESSIONAL",
      )!,
      [SubscriptionPlan.ENTERPRISE]: this.configService.get(
        "STRIPE_PRICE_ENTERPRISE",
      )!,
    };

    const priceId = priceMap[plan];

    if (!priceId) {
      throw new InternalServerErrorException(
        `Price not configured for plan: ${plan}`,
      );
    }

    return this.getStripe().prices.retrieve(priceId);
  }

  /**
   * Get all prices for plan
   */
  private async getPlanPrices(plan: SubscriptionPlan): Promise<Stripe.Price[]> {
    const price = await this.getPlanPrice(plan);
    return [price];
  }

  private async syncStripeSubscription(
    subscription: Stripe.Subscription,
    webhookEventId: string,
    tenantId?: string,
    plan?: SubscriptionPlan,
    statusOverride?: SubscriptionStatus,
  ): Promise<void> {
    const statusMap: Record<string, SubscriptionStatus> = {
      active: SubscriptionStatus.ACTIVE,
      trialing: SubscriptionStatus.TRIALING,
      past_due: SubscriptionStatus.PAST_DUE,
      canceled: SubscriptionStatus.CANCELED,
      unpaid: SubscriptionStatus.UNPAID,
    };

    await this.getBillingSyncPort().synchronizeSubscriptionFromWebhook({
      tenantId,
      externalId: subscription.id,
      customerExternalId:
        typeof subscription.customer === "string"
          ? subscription.customer
          : undefined,
      provider: SubscriptionProvider.STRIPE,
      webhookEventId,
      plan:
        plan || mapStripePlan(subscription, this.configService) || undefined,
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
          customerId:
            typeof subscription.customer === "string"
              ? subscription.customer
              : null,
        },
      },
    });
  }
}

function mapStripePlan(
  subscription: Stripe.Subscription,
  configService: ConfigService,
): SubscriptionPlan | null {
  const priceId = subscription.items.data[0]?.price?.id;
  const planMap: Record<string, SubscriptionPlan> = {
    [configService.get<string>("STRIPE_PRICE_BASIC") || ""]:
      SubscriptionPlan.BASIC,
    [configService.get<string>("STRIPE_PRICE_PROFESSIONAL") || ""]:
      SubscriptionPlan.PROFESSIONAL,
    [configService.get<string>("STRIPE_PRICE_ENTERPRISE") || ""]:
      SubscriptionPlan.ENTERPRISE,
  };

  if (priceId && planMap[priceId]) {
    return planMap[priceId];
  }

  const metadataPlan = subscription.metadata?.plan as
    | SubscriptionPlan
    | undefined;
  return metadataPlan || null;
}

function toDate(value?: number | null): Date | undefined {
  return typeof value === "number" ? new Date(value * 1000) : undefined;
}

function mapInvoiceStatus(
  status: Stripe.Invoice.Status | null,
): BillingInvoiceView["status"] {
  switch (status) {
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

function dtoTrialStatus(session: Stripe.Checkout.Session): SubscriptionStatus {
  return session.payment_status === "paid"
    ? SubscriptionStatus.ACTIVE
    : SubscriptionStatus.TRIALING;
}

function getCustomerDefaultPaymentMethodId(
  customer: Stripe.Customer,
): string | null {
  const invoiceSettings = customer.invoice_settings;
  const defaultPaymentMethod = invoiceSettings?.default_payment_method;

  return typeof defaultPaymentMethod === "string"
    ? defaultPaymentMethod
    : defaultPaymentMethod?.id || null;
}
