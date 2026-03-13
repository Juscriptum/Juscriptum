/**
 * Upgrade Prompt Component
 * Displays upgrade prompts for features not available on current plan
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../i18n";
import type { SubscriptionPlan } from "../types/auth.types";
import "./UpgradePrompt.css";

/**
 * Upgrade prompt props
 */
interface UpgradePromptProps {
  feature: string;
  requiredPlan?: SubscriptionPlan;
  className?: string;
}

/**
 * Plan display names
 */
const PLAN_NAMES: Record<SubscriptionPlan, string> = {
  basic: "Basic",
  professional: "Professional",
  enterprise: "Enterprise",
};

/**
 * Upgrade Prompt Component
 */
export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  feature,
  requiredPlan = "professional",
  className = "",
}) => {
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleUpgrade = () => {
    navigate("/billing");
  };

  return (
    <div className={`upgrade-prompt ${className}`.trim()}>
      <div className="upgrade-prompt-icon">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      </div>
      <h3 className="upgrade-prompt-title">
        {t("upgrade.featureNotAvailable")}
      </h3>
      <p className="upgrade-prompt-message">
        {t("upgrade.upgradeTo", { plan: PLAN_NAMES[requiredPlan] })}
      </p>
      <p className="upgrade-prompt-feature">{feature}</p>
      <button className="upgrade-prompt-button" onClick={handleUpgrade}>
        {t("upgrade.upgradeNow")}
      </button>
    </div>
  );
};

/**
 * Feature locked overlay props
 */
interface FeatureLockedOverlayProps {
  feature: string;
  requiredPlan?: SubscriptionPlan;
  children: React.ReactNode;
}

/**
 * Feature Locked Overlay
 * Shows children blurred with an upgrade prompt overlay
 */
export const FeatureLockedOverlay: React.FC<FeatureLockedOverlayProps> = ({
  feature,
  requiredPlan = "professional",
  children,
}) => {
  const [showPrompt, setShowPrompt] = React.useState(false);

  return (
    <div className="feature-locked-overlay">
      <div className="feature-locked-overlay__content">{children}</div>
      <div
        className="feature-locked-overlay__layer"
        onMouseEnter={() => setShowPrompt(true)}
        onMouseLeave={() => setShowPrompt(false)}
      >
        {showPrompt && (
          <UpgradePrompt feature={feature} requiredPlan={requiredPlan} />
        )}
      </div>
    </div>
  );
};

/**
 * Plan badge component
 */
interface PlanBadgeProps {
  plan: SubscriptionPlan;
  className?: string;
}

export const PlanBadge: React.FC<PlanBadgeProps> = ({
  plan,
  className = "",
}) => {
  return (
    <span className={`plan-badge plan-badge--${plan} ${className}`.trim()}>
      {PLAN_NAMES[plan]}
    </span>
  );
};

/**
 * Trial banner component
 */
interface TrialBannerProps {
  trialEndAt: string | Date;
  onUpgrade?: () => void;
}

export const TrialBanner: React.FC<TrialBannerProps> = ({
  trialEndAt,
  onUpgrade,
}) => {
  const { t, formatDate } = useI18n();
  const navigate = useNavigate();

  const endDate =
    typeof trialEndAt === "string" ? new Date(trialEndAt) : trialEndAt;
  const now = new Date();
  const daysLeft = Math.ceil(
    (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate("/billing");
    }
  };

  if (daysLeft <= 0) {
    return (
      <div className="trial-banner trial-banner--expired">
        <span className="trial-banner__text--expired">
          Пробний період завершено. Оновіть підписку, щоб продовжити роботу.
        </span>
        <button className="trial-banner-button" onClick={handleUpgrade}>
          Оновити
        </button>
      </div>
    );
  }

  return (
    <div className="trial-banner trial-banner--warning">
      <span className="trial-banner__text--warning">
        Пробний період завершиться {formatDate(endDate, "long")} ({daysLeft}{" "}
        днів)
      </span>
      <button className="trial-banner-button" onClick={handleUpgrade}>
        Оновити
      </button>
    </div>
  );
};

export default UpgradePrompt;
