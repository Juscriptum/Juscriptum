import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Alert } from "../../components/Alert";
import { Breadcrumbs } from "../../components/navigation";
import { PageHeader } from "../../components/PageHeader";
import { Spinner } from "../../components/Spinner";
import { useAuth } from "../../hooks/useAuth";
import { calculationService } from "../../services/calculation.service";
import { caseService } from "../../services/case.service";
import { clientService } from "../../services/client.service";
import { documentService } from "../../services/document.service";
import { eventService } from "../../services/event.service";
import { Calculation } from "../../types/calculation.types";
import { Case } from "../../types/case.types";
import { Client } from "../../types/client.types";
import { Event } from "../../types/event.types";
import { getClientDisplayName } from "../../utils/clientFormData";
import { getCaseTypeLabel } from "../../utils/caseCategories";
import {
  formatCurrencyAmount,
  formatCurrencyInWordsUk,
} from "../../utils/currency";
import { buildPrintableHtml } from "../print-forms/templateBuilder.utils";
import {
  loadStoredTemplates,
  TemplateRecord,
} from "../print-forms/templateRegistry";
import "./DocumentComposerPage.css";

type ComposerMode = "template" | "text";

const EVENT_TYPE_LABELS: Record<Event["type"], string> = {
  hearing: "Засідання",
  deadline: "Дедлайн",
  meeting: "Зустріч",
  court_sitting: "Судове засідання",
  other: "Інше",
};

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("uk-UA") : "";

const formatDateTime = (date?: string | null, time?: string | null) => {
  if (!date && !time) {
    return "";
  }

  const datePart = formatDate(date || undefined);
  return [datePart, time].filter(Boolean).join(", ");
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const normalizeCalculationItemDescription = (value?: string | null) => {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  const match = trimmed.match(/^(.*)\s+\(([^()]+)\)$/);
  if (!match) {
    return trimmed;
  }

  const [, label, suffix] = match;
  if (!suffix.includes("_")) {
    return trimmed;
  }

  return label.trim();
};

const getCalculationUnitTypeShortLabel = (
  unitType?: Calculation["items"][number]["unitType"] | null,
) => {
  switch (unitType) {
    case "hourly":
      return "год.";
    case "piecewise":
      return "шт.";
    case "fixed":
      return "фікс.";
    default:
      return "";
  }
};

const buildCalculationTable = (calculation?: Calculation | null) => {
  if (!calculation || calculation.items.length === 0) {
    return `
      <table>
        <thead>
          <tr>
            <th>№</th>
            <th>Назва послуги</th>
            <th>Кількість</th>
            <th>Тип обліку</th>
            <th>Сума</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="5">Рядки розрахунку не обрані.</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  return `
    <table>
      <thead>
        <tr>
          <th>№</th>
          <th>Назва послуги</th>
          <th>Кількість</th>
          <th>Тип обліку</th>
          <th>Сума</th>
        </tr>
      </thead>
      <tbody>
        ${calculation.items
          .map(
            (item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(
                  normalizeCalculationItemDescription(item.description),
                )}</td>
                <td>${item.quantity ?? item.duration ?? ""}</td>
                <td>${escapeHtml(
                  getCalculationUnitTypeShortLabel(item.unitType),
                )}</td>
                <td>${formatCurrencyAmount(
                  item.lineTotal || 0,
                  calculation.currency || "UAH",
                )}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
};

const renderTemplateHtml = (
  templateHtml: string,
  values: Record<string, string>,
  calculation?: Calculation | null,
) => {
  const parser = new DOMParser();
  const documentNode = parser.parseFromString(
    `<div id="template-root">${templateHtml}</div>`,
    "text/html",
  );
  const root = documentNode.getElementById("template-root");

  if (!root) {
    return templateHtml;
  }

  root.querySelectorAll<HTMLElement>(".template-token").forEach((node) => {
    const variableId = node.dataset.tokenId || "";
    node.textContent = values[variableId] || "";
    node.className = "";
  });

  root
    .querySelectorAll<HTMLElement>(".template-token-table")
    .forEach((node) => {
      const variableId = node.dataset.tokenId || "";
      if (variableId === "calculation.selectedTable") {
        node.outerHTML = buildCalculationTable(calculation);
        return;
      }

      node.textContent = values[variableId] || "";
      node.className = "";
    });

  return root.innerHTML;
};

export const DocumentComposerPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const mode = (searchParams.get("mode") || "template") as ComposerMode;
  const initialCaseId = searchParams.get("caseId") || "";
  const initialClientId = searchParams.get("clientId") || "";
  const initialTemplateId = searchParams.get("templateId") || "";
  const [templates] = useState<TemplateRecord[]>(() => loadStoredTemplates());
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] =
    useState(initialTemplateId);
  const [selectedClientId, setSelectedClientId] = useState(initialClientId);
  const [selectedCaseId, setSelectedCaseId] = useState(initialCaseId);
  const [selectedCalculationId, setSelectedCalculationId] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [plainText, setPlainText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContext = async () => {
      try {
        setLoading(true);
        const [
          clientsResponse,
          casesResponse,
          calculationsResponse,
          eventsResponse,
        ] = await Promise.all([
          clientService.getAllClients(),
          caseService.getAllCases(),
          calculationService.getAllCalculations(),
          eventService.getAllEvents(),
        ]);

        setClients(clientsResponse);
        setCases(casesResponse);
        setCalculations(calculationsResponse);
        setEvents(eventsResponse);
      } catch (err: any) {
        setError(err.message || "Не вдалося завантажити дані для документа");
      } finally {
        setLoading(false);
      }
    };

    loadContext();
  }, []);

  const selectedTemplate = useMemo(
    () =>
      templates.find((template) => template.id === selectedTemplateId) || null,
    [selectedTemplateId, templates],
  );
  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) || null,
    [clients, selectedClientId],
  );
  const selectedCase = useMemo(
    () => cases.find((caseItem) => caseItem.id === selectedCaseId) || null,
    [cases, selectedCaseId],
  );
  const selectedCalculation = useMemo(
    () =>
      calculations.find(
        (calculation) => calculation.id === selectedCalculationId,
      ) || null,
    [calculations, selectedCalculationId],
  );
  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) || null,
    [events, selectedEventId],
  );

  useEffect(() => {
    if (selectedCase?.clientId && selectedCase.clientId !== selectedClientId) {
      setSelectedClientId(selectedCase.clientId);
    }
  }, [selectedCase?.clientId, selectedClientId]);

  useEffect(() => {
    if (mode === "template" && selectedTemplate && !title) {
      setTitle(selectedTemplate.title);
      setDescription(selectedTemplate.description);
    }
  }, [description, mode, selectedTemplate, title]);

  const filteredCases = useMemo(
    () =>
      selectedClientId
        ? cases.filter((caseItem) => caseItem.clientId === selectedClientId)
        : cases,
    [cases, selectedClientId],
  );

  const filteredCalculations = useMemo(
    () =>
      selectedCaseId
        ? calculations.filter(
            (calculation) => calculation.caseId === selectedCaseId,
          )
        : calculations,
    [calculations, selectedCaseId],
  );

  const filteredEvents = useMemo(
    () =>
      selectedCaseId
        ? events.filter((event) => event.caseId === selectedCaseId)
        : events,
    [events, selectedCaseId],
  );

  const documentValues = useMemo(() => {
    const displayName = selectedClient
      ? getClientDisplayName(selectedClient)
      : "";
    return {
      "user.fullName": [user?.lastName, user?.firstName, user?.patronymic]
        .filter(Boolean)
        .join(" "),
      "user.email": user?.email || "",
      "user.phone": user?.phone || user?.phonePrimary || "",
      "client.fullName": displayName,
      "client.companyName": selectedClient?.companyName || "",
      "client.email": selectedClient?.email || "",
      "client.phone": selectedClient?.phone || "",
      "client.address": selectedClient?.address || "",
      "client.comment": selectedClient?.notes || "",
      "case.title": selectedCase?.title || "",
      "case.number": selectedCase?.caseNumber || "",
      "case.type": selectedCase ? getCaseTypeLabel(selectedCase.caseType) : "",
      "case.priority": selectedCase?.priority || "",
      "case.startDate": formatDate(selectedCase?.startDate),
      "case.courtName": selectedCase?.courtName || "",
      "case.courtAddress": selectedCase?.courtAddress || "",
      "case.registryNumber": selectedCase?.registryCaseNumber || "",
      "case.judgeName": selectedCase?.judgeName || "",
      "case.proceedingStage": selectedCase?.proceedingStage || "",
      "case.description": selectedCase?.description || "",
      "case.plaintiffName": selectedCase?.plaintiffName || "",
      "case.defendantName": selectedCase?.defendantName || "",
      "calculation.name": selectedCalculation?.name || "",
      "calculation.date": formatDate(selectedCalculation?.calculationDate),
      "calculation.dueDate": formatDate(selectedCalculation?.dueDate),
      "calculation.subjectType":
        selectedCalculation?.metadata?.subjectDisplayName ||
        selectedCalculation?.metadata?.subjectType ||
        "",
      "calculation.description": selectedCalculation?.description || "",
      "calculation.internalNotes": selectedCalculation?.internalNotes || "",
      "calculation.totalAmount": selectedCalculation
        ? formatCurrencyAmount(
            selectedCalculation.totalAmount || 0,
            selectedCalculation.currency || "UAH",
          )
        : "",
      "calculation.totalAmountWords": selectedCalculation
        ? formatCurrencyInWordsUk(selectedCalculation.totalAmount || 0)
        : "",
      "event.title": selectedEvent?.title || "",
      "event.type": selectedEvent ? EVENT_TYPE_LABELS[selectedEvent.type] : "",
      "event.date": formatDate(selectedEvent?.eventDate),
      "event.time": selectedEvent?.eventTime || "",
      "event.dateTime": formatDateTime(
        selectedEvent?.eventDate,
        selectedEvent?.eventTime,
      ),
      "event.endDate": formatDate(selectedEvent?.endDate),
      "event.endTime": selectedEvent?.endTime || "",
      "event.isAllDay": selectedEvent?.isAllDay ? "Так" : "Ні",
      "event.location": selectedEvent?.location || "",
      "event.courtRoom": selectedEvent?.courtRoom || "",
      "event.responsibleContact": selectedEvent?.responsibleContact || "",
      "event.judgeName": selectedEvent?.judgeName || "",
      "event.reminderValue": String(selectedEvent?.reminderValue || ""),
      "event.reminderUnit": selectedEvent?.reminderUnit || "",
      "event.isRecurring": selectedEvent?.isRecurring ? "Так" : "Ні",
      "event.recurrencePattern": selectedEvent?.recurrencePattern || "",
      "event.recurrenceInterval": String(
        selectedEvent?.recurrenceInterval || "",
      ),
      "event.recurrenceEndDate": formatDate(selectedEvent?.recurrenceEndDate),
      "event.description": selectedEvent?.description || "",
    };
  }, [selectedCalculation, selectedCase, selectedClient, selectedEvent, user]);

  const renderedHtml = useMemo(() => {
    if (mode === "text") {
      return plainText
        .split("\n")
        .filter(Boolean)
        .map((line) => `<p>${escapeHtml(line)}</p>`)
        .join("");
    }

    if (!selectedTemplate) {
      return "<p>Оберіть шаблон, щоб сформувати документ.</p>";
    }

    return renderTemplateHtml(
      selectedTemplate.html,
      documentValues,
      selectedCalculation,
    );
  }, [documentValues, mode, plainText, selectedCalculation, selectedTemplate]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Вкажіть назву документа");
      return;
    }

    if (mode === "template" && !selectedTemplate) {
      setError("Оберіть шаблон документа");
      return;
    }

    if (mode === "text" && !plainText.trim()) {
      setError("Введіть текст документа");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const printableHtml = buildPrintableHtml(title.trim(), renderedHtml);
      const file = new File([printableHtml], `${title.trim()}.html`, {
        type: "text/html",
      });

      await documentService.uploadDocument(file, {
        type: "other",
        description: description.trim() || undefined,
        accessLevel: "internal",
        clientId: selectedClientId || undefined,
        caseId: selectedCaseId || undefined,
        calculationId: selectedCalculationId || undefined,
        eventId: selectedEventId || undefined,
        sourceKind:
          mode === "template" ? "template_generated" : "text_document",
        sourceTemplateId: selectedTemplateId || undefined,
        plainTextContent: mode === "text" ? plainText : undefined,
      });

      navigate(
        selectedCaseId
          ? `/cases/${selectedCaseId}/documents`
          : selectedClientId
            ? `/clients/${selectedClientId}/documents`
            : "/documents",
      );
    } catch (err: any) {
      setError(err.message || "Не вдалося зберегти документ");
    } finally {
      setSaving(false);
    }
  };

  const pageTitle =
    mode === "template"
      ? "Створити документ із шаблону"
      : "Створити текстовий документ";

  return (
    <div className="document-composer-page">
      <Breadcrumbs
        items={[
          { label: "Головна", to: "/dashboard" },
          { label: "Файли", to: "/documents" },
          { label: pageTitle },
        ]}
      />
      <PageHeader
        title={pageTitle}
        subtitle="Оберіть контекст документа і збережіть його до модуля Файли"
        actions={
          <>
            <Link to="/documents" className="btn btn-secondary">
              До файлів
            </Link>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Збереження..." : "Зберегти у Файли"}
            </button>
          </>
        }
      />

      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      {loading ? (
        <div className="loading-container">
          <Spinner size="large" />
        </div>
      ) : (
        <div className="document-composer-layout">
          <section className="content-surface document-composer-form">
            <div className="document-composer-grid">
              {mode === "template" && (
                <label>
                  <span>Шаблон</span>
                  <select
                    value={selectedTemplateId}
                    onChange={(event) =>
                      setSelectedTemplateId(event.target.value)
                    }
                  >
                    <option value="">Оберіть шаблон</option>
                    {templates
                      .filter((template) => template.status === "active")
                      .map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.title}
                        </option>
                      ))}
                  </select>
                </label>
              )}

              <label>
                <span>Назва документа</span>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Наприклад: Заява до суду"
                />
              </label>

              <label className="document-composer-grid-wide">
                <span>Опис</span>
                <input
                  type="text"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Необов'язково"
                />
              </label>

              <label>
                <span>Клієнт</span>
                <select
                  value={selectedClientId}
                  onChange={(event) => setSelectedClientId(event.target.value)}
                >
                  <option value="">Не вибрано</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {getClientDisplayName(client)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Справа</span>
                <select
                  value={selectedCaseId}
                  onChange={(event) => setSelectedCaseId(event.target.value)}
                >
                  <option value="">Не вибрано</option>
                  {filteredCases.map((caseItem) => (
                    <option key={caseItem.id} value={caseItem.id}>
                      {caseItem.caseNumber} •{" "}
                      {caseItem.title || getCaseTypeLabel(caseItem.caseType)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Розрахунок</span>
                <select
                  value={selectedCalculationId}
                  onChange={(event) =>
                    setSelectedCalculationId(event.target.value)
                  }
                >
                  <option value="">Не вибрано</option>
                  {filteredCalculations.map((calculation) => (
                    <option key={calculation.id} value={calculation.id}>
                      {calculation.name} •{" "}
                      {formatCurrencyAmount(
                        calculation.totalAmount || 0,
                        calculation.currency || "UAH",
                      )}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Подія</span>
                <select
                  value={selectedEventId}
                  onChange={(event) => setSelectedEventId(event.target.value)}
                >
                  <option value="">Не вибрано</option>
                  {filteredEvents.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title} • {formatDate(event.eventDate)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {mode === "text" && (
              <label className="document-composer-textarea">
                <span>Текст документа</span>
                <textarea
                  value={plainText}
                  onChange={(event) => setPlainText(event.target.value)}
                  placeholder="Введіть текст документа без змінних..."
                  rows={18}
                />
              </label>
            )}
          </section>

          <section className="content-surface document-composer-preview">
            <div className="document-composer-preview-head">
              <h3>Попередній перегляд</h3>
              <span>
                {mode === "template"
                  ? selectedTemplate?.title || "Шаблон не вибрано"
                  : "Текстовий документ"}
              </span>
            </div>
            <iframe
              className="document-composer-frame"
              title="Попередній перегляд документа"
              srcDoc={buildPrintableHtml(title || pageTitle, renderedHtml)}
            />
          </section>
        </div>
      )}
    </div>
  );
};

export default DocumentComposerPage;
