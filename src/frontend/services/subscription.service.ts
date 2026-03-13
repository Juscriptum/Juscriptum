import api from "./api";
import {
  Subscription,
  SubscriptionPlan,
  SubscriptionFeatures,
  PLAN_LIMITS,
} from "../types/subscription.types";

/**
 * Subscription Service
 */
export const subscriptionService = {
  /**
   * Get current subscription
   */
  async getSubscription(): Promise<Subscription> {
    return api.get<Subscription>("/organizations/subscription");
  },

  /**
   * Get plan features
   */
  getPlanFeatures(plan: SubscriptionPlan): SubscriptionFeatures {
    return PLAN_LIMITS[plan];
  },

  /**
   * Check if plan has feature
   */
  hasFeature(
    plan: SubscriptionPlan,
    feature: keyof SubscriptionFeatures,
  ): boolean {
    return !!PLAN_LIMITS[plan]?.[feature];
  },

  /**
   * Get plan limits
   */
  getPlanLimit(plan: SubscriptionPlan, limit: keyof SubscriptionFeatures): any {
    return PLAN_LIMITS[plan]?.[limit];
  },

  /**
   * Upgrade plan
   */
  async upgradePlan(plan: SubscriptionPlan): Promise<{ checkoutUrl: string }> {
    return api.post<{ checkoutUrl: string }>("/billing/checkout", { plan });
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription(): Promise<void> {
    await api.post<void>("/billing/cancel");
  },

  /**
   * Resume subscription
   */
  async resumeSubscription(): Promise<void> {
    await api.post<void>("/billing/resume");
  },

  /**
   * Update payment method
   */
  async updatePaymentMethod(paymentMethodId: string): Promise<void> {
    await api.put<void>("/billing/payment-method", { paymentMethodId });
  },

  /**
   * Get invoices
   */
  async getInvoices(): Promise<any[]> {
    return api.get<any[]>("/billing/invoices");
  },

  /**
   * Download invoice
   */
  downloadInvoice(invoiceId: string, filename: string): void {
    api.download(`/billing/invoices/${invoiceId}/download`, filename);
  },
};
