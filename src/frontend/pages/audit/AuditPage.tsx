import React, { useEffect, useMemo, useState } from "react";
import { Alert } from "../../components/Alert";
import { PageHeader } from "../../components/PageHeader";
import { Spinner } from "../../components/Spinner";
import { UpgradePrompt } from "../../components/UpgradePrompt";
import { Breadcrumbs } from "../../components/navigation";
import { auditLogService } from "../../services/audit-log.service";
import { AuditLogItem } from "../../types/audit-log.types";
import { usePermissions } from "../../hooks/usePermissions";
import "../workspace/WorkspacePage.css";
import "./AuditPage.css";

const ACTION_OPTIONS = ["", "create", "update", "delete", "login", "revoke"];

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export const AuditPage: React.FC = () => {
  const permissions = usePermissions();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");

  const canAccessAudit = permissions.canAccessAdvancedAudit();

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await auditLogService.getLogs({
        action: action || undefined,
        entityType: entityType || undefined,
        page: 1,
        limit: 50,
      });
      setLogs(response.data);
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ||
          "Не вдалося завантажити аудит подій",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canAccessAudit) {
      void loadLogs();
    } else {
      setLoading(false);
    }
  }, [canAccessAudit]);

  const summary = useMemo(() => {
    return {
      total: logs.length,
      logins: logs.filter((item) => item.action === "login").length,
      writes: logs.filter((item) =>
        ["create", "update", "delete", "revoke"].includes(item.action),
      ).length,
      entities: new Set(logs.map((item) => item.entityType)).size,
    };
  }, [logs]);

  if (!canAccessAudit) {
    return (
      <div className="workspace-page">
        <Breadcrumbs />
        <PageHeader
          title="Аудит"
          subtitle="Розширений журнал подій доступний з тарифу Professional"
        />
        <UpgradePrompt feature="Журнал аудиту та експорт подій" />
      </div>
    );
  }

  if (loading) {
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
        title="Аудит"
        subtitle="Журнал дій, входів і змін в організації"
        actions={
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              void loadLogs();
            }}
          >
            Оновити
          </button>
        }
      />

      {error && <Alert type="error">{error}</Alert>}

      <div className="workspace-grid">
        <div className="workspace-card">
          <span>Подій</span>
          <strong>{summary.total}</strong>
          <small>У поточній вибірці</small>
        </div>
        <div className="workspace-card">
          <span>Входи</span>
          <strong>{summary.logins}</strong>
          <small>Події входу</small>
        </div>
        <div className="workspace-card">
          <span>Мутації</span>
          <strong>{summary.writes}</strong>
          <small>Створення, зміни та скасування</small>
        </div>
        <div className="workspace-card">
          <span>Сутності</span>
          <strong>{summary.entities}</strong>
          <small>Унікальні типи об'єктів</small>
        </div>

        <section className="workspace-panel full">
          <div className="audit-toolbar">
            <label>
              Дія
              <select
                value={action}
                onChange={(event) => setAction(event.target.value)}
              >
                {ACTION_OPTIONS.map((value) => (
                  <option key={value || "all"} value={value}>
                    {value || "Усі дії"}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Тип сутності
              <input
                value={entityType}
                onChange={(event) => setEntityType(event.target.value)}
                placeholder="Користувач, справа, клієнт..."
              />
            </label>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                void loadLogs();
              }}
            >
              Застосувати
            </button>
          </div>

          <div className="workspace-list">
            {logs.length === 0 ? (
              <div className="workspace-empty">
                Для поточного фільтра журнал подій порожній.
              </div>
            ) : (
              logs.map((item) => (
                <div key={item.id} className="workspace-list-item audit-row">
                  <div>
                    <strong>
                      {item.action} • {item.entityType}
                    </strong>
                    <span>
                      {formatDate(item.createdAt)}
                      {item.entityId ? ` • ${item.entityId}` : ""}
                    </span>
                    {item.changedFields?.length ? (
                      <span className="audit-meta">
                        Змінені поля: {item.changedFields.join(", ")}
                      </span>
                    ) : null}
                  </div>
                  <div className="audit-side">
                    <span
                      className={`workspace-badge audit-badge audit-badge--${item.action}`}
                    >
                      {item.action}
                    </span>
                    {item.ipAddress && (
                      <span className="audit-side-note">{item.ipAddress}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AuditPage;
