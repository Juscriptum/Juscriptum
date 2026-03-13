import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Alert } from "../../components/Alert";
import { Spinner } from "../../components/Spinner";
import { PageHeader } from "../../components/PageHeader";
import { Breadcrumbs } from "../../components/navigation";
import { caseService } from "../../services/case.service";
import { clientService } from "../../services/client.service";
import documentService from "../../services/document.service";
import { Case } from "../../types/case.types";
import { Client } from "../../types/client.types";
import { Document } from "../../types/document.types";
import { getClientDisplayName } from "../../utils/clientFormData";
import "../workspace/WorkspacePage.css";

const ARCHIVE_LIMIT = 12;

export const ArchivePage: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadArchive = async () => {
    try {
      setLoading(true);
      setError(null);

      const [casesResponse, clientsResponse, documentsResponse] =
        await Promise.all([
          caseService.getCases({
            status: "archived",
            limit: ARCHIVE_LIMIT,
            sortBy: "updatedAt",
            sortOrder: "DESC",
          }),
          clientService.getClients({
            status: "archived",
            limit: ARCHIVE_LIMIT,
            sortBy: "updatedAt",
            sortOrder: "DESC",
          }),
          documentService.getDocuments({
            status: "archived",
            limit: ARCHIVE_LIMIT,
            sortBy: "updatedAt",
            sortOrder: "DESC",
          }),
        ]);

      setCases(casesResponse.data);
      setClients(clientsResponse.data);
      setDocuments(documentsResponse.data);
    } catch (err: any) {
      setError(err.message || "Помилка завантаження архіву");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArchive();
  }, []);

  const summary = useMemo(
    () => ({
      cases: cases.length,
      clients: clients.length,
      documents: documents.length,
      total: cases.length + clients.length + documents.length,
    }),
    [cases, clients, documents],
  );

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
        title="Архів"
        subtitle="Архівовані клієнти, справи та файли в одному розділі"
        actions={
          <button
            type="button"
            className="btn btn-primary"
            onClick={loadArchive}
          >
            Оновити
          </button>
        }
      />
      {error && <Alert type="error">{error}</Alert>}

      <div className="workspace-grid">
        <div className="workspace-card">
          <span>Усього в архіві</span>
          <strong>{summary.total}</strong>
          <small>Останні архівовані записи</small>
        </div>
        <div className="workspace-card">
          <span>Справи</span>
          <strong>{summary.cases}</strong>
          <small>Архівні юридичні справи</small>
        </div>
        <div className="workspace-card">
          <span>Клієнти</span>
          <strong>{summary.clients}</strong>
          <small>Архівовані клієнтські картки</small>
        </div>
        <div className="workspace-card">
          <span>Файли</span>
          <strong>{summary.documents}</strong>
          <small>Архівні документи</small>
        </div>

        <section className="workspace-panel">
          <div className="workspace-panel-header">
            <div>
              <h3>Архівні справи</h3>
              <p>Останні справи, переміщені в архів</p>
            </div>
            <Link to="/cases?status=archived" className="btn btn-outline">
              Усі архівні справи
            </Link>
          </div>
          <div className="workspace-list">
            {cases.map((caseItem) => (
              <Link
                key={caseItem.id}
                to={`/cases/${caseItem.id}`}
                className="workspace-list-item workspace-link"
              >
                <div>
                  <strong>{caseItem.title || caseItem.caseNumber}</strong>
                  <span>
                    {caseItem.registryCaseNumber || caseItem.caseNumber}
                  </span>
                </div>
                <span className="workspace-badge">{caseItem.status}</span>
              </Link>
            ))}
            {cases.length === 0 && (
              <div className="workspace-empty">Архівних справ поки немає.</div>
            )}
          </div>
        </section>

        <section className="workspace-panel">
          <div className="workspace-panel-header">
            <div>
              <h3>Архівні клієнти</h3>
              <p>Клієнтські картки, які були архівовані</p>
            </div>
            <Link to="/clients?status=archived" className="btn btn-outline">
              Усі архівні клієнти
            </Link>
          </div>
          <div className="workspace-list">
            {clients.map((client) => (
              <Link
                key={client.id}
                to={`/clients/${client.id}`}
                className="workspace-list-item workspace-link"
              >
                <div>
                  <strong>{getClientDisplayName(client)}</strong>
                  <span>
                    {client.companyName ||
                      client.email ||
                      client.phone ||
                      "Картка клієнта"}
                  </span>
                </div>
                <span className="workspace-badge">{client.status}</span>
              </Link>
            ))}
            {clients.length === 0 && (
              <div className="workspace-empty">
                Архівних клієнтів поки немає.
              </div>
            )}
          </div>
        </section>

        <section className="workspace-panel full">
          <div className="workspace-panel-header">
            <div>
              <h3>Архівні файли</h3>
              <p>Останні документи зі статусом архіву</p>
            </div>
            <Link to="/documents?status=archived" className="btn btn-outline">
              Усі архівні файли
            </Link>
          </div>
          <div className="workspace-list">
            {documents.map((document) => (
              <Link
                key={document.id}
                to="/documents?status=archived"
                className="workspace-list-item workspace-link"
              >
                <div>
                  <strong>{document.originalName}</strong>
                  <span>
                    {document.type} •{" "}
                    {new Date(document.updatedAt).toLocaleDateString("uk-UA")}
                  </span>
                </div>
                <span className="workspace-badge">{document.status}</span>
              </Link>
            ))}
            {documents.length === 0 && (
              <div className="workspace-empty">Архівних файлів поки немає.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ArchivePage;
