/**
 * Organization Types
 */
export interface Organization {
  id: string;
  name: string;
  legalForm: LegalForm;
  edrpou?: string;
  taxNumber?: string;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  phone?: string;
  email: string;
  website?: string;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  trialEndAt?: Date;
  currentPeriodEndAt?: Date;
  maxUsers: number;
  customDomain?: string;
  mfaRequired: boolean;
  ssoEnabled: boolean;
  auditRetentionDays: number;
  status: OrganizationStatus;
  settings: Record<string, any>;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type LegalForm =
  | "sole_proprietor"
  | "llc"
  | "joint_stock"
  | "partnership"
  | "other";

export type SubscriptionPlan = "basic" | "professional" | "enterprise";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid";

export type OrganizationStatus =
  | "provisioning"
  | "active"
  | "suspended"
  | "deleted";

export interface UpdateOrganizationData {
  name?: string;
  legalForm?: LegalForm;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  region?: string;
  edrpou?: string;
  taxNumber?: string;
  mfaRequired?: boolean;
  auditRetentionDays?: number;
  settings?: Record<string, any>;
}

export interface OrganizationSubscription {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface OnboardingProgress {
  completed: boolean;
  percentage: number;
  steps: OnboardingStep[];
}

export interface OnboardingStep {
  step: string;
  completed: boolean;
  completedAt: Date | null;
}
