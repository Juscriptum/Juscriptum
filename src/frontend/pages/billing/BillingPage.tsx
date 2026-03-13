import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { subscriptionService } from "../../services/subscription.service";
import { useSubscription } from "../../hooks/useSubscription";
import { usePermissions } from "../../hooks/usePermissions";
import type {
  SubscriptionPlan,
  SubscriptionFeatures,
} from "../../types/subscription.types";
import { PLAN_LIMITS } from "../../types/subscription.types";
import { formatCurrencyLabel } from "../../utils/currency";
import "./BillingPage.css";

/**
 * Plan card component
 */
interface PlanCardProps {
  plan: SubscriptionPlan;
  name: string;
  price: number;
  currency: string;
  features: SubscriptionFeatures;
  isCurrentPlan: boolean;
  isLoading: boolean;
  onSelect: (plan: SubscriptionPlan) => void;
}

const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  name,
  price,
  currency,
  features,
  isCurrentPlan,
  isLoading,
  onSelect,
}) => {
  const featureLabels: Record<keyof SubscriptionFeatures, string> = {
    maxUsers:
      features.maxUsers === -1
        ? "Необмежена кількість користувачів"
        : `До ${features.maxUsers} користувачів`,
    mfa: "Двофакторна аутентифікація",
    sso: "Єдиний вхід (SSO)",
    advancedAudit: "Розширений аудит",
    customDomain: "Власний домен",
    apiAccess: "API доступ",
    webhooks: "Webhooks",
    customReports: "Кастомні звіти",
    prioritySupport: "Пріоритетна підтримка",
    dataExport: "Експорт даних",
  };

  return (
    <div className={`plan-card ${isCurrentPlan ? "current" : ""}`}>
      <div className="plan-header">
        <h3 className="plan-name">{name}</h3>
        <div className="plan-price">
          {price === 0 ? (
            <span className="price-free">Безкоштовно</span>
          ) : (
            <>
              <span className="price-amount">{price}</span>
              <span className="price-currency">
                {formatCurrencyLabel(currency)}
              </span>
              <span className="price-period">/місяць</span>
            </>
          )}
        </div>
      </div>

      <ul className="plan-features">
        {(Object.keys(features) as Array<keyof SubscriptionFeatures>).map(
          (key) => (
            <li key={key} className={features[key] ? "included" : "excluded"}>
              <span className="feature-icon">{features[key] ? "✓" : "✗"}</span>
              <span className="feature-text">{featureLabels[key]}</span>
            </li>
          ),
        )}
      </ul>

      <button
        className={`plan-button ${isCurrentPlan ? "current" : ""}`}
        onClick={() => !isCurrentPlan && onSelect(plan)}
        disabled={isCurrentPlan || isLoading}
      >
        {isLoading ? (
          <span className="loading-spinner"></span>
        ) : isCurrentPlan ? (
          "Поточний план"
        ) : (
          "Обрати план"
        )}
      </button>
    </div>
  );
};

/**
 * Billing Page Component
 */
export const BillingPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    subscription,
    isLoading: subscriptionLoading,
    loadSubscription,
  } = useSubscription();
  const { canManageBilling, isOwner } = usePermissions();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plans = [
    {
      plan: "basic" as SubscriptionPlan,
      name: "Basic",
      price: 0,
      currency: "UAH",
      features: PLAN_LIMITS.basic,
    },
    {
      plan: "professional" as SubscriptionPlan,
      name: "Professional",
      price: 499,
      currency: "UAH",
      features: PLAN_LIMITS.professional,
    },
    {
      plan: "enterprise" as SubscriptionPlan,
      name: "Enterprise",
      price: 1499,
      currency: "UAH",
      features: PLAN_LIMITS.enterprise,
    },
  ];

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (!canManageBilling()) {
      setError("У вас немає прав для керування підпискою");
      return;
    }

    setSelectedPlan(plan);
    setIsLoading(true);
    setError(null);

    try {
      const { checkoutUrl } = await subscriptionService.upgradePlan(plan);
      // Redirect to payment provider
      window.location.href = checkoutUrl;
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Не вдалося створити сесію оплати",
      );
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!canManageBilling()) {
      setError("У вас немає прав для скасування підписки");
      return;
    }

    if (!window.confirm("Ви впевнені, що хочете скасувати підписку?")) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await subscriptionService.cancelSubscription();
      await loadSubscription();
    } catch (err: any) {
      setError(err.response?.data?.message || "Не вдалося скасувати підписку");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOwner()) {
    return (
      <div className="billing-page">
        <div className="access-denied">
          <h2>Доступ обмежено</h2>
          <p>Тільки власник організації може керувати підпискою.</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="back-button"
          >
            Повернутися до дашборду
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="billing-page">
      <div className="billing-header">
        <h1>Керування підпискою</h1>
        <p>Оберіть план, який найкраще підходить для вашої практики</p>
      </div>

      {subscription && (
        <div className="current-subscription">
          <h3>Поточна підписка</h3>
          <div className="subscription-info">
            <span className="plan-badge">{subscription.plan}</span>
            <span className="status-badge">{subscription.status}</span>
            {subscription.currentPeriodEndAt && (
              <span className="period-end">
                Дійсна до:{" "}
                {new Date(subscription.currentPeriodEndAt).toLocaleDateString(
                  "uk-UA",
                )}
              </span>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="plans-grid">
        {plans.map((p) => (
          <PlanCard
            key={p.plan}
            {...p}
            isCurrentPlan={subscription?.plan === p.plan}
            isLoading={isLoading && selectedPlan === p.plan}
            onSelect={handleSelectPlan}
          />
        ))}
      </div>

      {subscription && subscription.status !== "canceled" && (
        <div className="subscription-actions">
          <button
            className="cancel-button"
            onClick={handleCancelSubscription}
            disabled={isLoading}
          >
            Скасувати підписку
          </button>
        </div>
      )}

      <div className="billing-footer">
        <h3>Способи оплати</h3>
        <div className="payment-methods">
          <div className="payment-method">
            <span className="method-icon">💳</span>
            <span>Банківська карта</span>
          </div>
          <div className="payment-method">
            <span className="method-icon">🏦</span>
            <span>WayForPay</span>
          </div>
          <div className="payment-method">
            <span className="method-icon">🌍</span>
            <span>Stripe (міжнародні)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
