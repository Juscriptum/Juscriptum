import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Alert } from "./Alert";
import { Spinner } from "./Spinner";
import { caseService } from "../services/case.service";
import { RegistryHearingSuggestion } from "../types/case.types";
import { useAuth } from "../hooks/useAuth";

const CHECK_TIME_ZONE = "Europe/Kyiv";
const CHECK_HOUR = 10;

const getTodayKeyInTimeZone = (timeZone: string): string =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const getCurrentHourInTimeZone = (timeZone: string): number =>
  Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      hour12: false,
    }).format(new Date()),
  );

const formatRegistryDate = (value: string): string => {
  const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})$/);

  if (!match) {
    return value;
  }

  const [, day, month, year, hours, minutes] = match;
  return `${day}.${month}.${year} ${hours}:${minutes}`;
};

export const RegistryHearingNotifications: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [items, setItems] = useState<RegistryHearingSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingForCaseId, setCreatingForCaseId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const storageKey = useMemo(
    () =>
      user?.id
        ? `law-organizer.registry-hearing-check.${user.id}.${getTodayKeyInTimeZone(CHECK_TIME_ZONE)}`
        : null,
    [user?.id],
  );

  useEffect(() => {
    if (!isAuthenticated || !user?.id || !storageKey) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    if (getCurrentHourInTimeZone(CHECK_TIME_ZONE) < CHECK_HOUR) {
      return;
    }

    if (window.localStorage.getItem(storageKey) === "done") {
      return;
    }

    let isCancelled = false;

    const loadNotifications = async () => {
      try {
        setLoading(true);
        setError(null);
        const suggestions = await caseService.getRegistryHearingNotifications();

        if (isCancelled) {
          return;
        }

        setItems(suggestions.slice(0, 3));
        window.localStorage.setItem(storageKey, "done");
      } catch (requestError: any) {
        if (isCancelled) {
          return;
        }

        setError(
          requestError.response?.data?.message ||
            "Не вдалося перевірити найближчі засідання з `court_dates`.",
        );
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    void loadNotifications();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, storageKey, user?.id]);

  const handleCreateEvent = async (suggestion: RegistryHearingSuggestion) => {
    try {
      setCreatingForCaseId(suggestion.caseId);
      setError(null);
      await caseService.createRegistryHearingEvent(suggestion.caseId);
      setItems((current) =>
        current.filter((item) => item.caseId !== suggestion.caseId),
      );
    } catch (requestError: any) {
      setError(
        requestError.response?.data?.message ||
          "Не вдалося створити подію за даними реєстру.",
      );
    } finally {
      setCreatingForCaseId(null);
    }
  };

  const handleDismiss = (caseId: string) => {
    setItems((current) => current.filter((item) => item.caseId !== caseId));
  };

  if (!isAuthenticated || (!loading && items.length === 0 && !error)) {
    return null;
  }

  return (
    <div className="registry-hearing-notifications">
      {loading && (
        <Alert type="info">
          <span className="registry-hearing-inline">
            <Spinner size="small" />
            Перевіряємо `court_dates` після 10:00 за `Europe/Kyiv`...
          </span>
        </Alert>
      )}

      {error && (
        <Alert type="warning" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {items.map((item) => (
        <Alert
          key={`${item.caseId}-${item.date}`}
          type="info"
          onClose={() => handleDismiss(item.caseId)}
        >
          <div className="registry-hearing-notice">
            <strong>
              У реєстрі знайдено найближче засідання по справі {item.caseNumber}
              .
            </strong>
            <span>
              Дата: {formatRegistryDate(item.date)}. Суд:{" "}
              {item.courtName || "не вказано"}.
            </span>
            <span>
              Пошук:{" "}
              {item.matchedBy.includes("case_number")
                ? "за номером справи"
                : "за ПІБ / учасниками"}
              .
            </span>
            <div className="registry-hearing-actions">
              <button
                type="button"
                className="btn btn-primary"
                disabled={creatingForCaseId === item.caseId}
                onClick={() => handleCreateEvent(item)}
              >
                {creatingForCaseId === item.caseId
                  ? "Створення..."
                  : "Створити подію"}
              </button>
              <Link to={`/cases/${item.caseId}`} className="btn btn-outline">
                Відкрити справу
              </Link>
            </div>
          </div>
        </Alert>
      ))}
    </div>
  );
};

export default RegistryHearingNotifications;
