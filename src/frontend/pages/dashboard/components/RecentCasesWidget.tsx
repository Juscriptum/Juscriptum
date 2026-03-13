import React from "react";
import { RecentCase } from "../../../types/dashboard.types";

interface RecentCasesWidgetProps {
  cases: RecentCase[];
}

export const RecentCasesWidget: React.FC<RecentCasesWidgetProps> = ({
  cases,
}) => {
  const getStatusClass = (status: string) => {
    const classes: Record<string, string> = {
      Активна: "badge-status-active",
      Чернетка: "badge-status-draft",
      Призупинена: "badge-status-paused",
      Закрита: "badge-status-closed",
      Архівна: "badge-status-archived",
    };
    return classes[status] || "badge-status-default";
  };

  const getPriorityClass = (priority: string) => {
    const classes: Record<string, string> = {
      Низький: "badge-priority-low",
      Середній: "badge-priority-medium",
      Високий: "badge-priority-high",
      Терміновий: "badge-priority-urgent",
    };
    return classes[priority] || "badge-priority-default";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (cases.length === 0) {
    return (
      <div className="widget recent-cases-widget">
        <div className="widget-header">
          <h3 className="widget-title">Останні справи</h3>
        </div>
        <div className="widget-empty">
          <p>Немає справ для відображення</p>
        </div>
      </div>
    );
  }

  return (
    <div className="widget recent-cases-widget">
      <div className="widget-header">
        <h3 className="widget-title">Останні справи</h3>
        <span className="widget-count">{cases.length}</span>
      </div>
      <div className="widget-content">
        {cases.map((caseItem) => (
          <div key={caseItem.id} className="case-item">
            <div className="case-item-header">
              <span className="case-number">{caseItem.caseNumber}</span>
              <div className="case-badges">
                <span
                  className={`badge badge-status ${getStatusClass(caseItem.status)}`}
                >
                  {caseItem.status}
                </span>
                <span
                  className={`badge badge-priority ${getPriorityClass(caseItem.priority)}`}
                >
                  {caseItem.priority}
                </span>
              </div>
            </div>
            <div className="case-item-title">{caseItem.title}</div>
            <div className="case-item-footer">
              <span className="case-client">{caseItem.clientName}</span>
              <span className="case-date">
                {formatDate(caseItem.nextHearingDate)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
