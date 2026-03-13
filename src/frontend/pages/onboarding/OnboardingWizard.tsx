import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../hooks/useOnboarding";
import { usePermissions } from "../../hooks/usePermissions";
import { subscriptionService } from "../../services/subscription.service";
import { organizationService } from "../../services/organization.service";
import { profileService } from "../../services/profile.service";
import { teamService } from "../../services/team.service";
import type { SubscriptionPlan } from "../../types/subscription.types";
import { PLAN_LIMITS } from "../../types/subscription.types";
import { useAppDispatch } from "../../store";
import {
  updateOrganization as updateOrganizationAction,
  updateUser as updateUserAction,
} from "../../store/auth.slice";
import { UserProfileDetailsForm } from "../../components/profile/UserProfileDetailsForm";
import "./OnboardingWizard.css";

type OnboardingStepId =
  | "organization_details"
  | "user_profile"
  | "subscription_setup"
  | "team_invitation"
  | "first_case_created";

interface Step {
  id: OnboardingStepId;
  title: string;
  description: string;
  icon: string;
}

const STEPS: Step[] = [
  {
    id: "organization_details",
    title: "Дані організації",
    description: "Доповніть реквізити та контакти юридичної практики",
    icon: "🏛️",
  },
  {
    id: "user_profile",
    title: "Профіль користувача",
    description: "Заповніть мінімальний професійний профіль для старту",
    icon: "👤",
  },
  {
    id: "subscription_setup",
    title: "Оберіть план",
    description: "Виберіть підписку для доступу до функцій",
    icon: "💎",
  },
  {
    id: "team_invitation",
    title: "Запросити команду",
    description: "Додайте колег до вашої організації",
    icon: "👥",
  },
  {
    id: "first_case_created",
    title: "Створіть першу справу",
    description: "Почніть роботу з вашим першим клієнтом",
    icon: "📁",
  },
];

/**
 * Progress indicator component
 */
interface ProgressIndicatorProps {
  steps: Step[];
  currentStep: number;
  completedSteps: Set<string>;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStep,
  completedSteps,
}) => {
  return (
    <div className="progress-indicator">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{
            ["--progress-width" as string]: `${(currentStep / (steps.length - 1)) * 100}%`,
          }}
        />
      </div>
      <div className="steps-indicators">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`step-dot ${
              index < currentStep
                ? "completed"
                : index === currentStep
                  ? "current"
                  : "pending"
            } ${completedSteps.has(step.id) ? "done" : ""}`}
          >
            <span className="step-icon">
              {completedSteps.has(step.id) ? "✓" : step.icon}
            </span>
            <span className="step-label">{step.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Organization Details Step
 */
const OrganizationDetailsStep: React.FC<{
  onComplete: (data?: Record<string, any>) => void;
  onSkip: () => void;
}> = ({ onComplete, onSkip }) => {
  const { organization } = usePermissions();
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState({
    name: organization?.name || "",
    legalForm: organization?.legalForm || "sole_proprietor",
    edrpou: "",
    taxNumber: "",
    address: "",
    city: "",
    region: "",
    phone: "",
    website: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const updated = await organizationService.updateOrganization(formData);
      dispatch(
        updateOrganizationAction({
          name: updated.name,
          legalForm: updated.legalForm,
          edrpou: updated.edrpou,
          taxNumber: updated.taxNumber,
          address: updated.address,
          city: updated.city,
          region: updated.region,
          phone: updated.phone,
          email: updated.email,
          website: updated.website,
        }),
      );
      onComplete({
        ownership: "onboarding",
        organization: {
          legalForm: updated.legalForm,
          edrpou: updated.edrpou,
          taxNumber: updated.taxNumber,
          address: updated.address,
          city: updated.city,
          region: updated.region,
          phone: updated.phone,
          website: updated.website,
        },
      });
    } catch (submitError: any) {
      setError(
        submitError?.response?.data?.message ||
          "Не вдалося зберегти реквізити організації",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="onboarding-step">
      <h2>Дані організації</h2>

      {error && <p className="step-error">{error}</p>}

      <form onSubmit={handleSubmit} className="onboarding-form">
        <div className="form-group">
          <label>Назва організації</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="ТОВ 'Юридична фірма'"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Правова форма</label>
            <select
              value={formData.legalForm}
              onChange={(e) =>
                setFormData({ ...formData, legalForm: e.target.value })
              }
            >
              <option value="sole_proprietor">ФОП</option>
              <option value="llc">ТОВ</option>
              <option value="joint_stock">АТ</option>
              <option value="partnership">Партнерство</option>
              <option value="other">Інша форма</option>
            </select>
          </div>

          <div className="form-group">
            <label>ЄДРПОУ</label>
            <input
              type="text"
              value={formData.edrpou}
              onChange={(e) =>
                setFormData({ ...formData, edrpou: e.target.value })
              }
              placeholder="12345678"
              maxLength={8}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Податковий номер</label>
            <input
              type="text"
              value={formData.taxNumber}
              onChange={(e) =>
                setFormData({ ...formData, taxNumber: e.target.value })
              }
              placeholder="1234567890"
            />
          </div>

          <div className="form-group">
            <label>Телефон</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="+380 44 123 4567"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Місто</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              placeholder="Київ"
            />
          </div>

          <div className="form-group">
            <label>Область</label>
            <input
              type="text"
              value={formData.region}
              onChange={(e) =>
                setFormData({ ...formData, region: e.target.value })
              }
              placeholder="Київська"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Адреса</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            placeholder="м. Київ, вул. Хрещатик, 1"
          />
        </div>

        <div className="form-group">
          <label>Сайт</label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) =>
              setFormData({ ...formData, website: e.target.value })
            }
            placeholder="https://example.ua"
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={onSkip} className="skip-button">
            Пропустити
          </button>
          <button type="submit" className="next-button" disabled={isLoading}>
            {isLoading ? "Збереження..." : "Продовжити"}
          </button>
        </div>
      </form>
    </div>
  );
};

/**
 * User Profile Step
 */
const UserProfileStep: React.FC<{
  onComplete: (data?: Record<string, any>) => void;
  onSkip: () => void;
}> = ({ onComplete, onSkip }) => {
  const { user } = usePermissions();
  const dispatch = useAppDispatch();

  const handleSubmit = async (formData: any) => {
    const profile = await profileService.updateProfile(formData);
    dispatch(
      updateUserAction({
        firstName: profile.firstName,
        lastName: profile.lastName,
        patronymic: profile.patronymic,
        phone: profile.phonePrimary || profile.phone,
        position: profile.position,
      }),
    );
    onComplete({
      ownership: "onboarding",
      user: {
        organizationType: profile.organizationType,
        firstName: profile.firstName,
        lastName: profile.lastName,
        patronymic: profile.patronymic,
        taxId: profile.taxId,
        phonePrimary: profile.phonePrimary,
        legalStatus: profile.legalStatus,
        bankName: profile.bankName,
        bankMfo: profile.bankMfo,
        iban: profile.iban,
      },
    });
  };

  return (
    <div className="onboarding-step">
      <UserProfileDetailsForm
        email={user?.email || ""}
        initialData={user || undefined}
        introTitle="Профіль користувача"
        introText="Після швидкої реєстрації заповніть профіль юриста. Цей крок можна пропустити й повернутися до нього пізніше в розділі профілю."
        submitLabel="Зберегти дані профілю"
        onSubmit={handleSubmit}
        onSkip={onSkip}
      />
    </div>
  );
};

/**
 * Subscription Setup Step
 */
const SubscriptionSetupStep: React.FC<{
  onComplete: () => void;
  onSkip: () => void;
}> = ({ onComplete, onSkip }) => {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(
    SubscriptionPlan.PROFESSIONAL,
  );
  const [isLoading, setIsLoading] = useState(false);

  const plans = [
    {
      id: SubscriptionPlan.BASIC,
      name: "Basic",
      price: 0,
      features: ["1 користувач", "Базові функції", "Експорт даних"],
    },
    {
      id: SubscriptionPlan.PROFESSIONAL,
      name: "Professional",
      price: 499,
      features: ["5 користувачів", "MFA", "API доступ", "Webhooks"],
      popular: true,
    },
    {
      id: SubscriptionPlan.ENTERPRISE,
      name: "Enterprise",
      price: 1499,
      features: [
        "Необмежено користувачів",
        "SSO",
        "Власний домен",
        "Пріоритетна підтримка",
      ],
    },
  ];

  const handleSelectPlan = async () => {
    if (selectedPlan === SubscriptionPlan.BASIC) {
      onComplete();
      return;
    }

    setIsLoading(true);

    try {
      const { checkoutUrl } =
        await subscriptionService.upgradePlan(selectedPlan);
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="onboarding-step subscription-step">
      <h2>Оберіть план підписки</h2>
      <p>Виберіть план, який найкраще підходить для вашої практики</p>

      <div className="plans-selection">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`plan-option ${selectedPlan === plan.id ? "selected" : ""} ${
              plan.popular ? "popular" : ""
            }`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            {plan.popular && <span className="popular-badge">Популярний</span>}
            <h3>{plan.name}</h3>
            <div className="plan-price">
              {plan.price === 0 ? (
                <span className="free">Безкоштовно</span>
              ) : (
                <>
                  <span className="amount">{plan.price}</span>
                  <span className="currency">грн/міс</span>
                </>
              )}
            </div>
            <ul className="plan-features-list">
              {plan.features.map((feature, index) => (
                <li key={index}>✓ {feature}</li>
              ))}
            </ul>
            <div className="plan-radio">
              <input
                type="radio"
                name="plan"
                checked={selectedPlan === plan.id}
                onChange={() => setSelectedPlan(plan.id)}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="form-actions">
        <button onClick={onSkip} className="skip-button">
          Пропустити
        </button>
        <button
          onClick={handleSelectPlan}
          className="next-button"
          disabled={isLoading}
        >
          {isLoading
            ? "Обробка..."
            : selectedPlan === SubscriptionPlan.BASIC
              ? "Продовжити"
              : "Оплатити"}
        </button>
      </div>
    </div>
  );
};

/**
 * Team Invitation Step
 */
const TeamInvitationStep: React.FC<{
  onComplete: (data?: Record<string, any>) => void;
  onSkip: () => void;
}> = ({ onComplete, onSkip }) => {
  const [emails, setEmails] = useState<string[]>([""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addEmail = () => {
    setEmails([...emails, ""]);
  };

  const removeEmail = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const validEmails = emails.filter((email) => email.trim() !== "");
      if (validEmails.length > 0) {
        await Promise.all(
          validEmails.map((email) =>
            teamService.createInvitation({
              email,
              role: "lawyer",
            }),
          ),
        );
      }
      onComplete({
        invitationsSent: validEmails.length,
      });
    } catch (submitError: any) {
      setError(
        submitError?.response?.data?.message ||
          "Не вдалося створити запрошення для команди",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="onboarding-step">
      <h2>Запросіть команду</h2>
      <p>Додайте колег до вашої організації (необов'язково)</p>

      {error && <p className="step-error">{error}</p>}

      <div className="emails-list">
        {emails.map((email, index) => (
          <div key={index} className="email-input-row">
            <input
              type="email"
              value={email}
              onChange={(e) => updateEmail(index, e.target.value)}
              placeholder="email@lawyer.ua"
            />
            {emails.length > 1 && (
              <button
                type="button"
                onClick={() => removeEmail(index)}
                className="remove-button"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      <button type="button" onClick={addEmail} className="add-email-button">
        + Додати ще email
      </button>

      <div className="form-actions">
        <button onClick={onSkip} className="skip-button">
          Пропустити
        </button>
        <button
          onClick={handleSubmit}
          className="next-button"
          disabled={isLoading}
        >
          {isLoading ? "Надсилання..." : "Надіслати запрошення"}
        </button>
      </div>
    </div>
  );
};

/**
 * First Case Step
 */
const FirstCaseStep: React.FC<{
  onComplete: () => void;
  onSkip: () => void;
}> = ({ onComplete, onSkip }) => {
  const navigate = useNavigate();

  const handleCreateCase = () => {
    // Navigate to case creation
    navigate("/cases/add");
  };

  return (
    <div className="onboarding-step final-step">
      <div className="success-icon">🎉</div>
      <h2>Готово!</h2>
      <p>
        Ви завершили налаштування. Тепер можете почати роботу з вашим першим
        клієнтом.
      </p>

      <div className="final-actions">
        <button onClick={handleCreateCase} className="create-case-button">
          📁 Створити першу справу
        </button>
        <button onClick={onSkip} className="skip-button">
          Пізніше
        </button>
      </div>

      <div className="quick-tips">
        <h4>Швидкі поради:</h4>
        <ul>
          <li>Створюйте справи для кожного клієнта</li>
          <li>Додавайте документи та події</li>
          <li>Використовуйте калькулятори для розрахунків</li>
          <li>Запрошуйте колег до співпраці</li>
        </ul>
      </div>
    </div>
  );
};

/**
 * Main Onboarding Wizard Component
 */
export const OnboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const {
    progress,
    isLoading: progressLoading,
    completeStep,
  } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Initialize completed steps from progress
  useEffect(() => {
    if (progress?.steps) {
      const completed = new Set(
        progress.steps.filter((s) => s.completed).map((s) => s.step),
      );
      setCompletedSteps(completed);

      // Find first incomplete step
      const firstIncomplete = STEPS.findIndex(
        (step) => !completed.has(step.id),
      );
      if (firstIncomplete !== -1) {
        setCurrentStep(firstIncomplete);
      } else {
        // All steps completed, redirect to dashboard
        navigate("/dashboard");
      }
    }
  }, [progress, navigate]);

  const handleStepComplete = async (data?: Record<string, any>) => {
    const step = STEPS[currentStep];

    try {
      await completeStep(step.id, data);
      setCompletedSteps((prev) => new Set([...prev, step.id]));

      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // All done, go to dashboard
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Failed to complete step:", error);
    }
  };

  const handleSkip = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate("/dashboard");
    }
  };

  if (progressLoading) {
    return (
      <div className="onboarding-loading">
        <div className="spinner"></div>
        <p>Завантаження...</p>
      </div>
    );
  }

  const renderStep = () => {
    const step = STEPS[currentStep];

    switch (step.id) {
      case "organization_details":
        return (
          <OrganizationDetailsStep
            onComplete={handleStepComplete}
            onSkip={handleSkip}
          />
        );
      case "user_profile":
        return (
          <UserProfileStep
            onComplete={handleStepComplete}
            onSkip={handleSkip}
          />
        );
      case "subscription_setup":
        return (
          <SubscriptionSetupStep
            onComplete={handleStepComplete}
            onSkip={handleSkip}
          />
        );
      case "team_invitation":
        return (
          <TeamInvitationStep
            onComplete={handleStepComplete}
            onSkip={handleSkip}
          />
        );
      case "first_case_created":
        return (
          <FirstCaseStep onComplete={handleStepComplete} onSkip={handleSkip} />
        );
      default:
        return null;
    }
  };

  return (
    <div className="onboarding-wizard">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <h1>Ласкаво просимо!</h1>
          <p>Давайте налаштуємо ваш робочий простір</p>
        </div>

        <ProgressIndicator
          steps={STEPS}
          currentStep={currentStep}
          completedSteps={completedSteps}
        />

        <div className="onboarding-content">{renderStep()}</div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
