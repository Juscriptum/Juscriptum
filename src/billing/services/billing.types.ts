import {
  SubscriptionPlan,
  SubscriptionProvider,
  SubscriptionStatus,
} from "../../database/entities/enums/subscription.enum";

export const BILLING_SYNC_PORT = "BILLING_SYNC_PORT";

export interface BillingInvoiceView {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: "draft" | "open" | "paid" | "void" | "uncollectible";
  dueDate?: Date;
  paidAt?: Date;
  pdfUrl?: string;
  provider: SubscriptionProvider;
}

export interface BillingPaymentMethodView {
  id: string;
  type: "card" | "bank_account";
  last4?: string;
  brand?: string;
  expMonth?: number;
  expYear?: number;
  isDefault: boolean;
  provider: SubscriptionProvider;
}

export interface BillingSyncPort {
  synchronizeSubscriptionFromWebhook(data: {
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
  }): Promise<{ ignored: boolean; subscription: unknown | null }>;
}
