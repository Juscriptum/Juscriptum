import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Subscription } from "../../database/entities/Subscription.entity";
import { Organization } from "../../database/entities/Organization.entity";
import {
  SubscriptionStatus,
  SubscriptionPlan,
} from "../../database/entities/enums/subscription.enum";
import { SubscriptionProvider } from "../../database/entities/enums/subscription.enum";
import { StripeService } from "./stripe.service";
import { WayForPayService } from "./wayforpay.service";
import { BillingInvoiceView, BillingPaymentMethodView } from "./billing.types";

/**
 * Billing Service (Orchestrator)
 */
@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    private readonly stripeService: StripeService,
    private readonly wayForPayService: WayForPayService,
  ) {}

  /**
   * Get subscription by tenant
   */
  async getSubscription(tenantId: string): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: { tenantId },
    });
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    tenantId: string,
    atPeriodEnd: boolean,
  ): Promise<void> {
    const subscription = await this.getSubscription(tenantId);

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    if (
      subscription.provider === "stripe" &&
      subscription.subscriptionExternalId
    ) {
      await this.stripeService.cancelSubscription(
        subscription.subscriptionExternalId,
        atPeriodEnd,
      );
    }

    // Update local status
    if (!atPeriodEnd) {
      await this.subscriptionRepository.update(
        { id: subscription.id },
        {
          status: SubscriptionStatus.CANCELED,
          canceledAt: new Date(),
        },
      );
    } else {
      await this.subscriptionRepository.update(
        { id: subscription.id },
        {
          cancelAtPeriodEnd: true,
        },
      );
    }
  }

  /**
   * Resume subscription
   */
  async resumeSubscription(
    tenantId: string,
    newPlan?: SubscriptionPlan,
  ): Promise<void> {
    const subscription = await this.getSubscription(tenantId);

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    if (
      subscription.provider === "stripe" &&
      subscription.subscriptionExternalId
    ) {
      await this.stripeService.resumeSubscription(
        subscription.subscriptionExternalId,
      );

      if (newPlan) {
        await this.stripeService.updateSubscriptionPlan(
          subscription.subscriptionExternalId,
          newPlan,
        );
      }
    }

    // Update local status
    await this.subscriptionRepository.update(
      { id: subscription.id },
      {
        status: SubscriptionStatus.ACTIVE,
        plan: newPlan || subscription.plan,
        cancelAtPeriodEnd: false,
        canceledAt: undefined,
      },
    );
  }

  /**
   * Get invoices
   */
  async getInvoices(tenantId: string): Promise<BillingInvoiceView[]> {
    const subscription = await this.getSubscription(tenantId);

    if (!subscription) {
      return [];
    }

    if (subscription.provider === SubscriptionProvider.STRIPE) {
      return this.stripeService.getInvoices(
        subscription.externalId,
        subscription.subscriptionExternalId,
      );
    }

    return this.wayForPayService.getInvoices(subscription);
  }

  /**
   * Get payment methods
   */
  async getPaymentMethods(
    tenantId: string,
  ): Promise<BillingPaymentMethodView[]> {
    const subscription = await this.getSubscription(tenantId);

    if (!subscription) {
      return [];
    }

    if (subscription.provider === SubscriptionProvider.STRIPE) {
      return this.stripeService.getPaymentMethods(subscription.externalId);
    }

    return this.wayForPayService.getPaymentMethods(subscription);
  }

  /**
   * Synchronize subscription from provider webhook
   */
  async synchronizeSubscriptionFromWebhook(data: {
    tenantId?: string;
    externalId: string;
    provider: SubscriptionProvider;
    webhookEventId?: string;
    customerExternalId?: string;
    status?: SubscriptionStatus;
    plan?: SubscriptionPlan;
    trialStartAt?: Date;
    trialEndAt?: Date;
    currentPeriodStartAt?: Date;
    currentPeriodEndAt?: Date;
    cancelAtPeriodEnd?: boolean;
    canceledAt?: Date | null;
    amountCents?: number;
    currency?: string;
    metadata?: Record<string, any>;
  }): Promise<{ ignored: boolean; subscription: Subscription | null }> {
    let subscription = await this.subscriptionRepository.findOne({
      where: {
        subscriptionExternalId: data.externalId,
        provider: data.provider,
      },
    });

    if (!subscription && data.tenantId) {
      subscription = await this.subscriptionRepository.findOne({
        where: {
          tenantId: data.tenantId,
          provider: data.provider,
        },
      });
    }

    if (
      subscription &&
      data.webhookEventId &&
      subscription.latestWebhookEventId === data.webhookEventId
    ) {
      return { ignored: true, subscription };
    }

    const patch = {
      ...(data.status ? { status: data.status } : {}),
      ...(data.plan ? { plan: data.plan } : {}),
      ...(data.trialStartAt ? { trialStartAt: data.trialStartAt } : {}),
      ...(data.trialEndAt ? { trialEndAt: data.trialEndAt } : {}),
      ...(data.currentPeriodStartAt
        ? { currentPeriodStartAt: data.currentPeriodStartAt }
        : {}),
      ...(data.currentPeriodEndAt
        ? { currentPeriodEndAt: data.currentPeriodEndAt }
        : {}),
      ...(data.cancelAtPeriodEnd !== undefined
        ? { cancelAtPeriodEnd: data.cancelAtPeriodEnd }
        : {}),
      ...(data.canceledAt !== undefined ? { canceledAt: data.canceledAt } : {}),
      ...(data.amountCents !== undefined
        ? { amountCents: data.amountCents }
        : {}),
      ...(data.currency ? { currency: data.currency } : {}),
      ...(data.customerExternalId !== undefined
        ? { externalId: data.customerExternalId }
        : {}),
      ...(data.metadata
        ? {
            metadata: {
              ...(subscription?.metadata || {}),
              ...data.metadata,
            },
          }
        : {}),
      ...(data.webhookEventId
        ? { latestWebhookEventId: data.webhookEventId }
        : {}),
      subscriptionExternalId: data.externalId,
      lastSyncedAt: new Date(),
    };

    if (subscription) {
      Object.assign(subscription, patch);
      await this.subscriptionRepository.save(subscription);
    } else {
      if (!data.tenantId || !data.plan || !data.status) {
        throw new Error(
          "tenantId, plan, and status are required to create a subscription from webhook",
        );
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
        metadata: data.metadata || {},
      } as Partial<Subscription>);
      subscription = await this.subscriptionRepository.save(subscription);
    }

    await this.updateOrganizationSubscriptionSnapshot(subscription);

    return { ignored: false, subscription };
  }

  /**
   * Backwards-compatible wrapper
   */
  async updateSubscriptionFromWebhook(
    externalId: string,
    provider: SubscriptionProvider,
    data: {
      status?: SubscriptionStatus;
      plan?: SubscriptionPlan;
      currentPeriodEndAt?: Date;
      trialEndAt?: Date;
      cancelAtPeriodEnd?: boolean;
      canceledAt?: Date | null;
      amountCents?: number;
      currency?: string;
    },
  ): Promise<void> {
    await this.synchronizeSubscriptionFromWebhook({
      externalId,
      provider,
      ...data,
    });
  }

  async createSubscriptionFromWebhook(
    tenantId: string,
    externalId: string,
    provider: SubscriptionProvider,
    data: {
      plan: SubscriptionPlan;
      status: SubscriptionStatus;
      trialStartAt?: Date;
      trialEndAt?: Date;
      currentPeriodStartAt?: Date;
      currentPeriodEndAt?: Date;
      amountCents?: number;
      currency?: string;
    },
  ): Promise<void> {
    await this.synchronizeSubscriptionFromWebhook({
      tenantId,
      externalId,
      provider,
      ...data,
    });
  }

  private async updateOrganizationSubscriptionSnapshot(
    subscription: Subscription,
  ): Promise<void> {
    await this.organizationRepository.update(
      { id: subscription.tenantId },
      {
        subscriptionPlan: subscription.plan,
        subscriptionStatus: subscription.status,
        currentPeriodEndAt: subscription.currentPeriodEndAt,
        trialEndAt: subscription.trialEndAt,
      },
    );
  }
}
