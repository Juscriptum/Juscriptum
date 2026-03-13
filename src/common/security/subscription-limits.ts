import { SubscriptionPlan } from "../../database/entities/enums/subscription.enum";

export interface SubscriptionLimits {
  maxClients: number | null;
  maxCases: number | null;
  maxUsers: number | null;
}

export const SUBSCRIPTION_LIMITS: Record<string, SubscriptionLimits> = {
  [SubscriptionPlan.BASIC]: {
    maxClients: 1,
    maxCases: 3,
    maxUsers: 1,
  },
  [SubscriptionPlan.PROFESSIONAL]: {
    maxClients: null,
    maxCases: null,
    maxUsers: 5,
  },
  [SubscriptionPlan.ENTERPRISE]: {
    maxClients: null,
    maxCases: null,
    maxUsers: null,
  },
};

export function getSubscriptionLimits(
  plan?: string | null,
): SubscriptionLimits {
  return (
    SUBSCRIPTION_LIMITS[plan ?? SubscriptionPlan.BASIC] ?? {
      maxClients: 1,
      maxCases: 3,
      maxUsers: 1,
    }
  );
}

export function getPlanLevel(plan?: string | null): number {
  switch (plan) {
    case SubscriptionPlan.ENTERPRISE:
      return 3;
    case SubscriptionPlan.PROFESSIONAL:
      return 2;
    case SubscriptionPlan.BASIC:
    default:
      return 1;
  }
}
