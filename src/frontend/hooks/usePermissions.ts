import { useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import type { UserRole, SubscriptionPlan } from "../types/auth.types";
import type { SubscriptionFeatures } from "../types/subscription.types";
import { PLAN_LIMITS } from "../types/subscription.types";

/**
 * Use Permissions Hook
 */
export const usePermissions = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const organization = useSelector(
    (state: RootState) => state.auth.organization,
  );

  /**
   * Check if user has role
   */
  const hasRole = useCallback(
    (roles: UserRole[]): boolean => {
      if (!user) return false;
      return roles.includes(user.role as UserRole);
    },
    [user],
  );

  /**
   * Check if user is organization owner
   */
  const isOwner = useCallback((): boolean => {
    return hasRole(["organization_owner"]);
  }, [hasRole]);

  /**
   * Check if user is admin
   */
  const isAdmin = useCallback((): boolean => {
    return hasRole(["organization_owner", "organization_admin"]);
  }, [hasRole]);

  /**
   * Check if user is lawyer
   */
  const isLawyer = useCallback((): boolean => {
    return hasRole(["lawyer"]);
  }, [hasRole]);

  /**
   * Check if user is assistant
   */
  const isAssistant = useCallback((): boolean => {
    return hasRole(["assistant"]);
  }, [hasRole]);

  /**
   * Check if user is accountant
   */
  const isAccountant = useCallback((): boolean => {
    return hasRole(["accountant"]);
  }, [hasRole]);

  /**
   * Get subscription plan
   */
  const getPlan = useCallback((): SubscriptionPlan | null => {
    return organization?.subscriptionPlan || null;
  }, [organization]);

  /**
   * Check if plan has feature
   */
  const hasFeature = useCallback(
    (feature: keyof SubscriptionFeatures): boolean => {
      const plan = getPlan();
      if (!plan) return false;
      return !!PLAN_LIMITS[plan]?.[feature];
    },
    [getPlan],
  );

  /**
   * Check if can manage users
   */
  const canManageUsers = useCallback((): boolean => {
    return isAdmin();
  }, [isAdmin]);

  /**
   * Check if can manage billing
   */
  const canManageBilling = useCallback((): boolean => {
    return isOwner();
  }, [isOwner]);

  /**
   * Check if can access advanced audit
   */
  const canAccessAdvancedAudit = useCallback((): boolean => {
    return hasFeature("advancedAudit") && isAdmin();
  }, [hasFeature, isAdmin]);

  /**
   * Check if can manage settings
   */
  const canManageSettings = useCallback((): boolean => {
    return isAdmin();
  }, [isAdmin]);

  /**
   * Check if can create cases
   */
  const canCreateCases = useCallback((): boolean => {
    return hasRole(["organization_owner", "organization_admin", "lawyer"]);
  }, [hasRole]);

  /**
   * Check if can view cases
   */
  const canViewCases = useCallback((): boolean => {
    return hasRole([
      "organization_owner",
      "organization_admin",
      "lawyer",
      "assistant",
    ]);
  }, [hasRole]);

  /**
   * Check if can manage documents
   */
  const canManageDocuments = useCallback((): boolean => {
    return hasRole([
      "organization_owner",
      "organization_admin",
      "lawyer",
      "assistant",
    ]);
  }, [hasRole]);

  /**
   * Check if can view billing
   */
  const canViewBilling = useCallback((): boolean => {
    return isAdmin() || isAccountant();
  }, [isAdmin, isAccountant]);

  /**
   * Check if can invite users
   */
  const canInviteUsers = useCallback((): boolean => {
    const plan = getPlan();
    if (!plan) return false;
    const maxUsers = PLAN_LIMITS[plan]?.maxUsers || 0;
    if (maxUsers === -1) return isAdmin(); // Unlimited
    // TODO: Get current user count from API
    return isAdmin(); // Simplified for now
  }, [isAdmin, getPlan]);

  return {
    user,
    organization,
    hasRole,
    isOwner,
    isAdmin,
    isLawyer,
    isAssistant,
    isAccountant,
    getPlan,
    hasFeature,
    canManageUsers,
    canManageBilling,
    canAccessAdvancedAudit,
    canManageSettings,
    canCreateCases,
    canViewCases,
    canManageDocuments,
    canViewBilling,
    canInviteUsers,
  };
};
