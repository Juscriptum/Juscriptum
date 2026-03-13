import React from "react";
import { ActivityFeedItem } from "../../../types/dashboard.types";

interface ActivityFeedWidgetProps {
  activities: ActivityFeedItem[];
}

export const ActivityFeedWidget: React.FC<ActivityFeedWidgetProps> = ({
  activities,
}) => {
  const getActionIcon = (action: string) => {
    const icons: Record<string, JSX.Element> = {
      Створено: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      ),
      Оновлено: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
        >
          <path d="M23 4v6h-6" />
          <path d="M1 20v-6h6" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
      ),
      Видалено: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      ),
      Увійшов: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6b7280"
          strokeWidth="2"
        >
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
      ),
      Вийшов: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6b7280"
          strokeWidth="2"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      ),
      "Змінено права": (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
    };
    return icons[action] || icons["Оновлено"];
  };

  const formatTime = (timestamp: string) => {
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

    return date.toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (activities.length === 0) {
    return (
      <div className="widget activity-feed-widget">
        <div className="widget-header">
          <h3 className="widget-title">Остання активність</h3>
        </div>
        <div className="widget-empty">
          <p>Немає активності</p>
        </div>
      </div>
    );
  }

  return (
    <div className="widget activity-feed-widget">
      <div className="widget-header">
        <h3 className="widget-title">Остання активність</h3>
        <span className="widget-count">{activities.length}</span>
      </div>
      <div className="widget-content">
        {activities.map((activity) => (
          <div key={activity.id} className="activity-item">
            <div className="activity-icon">
              {getActionIcon(activity.action)}
            </div>
            <div className="activity-content">
              <div className="activity-text">
                <span className="activity-user">{activity.userName}</span>{" "}
                {activity.action.toLowerCase()}{" "}
                <span className="activity-entity-type">
                  {activity.entityType}
                </span>
                {activity.entityDescription && (
                  <span className="activity-entity">
                    : {activity.entityDescription}
                  </span>
                )}
              </div>
              <div className="activity-time">
                {formatTime(activity.timestamp)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
