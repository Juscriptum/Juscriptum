/**
 * Subscription Types
 */
export interface Subscription {
  id: string;
  tenantId: string;
  provider: "stripe" | "wayforpay";
  externalId?: string;
  subscriptionExternalId?: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  trialStartAt?: Date;
  trialEndAt?: Date;
  currentPeriodStartAt?: Date;
  currentPeriodEndAt?: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  amountCents?: number;
  currency: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type SubscriptionPlan = "basic" | "professional" | "enterprise";

/**
 * SubscriptionPlan enum-like object for easier access
 */
export const SubscriptionPlanEnum = {
  BASIC: "basic" as SubscriptionPlan,
  PROFESSIONAL: "professional" as SubscriptionPlan,
  ENTERPRISE: "enterprise" as SubscriptionPlan,
};

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid";

export type SubscriptionProvider = "stripe" | "wayforpay";

export interface SubscriptionFeatures {
  maxUsers: number;
  mfa: boolean;
  sso: boolean;
  advancedAudit: boolean;
  customDomain: boolean;
  apiAccess: boolean;
  webhooks: boolean;
  customReports: boolean;
  prioritySupport: boolean;
  dataExport: boolean;
}

export interface PlanLimits {
  [key: string]: SubscriptionFeatures;
}

export const PLAN_LIMITS: PlanLimits = {
  basic: {
    maxUsers: 1,
    mfa: false,
    sso: false,
    advancedAudit: false,
    customDomain: false,
    apiAccess: false,
    webhooks: false,
    customReports: false,
    prioritySupport: false,
    dataExport: true,
  },
  professional: {
    maxUsers: 5,
    mfa: true,
    sso: false,
    advancedAudit: true,
    customDomain: false,
    apiAccess: true,
    webhooks: true,
    customReports: false,
    prioritySupport: false,
    dataExport: true,
  },
  enterprise: {
    maxUsers: -1, // Unlimited
    mfa: true,
    sso: true,
    advancedAudit: true,
    customDomain: true,
    apiAccess: true,
    webhooks: true,
    customReports: true,
    prioritySupport: true,
    dataExport: true,
  },
};

export interface BillingAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface PaymentMethod {
  id: string;
  type: "card" | "bank_account";
  last4?: string;
  brand?: "visa" | "mastercard" | "amex";
  expMonth?: number;
  expYear?: number;
  isDefault: boolean;
}

export interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: "draft" | "open" | "paid" | "void" | "uncollectible";
  dueDate?: Date;
  paidAt?: Date;
  pdfUrl?: string;
}
