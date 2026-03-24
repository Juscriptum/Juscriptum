import React, { useEffect } from "react";
import { useDashboard } from "../../hooks/useDashboard";
import { StatCard } from "./components/StatCard";
import { RecentCasesWidget } from "./components/RecentCasesWidget";
import { UpcomingEventsWidget } from "./components/UpcomingEventsWidget";
import { ActivityFeedWidget } from "./components/ActivityFeedWidget";
import { TasksWidget } from "./components/TasksWidget";
import { Spinner } from "../../components/Spinner";
import { Alert } from "../../components/Alert";
import { PageHeader } from "../../components/PageHeader";
import { Breadcrumbs } from "../../components/navigation";
import { formatCurrencyAmount } from "../../utils/currency";
import "./DashboardPage.css";

/**
 * Dashboard Page Component
 * Main dashboard showing statistics and recent activity
 */
export const DashboardPage: React.FC = () => {
  const { stats, isLoading, error, fetchStats, refresh } = useDashboard();

  useEffect(() => {
    fetchStats({ days: 30 });
  }, [fetchStats]);

  const handleRefresh = () => {
    refresh();
  };

  if (isLoading && !stats) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <Spinner size="large" />
          <p>Завантаження даних...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <Breadcrumbs />
      <PageHeader
        title="Дашборд"
        subtitle="Ключові показники, активність і найближчі події без зайвого шуму"
        actions={
          <button
            className="btn btn-outline dashboard-refresh"
            onClick={handleRefresh}
            disabled={isLoading}
            title="Оновити"
          >
            {isLoading ? (
              <Spinner size="small" />
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            )}
            Оновити
          </button>
        }
      />

      {error && (
        <Alert type="error" className="dashboard-alert">
          {error}
        </Alert>
      )}

      <div className="dashboard-content">
        {/* Statistics Cards */}
        {stats && (
          <section className="dashboard-section dashboard-section-stats">
            <div className="stats-grid">
              {stats.stats.map((stat, index) => (
                <StatCard key={index} stat={stat} />
              ))}
            </div>
          </section>
        )}

        {/* Main Content Grid */}
        <div className="dashboard-grid">
          {/* Left Column */}
          <div className="dashboard-column">
            {/* Recent Cases */}
            {stats && (
              <section className="dashboard-section">
                <RecentCasesWidget cases={stats.recentCases} />
              </section>
            )}

            {/* Activity Feed */}
            {stats && (
              <section className="dashboard-section">
                <ActivityFeedWidget activities={stats.activityFeed} />
              </section>
            )}
          </div>

          {/* Right Column */}
          <div className="dashboard-column">
            {/* Upcoming Events */}
            {stats && (
              <section className="dashboard-section">
                <UpcomingEventsWidget events={stats.upcomingEvents} />
              </section>
            )}

            {/* Tasks */}
            {stats && (
              <section className="dashboard-section">
                <TasksWidget tasks={stats.pendingTasks} />
              </section>
            )}
          </div>
        </div>

        {/* Revenue Chart Section */}
        {stats && stats.revenueData.length > 0 && (
          <section className="dashboard-section dashboard-section-revenue">
            <div className="widget revenue-widget">
              <div className="widget-header">
                <h3 className="widget-title">Дохід</h3>
                <div className="revenue-summary">
                  <div className="revenue-summary-item">
                    <span className="revenue-summary-label">Загальний:</span>
                    <span className="revenue-summary-value">
                      {formatCurrencyAmount(
                        stats.revenueData.reduce(
                          (sum, item) => sum + item.amount,
                          0,
                        ),
                      )}
                    </span>
                  </div>
                  <div className="revenue-summary-item">
                    <span className="revenue-summary-label">Оплачено:</span>
                    <span className="revenue-summary-value revenue-summary-value-paid">
                      {formatCurrencyAmount(
                        stats.revenueData.reduce(
                          (sum, item) => sum + item.paidAmount,
                          0,
                        ),
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <div className="widget-content">
                <div className="revenue-chart">
                  {stats.revenueData.map((item, index) => {
                    const maxValue = Math.max(
                      ...stats.revenueData.map((d) => d.amount),
                    );
                    const height =
                      maxValue > 0 ? (item.amount / maxValue) * 100 : 0;

                    return (
                      <div key={index} className="revenue-bar">
                        <div
                          className="revenue-bar-fill"
                          style={{ ["--bar-height" as string]: `${height}%` }}
                          title={`${new Date(item.date).toLocaleDateString("uk-UA")}: ${formatCurrencyAmount(item.amount)}`}
                        />
                        <div className="revenue-bar-label">
                          {new Date(item.date).toLocaleDateString("uk-UA", {
                            day: "2-digit",
                            month: "2-digit",
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
