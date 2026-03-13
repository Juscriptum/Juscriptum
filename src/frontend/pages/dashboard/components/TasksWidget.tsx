import React from "react";
import { Task } from "../../../types/dashboard.types";

interface TasksWidgetProps {
  tasks: Task[];
}

export const TasksWidget: React.FC<TasksWidgetProps> = ({ tasks }) => {
  const getTypeIcon = (type: Task["type"]) => {
    const icons: Record<Task["type"], JSX.Element> = {
      deadline: (
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
      hearing: (
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
      document: (
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
      ),
      payment: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      ),
    };
    return icons[type];
  };

  const getPriorityClass = (priority: string) => {
    const classes: Record<string, string> = {
      Низький: "task-priority-low",
      Середній: "task-priority-medium",
      Високий: "task-priority-high",
      Терміновий: "task-priority-urgent",
    };
    return classes[priority] || "task-priority-default";
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays < 0) {
      return `Прострочено ${Math.abs(diffDays)} дн`;
    }
    if (diffDays === 0) {
      return "Сьогодні";
    }
    if (diffDays === 1) {
      return "Завтра";
    }
    if (diffDays < 7) {
      return `Через ${diffDays} дн`;
    }

    return date.toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (tasks.length === 0) {
    return (
      <div className="widget tasks-widget">
        <div className="widget-header">
          <h3 className="widget-title">Завдання</h3>
        </div>
        <div className="widget-empty">
          <p>Немає завдань</p>
        </div>
      </div>
    );
  }

  return (
    <div className="widget tasks-widget">
      <div className="widget-header">
        <h3 className="widget-title">Завдання</h3>
        <span className="widget-count">{tasks.length}</span>
      </div>
      <div className="widget-content">
        {tasks.map((task) => (
          <div key={task.id} className="task-item">
            <div className="task-item-icon">{getTypeIcon(task.type)}</div>
            <div className="task-item-content">
              <div className="task-item-title">{task.title}</div>
              <div className="task-item-meta">
                <span
                  className={`task-priority ${getPriorityClass(task.priority)}`}
                >
                  {task.priority}
                </span>
                <span className="task-due-date">
                  {formatDueDate(task.dueDate)}
                </span>
              </div>
              <div className="task-case">{task.caseNumber}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
