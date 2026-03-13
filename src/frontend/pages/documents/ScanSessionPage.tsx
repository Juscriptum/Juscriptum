import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Alert } from "../../components/Alert";
import { Breadcrumbs } from "../../components/navigation";
import { PageHeader } from "../../components/PageHeader";
import { Spinner } from "../../components/Spinner";
import { caseService } from "../../services/case.service";
import { clientService } from "../../services/client.service";
import { documentService } from "../../services/document.service";
import { Case } from "../../types/case.types";
import { Client } from "../../types/client.types";
import {
  CreateScanSessionResponse,
  ScanDestinationScope,
  ScanDocumentFormat,
  ScanSessionResponse,
} from "../../types/document.types";
import { getClientDisplayName } from "../../utils/clientFormData";
import "./ScanSessionPage.css";

const STATUS_LABELS: Record<string, string> = {
  created: "Очікує відкриття на телефоні",
  opened: "Телефон підключено",
  capturing: "Триває підготовка сторінок",
  uploading: "Йде завантаження сторінок",
  uploaded: "Сторінки завантажено",
  preprocessing: "Підготовка зображень",
  assembling_pdf: "Збирається PDF",
  ocr_processing: "Виконується OCR",
  indexing: "Індексується текст",
  completed: "Готово",
  failed: "Помилка",
  expired: "Сесію прострочено",
  cancelled: "Сесію скасовано",
};

const isLocalhostUrl = (url?: string | null) => {
  if (!url) {
    return false;
  }

  try {
    const hostname = new URL(url).hostname;
    return ["localhost", "127.0.0.1", "0.0.0.0"].includes(hostname);
  } catch {
    return false;
  }
};

const getDestinationSummary = (
  destinationScope: ScanDestinationScope,
  client: Client | null,
  caseItem: Case | null,
) => {
  if (destinationScope === "personal") {
    return "Папка Власна";
  }

  if (destinationScope === "client" && client && caseItem) {
    return `${getClientDisplayName(client)} / ${caseItem.caseNumber}`;
  }

  if (destinationScope === "client" && client) {
    return `${getClientDisplayName(client)} / корінь клієнта`;
  }

  return "Кореневий каталог";
};

export const ScanSessionPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("sessionId") || "";
  const initialDestinationScope =
    (searchParams.get("destinationScope") as ScanDestinationScope | null) ||
    "root";
  const initialClientId = searchParams.get("clientId") || "";
  const initialCaseId = searchParams.get("caseId") || "";

  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [destinationScope, setDestinationScope] =
    useState<ScanDestinationScope>(initialDestinationScope);
  const [selectedClientId, setSelectedClientId] = useState(initialClientId);
  const [selectedCaseId, setSelectedCaseId] = useState(initialCaseId);
  const [documentFormat, setDocumentFormat] =
    useState<ScanDocumentFormat>("A4");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(Boolean(sessionId));
  const [supportLoading, setSupportLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionMeta, setSessionMeta] =
    useState<CreateScanSessionResponse | null>(null);
  const [session, setSession] = useState<ScanSessionResponse | null>(null);

  useEffect(() => {
    const loadSupportData = async () => {
      try {
        setSupportLoading(true);
        const [clientsResponse, casesResponse] = await Promise.all([
          clientService.getAllClients(),
          caseService.getAllCases({ status: "active" }),
        ]);
        setClients(clientsResponse);
        setCases(casesResponse);
      } catch (err: any) {
        setError(err.message || "Не вдалося завантажити дані для сканування");
      } finally {
        setSupportLoading(false);
      }
    };

    loadSupportData();
  }, []);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    let isMounted = true;
    const loadSession = async () => {
      try {
        const response = await documentService.getScanSession(sessionId);
        if (!isMounted) {
          return;
        }

        setSession(response);
        setDestinationScope(response.destinationScope || "root");
        setSelectedClientId(response.clientId || "");
        setSelectedCaseId(response.caseId || "");
        setDocumentFormat(response.documentFormat || "A4");
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Не вдалося завантажити scan session");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSession();
    const timer = window.setInterval(loadSession, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, [sessionId]);

  useEffect(() => {
    if (destinationScope !== "client") {
      setSelectedClientId("");
      setSelectedCaseId("");
      return;
    }

    if (!selectedClientId) {
      setSelectedCaseId("");
      return;
    }

    const selectedCaseBelongsToClient = cases.some(
      (caseItem) =>
        caseItem.id === selectedCaseId &&
        caseItem.clientId === selectedClientId,
    );
    if (!selectedCaseBelongsToClient) {
      setSelectedCaseId("");
    }
  }, [cases, destinationScope, selectedCaseId, selectedClientId]);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) || null,
    [clients, selectedClientId],
  );

  const clientCases = useMemo(
    () =>
      selectedClientId
        ? cases.filter((caseItem) => caseItem.clientId === selectedClientId)
        : [],
    [cases, selectedClientId],
  );

  const selectedCase = useMemo(
    () =>
      clientCases.find((caseItem) => caseItem.id === selectedCaseId) || null,
    [clientCases, selectedCaseId],
  );

  const destinationSummary = getDestinationSummary(
    destinationScope,
    selectedClient,
    selectedCase,
  );

  const handleCreate = async () => {
    if (destinationScope === "client" && !selectedClientId) {
      setError("Оберіть клієнта або змініть місце збереження");
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const response = await documentService.createScanSession({
        documentFormat,
        destinationScope,
        clientId: destinationScope === "client" ? selectedClientId : undefined,
        caseId:
          destinationScope === "client" && selectedCaseId
            ? selectedCaseId
            : undefined,
      });
      setSessionMeta(response);

      const nextParams = new URLSearchParams({
        sessionId: response.sessionId,
      });
      if (destinationScope !== "root") {
        nextParams.set("destinationScope", destinationScope);
      }
      if (selectedClientId) {
        nextParams.set("clientId", selectedClientId);
      }
      if (selectedCaseId) {
        nextParams.set("caseId", selectedCaseId);
      }

      navigate(`/documents/scan-session?${nextParams.toString()}`, {
        replace: true,
      });
    } catch (err: any) {
      setError(err.message || "Не вдалося створити scan session");
    } finally {
      setCreating(false);
    }
  };

  const qrCode = sessionMeta?.qrCode;
  const activeMobileUrl = sessionMeta?.mobileUrl || session?.mobileUrl;
  const activeStatus = session?.status || sessionMeta?.status || "created";
  const showLocalhostHint = isLocalhostUrl(activeMobileUrl);

  return (
    <div className="scan-session-page">
      <Breadcrumbs
        items={[
          { label: "Головна", to: "/dashboard" },
          { label: "Файли", to: "/documents" },
          { label: "Додати скан" },
        ]}
      />
      <PageHeader
        title="Додати скан"
        subtitle="Оберіть, куди зберегти PDF після сканування, відкрийте сканер на телефоні та дочекайтесь формування документа"
        actions={
          <Link to="/documents" className="btn btn-secondary">
            До файлів
          </Link>
        }
      />

      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      <section className="content-surface scan-session-setup">
        <label>
          <span>Куди зберегти скан</span>
          <select
            value={destinationScope}
            onChange={(event) =>
              setDestinationScope(event.target.value as ScanDestinationScope)
            }
            disabled={Boolean(sessionId)}
          >
            <option value="root">Кореневий каталог</option>
            <option value="personal">Власна</option>
            <option value="client">Клієнт</option>
          </select>
        </label>

        <label>
          <span>Клієнт</span>
          <select
            value={selectedClientId}
            onChange={(event) => setSelectedClientId(event.target.value)}
            disabled={Boolean(sessionId) || destinationScope !== "client"}
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
            disabled={
              Boolean(sessionId) ||
              destinationScope !== "client" ||
              !selectedClientId
            }
          >
            <option value="">Не вибрано</option>
            {clientCases.map((caseItem) => (
              <option key={caseItem.id} value={caseItem.id}>
                {caseItem.caseNumber} • {caseItem.title || "Без назви"}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Формат документа</span>
          <select
            value={documentFormat}
            onChange={(event) =>
              setDocumentFormat(event.target.value as ScanDocumentFormat)
            }
            disabled={Boolean(sessionId)}
          >
            <option value="A4">A4</option>
            <option value="Original">Original</option>
          </select>
        </label>

        {!sessionId && (
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={creating || supportLoading}
          >
            {creating ? "Створення..." : "Створити scan session"}
          </button>
        )}
      </section>

      <section className="content-surface scan-session-target">
        <strong>Місце збереження:</strong> {destinationSummary}
        <span>
          Фінальний файл буде названий у форматі `Скан-ddmmyy-hhmm.pdf`.
        </span>
      </section>

      {loading || supportLoading ? (
        <div className="loading-container">
          <Spinner size="large" />
        </div>
      ) : (
        <div className="scan-session-layout">
          <section className="content-surface scan-session-qr">
            <h3>Підключення телефону</h3>
            {qrCode ? (
              <img src={qrCode} alt="QR-код для мобільного сканера" />
            ) : (
              <div className="scan-session-qr-placeholder">
                QR буде доступний після створення сесії
              </div>
            )}
            {activeMobileUrl && (
              <>
                <a href={activeMobileUrl} target="_blank" rel="noreferrer">
                  Відкрити мобільний сканер
                </a>
                <code className="scan-session-link">{activeMobileUrl}</code>
              </>
            )}
            {showLocalhostHint && (
              <Alert
                type="warning"
                message="Це посилання вказує на localhost і не відкриється з телефону. Для тесту задайте APP_URL або MOBILE_SCAN_BASE_URL через локальний IP комп'ютера чи використайте тунель ngrok/cloudflared."
              />
            )}
            <p>Статус: {STATUS_LABELS[activeStatus] || activeStatus}</p>
          </section>

          <section className="content-surface scan-session-status">
            <h3>Стан обробки</h3>
            <div className="scan-session-stats">
              <article>
                <strong>{session?.pagesCount || 0}</strong>
                <span>Сторінок</span>
              </article>
              <article>
                <strong>{session?.uploadedPages || 0}</strong>
                <span>Завантажено</span>
              </article>
              <article>
                <strong>{session?.processedPages || 0}</strong>
                <span>Оброблено</span>
              </article>
            </div>

            <div className="scan-session-case">
              <strong>Куди буде збережено:</strong> {destinationSummary}
            </div>

            {session?.lastError && (
              <Alert type="error" message={session.lastError} />
            )}

            {session?.pages?.length ? (
              <div className="scan-session-pages">
                {session.pages.map((page) => (
                  <article key={page.id} className="scan-session-page-card">
                    {page.previewUrl ? (
                      <img
                        src={page.previewUrl}
                        alt={`Сторінка ${page.pageNumber}`}
                      />
                    ) : (
                      <div className="scan-session-page-card-placeholder">
                        Без preview
                      </div>
                    )}
                    <div>
                      <strong>Сторінка {page.pageNumber}</strong>
                      <span>{page.status}</span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="scan-session-empty">
                Сторінки з'являться тут після завантаження з телефону.
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default ScanSessionPage;
