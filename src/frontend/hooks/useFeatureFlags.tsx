import { useMemo } from "react";
import { usePermissions } from "./usePermissions";
import { PLAN_LIMITS, SubscriptionFeatures } from "../types/subscription.types";

/**
 * Feature flags configuration
 * Maps feature names to plan requirements
 */
export const FEATURE_FLAGS: Record<string, keyof SubscriptionFeatures> = {
  // Security features
  MFA: "mfa",
  SSO: "sso",

  // Advanced features
  ADVANCED_AUDIT: "advancedAudit",
  CUSTOM_DOMAIN: "customDomain",
  API_ACCESS: "apiAccess",
  WEBHOOKS: "webhooks",
  CUSTOM_REPORTS: "customReports",

  // Support
  PRIORITY_SUPPORT: "prioritySupport",

  // Data
  DATA_EXPORT: "dataExport",
};

/**
 * Feature flag names type
 */
export type FeatureFlagName = keyof typeof FEATURE_FLAGS;

/**
 * Use Feature Flags Hook
 * Provides easy access to feature flag checks
 */
export const useFeatureFlags = () => {
  const permissions = usePermissions();

  /**
   * Check if a feature is enabled for current plan
   */
  const isEnabled = (featureName: FeatureFlagName): boolean => {
    const featureKey = FEATURE_FLAGS[featureName];
    if (!featureKey) {
      console.warn(`Unknown feature flag: ${featureName}`);
      return false;
    }
    return permissions.hasFeature(featureKey);
  };

  /**
   * Check multiple features - returns true if ALL are enabled
   */
  const areAllEnabled = (featureNames: FeatureFlagName[]): boolean => {
    return featureNames.every(isEnabled);
  };

  /**
   * Check multiple features - returns true if ANY is enabled
   */
  const isAnyEnabled = (featureNames: FeatureFlagName[]): boolean => {
    return featureNames.some(isEnabled);
  };

  /**
   * Get all enabled features
   */
  const getEnabledFeatures = (): FeatureFlagName[] => {
    return (Object.keys(FEATURE_FLAGS) as FeatureFlagName[]).filter(isEnabled);
  };

  /**
   * Get all disabled features
   */
  const getDisabledFeatures = (): FeatureFlagName[] => {
    return (Object.keys(FEATURE_FLAGS) as FeatureFlagName[]).filter(
      (name) => !isEnabled(name),
    );
  };

  /**
   * Get max users limit for current plan
   */
  const getMaxUsers = (): number => {
    const plan = permissions.getPlan();
    if (!plan) return 1;
    return PLAN_LIMITS[plan]?.maxUsers || 1;
  };

  /**
   * Check if plan supports unlimited users
   */
  const hasUnlimitedUsers = (): boolean => {
    return getMaxUsers() === -1;
  };

  /**
   * Get feature description for upgrade prompt
   */
  const getFeatureDescription = (featureName: FeatureFlagName): string => {
    const descriptions: Record<FeatureFlagName, string> = {
      MFA: "Двофакторна аутентифікація",
      SSO: "Єдиний вхід (SSO)",
      ADVANCED_AUDIT: "Розширений аудит дій",
      CUSTOM_DOMAIN: "Власний домен",
      API_ACCESS: "API доступ",
      WEBHOOKS: "Webhooks інтеграція",
      CUSTOM_REPORTS: "Кастомні звіти",
      PRIORITY_SUPPORT: "Пріоритетна підтримка",
      DATA_EXPORT: "Експорт даних",
    };
    return descriptions[featureName] || featureName;
  };

  /**
   * Get minimum plan required for a feature
   */
  const getRequiredPlan = (featureName: FeatureFlagName): string => {
    const featureKey = FEATURE_FLAGS[featureName];

    // Check basic plan first
    if (PLAN_LIMITS.basic[featureKey]) return "Basic";

    // Check professional plan
    if (PLAN_LIMITS.professional[featureKey]) return "Professional";

    // Check enterprise plan
    if (PLAN_LIMITS.enterprise[featureKey]) return "Enterprise";

    return "Unknown";
  };

  return {
    isEnabled,
    areAllEnabled,
    isAnyEnabled,
    getEnabledFeatures,
    getDisabledFeatures,
    getMaxUsers,
    hasUnlimitedUsers,
    getFeatureDescription,
    getRequiredPlan,
    FEATURE_FLAGS,
  };
};

/**
 * Feature Gate Component Props
 */
interface FeatureGateProps {
  feature: FeatureFlagName | FeatureFlagName[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Feature Gate Component
 * Conditionally renders children based on feature flag(s)
 *
 * @example
 * // Single feature
 * <FeatureGate feature="API_ACCESS">
 *   <ApiSettings />
 * </FeatureGate>
 *
 * @example
 * // Multiple features (any)
 * <FeatureGate feature={['MFA', 'SSO']} requireAll={false}>
 *   <SecuritySettings />
 * </FeatureGate>
 *
 * @example
 * // With fallback
 * <FeatureGate feature="CUSTOM_REPORTS" fallback={<UpgradePrompt />}>
 *   <CustomReports />
 * </FeatureGate>
 */
export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  requireAll = true,
  fallback = null,
  children,
}) => {
  const { isEnabled, areAllEnabled, isAnyEnabled } = useFeatureFlags();

  const features = Array.isArray(feature) ? feature : [feature];

  const hasAccess = requireAll
    ? areAllEnabled(features)
    : isAnyEnabled(features);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default useFeatureFlags;
