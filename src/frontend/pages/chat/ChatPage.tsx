import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Alert } from "../../components/Alert";
import { PageHeader } from "../../components/PageHeader";
import { Spinner } from "../../components/Spinner";
import { Breadcrumbs } from "../../components/navigation";
import { useWorkspaceSnapshot } from "../../hooks/useWorkspaceSnapshot";
import "../workspace/WorkspacePage.css";

export const ChatPage: React.FC = () => {
  const { dashboard, cases, loading, error, refresh } = useWorkspaceSnapshot({
    days: 30,
    casesLimit: 12,
  });

  const rooms = useMemo(() => {
    return cases.slice(0, 6).map((item) => ({
      id: item.id,
      title: item.title || item.caseNumber,
      subtitle: `${item.caseNumber} • ${item.status}`,
      activityCount:
        dashboard?.activityFeed.filter((entry) =>
          entry.entityDescription?.includes(item.caseNumber),
        ).length || 0,
    }));
  }, [cases, dashboard]);

  if (loading && !dashboard && cases.length === 0) {
    return (
      <div className="workspace-loading">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="workspace-page">
      <Breadcrumbs />
      <PageHeader
        title="Чат"
        subtitle="Обговорення справ, що потребують уваги команди"
        actions={
          <button type="button" className="btn btn-primary" onClick={refresh}>
            Оновити
          </button>
        }
      />
      {error && <Alert type="error">{error}</Alert>}
      <div className="workspace-grid">
        <div className="workspace-card">
          <span>Активність</span>
          <strong>{dashboard?.activityFeed.length || 0}</strong>
          <small>Подій за останній період</small>
        </div>
        <div className="workspace-card">
          <span>Задачі</span>
          <strong>{dashboard?.pendingTasks.length || 0}</strong>
          <small>Потребують обговорення</small>
        </div>
        <div className="workspace-card">
          <span>Кімнати справ</span>
          <strong>{rooms.length}</strong>
          <small>Доступні для переходу</small>
        </div>
        <div className="workspace-card">
          <span>Учасники</span>
          <strong>{cases.length}</strong>
          <small>Справ у робочому переліку</small>
        </div>
        <section className="workspace-panel full">
          <div className="workspace-panel-header">
            <div>
              <h3>Пріоритетні обговорення</h3>
              <p>Відкрийте справу, щоб продовжити роботу</p>
            </div>
          </div>
          <div className="workspace-list">
            {rooms.map((room) => (
              <Link
                key={room.id}
                to={`/cases/${room.id}`}
                className="workspace-list-item workspace-link"
              >
                <div>
                  <strong>{room.title}</strong>
                  <span>{room.subtitle}</span>
                </div>
                <span className="workspace-badge">
                  {room.activityCount} подій
                </span>
              </Link>
            ))}
            {rooms.length === 0 && (
              <div className="workspace-empty">
                Немає справ для командного обговорення.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ChatPage;
