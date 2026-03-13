import React, { useMemo } from "react";
import { Alert } from "../../components/Alert";
import { PageHeader } from "../../components/PageHeader";
import { Spinner } from "../../components/Spinner";
import { Breadcrumbs } from "../../components/navigation";
import { useWorkspaceSnapshot } from "../../hooks/useWorkspaceSnapshot";
import { formatCurrencyAmount } from "../../utils/currency";
import "../workspace/WorkspacePage.css";

export const MailPage: React.FC = () => {
  const { clients, invoices, documents, loading, error, refresh } =
    useWorkspaceSnapshot({ clientsLimit: 20, documentsLimit: 10 });

  const contacts = useMemo(
    () => clients.filter((client) => client.email).slice(0, 8),
    [clients],
  );
  const unpaidInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status === "open"),
    [invoices],
  );

  if (loading && clients.length === 0 && invoices.length === 0) {
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
        title="Пошта"
        subtitle="Контакти, рахунки та документи для щоденної комунікації"
        actions={
          <button type="button" className="btn btn-primary" onClick={refresh}>
            Оновити
          </button>
        }
      />
      {error && <Alert type="error">{error}</Alert>}
      <div className="workspace-grid">
        <div className="workspace-card">
          <span>Контакти з email</span>
          <strong>{contacts.length}</strong>
          <small>Готові до зв'язку</small>
        </div>
        <div className="workspace-card">
          <span>Відкриті рахунки</span>
          <strong>{unpaidInvoices.length}</strong>
          <small>Потребують нагадування</small>
        </div>
        <div className="workspace-card">
          <span>Документи</span>
          <strong>{documents.length}</strong>
          <small>Доступні для роботи</small>
        </div>
        <div className="workspace-card">
          <span>Комунікації</span>
          <strong>{contacts.length + unpaidInvoices.length}</strong>
          <small>Поточні приводи для звернення</small>
        </div>
        <section className="workspace-panel">
          <div className="workspace-panel-header">
            <h3>Контакти</h3>
          </div>
          <div className="workspace-list">
            {contacts.map((client) => (
              <a
                key={client.id}
                href={`mailto:${client.email}`}
                className="workspace-list-item workspace-link"
              >
                <div>
                  <strong>
                    {client.companyName ||
                      `${client.lastName || ""} ${client.firstName || ""}`.trim() ||
                      "Клієнт"}
                  </strong>
                  <span>{client.email}</span>
                </div>
                <span className="workspace-badge">{client.status}</span>
              </a>
            ))}
            {contacts.length === 0 && (
              <div className="workspace-empty">Немає контактів з email.</div>
            )}
          </div>
        </section>
        <section className="workspace-panel">
          <div className="workspace-panel-header">
            <h3>Нагадування по оплатах</h3>
          </div>
          <div className="workspace-list">
            {unpaidInvoices.map((invoice) => (
              <div key={invoice.id} className="workspace-list-item">
                <div>
                  <strong>
                    {invoice.number || `Рахунок ${invoice.id.slice(0, 6)}`}
                  </strong>
                  <span>
                    {formatCurrencyAmount(invoice.amount, invoice.currency)}
                  </span>
                </div>
                <span className="workspace-badge warning">
                  {invoice.status}
                </span>
              </div>
            ))}
            {unpaidInvoices.length === 0 && (
              <div className="workspace-empty">
                Немає відкритих рахунків для нагадувань.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default MailPage;
