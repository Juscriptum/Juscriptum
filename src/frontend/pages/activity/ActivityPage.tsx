import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Alert } from "../../components/Alert";
import { Spinner } from "../../components/Spinner";
import { PageHeader } from "../../components/PageHeader";
import { Breadcrumbs } from "../../components/navigation";
import { dashboardService } from "../../services/dashboard.service";
import { ActivityFeedItem, DashboardStats } from "../../types/dashboard.types";
import "./ActivityPage.css";

const PERIOD_OPTIONS = [7, 30, 90];

const getActionTone = (action: string) => {
  switch (action) {
    case "Створено":
      return "activity-tone-create";
    case "Видалено":
      return "activity-tone-delete";
    case "Увійшов":
    case "Вийшов":
      return "activity-tone-auth";
    default:
      return "activity-tone-update";
  }
};

const formatRelativeTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Щойно";
  if (diffMins < 60) return `${diffMins} хв тому`;
  if (diffHours < 24) return `${diffHours} год тому`;
  if (diffDays < 7) return `${diffDays} дн тому`;

  return date.toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const ActivityPage: React.FC = () => {
  const [days, setDays] = useState<number>(30);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadActivity = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await dashboardService.getStats({ days });
        setStats(response);
      } catch (err: any) {
        setError(err.message || "Помилка завантаження активності");
      } finally {
        setLoading(false);
      }
    };

    loadActivity();
  }, [days]);

  const summary = useMemo(() => {
    const feed = stats?.activityFeed || [];
    return {
      total: feed.length,
      users: new Set(feed.map((item) => item.userName)).size,
      entities: new Set(feed.map((item) => item.entityType)).size,
      pendingTasks: stats?.pendingTasks.length || 0,
    };
  }, [stats]);

  const groupedFeed = useMemo(() => {
    const feed = stats?.activityFeed || [];
    return feed.reduce<Record<string, ActivityFeedItem[]>>((acc, item) => {
      const dateKey = new Date(item.timestamp).toLocaleDateString("uk-UA", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      acc[dateKey] = acc[dateKey] || [];
      acc[dateKey].push(item);
      return acc;
    }, {});
  }, [stats]);

  return (
    <div className="activity-page">
      <Breadcrumbs />
      <PageHeader
        title="Активність"
        subtitle="Хронологія дій користувачів та змін по основних сутностях"
        actions={
          <div
            className="activity-period-switcher"
            role="tablist"
            aria-label="Період активності"
          >
            {PERIOD_OPTIONS.map((value) => (
              <button
                key={value}
                type="button"
                className={`btn btn-outline ${days === value ? "is-current" : ""}`}
                onClick={() => setDays(value)}
              >
                {value} днів
              </button>
            ))}
          </div>
        }
      />

      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      {loading ? (
        <div className="activity-loading">
          <Spinner size="large" />
        </div>
      ) : (
        <>
          <div className="activity-summary-grid">
            <div className="activity-summary-card">
              <span>Подій</span>
              <strong>{summary.total}</strong>
            </div>
            <div className="activity-summary-card">
              <span>Активних користувачів</span>
              <strong>{summary.users}</strong>
            </div>
            <div className="activity-summary-card">
              <span>Типів сутностей</span>
              <strong>{summary.entities}</strong>
            </div>
            <div className="activity-summary-card">
              <span>Відкритих задач</span>
              <strong>{summary.pendingTasks}</strong>
            </div>
          </div>

          <div className="activity-layout-grid">
            <section className="activity-feed-panel">
              <div className="activity-panel-header">
                <h3>Стрічка активності</h3>
                <span>{summary.total} записів</span>
              </div>

              {Object.keys(groupedFeed).length === 0 ? (
                <div className="activity-empty">
                  Немає активності за вибраний період.
                </div>
              ) : (
                Object.entries(groupedFeed).map(([dateLabel, items]) => (
                  <div key={dateLabel} className="activity-day-group">
                    <div className="activity-day-label">{dateLabel}</div>
                    <div className="activity-day-list">
                      {items.map((item) => (
                        <article key={item.id} className="activity-entry">
                          <div
                            className={`activity-entry-marker ${getActionTone(item.action)}`}
                          />
                          <div className="activity-entry-body">
                            <div className="activity-entry-head">
                              <strong>{item.userName}</strong>
                              <span>{formatRelativeTime(item.timestamp)}</span>
                            </div>
                            <div className="activity-entry-text">
                              {item.action.toLowerCase()}{" "}
                              <span>{item.entityType}</span>
                              {item.entityDescription
                                ? `: ${item.entityDescription}`
                                : ""}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </section>

            <aside className="activity-side-panel">
              <section className="activity-card">
                <div className="activity-panel-header">
                  <h3>Найближчі задачі</h3>
                  <span>{stats?.pendingTasks.length || 0}</span>
                </div>
                {(stats?.pendingTasks || []).slice(0, 5).map((task) => (
                  <div key={task.id} className="activity-side-item">
                    <strong>{task.title}</strong>
                    <span>
                      {task.caseNumber} •{" "}
                      {new Date(task.dueDate).toLocaleDateString("uk-UA")}
                    </span>
                  </div>
                ))}
                {(stats?.pendingTasks || []).length === 0 && (
                  <div className="activity-empty side-empty">
                    Немає відкритих задач.
                  </div>
                )}
              </section>

              <section className="activity-card">
                <div className="activity-panel-header">
                  <h3>Останні справи</h3>
                  <span>{stats?.recentCases.length || 0}</span>
                </div>
                {(stats?.recentCases || []).slice(0, 5).map((caseItem) => (
                  <Link
                    key={caseItem.id}
                    to={`/cases/${caseItem.id}`}
                    className="activity-side-item activity-link-item"
                  >
                    <strong>{caseItem.title || caseItem.caseNumber}</strong>
                    <span>
                      {caseItem.clientName} • {caseItem.caseNumber}
                    </span>
                  </Link>
                ))}
                {(stats?.recentCases || []).length === 0 && (
                  <div className="activity-empty side-empty">
                    Справ поки немає.
                  </div>
                )}
              </section>
            </aside>
          </div>
        </>
      )}
    </div>
  );
};

export default ActivityPage;
