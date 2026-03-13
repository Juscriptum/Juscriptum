import React, { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Pencil, Save } from "lucide-react";
import { caseService } from "../../services/case.service";
import { clientService } from "../../services/client.service";
import { Alert } from "../../components/Alert";
import { FormActionBar } from "../../components/FormActionBar";
import { Spinner } from "../../components/Spinner";
import { PageHeader } from "../../components/PageHeader";
import { Breadcrumbs } from "../../components/navigation";
import RelatedNotesPanel from "../../components/notes/RelatedNotesPanel";
import { CaseFormSections } from "../../components/cases";
import { useAuth } from "../../hooks/useAuth";
import {
  createCaseSchema,
  CreateCaseFormData,
} from "../../schemas/case.schema";
import { Case, CaseStatus, TimelineEvent } from "../../types/case.types";
import { Client } from "../../types/client.types";
import {
  CaseParticipant,
  buildLegacyParticipantFields,
  buildParticipantMetadata,
  extractParticipantsFromCase,
  normalizeParticipants,
} from "../../utils/caseParticipants";
import {
  getCaseTypeLabel,
  normalizeCaseTypeForForm,
} from "../../utils/caseCategories";
import "./AddCasePage.css";
import "./CaseDetailsPage.css";

const STATUS_LABELS: Record<CaseStatus, string> = {
  draft: "Чернетка",
  active: "Активна",
  on_hold: "Призупинена",
  closed: "Закрита",
  archived: "Архів",
};

const STATUS_CLASSNAMES: Record<CaseStatus, string> = {
  draft: "status-draft",
  active: "status-active",
  on_hold: "status-hold",
  closed: "status-closed",
  archived: "status-archived",
};

const PRIORITY_LABELS: Record<CreateCaseFormData["priority"], string> = {
  low: "Низький",
  medium: "Середній",
  high: "Високий",
  urgent: "Терміновий",
};

const PROCEEDING_STAGE_LABELS: Record<string, string> = {
  first_instance: "Перша інстанція",
  appeal: "Апеляція",
  cassation: "Касація",
  supreme_court: "Верховний Суд",
  execution: "Виконавче провадження",
  pre_trial: "Досудове розслідування",
  other: "Інше",
};

const mapCaseToFormData = (
  caseItem: Case,
  fallbackLawyerId?: string,
): CreateCaseFormData => ({
  caseNumber: caseItem.caseNumber || "",
  registryCaseNumber: caseItem.registryCaseNumber || "",
  caseType: normalizeCaseTypeForForm(caseItem.caseType),
  clientId: caseItem.clientId || "",
  assignedLawyerId: caseItem.assignedLawyerId || fallbackLawyerId || "",
  title: caseItem.title || "",
  description: caseItem.description || "",
  caseSubcategory: caseItem.metadata?.caseSubcategory || "",
  priority: caseItem.priority,
  startDate: caseItem.startDate ? caseItem.startDate.split("T")[0] : "",
  deadlineDate: caseItem.deadlineDate
    ? caseItem.deadlineDate.split("T")[0]
    : "",
  estimatedAmount: caseItem.estimatedAmount,
  courtFee: caseItem.courtFee,
  courtName: caseItem.courtName || "",
  courtAddress: caseItem.courtAddress || "",
  judgeName: caseItem.judgeName || "",
  proceedingStage: caseItem.proceedingStage || "",
  plaintiffName: caseItem.plaintiffName || "",
  defendantName: caseItem.defendantName || "",
  thirdParties: caseItem.thirdParties || "",
  participants: extractParticipantsFromCase(caseItem),
  internalNotes: caseItem.internalNotes || "",
  clientNotes: caseItem.clientNotes || "",
  metadata: caseItem.metadata || {},
});

export const CaseDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [caseItem, setCaseItem] = useState<Case | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<CaseStatus | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const methods = useForm<CreateCaseFormData>({
    resolver: zodResolver(createCaseSchema),
    defaultValues: {
      caseNumber: "",
      caseType: "judicial_case",
      clientId: "",
      assignedLawyerId: user?.id || "",
      priority: "medium",
      title: "",
      description: "",
      caseSubcategory: "",
      registryCaseNumber: "",
      courtName: "",
      courtAddress: "",
      judgeName: "",
      proceedingStage: "",
      plaintiffName: "",
      defendantName: "",
      thirdParties: "",
      participants: [],
      startDate: "",
      deadlineDate: "",
      internalNotes: "",
      clientNotes: "",
      metadata: {},
    },
    mode: "onTouched",
  });

  const loadPageData = async () => {
    if (!id) {
      setError("Не вдалося визначити справу");
      setPageLoading(false);
      return;
    }

    try {
      setPageLoading(true);
      setError(null);

      const [caseResponse, clients, timelineResponse] = await Promise.all([
        caseService.getCase(id),
        clientService.getAllClients(),
        caseService.getCaseTimeline(id),
      ]);

      setCaseItem(caseResponse);
      setClients(clients);
      setTimeline(timelineResponse);
      methods.reset(mapCaseToFormData(caseResponse, user?.id));
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Помилка завантаження справи");
    } finally {
      setPageLoading(false);
      setClientsLoading(false);
      setTimelineLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();
  }, [id]);

  useEffect(() => {
    if (user?.id) {
      methods.setValue("assignedLawyerId", user.id, { shouldDirty: false });
    }
  }, [methods, user?.id]);

  const getClientDisplayName = (client: Client): string => {
    const personalName =
      `${client.lastName || ""} ${client.firstName || ""} ${client.patronymic || ""}`.trim();

    if (client.type !== "legal_entity" && personalName) {
      return personalName;
    }

    return client.companyName || "Невідома компанія";
  };

  const handleSave = async (data: CreateCaseFormData) => {
    if (!id || !caseItem) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { participants, caseSubcategory, ...caseData } = data;
      const normalizedParticipants = normalizeParticipants(data.participants);
      const legacyFields = buildLegacyParticipantFields(normalizedParticipants);
      const updatedCase = await caseService.updateCase(id, {
        ...caseData,
        ...legacyFields,
        estimatedAmount:
          typeof data.estimatedAmount === "number"
            ? data.estimatedAmount
            : undefined,
        courtFee: typeof data.courtFee === "number" ? data.courtFee : undefined,
        assignedLawyerId:
          data.assignedLawyerId || user?.id || caseItem.assignedLawyerId,
        metadata: {
          ...buildParticipantMetadata(data.metadata, normalizedParticipants),
          caseSubcategory: (caseSubcategory || "").trim(),
        },
      });
      setCaseItem(updatedCase);
      methods.reset(mapCaseToFormData(updatedCase, user?.id));
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Помилка збереження справи");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (status: CaseStatus) => {
    if (!id || !caseItem) {
      return;
    }

    setStatusUpdating(status);
    setError(null);

    try {
      const updatedCase = await caseService.changeStatus(id, status);
      setCaseItem(updatedCase);
      methods.reset(mapCaseToFormData(updatedCase, user?.id));
    } catch (err: any) {
      setError(err.message || "Помилка зміни статусу");
    } finally {
      setStatusUpdating(null);
    }
  };

  const participants = useMemo<CaseParticipant[]>(
    () => (caseItem ? extractParticipantsFromCase(caseItem) : []),
    [caseItem],
  );

  const handleStartEditing = () => {
    if (!caseItem) {
      return;
    }

    methods.reset(mapCaseToFormData(caseItem, user?.id));
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    if (!caseItem) {
      setIsEditing(false);
      return;
    }

    methods.reset(mapCaseToFormData(caseItem, user?.id));
    setIsEditing(false);
  };

  const renderDetailValue = (value?: string | null) =>
    value && String(value).trim() ? value : "Не вказано";

  if (pageLoading) {
    return (
      <div className="case-details-loading">
        <Spinner size="large" />
      </div>
    );
  }

  if (!caseItem) {
    return (
      <div className="case-details-page case-details-empty">
        <Alert type="error" message={error || "Справу не знайдено"} />
      </div>
    );
  }

  return (
    <div className="add-case-page case-details-page">
      <Breadcrumbs />

      <PageHeader
        title={caseItem.title || caseItem.caseNumber}
        subtitle={
          isEditing
            ? `Редагування справи ${caseItem.caseNumber}`
            : `Перегляд справи ${caseItem.caseNumber}`
        }
        actions={
          <>
            <Link to="/cases" className="btn btn-outline">
              <ArrowLeft size={18} />
              До списку справ
            </Link>
            <Link
              to={`/cases/${caseItem.id}/documents`}
              className="btn btn-outline"
            >
              Документи
            </Link>
            <Link
              to={`/events/add?caseId=${caseItem.id}`}
              className="btn btn-outline"
            >
              <Calendar size={18} />
              Додати подію
            </Link>
            <Link
              to={`/notes?caseId=${caseItem.id}&clientId=${caseItem.clientId}&new=1`}
              className="btn btn-outline"
            >
              <Pencil size={18} />
              Додати нотатку
            </Link>
            {!isEditing && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleStartEditing}
              >
                <Pencil size={18} />
                Редагувати
              </button>
            )}
          </>
        }
      />

      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      <div className="case-details-summary-grid">
        <div className="case-summary-card">
          <span className="case-summary-label">Статус</span>
          <span
            className={`case-status-pill ${STATUS_CLASSNAMES[caseItem.status]}`}
          >
            {STATUS_LABELS[caseItem.status]}
          </span>
        </div>
        <div className="case-summary-card">
          <span className="case-summary-label">Клієнт</span>
          <span className="case-summary-value">
            {caseItem.client
              ? getClientDisplayName(caseItem.client)
              : "Не вказано"}
          </span>
        </div>
        <div className="case-summary-card">
          <span className="case-summary-label">Створено</span>
          <span className="case-summary-value">
            {new Date(caseItem.createdAt).toLocaleDateString("uk-UA")}
          </span>
        </div>
        <div className="case-summary-card">
          <span className="case-summary-label">Оновлено</span>
          <span className="case-summary-value">
            {new Date(caseItem.updatedAt).toLocaleDateString("uk-UA")}
          </span>
        </div>
      </div>

      <div className="case-status-actions-panel">
        <button
          type="button"
          className="btn btn-outline"
          disabled={statusUpdating === "active" || caseItem.status === "active"}
          onClick={() => handleStatusChange("active")}
        >
          Активувати
        </button>
        <button
          type="button"
          className="btn btn-outline"
          disabled={
            statusUpdating === "on_hold" || caseItem.status === "on_hold"
          }
          onClick={() => handleStatusChange("on_hold")}
        >
          Призупинити
        </button>
        <button
          type="button"
          className="btn btn-outline"
          disabled={statusUpdating === "closed" || caseItem.status === "closed"}
          onClick={() => handleStatusChange("closed")}
        >
          Закрити
        </button>
        <button
          type="button"
          className="btn btn-outline"
          disabled={
            statusUpdating === "archived" || caseItem.status === "archived"
          }
          onClick={() => handleStatusChange("archived")}
        >
          Архівувати
        </button>
      </div>

      {isEditing ? (
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(handleSave)}>
            <CaseFormSections
              methods={methods}
              clients={clients}
              clientsLoading={clientsLoading}
              getClientDisplayName={getClientDisplayName}
              caseNumberReadOnly
            />

            <FormActionBar title="Дії зі справою">
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleCancelEditing}
                disabled={saving}
              >
                Скасувати
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Spinner size="small" />
                    Збереження...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Зберегти зміни
                  </>
                )}
              </button>
            </FormActionBar>
          </form>
        </FormProvider>
      ) : (
        <div className="case-readonly-layout">
          <section className="form-section case-readonly-section">
            <div className="section-header">
              <Calendar size={20} />
              <h2>Основна інформація</h2>
            </div>
            <div className="case-readonly-grid">
              <div className="case-readonly-field">
                <span>Номер справи</span>
                <strong>{renderDetailValue(caseItem.caseNumber)}</strong>
              </div>
              <div className="case-readonly-field">
                <span>Дата додавання справи</span>
                <strong>
                  {caseItem.startDate
                    ? new Date(caseItem.startDate).toLocaleDateString("uk-UA")
                    : "Не вказано"}
                </strong>
              </div>
              <div className="case-readonly-field">
                <span>Категорія справи</span>
                <strong>{getCaseTypeLabel(caseItem.caseType)}</strong>
              </div>
              <div className="case-readonly-field">
                <span>Підкатегорія справи</span>
                <strong>
                  {renderDetailValue(caseItem.metadata?.caseSubcategory)}
                </strong>
              </div>
              <div className="case-readonly-field">
                <span>Пріоритет</span>
                <strong>{PRIORITY_LABELS[caseItem.priority]}</strong>
              </div>
              <div className="case-readonly-field case-readonly-field--full">
                <span>Суть справи</span>
                <strong>{renderDetailValue(caseItem.title)}</strong>
              </div>
              <div className="case-readonly-field case-readonly-field--full">
                <span>Опис справи</span>
                <strong>{renderDetailValue(caseItem.description)}</strong>
              </div>
            </div>
          </section>

          <section className="form-section case-readonly-section">
            <div className="section-header">
              <Calendar size={20} />
              <h2>Дані щодо установи</h2>
            </div>
            <div className="case-readonly-grid">
              <div className="case-readonly-field">
                <span>Назва установи</span>
                <strong>{renderDetailValue(caseItem.courtName)}</strong>
              </div>
              <div className="case-readonly-field">
                <span>Адреса установи</span>
                <strong>{renderDetailValue(caseItem.courtAddress)}</strong>
              </div>
              <div className="case-readonly-field">
                <span>Номер справи в реєстрі</span>
                <strong>
                  {renderDetailValue(caseItem.registryCaseNumber)}
                </strong>
              </div>
              <div className="case-readonly-field">
                <span>Особа, у веденні якої знаходиться справа</span>
                <strong>{renderDetailValue(caseItem.judgeName)}</strong>
              </div>
              <div className="case-readonly-field">
                <span>Стадія розгляду</span>
                <strong>
                  {renderDetailValue(
                    PROCEEDING_STAGE_LABELS[caseItem.proceedingStage || ""] ||
                      caseItem.proceedingStage,
                  )}
                </strong>
              </div>
            </div>
          </section>

          <section className="form-section case-readonly-section">
            <div className="section-header">
              <Calendar size={20} />
              <h2>Учасники</h2>
            </div>
            {participants.length > 0 ? (
              <div className="case-participants-list">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="case-participant-readonly-card"
                  >
                    <span>{renderDetailValue(participant.role)}</span>
                    <strong>{renderDetailValue(participant.name)}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="case-timeline-empty">Учасники не вказані.</div>
            )}
          </section>

          <section className="form-section case-readonly-section">
            <div className="section-header">
              <Calendar size={20} />
              <h2>Коментарі</h2>
            </div>
            <div className="case-readonly-grid">
              <div className="case-readonly-field case-readonly-field--full">
                <span>Внутрішні нотатки</span>
                <strong>{renderDetailValue(caseItem.internalNotes)}</strong>
              </div>
            </div>
          </section>
        </div>
      )}

      <section className="form-section case-timeline-section">
        <div className="section-header">
          <Calendar size={20} />
          <h2>Timeline справи</h2>
        </div>

        {timelineLoading ? (
          <div className="loading-select">
            <Spinner size="small" /> Завантаження timeline...
          </div>
        ) : timeline.length === 0 ? (
          <div className="case-timeline-empty">Немає подій у timeline</div>
        ) : (
          <div className="case-timeline-list">
            {timeline.map((event, index) => (
              <div
                key={`${event.type}-${event.date}-${index}`}
                className="case-timeline-item"
              >
                <div className="case-timeline-date">
                  {new Date(event.date).toLocaleDateString("uk-UA", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
                <div className="case-timeline-body">
                  <div className="case-timeline-type">
                    {event.type === "event" ? "Подія" : "Документ"}
                  </div>
                  <div className="case-timeline-title">
                    {event.type === "event"
                      ? event.data.title
                      : event.data.originalName}
                  </div>
                  {event.data.description && (
                    <div className="case-timeline-description">
                      {event.data.description}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <RelatedNotesPanel
        title="Нотатки справи"
        description="Усі робочі записи по справі доступні у картці та в центральному розділі нотаток."
        filters={{ caseId: caseItem.id }}
        createTo={`/notes?caseId=${caseItem.id}&clientId=${caseItem.clientId}&new=1`}
        emptyMessage="Для цієї справи ще немає пов'язаних нотаток."
      />
    </div>
  );
};

export default CaseDetailsPage;
