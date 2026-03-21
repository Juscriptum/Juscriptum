import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Alert } from "../../components/Alert";
import { Spinner } from "../../components/Spinner";
import { PageHeader } from "../../components/PageHeader";
import { Breadcrumbs } from "../../components/navigation";
import { caseService } from "../../services/case.service";
import { clientService } from "../../services/client.service";
import documentService from "../../services/document.service";
import pricelistService from "../../services/pricelist.service";
import { Case } from "../../types/case.types";
import { Client } from "../../types/client.types";
import { Document } from "../../types/document.types";
import { Pricelist } from "../../types/pricelist.types";
import { getClientDisplayName } from "../../utils/clientFormData";
import {
  TemplateRecord,
  loadStoredTemplates,
} from "../print-forms/templateRegistry";
import "./ArchivePage.css";

const ARCHIVE_LIMIT = 12;

type ArchiveTabId =
  | "clients"
  | "cases"
  | "events"
  | "pricelists"
  | "documents"
  | "calculations"
  | "templates"
  | "notes";

interface ArchiveTabDefinition {
  id: ArchiveTabId;
  label: string;
  description: string;
  count: number;
  supported: boolean;
}

const ARCHIVE_TAB_ORDER: ArchiveTabId[] = [
  "clients",
  "cases",
  "events",
  "pricelists",
  "documents",
  "calculations",
  "templates",
  "notes",
];

const formatDate = (value?: string | null) => {
  if (!value) {
    return "Дата не вказана";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("uk-UA");
};

const sortTemplates = (items: TemplateRecord[]) =>
  [...items].sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );

export const ArchivePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cases, setCases] = useState<Case[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [pricelists, setPricelists] = useState<Pricelist[]>([]);
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestedTab = searchParams.get("tab");
  const activeTab: ArchiveTabId = ARCHIVE_TAB_ORDER.includes(
    requestedTab as ArchiveTabId,
  )
    ? (requestedTab as ArchiveTabId)
    : "clients";

  const loadArchive = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        casesResponse,
        clientsResponse,
        documentsResponse,
        pricelistsResponse,
      ] = await Promise.all([
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
        pricelistService.getPricelists({
          status: "archived",
          limit: ARCHIVE_LIMIT,
          page: 1,
          search: undefined,
        }),
      ]);

      setCases(casesResponse.data);
      setClients(clientsResponse.data);
      setDocuments(documentsResponse.data);
      setPricelists(pricelistsResponse.data);
      setTemplates(
        sortTemplates(
          loadStoredTemplates().filter((item) => item.status === "archived"),
        ).slice(0, ARCHIVE_LIMIT),
      );
    } catch (err: any) {
      setError(err.message || "Помилка завантаження архіву");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadArchive();
  }, []);

  const tabs = useMemo<ArchiveTabDefinition[]>(
    () => [
      {
        id: "clients",
        label: "Клієнти",
        description: "Архівовані картки клієнтів",
        count: clients.length,
        supported: true,
      },
      {
        id: "cases",
        label: "Справи",
        description: "Закриті або перенесені до архіву справи",
        count: cases.length,
        supported: true,
      },
      {
        id: "events",
        label: "Події",
        description: "Архів календарних подій",
        count: 0,
        supported: false,
      },
      {
        id: "pricelists",
        label: "Прайси",
        description: "Архівні прайс-листи",
        count: pricelists.length,
        supported: true,
      },
      {
        id: "documents",
        label: "Файли",
        description: "Архів документів і вкладень",
        count: documents.length,
        supported: true,
      },
      {
        id: "calculations",
        label: "Розрахунки",
        description: "Архів фінансових розрахунків",
        count: 0,
        supported: false,
      },
      {
        id: "templates",
        label: "Шаблони",
        description: "Архівні шаблони документів",
        count: templates.length,
        supported: true,
      },
      {
        id: "notes",
        label: "Нотатки",
        description: "Архів робочих нотаток",
        count: 0,
        supported: false,
      },
    ],
    [
      cases.length,
      clients.length,
      documents.length,
      pricelists.length,
      templates.length,
    ],
  );

  const totalArchived = useMemo(
    () => tabs.reduce((sum, tab) => sum + tab.count, 0),
    [tabs],
  );

  const supportedTabs = tabs.filter((tab) => tab.supported).length;
  const activeTabConfig = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  const handleTabChange = (tabId: ArchiveTabId) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", tabId);
    setSearchParams(nextParams, { replace: true });
  };

  const renderUnsupportedPanel = (
    title: string,
    description: string,
    actionLabel: string,
    actionTo: string,
  ) => (
    <section
      className="archive-panel"
      role="tabpanel"
      id={`archive-panel-${activeTab}`}
      aria-labelledby={`archive-tab-${activeTab}`}
    >
      <div className="archive-panel-header">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <Link to={actionTo} className="btn btn-outline">
          {actionLabel}
        </Link>
      </div>
      <div className="archive-empty-state">
        <strong>Окремий архів для цієї категорії ще не заповнений.</strong>
        <p>
          Вкладка вже готова для категоризації архівних даних, але в поточній
          реалізації модуль ще не має окремого архівного статусу.
        </p>
      </div>
    </section>
  );

  const renderActivePanel = () => {
    if (loading) {
      return (
        <div className="archive-loading">
          <Spinner size="large" />
        </div>
      );
    }

    switch (activeTab) {
      case "clients":
        return (
          <section
            className="archive-panel"
            role="tabpanel"
            id="archive-panel-clients"
            aria-labelledby="archive-tab-clients"
          >
            <div className="archive-panel-header">
              <div>
                <h3>Архівні клієнти</h3>
                <p>Картки клієнтів, які були виведені з активної роботи</p>
              </div>
              <Link to="/clients?status=archived" className="btn btn-outline">
                Усі архівні клієнти
              </Link>
            </div>
            <div className="archive-list">
              {clients.map((client) => (
                <Link
                  key={client.id}
                  to={`/clients/${client.id}`}
                  className="archive-list-item"
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
                  <span className="archive-item-meta">{client.status}</span>
                </Link>
              ))}
              {clients.length === 0 && (
                <div className="archive-empty-state">
                  У архіві поки немає клієнтів.
                </div>
              )}
            </div>
          </section>
        );
      case "cases":
        return (
          <section
            className="archive-panel"
            role="tabpanel"
            id="archive-panel-cases"
            aria-labelledby="archive-tab-cases"
          >
            <div className="archive-panel-header">
              <div>
                <h3>Архівні справи</h3>
                <p>Останні справи, які були переміщені до архіву</p>
              </div>
              <Link to="/cases?status=archived" className="btn btn-outline">
                Усі архівні справи
              </Link>
            </div>
            <div className="archive-list">
              {cases.map((caseItem) => (
                <Link
                  key={caseItem.id}
                  to={`/cases/${caseItem.id}`}
                  className="archive-list-item"
                >
                  <div>
                    <strong>{caseItem.title || caseItem.caseNumber}</strong>
                    <span>
                      {caseItem.registryCaseNumber || caseItem.caseNumber}
                    </span>
                  </div>
                  <span className="archive-item-meta">{caseItem.status}</span>
                </Link>
              ))}
              {cases.length === 0 && (
                <div className="archive-empty-state">
                  У архіві поки немає справ.
                </div>
              )}
            </div>
          </section>
        );
      case "pricelists":
        return (
          <section
            className="archive-panel"
            role="tabpanel"
            id="archive-panel-pricelists"
            aria-labelledby="archive-tab-pricelists"
          >
            <div className="archive-panel-header">
              <div>
                <h3>Архівні прайси</h3>
                <p>Прайс-листи, які були прибрані з активного використання</p>
              </div>
              <Link to="/pricelists?tab=archived" className="btn btn-outline">
                Усі архівні прайси
              </Link>
            </div>
            <div className="archive-list">
              {pricelists.map((pricelist) => (
                <Link
                  key={pricelist.id}
                  to={`/pricelists/${pricelist.id}`}
                  className="archive-list-item"
                >
                  <div>
                    <strong>{pricelist.name}</strong>
                    <span>
                      {pricelist.description?.trim() ||
                        `${pricelist.items.length} позицій у прайсі`}
                    </span>
                  </div>
                  <span className="archive-item-meta">
                    {formatDate(pricelist.updatedAt)}
                  </span>
                </Link>
              ))}
              {pricelists.length === 0 && (
                <div className="archive-empty-state">
                  У архіві поки немає прайсів.
                </div>
              )}
            </div>
          </section>
        );
      case "documents":
        return (
          <section
            className="archive-panel"
            role="tabpanel"
            id="archive-panel-documents"
            aria-labelledby="archive-tab-documents"
          >
            <div className="archive-panel-header">
              <div>
                <h3>Архівні файли</h3>
                <p>Документи та вкладення зі статусом архіву</p>
              </div>
              <Link to="/documents?status=archived" className="btn btn-outline">
                Усі архівні файли
              </Link>
            </div>
            <div className="archive-list">
              {documents.map((document) => (
                <Link
                  key={document.id}
                  to="/documents?status=archived"
                  className="archive-list-item"
                >
                  <div>
                    <strong>{document.originalName}</strong>
                    <span>{document.type}</span>
                  </div>
                  <span className="archive-item-meta">
                    {formatDate(document.updatedAt)}
                  </span>
                </Link>
              ))}
              {documents.length === 0 && (
                <div className="archive-empty-state">
                  У архіві поки немає файлів.
                </div>
              )}
            </div>
          </section>
        );
      case "templates":
        return (
          <section
            className="archive-panel"
            role="tabpanel"
            id="archive-panel-templates"
            aria-labelledby="archive-tab-templates"
          >
            <div className="archive-panel-header">
              <div>
                <h3>Архівні шаблони</h3>
                <p>Шаблони документів, які були прибрані з активного набору</p>
              </div>
              <Link to="/print-forms" className="btn btn-outline">
                До конструктора шаблонів
              </Link>
            </div>
            <div className="archive-list">
              {templates.map((template) => (
                <Link
                  key={template.id}
                  to="/print-forms"
                  className="archive-list-item"
                >
                  <div>
                    <strong>{template.title}</strong>
                    <span>{template.description || "Опис відсутній"}</span>
                  </div>
                  <span className="archive-item-meta">
                    {formatDate(template.updatedAt)}
                  </span>
                </Link>
              ))}
              {templates.length === 0 && (
                <div className="archive-empty-state">
                  У архіві поки немає шаблонів.
                </div>
              )}
            </div>
          </section>
        );
      case "events":
        return renderUnsupportedPanel(
          "Архів подій",
          "Тут будуть зібрані архівні календарні події за категорією.",
          "До календаря",
          "/calendar",
        );
      case "calculations":
        return renderUnsupportedPanel(
          "Архів розрахунків",
          "Тут будуть зібрані архівні фінансові розрахунки та підсумки.",
          "До розрахунків",
          "/calculations",
        );
      case "notes":
        return renderUnsupportedPanel(
          "Архів нотаток",
          "Тут будуть зібрані робочі нотатки, винесені з активного простору.",
          "До нотаток",
          "/notes",
        );
      default:
        return null;
    }
  };

  return (
    <div className="archive-page">
      <Breadcrumbs />
      <PageHeader
        title="Архів"
        subtitle="Архівовані записи тепер розділені за категоріями для швидкої навігації"
        actions={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void loadArchive()}
          >
            Оновити
          </button>
        }
      />

      {error && <Alert type="error">{error}</Alert>}

      <div className="archive-summary-grid">
        <div className="archive-summary-card">
          <span>Усього в архіві</span>
          <strong>{totalArchived}</strong>
          <small>У всіх категоріях зі статусом архіву</small>
        </div>
        <div className="archive-summary-card">
          <span>Категорій</span>
          <strong>{tabs.length}</strong>
          <small>Окремі вкладки для навігації</small>
        </div>
        <div className="archive-summary-card">
          <span>Готові модулі</span>
          <strong>{supportedTabs}</strong>
          <small>Категорії вже показують реальні архівні дані</small>
        </div>
        <div className="archive-summary-card">
          <span>Поточна вкладка</span>
          <strong>{activeTabConfig.count}</strong>
          <small>{activeTabConfig.description}</small>
        </div>
      </div>

      <section className="archive-tabs-panel">
        <div
          className="archive-tabs"
          role="tablist"
          aria-label="Категорії архіву"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              id={`archive-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`archive-panel-${tab.id}`}
              className={`archive-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <span className="archive-tab-label">{tab.label}</span>
              <span className="archive-tab-count">{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="archive-tab-description">
          <strong>{activeTabConfig.label}</strong>
          <span>{activeTabConfig.description}</span>
        </div>
      </section>

      {renderActivePanel()}
    </div>
  );
};

export default ArchivePage;
