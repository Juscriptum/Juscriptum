import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Alert } from "../../components/Alert";
import { PageHeader } from "../../components/PageHeader";
import { Spinner } from "../../components/Spinner";
import { Breadcrumbs } from "../../components/navigation";
import { useWorkspaceSnapshot } from "../../hooks/useWorkspaceSnapshot";
import { Invoice } from "../../types/subscription.types";
import { getCaseTypeLabel } from "../../utils/caseCategories";
import { formatCurrencyAmount } from "../../utils/currency";
import "../workspace/WorkspacePage.css";

const PERIOD_OPTIONS = [30, 90, 180];

const formatCurrency = (amount: number) =>
  formatCurrencyAmount(amount, "UAH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const getInvoiceBadgeClass = (status: Invoice["status"]) => {
  switch (status) {
    case "paid":
      return "workspace-badge success";
    case "open":
      return "workspace-badge warning";
    case "uncollectible":
    case "void":
      return "workspace-badge danger";
    default:
      return "workspace-badge";
  }
};

export const ReportsPage: React.FC = () => {
  const [days, setDays] = useState(90);
  const {
    dashboard,
    caseStats,
    cases,
    invoices,
    subscription,
    loading,
    error,
    refresh,
  } = useWorkspaceSnapshot({ days, casesLimit: 10 });

  const reportMetrics = useMemo(() => {
    const revenue = dashboard?.revenueData || [];
    const totalRevenue = revenue.reduce((sum, item) => sum + item.amount, 0);
    const collectedRevenue = revenue.reduce(
      (sum, item) => sum + item.paidAmount,
      0,
    );
    const outstandingRevenue = Math.max(totalRevenue - collectedRevenue, 0);
    const collectionRate =
      totalRevenue > 0
        ? Math.round((collectedRevenue / totalRevenue) * 100)
        : 0;
    const paidInvoices = invoices.filter(
      (invoice) => invoice.status === "paid",
    ).length;
    const openInvoices = invoices.filter(
      (invoice) => invoice.status === "open",
    ).length;

    return {
      totalRevenue,
      collectedRevenue,
      outstandingRevenue,
      collectionRate,
      paidInvoices,
      openInvoices,
    };
  }, [dashboard, invoices]);

  const statusRows = useMemo(() => {
    const entries = Object.entries(caseStats?.byStatus || {});
    const maxValue = Math.max(...entries.map(([, value]) => value), 0);

    return entries.map(([status, value]) => ({
      status,
      value,
      fill: maxValue > 0 ? `${(value / maxValue) * 100}%` : "0%",
    }));
  }, [caseStats]);

  const typeRows = useMemo(() => {
    const totals = cases.reduce<
      Record<string, { count: number; estimated: number; paid: number }>
    >((acc, item) => {
      const key = item.caseType || "consultation_case";
      acc[key] = acc[key] || { count: 0, estimated: 0, paid: 0 };
      acc[key].count += 1;
      acc[key].estimated += item.estimatedAmount || 0;
      acc[key].paid += item.paidAmount || 0;
      return acc;
    }, {});

    return Object.entries(totals)
      .map(([type, values]) => ({
        type,
        count: values.count,
        estimatedAverage:
          values.count > 0 ? values.estimated / values.count : 0,
        paidAverage: values.count > 0 ? values.paid / values.count : 0,
      }))
      .sort((left, right) => right.count - left.count);
  }, [cases]);

  if (loading && !dashboard && !caseStats) {
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
        title="Звіти"
        subtitle="Операційна звітність по виручці, справах та виставлених рахунках"
        actions={
          <div className="workspace-actions">
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
            <button type="button" className="btn btn-primary" onClick={refresh}>
              Оновити
            </button>
          </div>
        }
      />

      {error && <Alert type="error">{error}</Alert>}

      <div className="workspace-grid">
        <div className="workspace-card">
          <span>Активні справи</span>
          <strong>{caseStats?.activeCases || 0}</strong>
          <small>Всього у портфелі: {caseStats?.total || 0}</small>
        </div>
        <div className="workspace-card">
          <span>Виручка за період</span>
          <strong>{formatCurrency(reportMetrics.totalRevenue)}</strong>
          <small>
            Сплачено: {formatCurrency(reportMetrics.collectedRevenue)}
          </small>
        </div>
        <div className="workspace-card">
          <span>Рівень інкасації</span>
          <strong>{reportMetrics.collectionRate}%</strong>
          <small>
            До отримання: {formatCurrency(reportMetrics.outstandingRevenue)}
          </small>
        </div>
        <div className="workspace-card">
          <span>Рахунки</span>
          <strong>
            {reportMetrics.paidInvoices}/{invoices.length}
          </strong>
          <small>Відкритих до оплати: {reportMetrics.openInvoices}</small>
        </div>

        <section className="workspace-panel">
          <div className="workspace-panel-header">
            <div>
              <h3>Статуси справ</h3>
              <p>Розподіл портфеля по життєвому циклу</p>
            </div>
          </div>
          {statusRows.length === 0 ? (
            <div className="workspace-empty">
              Недостатньо даних для побудови звіту.
            </div>
          ) : (
            <div className="workspace-bars">
              {statusRows.map((row) => (
                <div key={row.status} className="workspace-bar-row">
                  <div className="workspace-bar-meta">
                    <strong>{row.status}</strong>
                    <span>{row.value}</span>
                  </div>
                  <div className="workspace-bar-track">
                    <div
                      className="workspace-bar-fill"
                      style={{ ["--fill-width" as string]: row.fill }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="workspace-panel">
          <div className="workspace-panel-header">
            <div>
              <h3>Практики за типом справ</h3>
              <p>Середні суми по актуальних кейсах</p>
            </div>
          </div>
          {typeRows.length === 0 ? (
            <div className="workspace-empty">Ще немає справ для аналітики.</div>
          ) : (
            <div className="workspace-list">
              {typeRows.slice(0, 6).map((row) => (
                <div key={row.type} className="workspace-data-row">
                  <div>
                    <strong>{getCaseTypeLabel(row.type)}</strong>
                    <span>{row.count} справ</span>
                  </div>
                  <div>
                    <strong>{formatCurrency(row.estimatedAverage)}</strong>
                    <span>
                      Середня оцінка, сплачено {formatCurrency(row.paidAverage)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="workspace-panel full">
          <div className="workspace-panel-header">
            <div>
              <h3>Останні рахунки та справи</h3>
              <p>
                План: <strong>{subscription?.plan || "n/a"}</strong>
              </p>
            </div>
            <Link to="/billing" className="btn btn-outline">
              До білінгу
            </Link>
          </div>
          <div className="workspace-two-column">
            <div className="workspace-list">
              {invoices.slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="workspace-list-item">
                  <div>
                    <strong>
                      {invoice.number || `Рахунок ${invoice.id.slice(0, 6)}`}
                    </strong>
                    <span>
                      {formatCurrencyAmount(invoice.amount, invoice.currency)}
                    </span>
                  </div>
                  <span className={getInvoiceBadgeClass(invoice.status)}>
                    {invoice.status}
                  </span>
                </div>
              ))}
              {invoices.length === 0 && (
                <div className="workspace-empty">
                  Рахунки ще не створювались.
                </div>
              )}
            </div>
            <div className="workspace-list">
              {cases.slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  to={`/cases/${item.id}`}
                  className="workspace-list-item workspace-link"
                >
                  <div>
                    <strong>{item.title || item.caseNumber}</strong>
                    <span>
                      {item.caseNumber} •{" "}
                      {item.client?.companyName ||
                        item.client?.firstName ||
                        "Клієнт"}
                    </span>
                  </div>
                  <span className="workspace-badge">{item.status}</span>
                </Link>
              ))}
              {cases.length === 0 && (
                <div className="workspace-empty">Справи поки відсутні.</div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ReportsPage;
