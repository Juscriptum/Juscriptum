import { useState, useEffect, useCallback } from "react";
import { subscriptionService } from "../services/subscription.service";
import type {
  Subscription,
  SubscriptionPlan,
  SubscriptionFeatures,
} from "../types/subscription.types";

/**
 * Use Subscription Hook
 */
export const useSubscription = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load subscription
   */
  const loadSubscription = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await subscriptionService.getSubscription();
      setSubscription(data);
    } catch (error: any) {
      setError(
        error.response?.data?.message || "Не вдалося завантажити підписку",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Upgrade plan
   */
  const upgradePlan = useCallback(
    async (plan: SubscriptionPlan): Promise<{ checkoutUrl: string }> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await subscriptionService.upgradePlan(plan);
        return result;
      } catch (error: any) {
        setError(error.response?.data?.message || "Не вдалося оновити план");
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Cancel subscription
   */
  const cancelSubscription = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await subscriptionService.cancelSubscription();
      await loadSubscription();
    } catch (error: any) {
      setError(
        error.response?.data?.message || "Не вдалося скасувати підписку",
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadSubscription]);

  /**
   * Resume subscription
   */
  const resumeSubscription = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await subscriptionService.resumeSubscription();
      await loadSubscription();
    } catch (error: any) {
      setError(
        error.response?.data?.message || "Не вдалося відновити підписку",
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadSubscription]);

  /**
   * Check if plan has feature
   */
  const hasFeature = useCallback(
    (feature: keyof SubscriptionFeatures): boolean => {
      if (!subscription) return false;
      return subscriptionService.hasFeature(subscription.plan, feature);
    },
    [subscription],
  );

  /**
   * Get plan limit
   */
  const getPlanLimit = useCallback(
    (limit: keyof SubscriptionFeatures): any => {
      if (!subscription) return null;
      return subscriptionService.getPlanLimit(subscription.plan, limit);
    },
    [subscription],
  );

  /**
   * Get current plan
   */
  const getPlan = useCallback((): SubscriptionPlan | null => {
    return subscription?.plan || null;
  }, [subscription]);

  /**
   * Get subscription status
   */
  const getStatus = useCallback((): string | null => {
    return subscription?.status || null;
  }, [subscription]);

  /**
   * Load on first render
   */
  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  return {
    subscription,
    isLoading,
    error,
    loadSubscription,
    upgradePlan,
    cancelSubscription,
    resumeSubscription,
    hasFeature,
    getPlanLimit,
    getPlan,
    getStatus,
  };
};
