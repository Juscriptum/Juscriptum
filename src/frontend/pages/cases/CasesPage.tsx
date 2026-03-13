import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import caseService from "../../services/case.service";
import {
  Case,
  CaseFilters,
  CasePriority,
  CaseStatus,
  CaseType,
  TimelineEvent,
} from "../../types/case.types";
import { Spinner } from "../../components/Spinner";
import { Alert } from "../../components/Alert";
import { PageHeader } from "../../components/PageHeader";
import { DateRangePicker } from "../../components/DateRangePicker";
import { RecordActionsMenu } from "../../components/RecordActionsMenu";
import {
  CASE_CATEGORY_OPTIONS,
  getCaseTypeLabel as getCaseTypeLabelText,
} from "../../utils/caseCategories";
import "./CasesPage.css";

/**
 * Cases List Page
 */
export const CasesPage: React.FC = () => {
  const todayIso = new Date().toISOString().split("T")[0];
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<CaseFilters>({
    limit: 20,
    page: 1,
    clientId: searchParams.get("clientId") || undefined,
    status: (searchParams.get("status") as CaseStatus | null) || undefined,
  });
  const [showTimeline, setShowTimeline] = useState<string | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  useEffect(() => {
    loadCases();
  }, [filters]);

  const loadCases = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await caseService.getCases(filters);
      setCases(response.data);
      setTotal(response.total);
      setPage(response.page);
    } catch (err: any) {
      setError(err.message || "Помилка завантаження справ");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (search: string) => {
    setFilters((current) => ({ ...current, search, page: 1 }));
  };

  const handleFilterChange = (
    key: keyof CaseFilters,
    value: string | undefined,
  ) => {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((current) => ({ ...current, page: newPage }));
  };

  const handleDateRangeChange = (
    key: "startDateFrom" | "startDateTo",
    value: string,
  ) => {
    setFilters((current) => ({
      ...current,
      [key]: value || undefined,
      page: 1,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      limit: filters.limit || 20,
      page: 1,
      clientId: searchParams.get("clientId") || undefined,
      status: (searchParams.get("status") as CaseStatus | null) || undefined,
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Ви впевнені, що хочете видалити цю справу?")) {
      return;
    }

    try {
      await caseService.deleteCase(id);
      await loadCases();
    } catch (err: any) {
      setError(err.message || "Помилка видалення справи");
    }
  };

  const handleStatusChange = async (id: string, status: CaseStatus) => {
    try {
      await caseService.changeStatus(id, status);
      await loadCases();
    } catch (err: any) {
      setError(err.message || "Помилка зміни статусу");
    }
  };

  const handleArchive = async (caseItem: Case) => {
    if (caseItem.status === "archived") {
      return;
    }

    if (!window.confirm(`Архівувати справу "${caseItem.caseNumber}"?`)) {
      return;
    }

    await handleStatusChange(caseItem.id, "archived");
  };

  const loadTimeline = async (caseId: string) => {
    setTimelineLoading(true);
    try {
      const timeline = await caseService.getCaseTimeline(caseId);
      setTimelineData(timeline);
      setShowTimeline(caseId);
    } catch (err: any) {
      setError(err.message || "Помилка завантаження timeline");
    } finally {
      setTimelineLoading(false);
    }
  };

  const totalPages = Math.ceil(total / (filters.limit || 20));
  const getStatusBadge = (status: CaseStatus) => {
    const statusClasses: Record<CaseStatus, string> = {
      draft: "badge-secondary",
      active: "badge-success",
      on_hold: "badge-warning",
      closed: "badge-info",
      archived: "badge-default",
    };
    const statusLabels: Record<CaseStatus, string> = {
      draft: "Чернетка",
      active: "Активна",
      on_hold: "Призупинена",
      closed: "Закрита",
      archived: "Архів",
    };

    return (
      <span className={`badge ${statusClasses[status]}`}>
        {statusLabels[status]}
      </span>
    );
  };

  const getPriorityBadge = (priority: CasePriority) => {
    const priorityClasses: Record<CasePriority, string> = {
      low: "priority-low",
      medium: "priority-medium",
      high: "priority-high",
      urgent: "priority-urgent",
    };
    const priorityLabels: Record<CasePriority, string> = {
      low: "Низький",
      medium: "Середній",
      high: "Високий",
      urgent: "Терміновий",
    };

    return (
      <span className={`priority-badge ${priorityClasses[priority]}`}>
        {priorityLabels[priority]}
      </span>
    );
  };

  const getCaseTypeLabel = (type: CaseType) => {
    return getCaseTypeLabelText(type);
  };

  const getClientDisplayName = (caseItem: Case) => {
    if (!caseItem.client) {
      return "Клієнта не вказано";
    }

    if (caseItem.client.type === "individual") {
      return (
        `${caseItem.client.lastName || ""} ${caseItem.client.firstName || ""}`.trim() ||
        "Фізична особа"
      );
    }

    return caseItem.client.companyName || "Юридична особа";
  };

  const formatCaseDate = (date?: string) => {
    return date ? new Date(date).toLocaleDateString("uk-UA") : "Не призначено";
  };

  return (
    <div className="cases-page">
      <PageHeader
        title="Мої справи"
        subtitle="Операційний реєстр справ, строків і статусів з прямим переходом до документів та timeline"
        actions={
          <button
            className="btn btn-primary"
            onClick={() => navigate("/cases/add")}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Нова справа
          </button>
        }
      />

      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      <section className="cases-registry">
        <div className="filters-bar">
          <div className="search-box">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Пошук справ..."
              value={filters.search || ""}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <div className="filters-date-range">
            <span className="filters-date-range__label">Дата відкриття</span>
            <DateRangePicker
              fromValue={filters.startDateFrom}
              toValue={filters.startDateTo}
              onFromChange={(value) =>
                handleDateRangeChange("startDateFrom", value)
              }
              onToChange={(value) =>
                handleDateRangeChange("startDateTo", value)
              }
              max={todayIso}
            />
          </div>
          <select
            value={filters.caseType || ""}
            onChange={(e) =>
              handleFilterChange("caseType", e.target.value || undefined)
            }
          >
            <option value="">Усі типи</option>
            {CASE_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={filters.status || ""}
            onChange={(e) =>
              handleFilterChange("status", e.target.value || undefined)
            }
          >
            <option value="">Усі статуси</option>
            <option value="draft">Чернетки</option>
            <option value="active">Активні</option>
            <option value="on_hold">Призупинені</option>
            <option value="closed">Закриті</option>
            <option value="archived">Архівні</option>
          </select>
          <select
            value={filters.priority || ""}
            onChange={(e) =>
              handleFilterChange("priority", e.target.value || undefined)
            }
          >
            <option value="">Усі пріоритети</option>
            <option value="urgent">Термінові</option>
            <option value="high">Високі</option>
            <option value="medium">Середні</option>
            <option value="low">Низькі</option>
          </select>
          <button
            type="button"
            className="btn btn-secondary filters-reset-btn"
            onClick={handleResetFilters}
          >
            Скинути
          </button>
        </div>

        {loading ? (
          <div className="loading-container">
            <Spinner size="large" />
          </div>
        ) : cases.length === 0 ? (
          <div className="empty-state">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <h3>Справ не знайдено</h3>
            <p>
              {filters.clientId
                ? "Для цього клієнта ще немає справ."
                : "Створіть першу справу, щоб почати роботу."}
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/cases/add")}
            >
              Нова справа
            </button>
          </div>
        ) : (
          <>
            <div className="cases-table">
              <table>
                <thead>
                  <tr>
                    <th>Номер</th>
                    <th>Номер справи в реєстрі</th>
                    <th>Клієнт</th>
                    <th>Суд</th>
                    <th>Статус</th>
                    <th>Пріоритет</th>
                    <th>Наступна дата</th>
                    <th>Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((caseItem) => (
                    <tr key={caseItem.id}>
                      <td data-label="Номер">
                        <span className="case-number-cell">
                          {caseItem.caseNumber}
                        </span>
                      </td>
                      <td data-label="Номер справи в реєстрі">
                        {caseItem.registryCaseNumber ? (
                          <Link
                            to={`/cases/${caseItem.id}`}
                            className="case-subject-link"
                          >
                            {caseItem.registryCaseNumber}
                          </Link>
                        ) : (
                          <span className="muted-text">Не вказано</span>
                        )}
                      </td>
                      <td data-label="Клієнт">
                        {caseItem.client ? (
                          <Link
                            to={`/clients/${caseItem.client.id}`}
                            className="client-link"
                          >
                            {getClientDisplayName(caseItem)}
                          </Link>
                        ) : (
                          <span className="muted-text">Клієнта не вказано</span>
                        )}
                      </td>
                      <td data-label="Суд">
                        {caseItem.courtName ? (
                          <span
                            className="court-name"
                            title={caseItem.courtName}
                          >
                            {caseItem.courtName}
                          </span>
                        ) : (
                          <span className="muted-text">Не вказано</span>
                        )}
                      </td>
                      <td data-label="Статус">
                        <div className="status-cell">
                          {getStatusBadge(caseItem.status)}
                          <select
                            className="status-dropdown"
                            value={caseItem.status}
                            onChange={(e) =>
                              handleStatusChange(
                                caseItem.id,
                                e.target.value as CaseStatus,
                              )
                            }
                            aria-label={`Статус справи ${caseItem.caseNumber}`}
                          >
                            <option value="draft">Чернетка</option>
                            <option value="active">Активна</option>
                            <option value="on_hold">Призупинена</option>
                            <option value="closed">Закрита</option>
                            <option value="archived">Архів</option>
                          </select>
                        </div>
                      </td>
                      <td data-label="Пріоритет">
                        {getPriorityBadge(caseItem.priority)}
                      </td>
                      <td data-label="Наступна дата">
                        <div className="case-dates-cell">
                          <span className="date-label">Засідання</span>
                          <span
                            className={
                              caseItem.nextHearingDate
                                ? "date-value"
                                : "muted-text"
                            }
                          >
                            {formatCaseDate(caseItem.nextHearingDate)}
                          </span>
                          {caseItem.deadlineDate && (
                            <span className="date-note">
                              Дедлайн: {formatCaseDate(caseItem.deadlineDate)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td data-label="Дії">
                        <RecordActionsMenu
                          actions={[
                            {
                              label: "Відкрити / редагувати",
                              to: `/cases/${caseItem.id}`,
                            },
                            {
                              label: "Дублювати",
                              to: `/cases/add?duplicateFrom=${caseItem.id}`,
                            },
                            {
                              label: "Документи справи",
                              to: `/documents?caseId=${caseItem.id}`,
                            },
                            {
                              label: "Timeline справи",
                              onClick: () => loadTimeline(caseItem.id),
                            },
                            {
                              label:
                                caseItem.status === "archived"
                                  ? "Уже в архіві"
                                  : "Архівувати",
                              onClick: () => handleArchive(caseItem),
                              disabled: caseItem.status === "archived",
                            },
                            {
                              label: "Видалити",
                              onClick: () => handleDelete(caseItem.id),
                              danger: true,
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="btn btn-secondary"
                  disabled={page === 1}
                  onClick={() => handlePageChange(page - 1)}
                >
                  Попередня
                </button>
                <span className="page-info">
                  Сторінка {page} з {totalPages} ({total} записів)
                </span>
                <button
                  className="btn btn-secondary"
                  disabled={page === totalPages}
                  onClick={() => handlePageChange(page + 1)}
                >
                  Наступна
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {showTimeline && (
        <TimelineModal
          caseId={showTimeline}
          timeline={timelineData}
          loading={timelineLoading}
          onClose={() => setShowTimeline(null)}
        />
      )}
    </div>
  );
};

interface TimelineModalProps {
  caseId: string;
  timeline: TimelineEvent[];
  loading: boolean;
  onClose: () => void;
}

const TimelineModal: React.FC<TimelineModalProps> = ({
  caseId,
  timeline,
  loading,
  onClose,
}) => {
  return (
    <div className="modal-overlay">
      <div className="modal modal-lg">
        <div className="modal-header">
          <h2>Timeline справи {caseId}</h2>
          <button className="modal-close" onClick={onClose}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div className="loading-container">
              <Spinner />
            </div>
          ) : timeline.length === 0 ? (
            <div className="empty-timeline">
              <p>Немає подій у timeline</p>
            </div>
          ) : (
            <div className="timeline">
              {timeline.map((event, index) => (
                <div
                  key={index}
                  className={`timeline-item timeline-${event.type}`}
                >
                  <div className="timeline-marker">
                    {event.type === "event" ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect
                          x="3"
                          y="4"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                      </svg>
                    ) : (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    )}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-date">
                      {new Date(event.date).toLocaleDateString("uk-UA", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                    <div className="timeline-title">
                      {event.type === "event"
                        ? event.data.title
                        : event.data.originalName}
                    </div>
                    {event.data.description && (
                      <div className="timeline-description">
                        {event.data.description}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CasesPage;
