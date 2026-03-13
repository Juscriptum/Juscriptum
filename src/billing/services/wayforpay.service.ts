import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import axios from "axios";
import * as crypto from "crypto";
import { Subscription } from "../../database/entities/Subscription.entity";
import { Organization } from "../../database/entities/Organization.entity";
import {
  SubscriptionStatus,
  SubscriptionPlan,
  SubscriptionProvider,
} from "../../database/entities/enums/subscription.enum";
import { CreateCheckoutSessionDto } from "../dto/billing.dto";
import { AuditService } from "../../auth/services/audit.service";
import { BillingInvoiceView, BillingPaymentMethodView } from "./billing.types";

interface WayForPayCheckoutResponse {
  url: string;
  transactionId: string;
}

interface WayForPayWebhookPayload {
  merchantAccount: string;
  merchantDomainName: string;
  orderReference: string;
  orderDate: number;
  amount: number;
  currency: string;
  productCount: number;
  productName: string[];
  productPrice: number[];
  productPriceUsd: number[];
  orderStatus: string;
  signature: string;
  card?: string;
  cardType?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  reason?: string;
  reasonCode?: number;
}

interface PendingOrder {
  tenantId: string;
  plan: SubscriptionPlan;
  createdAt: Date;
  email?: string;
}

/**
 * WayForPay Service
 * Ukrainian payment processor integration
 */
@Injectable()
export class WayForPayService {
  private readonly logger = new Logger(WayForPayService.name);
  private readonly merchantAccount: string;
  private readonly merchantDomain: string;
  private readonly merchantSecretKey: string;
  private readonly apiUrl: string;
  private readonly returnUrl: string;
  private readonly serviceUrl: string;

  // In-memory cache for pending orders (in production, use Redis)
  private pendingOrders: Map<string, PendingOrder> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {
    this.merchantAccount = this.configService.get<string>(
      "WAYFORPAY_MERCHANT_ACCOUNT",
    )!;
    this.merchantDomain = this.configService.get<string>(
      "WAYFORPAY_MERCHANT_DOMAIN",
    )!;
    this.merchantSecretKey = this.configService.get<string>(
      "WAYFORPAY_MERCHANT_SECRET_KEY",
    )!;
    this.apiUrl = this.configService.get<string>(
      "WAYFORPAY_API_URL",
      "https://secure.wayforpay.com/pay",
    );
    this.returnUrl = this.configService.get<string>(
      "APP_URL",
      "https://laworganizer.ua",
    );
    this.serviceUrl = this.configService.get<string>(
      "APP_URL",
      "https://laworganizer.ua",
    );

    if (!this.merchantAccount || !this.merchantSecretKey) {
      this.logger.warn(
        "WayForPay is not configured - payment functionality will be limited",
      );
    }
  }

  /**
   * Create checkout session for subscription
   */
  async createCheckoutSession(
    tenantId: string,
    dto: CreateCheckoutSessionDto,
  ): Promise<{ checkoutUrl: string; sessionId: string }> {
    if (!this.merchantAccount || !this.merchantSecretKey) {
      throw new InternalServerErrorException("WayForPay is not configured");
    }

    const orderReference = this.generateOrderReference(tenantId, dto.plan);
    const planDetails = this.getPlanDetails(dto.plan);
    const amount = planDetails.amount;

    // Store pending order for webhook processing
    this.pendingOrders.set(orderReference, {
      tenantId,
      plan: dto.plan,
      createdAt: new Date(),
      email: dto.successUrl
        ? this.extractEmailFromUrl(dto.successUrl)
        : undefined,
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
      amount.toString(),
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
      productName: [planDetails.name],
      productCount: [1],
      productPrice: [amount],
      language: "UA",
      serviceUrl: `${this.serviceUrl}/api/billing/webhooks/wayforpay`,
      returnURL:
        dto.successUrl ||
        `${this.returnUrl}/billing/success?session_id=${orderReference}`,
      cancelURL:
        dto.cancelUrl ||
        `${this.returnUrl}/billing/cancel?session_id=${orderReference}`,
      defaultPaymentSystem: "card",
    };

    try {
      this.logger.log(
        `Creating WayForPay checkout session for tenant ${tenantId}, plan ${dto.plan}`,
      );

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
          currency: "UAH",
        },
      });

      this.logger.log(`WayForPay checkout session created: ${orderReference}`);

      return {
        checkoutUrl,
        sessionId: orderReference,
      };
    } catch (error) {
      this.logger.error("Failed to create WayForPay checkout session", error);
      throw new InternalServerErrorException(
        "Failed to create checkout session",
      );
    }
  }

  /**
   * Handle webhook callback from WayForPay
   */
  async handleWebhook(
    payload: WayForPayWebhookPayload,
  ): Promise<{ status: string }> {
    this.logger.log(
      `Received WayForPay webhook for order ${payload.orderReference}`,
    );

    // Verify signature
    if (!this.verifyWebhookSignature(payload)) {
      this.logger.error("Invalid webhook signature");
      throw new BadRequestException("Invalid signature");
    }

    // Extract tenant ID and plan from order reference
    const orderInfo = this.parseOrderReference(payload.orderReference);

    // Try to get from cache first
    let pendingOrder = this.pendingOrders.get(payload.orderReference);

    // If not in cache, try to find subscription by order reference
    if (!pendingOrder) {
      const existingSubscription = await this.subscriptionRepository.findOne({
        where: { externalId: payload.orderReference },
      });

      if (existingSubscription) {
        pendingOrder = {
          tenantId: existingSubscription.tenantId,
          plan: existingSubscription.plan,
          createdAt: existingSubscription.createdAt,
        };
      } else {
        // Fallback to parsed order reference
        pendingOrder = {
          tenantId: orderInfo.tenantId,
          plan: orderInfo.plan,
          createdAt: new Date(),
        };
      }
    }

    const { tenantId, plan } = pendingOrder;

    // Map WayForPay status to our enum
    const statusMap: Record<string, SubscriptionStatus> = {
      Approved: SubscriptionStatus.ACTIVE,
      "Awaiting Confirmation": SubscriptionStatus.TRIALING,
      "In Progress": SubscriptionStatus.TRIALING,
      Canceled: SubscriptionStatus.CANCELED,
      Declined: SubscriptionStatus.PAST_DUE,
      Expired: SubscriptionStatus.CANCELED,
      Refunded: SubscriptionStatus.CANCELED,
      "Partial Refunded": SubscriptionStatus.ACTIVE,
      Processing: SubscriptionStatus.TRIALING,
      "Waiting Auth Complete": SubscriptionStatus.TRIALING,
    };

    const status = statusMap[payload.orderStatus];

    if (!status) {
      this.logger.warn(
        `Unhandled WayForPay order status: ${payload.orderStatus}`,
      );
      return { status: "ignored" };
    }

    try {
      const webhookEventId = [
        payload.orderReference,
        payload.orderStatus,
        payload.amount,
        payload.currency,
      ].join(":");

      // Check if subscription exists
      let subscription = await this.subscriptionRepository.findOne({
        where: { tenantId },
      });

      if (
        subscription &&
        subscription.latestWebhookEventId === webhookEventId
      ) {
        this.logger.log(
          `Ignoring duplicate WayForPay webhook ${webhookEventId} for tenant ${tenantId}`,
        );
        return { status: "ok" };
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
        processedAt: new Date().toISOString(),
      };

      if (subscription) {
        // Update existing subscription
        subscription.status = status;
        subscription.plan = plan;
        subscription.externalId = payload.orderReference;
        subscription.lastSyncedAt = new Date();
        subscription.amountCents = Math.round(payload.amount * 100);
        subscription.currency = payload.currency;

        if (status === SubscriptionStatus.ACTIVE) {
          subscription.currentPeriodStartAt = new Date();
          subscription.currentPeriodEndAt = currentPeriodEndAt;
          subscription.canceledAt = null;
          subscription.cancelAtPeriodEnd = false;
        } else if (status === SubscriptionStatus.CANCELED) {
          subscription.canceledAt = new Date();
        }

        subscription.latestWebhookEventId = webhookEventId;
        subscription.metadata = {
          ...subscription.metadata,
          wayforpay: {
            ...(subscription.metadata?.wayforpay || {}),
            card: payload.card,
            cardType: payload.cardType,
            clientName: payload.clientName,
            clientEmail: payload.clientEmail,
            lastWebhookAt: new Date().toISOString(),
            orderStatus: payload.orderStatus,
            reason: payload.reason,
            reasonCode: payload.reasonCode,
            history: [
              ...((subscription.metadata?.wayforpay?.history as any[]) || []),
              paymentHistoryEntry,
            ].slice(-20),
          },
        };

        await this.subscriptionRepository.save(subscription);
        this.logger.log(
          `Updated subscription ${subscription.id} for tenant ${tenantId}`,
        );
      } else {
        // Create new subscription
        subscription = this.subscriptionRepository.create({
          tenantId,
          provider: SubscriptionProvider.WAYFORPAY,
          externalId: payload.orderReference,
          subscriptionExternalId: payload.orderReference,
          plan,
          status,
          amountCents: Math.round(payload.amount * 100),
          currency: payload.currency,
          currentPeriodStartAt:
            status === SubscriptionStatus.ACTIVE ? new Date() : undefined,
          currentPeriodEndAt:
            status === SubscriptionStatus.ACTIVE
              ? currentPeriodEndAt
              : undefined,
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
              history: [paymentHistoryEntry],
            },
          },
        });

        await this.subscriptionRepository.save(subscription);
        this.logger.log(
          `Created subscription ${subscription.id} for tenant ${tenantId}`,
        );
      }

      // Update organization subscription fields
      await this.organizationRepository.update(
        { id: tenantId },
        {
          subscriptionPlan: plan,
          subscriptionStatus: status,
          currentPeriodEndAt:
            status === SubscriptionStatus.ACTIVE
              ? currentPeriodEndAt
              : undefined,
        },
      );

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
          currency: payload.currency,
        },
      });

      // Clean up pending order
      this.pendingOrders.delete(payload.orderReference);

      this.logger.log(
        `WayForPay webhook processed successfully for order ${payload.orderReference}`,
      );

      return { status: "ok" };
    } catch (error) {
      this.logger.error(
        `Failed to process webhook for order ${payload.orderReference}`,
        error,
      );
      throw new InternalServerErrorException("Failed to process webhook");
    }
  }

  /**
   * Verify WayForPay webhook signature
   */
  verifyWebhookSignature(payload: WayForPayWebhookPayload): boolean {
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
        payload.productCount.toString(),
      ];

      // Add product names
      payload.productName.forEach((name) => signatureFields.push(name));

      // Add product prices
      payload.productPrice.forEach((price) =>
        signatureFields.push(price.toString()),
      );

      // Add USD prices if available
      if (payload.productPriceUsd && payload.productPriceUsd.length > 0) {
        payload.productPriceUsd.forEach((price) =>
          signatureFields.push(price.toString()),
        );
      }

      const signatureString = signatureFields.join(";");
      const expectedSignature =
        this.generateWayForPaySignature(signatureString);

      return crypto.timingSafeEqual(
        Buffer.from(payload.signature, "hex"),
        Buffer.from(expectedSignature, "hex"),
      );
    } catch (error) {
      this.logger.error("Error verifying webhook signature", error);
      return false;
    }
  }

  /**
   * Generate response signature for WayForPay callback
   */
  generateCallbackResponse(
    orderReference: string,
    status: "accept" | "decline",
  ): string {
    const signatureString =
      orderReference + ";" + status + ";" + this.merchantSecretKey;
    return this.generateWayForPaySignature(signatureString);
  }

  /**
   * Get subscription status by order reference
   */
  async getPaymentStatus(orderReference: string): Promise<{
    status: SubscriptionStatus | null;
    plan: SubscriptionPlan | null;
    amount: number | null;
  }> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { externalId: orderReference },
    });

    if (!subscription) {
      return { status: null, plan: null, amount: null };
    }

    return {
      status: subscription.status,
      plan: subscription.plan,
      amount: subscription.amountCents ? subscription.amountCents / 100 : null,
    };
  }

  getInvoices(subscription: Subscription): BillingInvoiceView[] {
    const history = this.getWayForPayHistory(subscription);

    return history.map((entry, index) => ({
      id: `${entry.orderReference}-${index}`,
      number: entry.orderReference,
      amount: Math.round(Number(entry.amount || 0) * 100),
      currency: String(entry.currency || subscription.currency || "UAH"),
      status: mapWayForPayInvoiceStatus(String(entry.orderStatus || "")),
      paidAt:
        entry.orderStatus === "Approved"
          ? new Date(entry.processedAt)
          : undefined,
      provider: SubscriptionProvider.WAYFORPAY,
    }));
  }

  getPaymentMethods(subscription: Subscription): BillingPaymentMethodView[] {
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
        provider: SubscriptionProvider.WAYFORPAY,
      },
    ];
  }

  /**
   * Generate order reference with encoded tenant and plan
   */
  private generateOrderReference(
    tenantId: string,
    plan: SubscriptionPlan,
  ): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString("hex");
    // Format: WFP-{tenantPrefix}-{plan}-{timestamp}-{random}
    return `WFP-${tenantId.substring(0, 8)}-${plan}-${timestamp}-${random}`;
  }

  /**
   * Parse order reference to extract tenant ID and plan
   */
  private parseOrderReference(reference: string): {
    tenantId: string;
    plan: SubscriptionPlan;
  } {
    const parts = reference.split("-");

    // Format: WFP-{tenantPrefix}-{plan}-{timestamp}-{random}
    if (parts.length >= 4 && parts[0] === "WFP") {
      const tenantPrefix = parts[1];
      const planStr = parts[2] as SubscriptionPlan;

      // Try to find subscription by order reference
      return {
        tenantId: tenantPrefix, // Will be resolved from pending orders or existing subscription
        plan: Object.values(SubscriptionPlan).includes(planStr)
          ? planStr
          : SubscriptionPlan.BASIC,
      };
    }

    // Legacy format fallback
    return {
      tenantId: parts[0],
      plan: (parts[1] as SubscriptionPlan) || SubscriptionPlan.BASIC,
    };
  }

  /**
   * Generate WayForPay signature (HMAC-MD5)
   */
  private generateWayForPaySignature(data: string): string {
    return crypto
      .createHmac("md5", this.merchantSecretKey)
      .update(data)
      .digest("hex");
  }

  /**
   * Build payment URL for redirect
   */
  private buildPaymentUrl(requestData: any): string {
    const params = new URLSearchParams();

    Object.entries(requestData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
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
   */
  private getPlanDetails(plan: SubscriptionPlan): {
    name: string;
    amount: number;
  } {
    const plans: Record<SubscriptionPlan, { name: string; amount: number }> = {
      [SubscriptionPlan.BASIC]: {
        name: "Law Organizer Basic",
        amount: 0,
      },
      [SubscriptionPlan.PROFESSIONAL]: {
        name: "Law Organizer Professional",
        amount: 499, // UAH per month
      },
      [SubscriptionPlan.ENTERPRISE]: {
        name: "Law Organizer Enterprise",
        amount: 1499, // UAH per month
      },
    };

    return plans[plan];
  }

  /**
   * Extract email from URL query params
   */
  private extractEmailFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get("email") || "";
    } catch {
      return "";
    }
  }

  /**
   * Clean up expired pending orders (call periodically)
   */
  cleanupExpiredOrders(): void {
    const now = Date.now();
    const expirationTime = 24 * 60 * 60 * 1000; // 24 hours

    for (const [orderRef, order] of this.pendingOrders.entries()) {
      if (now - order.createdAt.getTime() > expirationTime) {
        this.pendingOrders.delete(orderRef);
        this.logger.log(`Cleaned up expired pending order: ${orderRef}`);
      }
    }
  }

  private getWayForPayHistory(
    subscription: Subscription,
  ): Array<Record<string, any>> {
    const history = subscription.metadata?.wayforpay?.history;
    return Array.isArray(history) ? [...history].reverse() : [];
  }
}

function mapWayForPayInvoiceStatus(
  orderStatus: string,
): BillingInvoiceView["status"] {
  if (orderStatus === "Approved") {
    return "paid";
  }

  if (["Declined", "Canceled", "Expired"].includes(orderStatus)) {
    return "void";
  }

  if (["Refunded", "Partial Refunded"].includes(orderStatus)) {
    return "uncollectible";
  }

  return "open";
}
