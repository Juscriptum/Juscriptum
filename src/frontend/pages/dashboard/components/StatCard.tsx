import React from "react";
import { StatCard as StatCardType } from "../../types/dashboard.types";

interface StatCardProps {
  stat: StatCardType;
}

export const StatCard: React.FC<StatCardProps> = ({ stat }) => {
  const getIconSvg = (icon: string) => {
    const icons: Record<string, JSX.Element> = {
      users: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      briefcase: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
      folder: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      ),
      "dollar-sign": (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    };
    return icons[icon] || icons.users;
  };

  const trendIcon =
    stat.trend === "up" ? "↑" : stat.trend === "down" ? "↓" : "→";
  const trendClass = `stat-card-change-${stat.trend}`;

  return (
    <div className="stat-card">
      <div className="stat-card-icon">{getIconSvg(stat.icon)}</div>
      <div className="stat-card-content">
        <div className="stat-card-label">{stat.label}</div>
        <div className="stat-card-value">
          {stat.value.toLocaleString("uk-UA")}
        </div>
        <div className={`stat-card-change ${trendClass}`}>
          {trendIcon} {Math.abs(stat.change).toFixed(1)}%
          <span className="stat-card-change-label"> за період</span>
        </div>
      </div>
    </div>
  );
};
