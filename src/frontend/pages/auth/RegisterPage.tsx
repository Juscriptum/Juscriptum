import React, { useState, FormEvent, ChangeEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { RegisterCredentials } from "../../types/auth.types";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Alert } from "../../components/Alert";
import { Spinner } from "../../components/Spinner";
import { Logo } from "../../common/Logo";
import "./RegisterPage.css";

const registerHighlights = [
  "Швидка реєстрація лише за email та паролем",
  "Профіль юриста можна заповнити пізніше в onboarding або профілі",
  "Кабінет створюється одразу після успішного входу",
];

const getRegistrationErrorMessage = (error: unknown): string => {
  const responseMessage = (error as any)?.response?.data?.message;

  if (Array.isArray(responseMessage)) {
    return responseMessage.join(". ");
  }

  if (typeof responseMessage === "string" && responseMessage.trim()) {
    return responseMessage;
  }

  if ((error as any)?.request && !(error as any)?.response) {
    return "Сервіс реєстрації тимчасово недоступний. Спробуйте ще раз за кілька хвилин.";
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Не вдалося зареєструватись";
};

/**
 * Register Page Component - Simple email + password registration
 */
export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState<RegisterCredentials>({
    email: "",
    password: "",
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setError(null);
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    handleChange(e);

    // Calculate password strength
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    setPasswordStrength(strength);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Обов'язкове поле";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Невірний формат email";
    }

    if (!formData.password) {
      newErrors.password = "Обов'язкове поле";
    } else if (formData.password.length < 8) {
      newErrors.password = "Мінімум 8 символів";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Обов'язкове поле";
    } else if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = "Паролі не співпадають";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setError(null);

    try {
      await register(formData);
      navigate("/dashboard", {
        state: {
          message:
            "Реєстрація успішна. Заповніть детальний профіль зараз або поверніться до нього пізніше.",
        },
      });
    } catch (err: unknown) {
      setError(getRegistrationErrorMessage(err));
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="register-page">
      <div className="register-container">
        <section className="register-showcase">
          <div className="register-showcase-badge">Старт у Law Organizer</div>
          <h1 className="register-showcase-title">
            Зареєструйте акаунт за хвилину, а деталі профілю внесіть другим
            кроком.
          </h1>
          <p className="register-showcase-text">
            На першому етапі потрібен лише email і пароль. Після входу ви
            відкриєте робочий кабінет і зможете заповнити реквізити, адресу,
            банківські дані та професійний статус окремою анкетою.
          </p>
          <ul className="register-showcase-list">
            {registerHighlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <div className="register-card">
          <Logo className="register-logo" />

          <h1 className="register-title">Реєстрація</h1>
          <p className="register-subtitle">
            Створіть акаунт і відкрийте робочий кабінет
          </p>

          {error && (
            <Alert type="error" className="register-alert">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="register-form">
            <Input
              name="email"
              type="email"
              label="Електронна пошта"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              disabled={isLoading}
              autoFocus
              error={errors.email}
            />

            <Input
              name="password"
              type="password"
              label="Пароль"
              value={formData.password}
              onChange={handlePasswordChange}
              placeholder="Мінімум 8 символів"
              required
              disabled={isLoading}
              error={errors.password}
            />

            <div className="password-strength">
              <div className="strength-bar">
                <div
                  className={`strength-fill strength-${passwordStrength}`}
                  style={{
                    ["--strength-width" as string]: `${(passwordStrength / 6) * 100}%`,
                  }}
                />
              </div>
              <span className="strength-text">
                {passwordStrength <= 2 && "Слабкий пароль"}
                {passwordStrength > 2 &&
                  passwordStrength <= 4 &&
                  "Середній пароль"}
                {passwordStrength > 4 && "Сильний пароль"}
              </span>
            </div>

            <Input
              name="confirmPassword"
              type="password"
              label="Підтвердження паролю"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors((prev) => ({ ...prev, confirmPassword: "" }));
              }}
              placeholder="Повторіть пароль"
              required
              disabled={isLoading}
              error={errors.confirmPassword}
            />

            <div className="register-actions">
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner size="small" />
                    Реєстрація...
                  </>
                ) : (
                  "Зареєструватись"
                )}
              </Button>
            </div>
          </form>

          <div className="register-footer">
            <p className="register-login">
              Вже є акаунт?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                disabled={isLoading}
              >
                Увійти
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
