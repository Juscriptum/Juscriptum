import React, { useState, FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Alert } from "../../components/Alert";
import { Spinner } from "../../components/Spinner";
import { Logo } from "../../common/Logo";
import { getAuthRedirectTarget } from "../../utils/authRedirect";
import "./LoginPage.css";

const loginHighlights = [
  "Усі клієнти, справи, документи та строки зібрані в одному кабінеті",
  "Швидкий доступ до щоденної роботи без пошуку по таблицях, чатах і папках",
  "Зручно для приватної практики, адвокатського бюро та юридичної компанії",
];

/**
 * Login Page Component
 */
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, isAuthenticated } = useAuth();
  const redirectTarget = getAuthRedirectTarget(location.search);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showMfa, setShowMfa] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await login(
        {
          email,
          password,
          mfaCode: showMfa ? mfaCode : undefined,
        },
        {
          rememberMe,
        },
      );

      // Redirect to dashboard or onboarding
      navigate(redirectTarget, { replace: true });
    } catch (err: any) {
      if (
        err.response?.status === 401 &&
        err.response?.data?.message ===
          "Введіть код двофакторної аутентифікації"
      ) {
        setShowMfa(true);
      } else {
        setError(err.response?.data?.message || "Не вдалося увійти");
      }
    }
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  const handleRegister = () => {
    navigate("/register");
  };

  if (isAuthenticated) {
    return <Navigate to={redirectTarget} replace />;
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <section className="login-showcase">
          <div className="login-showcase-badge">Law Organizer</div>
          <h1 className="login-showcase-title">
            Увійдіть у свій юридичний кабінет.
          </h1>
          <p className="login-showcase-text">
            Працюйте з клієнтами, справами, документами та важливими строками в
            одному робочому просторі без хаосу й зайвих переключень.
          </p>
          <ul className="login-showcase-list">
            {loginHighlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <div className="login-card">
          <Logo className="login-logo" />

          <h1 className="login-title">Вхід до кабінету</h1>
          <p className="login-subtitle">
            Увійдіть, щоб продовжити роботу з юридичною практикою в Law
            Organizer
          </p>

          {error && (
            <Alert type="error" className="login-alert">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <Input
              type="email"
              name="email"
              label="Електронна пошта"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={isLoading}
              autoFocus
            />

            <Input
              type="password"
              name="password"
              label="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введіть пароль"
              required
              disabled={isLoading}
            />

            {showMfa && (
              <Input
                type="text"
                name="mfaCode"
                label="Код двофакторної аутентифікації"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                pattern="\d*"
                required
                disabled={isLoading}
                autoFocus
              />
            )}

            <div className="login-actions">
              <label className="login-remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                />
                <span>Запам'ятати мене</span>
              </label>

              <button
                type="button"
                className="login-forgot-password"
                onClick={handleForgotPassword}
                disabled={isLoading}
              >
                Забули пароль?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="large"
              fullWidth
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner size="small" />
                  Вхід...
                </>
              ) : (
                "Увійти"
              )}
            </Button>
          </form>

          <div className="login-footer">
            <p className="login-register">
              Немає акаунту?{" "}
              <button
                type="button"
                onClick={handleRegister}
                disabled={isLoading}
              >
                Зареєструватися
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
