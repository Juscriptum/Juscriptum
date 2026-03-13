import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Alert } from "../../components/Alert";
import { PageHeader } from "../../components/PageHeader";
import { Spinner } from "../../components/Spinner";
import { Breadcrumbs } from "../../components/navigation";
import { useAuth } from "../../hooks/useAuth";
import { caseService } from "../../services/case.service";
import { clientService } from "../../services/client.service";
import { eventService } from "../../services/event.service";
import { User as AuthUser } from "../../types/auth.types";
import { Case } from "../../types/case.types";
import { Client } from "../../types/client.types";
import {
  CalendarEventType,
  CreateEventDto,
  EventRecurrencePattern,
  EventReminderUnit,
} from "../../types/event.types";
import "./AddEventPage.css";

const EVENT_TYPE_OPTIONS: Array<{ value: CalendarEventType; label: string }> = [
  { value: "hearing", label: "Засідання" },
  { value: "deadline", label: "Строк / дедлайн" },
  { value: "meeting", label: "Зустріч" },
  { value: "court_sitting", label: "Судове засідання" },
  { value: "other", label: "Інша подія" },
];

const REMINDER_UNIT_OPTIONS: Array<{
  value: EventReminderUnit;
  label: string;
}> = [
  { value: "minutes", label: "хвилин" },
  { value: "hours", label: "годин" },
  { value: "days", label: "днів" },
  { value: "weeks", label: "тижнів" },
];

const REPEAT_OPTIONS: Array<{
  value: EventRecurrencePattern;
  label: string;
}> = [
  { value: "daily", label: "Щодня" },
  { value: "weekly", label: "Щотижня" },
  { value: "monthly", label: "Щомісяця" },
  { value: "yearly", label: "Щороку" },
];

const toTodayIso = () => new Date().toISOString().split("T")[0];

type EventAudienceType = "user" | "client";

const getClientDisplayName = (client: Client) => {
  const fullName = [client.lastName, client.firstName, client.patronymic]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    fullName || client.companyName || client.email || client.phone || "Клієнт"
  );
};

const getUserDisplayName = (user?: AuthUser | null) => {
  if (!user) {
    return "Поточний користувач";
  }

  const fullName = [user.lastName, user.firstName, user.patronymic]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || user.email || "Поточний користувач";
};

export const AddEventPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const caseId = searchParams.get("caseId") || "";
  const clientId = searchParams.get("clientId") || "";
  const [audienceType, setAudienceType] = useState<EventAudienceType>(
    caseId || clientId ? "client" : "user",
  );
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedClientId, setSelectedClientId] = useState(clientId);
  const [isRangeEvent, setIsRangeEvent] = useState(false);
  const [form, setForm] = useState<CreateEventDto>({
    caseId: caseId || undefined,
    type: "meeting",
    title: "",
    description: "",
    eventDate: toTodayIso(),
    eventTime: "10:00",
    endDate: toTodayIso(),
    endTime: "11:00",
    isAllDay: false,
    location: "",
    courtRoom: "",
    judgeName: "",
    responsibleContact: "",
    reminderValue: 1,
    reminderUnit: "days",
    reminderDaysBefore: 1,
    isRecurring: false,
    recurrencePattern: "weekly",
    recurrenceInterval: 1,
  });

  useEffect(() => {
    let active = true;

    const loadOptions = async () => {
      try {
        setOptionsLoading(true);
        const [loadedClients, loadedCasesResponse] = await Promise.all([
          clientService.getAllClients({ status: "active" }),
          caseService.getCases({
            limit: 100,
            sortBy: "updatedAt",
            sortOrder: "DESC",
          }),
        ]);

        if (!active) {
          return;
        }

        setClients(loadedClients);
        setCases(loadedCasesResponse.data);

        if (!clientId && caseId) {
          const selectedCase = loadedCasesResponse.data.find(
            (item) => item.id === caseId,
          );

          if (selectedCase?.clientId) {
            setSelectedClientId(selectedCase.clientId);
          }
        }
      } catch (loadError: any) {
        if (!active) {
          return;
        }

        setError(
          loadError.response?.data?.message ||
            loadError.message ||
            "Не вдалося завантажити клієнтів та справи.",
        );
      } finally {
        if (active) {
          setOptionsLoading(false);
        }
      }
    };

    void loadOptions();

    return () => {
      active = false;
    };
  }, [caseId, clientId]);

  useEffect(() => {
    if (!isRangeEvent) {
      setForm((current) => ({
        ...current,
        endDate: current.eventDate,
        endTime: current.eventTime,
      }));
    }
  }, [isRangeEvent]);

  const eventTypeLabel = useMemo(
    () =>
      EVENT_TYPE_OPTIONS.find((option) => option.value === form.type)?.label ||
      "Подія",
    [form.type],
  );

  const availableCases = useMemo(() => {
    if (audienceType !== "client" || !selectedClientId) {
      return [];
    }

    return cases.filter((item) => item.clientId === selectedClientId);
  }, [audienceType, cases, selectedClientId]);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) || null,
    [clients, selectedClientId],
  );

  const updateForm = <K extends keyof CreateEventDto>(
    key: K,
    value: CreateEventDto[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const buildParticipantsPayload = (): Record<string, unknown> | undefined => {
    if (audienceType === "client") {
      if (!selectedClient) {
        return undefined;
      }

      const clientName = getClientDisplayName(selectedClient);
      return {
        labels: [clientName],
        subject: {
          type: "client",
          id: selectedClient.id,
          name: clientName,
          ...(form.caseId ? { caseId: form.caseId } : {}),
        },
      };
    }

    if (!user) {
      return undefined;
    }

    const userName = getUserDisplayName(user);
    return {
      labels: [userName],
      subject: {
        type: "user",
        id: user.id,
        name: userName,
        email: user.email,
        phone: user.phone || user.phonePrimary || undefined,
      },
    };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.eventDate) {
      setError("Вкажіть дату події.");
      return;
    }

    if (audienceType === "client" && !selectedClientId) {
      setError("Оберіть клієнта для події.");
      return;
    }

    if (
      isRangeEvent &&
      form.endDate &&
      new Date(`${form.endDate}T${form.endTime || "23:59"}`) <
        new Date(`${form.eventDate}T${form.eventTime || "00:00"}`)
    ) {
      setError("Дата та час завершення мають бути пізніше за початок події.");
      return;
    }

    if (form.isRecurring && !form.recurrenceEndDate) {
      setError("Вкажіть дату завершення повтору.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const normalizedTitle = form.title.trim() || eventTypeLabel;

      await eventService.createEvent({
        ...form,
        caseId:
          audienceType === "client" ? form.caseId || undefined : undefined,
        title: normalizedTitle,
        description: form.description?.trim() || undefined,
        eventTime: form.eventTime || undefined,
        endDate: isRangeEvent ? form.endDate : undefined,
        endTime: isRangeEvent ? form.endTime : undefined,
        location: form.location?.trim() || undefined,
        courtRoom: form.courtRoom?.trim() || undefined,
        judgeName: form.judgeName?.trim() || undefined,
        responsibleContact: form.responsibleContact?.trim() || undefined,
        participants: buildParticipantsPayload(),
        reminderValue: form.reminderValue,
        reminderUnit: form.reminderUnit,
        reminderDaysBefore:
          form.reminderUnit === "days" ? form.reminderValue : 0,
        isRecurring: form.isRecurring,
        recurrencePattern: form.isRecurring
          ? form.recurrencePattern
          : undefined,
        recurrenceInterval: form.isRecurring
          ? form.recurrenceInterval
          : undefined,
        recurrenceEndDate: form.isRecurring
          ? form.recurrenceEndDate
          : undefined,
      });

      setSuccess("Подію створено. Повертаю до календаря…");
      window.setTimeout(() => navigate("/calendar"), 500);
    } catch (submitError: any) {
      setError(
        submitError.response?.data?.message ||
          submitError.message ||
          "Не вдалося створити подію.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-event-page">
      <Breadcrumbs />
      <PageHeader
        title="Додати нову подію"
        subtitle="Заповніть інформацію про подію."
      />

      {error && (
        <Alert type="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert type="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <form className="add-event-form" onSubmit={handleSubmit}>
        <div className="add-event-grid">
          <label className="form-field">
            <span>Тип події</span>
            <select
              value={form.type}
              onChange={(event) =>
                updateForm("type", event.target.value as CalendarEventType)
              }
              disabled={loading}
            >
              {EVENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Подія для</span>
            <div
              className="audience-toggle"
              role="group"
              aria-label="Перемикач типу події"
            >
              <button
                type="button"
                aria-pressed={audienceType === "user"}
                className={`audience-toggle__option ${audienceType === "user" ? "is-active" : ""}`}
                onClick={() => {
                  setAudienceType("user");
                  updateForm("caseId", undefined);
                }}
                disabled={loading}
              >
                Користувач
              </button>
              <button
                type="button"
                aria-pressed={audienceType === "client"}
                className={`audience-toggle__option ${audienceType === "client" ? "is-active" : ""}`}
                onClick={() => setAudienceType("client")}
                disabled={loading}
              >
                Клієнт
              </button>
            </div>
          </label>

          {audienceType === "client" ? (
            <label className="form-field form-field--wide">
              <span>Клієнт</span>
              <select
                value={selectedClientId}
                onChange={(event) => {
                  const nextClientId = event.target.value;
                  setSelectedClientId(nextClientId);
                  updateForm("caseId", undefined);
                }}
                disabled={loading || optionsLoading}
              >
                <option value="">Оберіть клієнта</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {getClientDisplayName(client)}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="form-field form-field--wide">
              <span>Користувач</span>
              <div className="selection-summary">
                <strong>{getUserDisplayName(user)}</strong>
                <p>Подія буде створена без прив'язки до клієнта та справи.</p>
              </div>
            </div>
          )}

          <label className="form-field form-field--wide">
            <span>Назва події</span>
            <input
              type="text"
              value={form.title}
              onChange={(event) => updateForm("title", event.target.value)}
              placeholder={`Наприклад, ${eventTypeLabel}`}
              disabled={loading}
            />
          </label>

          <label className="form-field">
            <span>Дата</span>
            <input
              type="date"
              value={form.eventDate}
              onChange={(event) => updateForm("eventDate", event.target.value)}
              disabled={loading}
            />
          </label>

          <label className="form-field">
            <span>Час</span>
            <input
              type="time"
              value={form.eventTime || ""}
              onChange={(event) => updateForm("eventTime", event.target.value)}
              disabled={loading || Boolean(form.isAllDay)}
            />
          </label>

          <label className="form-field form-field--wide checkbox-field">
            <input
              type="checkbox"
              checked={isRangeEvent}
              onChange={(event) => setIsRangeEvent(event.target.checked)}
              disabled={loading}
            />
            <span>Продовжувана подія (від і до)</span>
          </label>

          {isRangeEvent && (
            <>
              <label className="form-field">
                <span>Дата завершення</span>
                <input
                  type="date"
                  value={form.endDate || ""}
                  onChange={(event) =>
                    updateForm("endDate", event.target.value)
                  }
                  disabled={loading}
                />
              </label>

              <label className="form-field">
                <span>Час завершення</span>
                <input
                  type="time"
                  value={form.endTime || ""}
                  onChange={(event) =>
                    updateForm("endTime", event.target.value)
                  }
                  disabled={loading || Boolean(form.isAllDay)}
                />
              </label>
            </>
          )}

          <label className="form-field form-field--wide checkbox-field checkbox-field--compact">
            <input
              type="checkbox"
              checked={Boolean(form.isAllDay)}
              onChange={(event) => updateForm("isAllDay", event.target.checked)}
              disabled={loading}
            />
            <span>Увесь день</span>
          </label>

          <label className="form-field">
            <span>Місце події</span>
            <input
              type="text"
              value={form.location || ""}
              onChange={(event) => updateForm("location", event.target.value)}
              placeholder="Адреса або онлайн"
              disabled={loading}
            />
          </label>

          <label className="form-field">
            <span>Зала / кабінет</span>
            <input
              type="text"
              value={form.courtRoom || ""}
              onChange={(event) => updateForm("courtRoom", event.target.value)}
              placeholder="Необов'язково"
              disabled={loading}
            />
          </label>

          <label className="form-field">
            <span>Контакти відповідальної особи</span>
            <input
              type="text"
              value={form.responsibleContact || ""}
              onChange={(event) =>
                updateForm("responsibleContact", event.target.value)
              }
              placeholder="ПІБ, телефон або email"
              disabled={loading}
            />
          </label>

          <label className="form-field">
            <span>Суддя / контакт</span>
            <input
              type="text"
              value={form.judgeName || ""}
              onChange={(event) => updateForm("judgeName", event.target.value)}
              placeholder="Необов'язково"
              disabled={loading}
            />
          </label>

          <div className="form-field">
            <span>Нагадати за</span>
            <div className="inline-fields">
              <input
                type="number"
                min="0"
                value={form.reminderValue ?? 0}
                onChange={(event) =>
                  updateForm("reminderValue", Number(event.target.value))
                }
                disabled={loading}
              />
              <select
                value={form.reminderUnit || "days"}
                onChange={(event) =>
                  updateForm(
                    "reminderUnit",
                    event.target.value as EventReminderUnit,
                  )
                }
                disabled={loading}
              >
                {REMINDER_UNIT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="form-field form-field--wide checkbox-field">
            <input
              type="checkbox"
              checked={Boolean(form.isRecurring)}
              onChange={(event) =>
                updateForm("isRecurring", event.target.checked)
              }
              disabled={loading}
            />
            <span>Повтор</span>
          </label>

          {form.isRecurring && (
            <>
              <label className="form-field">
                <span>Повторювати</span>
                <select
                  value={form.recurrencePattern || "weekly"}
                  onChange={(event) =>
                    updateForm(
                      "recurrencePattern",
                      event.target.value as EventRecurrencePattern,
                    )
                  }
                  disabled={loading}
                >
                  {REPEAT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span>Інтервал повтору</span>
                <input
                  type="number"
                  min="1"
                  value={form.recurrenceInterval || 1}
                  onChange={(event) =>
                    updateForm("recurrenceInterval", Number(event.target.value))
                  }
                  disabled={loading}
                />
              </label>

              <label className="form-field">
                <span>Повтор до</span>
                <input
                  type="date"
                  value={form.recurrenceEndDate || ""}
                  onChange={(event) =>
                    updateForm("recurrenceEndDate", event.target.value)
                  }
                  disabled={loading}
                />
              </label>
            </>
          )}

          <label className="form-field form-field--wide">
            <span>Опис</span>
            <textarea
              rows={5}
              value={form.description || ""}
              onChange={(event) =>
                updateForm("description", event.target.value)
              }
              placeholder="Коротко опишіть зміст події"
              disabled={loading}
            />
          </label>

          {audienceType === "client" && (
            <label className="form-field">
              <span>Справа (необов'язково)</span>
              <select
                value={form.caseId || ""}
                onChange={(event) =>
                  updateForm("caseId", event.target.value || undefined)
                }
                disabled={loading || optionsLoading || !selectedClientId}
              >
                <option value="">
                  {!selectedClientId
                    ? "Спочатку оберіть клієнта"
                    : availableCases.length > 0
                      ? "Оберіть справу"
                      : "У клієнта ще немає справ"}
                </option>
                {availableCases.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.caseNumber} {item.title ? `• ${item.title}` : ""}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="add-event-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate("/calendar")}
            disabled={loading}
          >
            Скасувати
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <Spinner size="small" /> Збереження...
              </>
            ) : (
              "Зберегти"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEventPage;
