import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { subscriptionService } from "../../services/subscription.service";
import "./PaymentResult.css";

/**
 * Payment Success Page
 */
export const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<"success" | "pending" | "error">(
    "pending",
  );

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!sessionId) {
        setStatus("error");
        setIsLoading(false);
        return;
      }

      try {
        // Wait a moment for webhook to process
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Check subscription status
        const subscription = await subscriptionService.getSubscription();

        if (subscription && subscription.status === "active") {
          setStatus("success");
        } else {
          setStatus("pending");
        }
      } catch (error) {
        console.error("Failed to check payment status:", error);
        setStatus("pending"); // Show pending state on error
      } finally {
        setIsLoading(false);
      }
    };

    checkPaymentStatus();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="payment-result-page">
        <div className="payment-result-card">
          <div className="loading-animation">
            <div className="spinner"></div>
          </div>
          <h2>Обробка платежу...</h2>
          <p>Будь ласка, зачекайте, ми перевіряємо статус оплати</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-result-page">
      <div className={`payment-result-card ${status}`}>
        {status === "success" && (
          <>
            <div className="icon success">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2>Оплата успішна!</h2>
            <p>Ваша підписка була успішно активована. Дякуємо за довіру!</p>
            <button
              onClick={() => navigate("/dashboard")}
              className="primary-button"
            >
              Перейти до дашборду
            </button>
          </>
        )}

        {status === "pending" && (
          <>
            <div className="icon pending">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h2>Платіж обробляється</h2>
            <p>
              Ваш платіж прийнято до обробки. Підписка буде активована протягом
              кількох хвилин. Ви отримаєте підтвердження на email.
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="primary-button"
            >
              Перейти до дашборду
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="icon error">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h2>Помилка</h2>
            <p>
              Не вдалося визначити статус платежу. Якщо кошти були списані,
              зв'яжіться з підтримкою.
            </p>
            <button
              onClick={() => navigate("/billing")}
              className="primary-button"
            >
              Спробувати знову
            </button>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * Payment Cancel Page
 */
export const PaymentCancelPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="payment-result-page">
      <div className="payment-result-card canceled">
        <div className="icon canceled">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h2>Платіж скасовано</h2>
        <p>
          Ви скасували процес оплати. Ви можете спробувати знову в будь-який
          час.
        </p>
        <div className="button-group">
          <button
            onClick={() => navigate("/billing")}
            className="primary-button"
          >
            Повернутися до оплати
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="secondary-button"
          >
            На дашборд
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
