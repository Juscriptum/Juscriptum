import React from "react";
import { UpcomingEvent } from "../../../types/dashboard.types";

interface UpcomingEventsWidgetProps {
  events: UpcomingEvent[];
}

export const UpcomingEventsWidget: React.FC<UpcomingEventsWidgetProps> = ({
  events,
}) => {
  const getTypeIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      "Судове засідання": (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 3v18h18" />
          <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
        </svg>
      ),
      Дедлайн: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      Зустріч: (
        <svg
          width="16"
          height="16"
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
      "Судове слухання": (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      ),
      Інше: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      ),
    };
    return icons[type] || icons["Інше"];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow =
      new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString() ===
      date.toDateString();

    if (isToday) {
      return "Сьогодні";
    }
    if (isTomorrow) {
      return "Завтра";
    }

    return date.toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("uk-UA", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isUrgent = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours < 24 && diffHours > 0;
  };

  if (events.length === 0) {
    return (
      <div className="widget upcoming-events-widget">
        <div className="widget-header">
          <h3 className="widget-title">Найближчі події</h3>
        </div>
        <div className="widget-empty">
          <p>Немає запланованих подій</p>
        </div>
      </div>
    );
  }

  return (
    <div className="widget upcoming-events-widget">
      <div className="widget-header">
        <h3 className="widget-title">Найближчі події</h3>
        <span className="widget-count">{events.length}</span>
      </div>
      <div className="widget-content">
        {events.map((event) => (
          <div
            key={event.id}
            className={`event-item ${isUrgent(event.eventDate) ? "event-item-urgent" : ""}`}
          >
            <div className="event-item-icon">{getTypeIcon(event.type)}</div>
            <div className="event-item-content">
              <div className="event-item-title">{event.title}</div>
              <div className="event-item-type">{event.type}</div>
              <div className="event-item-meta">
                <span className="event-item-date">
                  {formatDate(event.eventDate)}
                </span>
                <span className="event-item-time">
                  {formatTime(event.eventDate)}
                </span>
              </div>
              <div className="event-item-location">📍 {event.location}</div>
              <div className="event-item-case">{event.caseNumber}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
