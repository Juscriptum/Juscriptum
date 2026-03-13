import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
  SubscriptionFeatures,
} from "../types/subscription.types";
import { PLAN_LIMITS } from "../types/subscription.types";

/**
 * Subscription State
 */
interface SubscriptionState {
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Initial state
 */
const initialState: SubscriptionState = {
  subscription: null,
  isLoading: false,
  error: null,
};

/**
 * Subscription Slice
 */
const subscriptionSlice = createSlice({
  name: "subscription",
  initialState,
  reducers: {
    /**
     * Set subscription data
     */
    setSubscription: (state, action: PayloadAction<Subscription | null>) => {
      state.subscription = action.payload;
      state.isLoading = false;
      state.error = null;
    },

    /**
     * Update subscription data (partial update)
     */
    updateSubscription: (
      state,
      action: PayloadAction<Partial<Subscription>>,
    ) => {
      if (state.subscription) {
        state.subscription = { ...state.subscription, ...action.payload };
      }
    },

    /**
     * Set loading state
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    /**
     * Set error state
     */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    /**
     * Clear subscription (on logout)
     */
    clearSubscription: (state) => {
      state.subscription = null;
      state.isLoading = false;
      state.error = null;
    },

    /**
     * Update plan
     */
    setPlan: (state, action: PayloadAction<SubscriptionPlan>) => {
      if (state.subscription) {
        state.subscription.plan = action.payload;
      }
    },

    /**
     * Update status
     */
    setStatus: (state, action: PayloadAction<SubscriptionStatus>) => {
      if (state.subscription) {
        state.subscription.status = action.payload;
      }
    },
  },
});

/**
 * Exported actions
 */
export const {
  setSubscription,
  updateSubscription,
  setLoading,
  setError,
  clearSubscription,
  setPlan,
  setStatus,
} = subscriptionSlice.actions;

/**
 * Selector hooks
 */
export const selectSubscription = (state: {
  subscription: SubscriptionState;
}) => state.subscription.subscription;
export const selectIsLoading = (state: { subscription: SubscriptionState }) =>
  state.subscription.isLoading;
export const selectError = (state: { subscription: SubscriptionState }) =>
  state.subscription.error;
export const selectPlan = (state: { subscription: SubscriptionState }) =>
  state.subscription.subscription?.plan || null;
export const selectStatus = (state: { subscription: SubscriptionState }) =>
  state.subscription.subscription?.status || null;

/**
 * Select plan features
 */
export const selectPlanFeatures = (state: {
  subscription: SubscriptionState;
}): SubscriptionFeatures | null => {
  const plan = state.subscription.subscription?.plan;
  if (!plan) return null;
  return PLAN_LIMITS[plan] || null;
};

/**
 * Check if plan has feature
 */
export const selectHasFeature =
  (feature: keyof SubscriptionFeatures) =>
  (state: { subscription: SubscriptionState }): boolean => {
    const plan = state.subscription.subscription?.plan;
    if (!plan) return false;
    return !!PLAN_LIMITS[plan]?.[feature];
  };

/**
 * Get plan limit
 */
export const selectPlanLimit =
  (limit: keyof SubscriptionFeatures) =>
  (state: { subscription: SubscriptionState }): any => {
    const plan = state.subscription.subscription?.plan;
    if (!plan) return null;
    return PLAN_LIMITS[plan]?.[limit];
  };

export default subscriptionSlice.reducer;
