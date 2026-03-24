import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  Folder,
  FileText,
  LayoutGrid,
  List,
  ScanLine,
  Upload,
} from "lucide-react";
import { Alert } from "../../components/Alert";
import { PageHeader } from "../../components/PageHeader";
import { Breadcrumbs } from "../../components/navigation";
import { RecordActionsMenu } from "../../components/RecordActionsMenu";
import {
  RegistryEmptyState,
  RegistryFilterBar,
  RegistryLoadingState,
  RegistryPagination,
  RegistrySearchField,
  RegistrySurface,
  RegistryTableShell,
} from "../../components/registry";
import { caseService } from "../../services/case.service";
import { clientService } from "../../services/client.service";
import documentService from "../../services/document.service";
import { Case } from "../../types/case.types";
import { Client } from "../../types/client.types";
import {
  AccessLevel,
  Document,
  DocumentFilters,
  DocumentStatus,
  DocumentType,
} from "../../types/document.types";
import { getClientDisplayName } from "../../utils/clientFormData";
import { prepareImageForScanUpload } from "../../utils/imageCompression";
import "./DocumentsPage.css";

type DocumentsContext =
  | { scope: "global" }
  | { scope: "case"; caseItem: Case }
  | { scope: "client"; client: Client };

type ViewMode = "icons" | "list";

interface UploadDraft {
  file: File;
  name: string;
}

const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  public: "Публічний",
  internal: "Внутрішній",
  confidential: "Конфіденційний",
};

const TYPE_LABELS: Record<DocumentType, string> = {
  contract: "Договір",
  agreement: "Угода",
  court_order: "Судове рішення",
  evidence: "Доказ",
  invoice: "Рахунок",
  other: "Інше",
};

const STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: "Чернетка",
  uploading: "Завантаження",
  signed: "Підписано",
  rejected: "Відхилено",
  archived: "Архів",
};

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

const getFileIconName = (mimeType?: string) => {
  if (!mimeType) return "file";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.includes("pdf")) return "pdf";
  if (mimeType.includes("word") || mimeType.includes("document")) return "word";
  return "file";
};

const IMAGE_MIME_PREFIX = "image/";
const PDF_A4_WIDTH = 595.28;
const PDF_A4_HEIGHT = 841.89;

const buildMergedPdfName = (files: UploadDraft[]) => {
  const firstName = files[0]?.name || "scans";
  const normalized = firstName.replace(/\.[^.]+$/, "") || "scans";
  return `${normalized}-bundle.pdf`;
};

export const DocumentsPage: React.FC = () => {
  const { caseId, clientId } = useParams<{
    caseId?: string;
    clientId?: string;
  }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const dropInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [context, setContext] = useState<DocumentsContext>({ scope: "global" });
  const [loading, setLoading] = useState(true);
  const [contextLoading, setContextLoading] = useState(true);
  const [supportLoading, setSupportLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("icons");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [uploadQueue, setUploadQueue] = useState<UploadDraft[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mergingImages, setMergingImages] = useState(false);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [folderPath, setFolderPath] = useState<string[]>([]);
  const [filters, setFilters] = useState<DocumentFilters>({
    limit: 100,
    page: 1,
    caseId,
    clientId,
    status: (searchParams.get("status") as DocumentStatus | null) || undefined,
  });

  const syncFolderPath = (
    nextFolderPath: string[],
    options?: { replace?: boolean },
  ) => {
    setFolderPath(nextFolderPath);
    const nextParams = new URLSearchParams(searchParams);

    if (nextFolderPath.length > 0) {
      nextParams.set("folder", nextFolderPath.join("/"));
    } else {
      nextParams.delete("folder");
    }

    setSearchParams(nextParams, { replace: options?.replace ?? false });
  };

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      page: 1,
      caseId,
      clientId,
      status:
        (searchParams.get("status") as DocumentStatus | null) || undefined,
    }));
  }, [caseId, clientId, searchParams]);

  useEffect(() => {
    if (caseId || clientId) {
      return;
    }

    const folder = searchParams.get("folder");
    setFolderPath(folder ? folder.split("/").filter(Boolean) : []);
  }, [caseId, clientId, searchParams]);

  useEffect(() => {
    const loadContext = async () => {
      try {
        setContextLoading(true);

        if (caseId) {
          const caseItem = await caseService.getCase(caseId);
          setContext({ scope: "case", caseItem });
          syncFolderPath(["client", caseItem.clientId, caseItem.id], {
            replace: true,
          });
          return;
        }

        if (clientId) {
          const client = await clientService.getClient(clientId);
          setContext({ scope: "client", client });
          syncFolderPath(["client", client.id], { replace: true });
          return;
        }

        setContext({ scope: "global" });
        if (!searchParams.get("folder")) {
          syncFolderPath([], { replace: true });
        }
      } catch (err: any) {
        setError(err.message || "Помилка завантаження контексту документів");
      } finally {
        setContextLoading(false);
      }
    };

    loadContext();
  }, [caseId, clientId]);

  useEffect(() => {
    const loadSupportData = async () => {
      try {
        setSupportLoading(true);
        const [clientsResponse, casesResponse] = await Promise.all([
          clientService.getAllClients(),
          caseService.getAllCases(),
        ]);
        setClients(clientsResponse);
        setCases(casesResponse);
      } catch (err: any) {
        setError(err.message || "Не вдалося завантажити структуру папок");
      } finally {
        setSupportLoading(false);
      }
    };

    loadSupportData();
  }, []);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await documentService.getDocuments(filters);
        setDocuments(response.data);
        setTotal(response.total);
        setPage(response.page);
      } catch (err: any) {
        setError(err.message || "Помилка завантаження документів");
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, [filters]);

  const clientsById = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients],
  );
  const casesById = useMemo(
    () => new Map(cases.map((caseItem) => [caseItem.id, caseItem])),
    [cases],
  );

  const explorerEntries = useMemo(() => {
    const personalDocuments = documents.filter(
      (doc) => !doc.clientId && !doc.caseId,
    );
    const clientFolders = clients.map((client) => {
      const clientDocuments = documents.filter(
        (doc) => doc.clientId === client.id && !doc.caseId,
      );
      const clientCases = cases.filter(
        (caseItem) => caseItem.clientId === client.id,
      );
      const caseDocumentCount = clientCases.reduce(
        (count, caseItem) =>
          count + documents.filter((doc) => doc.caseId === caseItem.id).length,
        0,
      );

      return {
        id: client.id,
        client,
        itemsCount: clientDocuments.length + caseDocumentCount,
        cases: clientCases,
      };
    });

    return { personalDocuments, clientFolders };
  }, [cases, clients, documents]);

  const currentFolderLabel = useMemo(() => {
    if (folderPath.length === 0) {
      return "Корінь";
    }
    if (folderPath[0] === "personal") {
      return "Власна";
    }
    if (folderPath[0] === "client" && folderPath[2]) {
      const caseItem = casesById.get(folderPath[2]);
      return caseItem
        ? `${caseItem.caseNumber} • ${caseItem.title || "Справa"}`
        : "Справa";
    }
    if (folderPath[0] === "client" && folderPath[1]) {
      const client = clientsById.get(folderPath[1]);
      return client ? getClientDisplayName(client) : "Клієнт";
    }
    return "Корінь";
  }, [casesById, clientsById, folderPath]);

  const iconFolders = useMemo(() => {
    if (folderPath.length === 0) {
      return [
        {
          key: "personal",
          label: "Власна",
          description: `${explorerEntries.personalDocuments.length} файлів`,
          onClick: () => syncFolderPath(["personal"]),
        },
        ...explorerEntries.clientFolders.map((entry) => ({
          key: entry.id,
          label: getClientDisplayName(entry.client),
          description: `${entry.itemsCount} файлів`,
          onClick: () => syncFolderPath(["client", entry.id]),
        })),
      ];
    }

    if (
      folderPath[0] === "client" &&
      folderPath[1] &&
      folderPath.length === 2
    ) {
      return cases
        .filter((caseItem) => caseItem.clientId === folderPath[1])
        .map((caseItem) => ({
          key: caseItem.id,
          label: caseItem.caseNumber,
          description: caseItem.title || "Справa",
          onClick: () => syncFolderPath(["client", folderPath[1], caseItem.id]),
        }));
    }

    return [];
  }, [
    cases,
    explorerEntries.clientFolders,
    explorerEntries.personalDocuments.length,
    folderPath,
    clients.length,
  ]);

  const iconDocuments = useMemo(() => {
    if (folderPath.length === 0) {
      return [];
    }

    if (folderPath[0] === "personal") {
      return explorerEntries.personalDocuments;
    }

    if (
      folderPath[0] === "client" &&
      folderPath[1] &&
      folderPath.length === 2
    ) {
      return documents.filter(
        (doc) => doc.clientId === folderPath[1] && !doc.caseId,
      );
    }

    if (folderPath[0] === "client" && folderPath[2]) {
      return documents.filter((doc) => doc.caseId === folderPath[2]);
    }

    return [];
  }, [documents, explorerEntries.personalDocuments, folderPath]);

  const breadcrumbs = useMemo(() => {
    const base = [{ label: "Головна", to: "/dashboard" }, { label: "Файли" }];

    if (folderPath[0] === "personal") {
      return [...base, { label: "Власна" }];
    }

    if (folderPath[0] === "client") {
      const client = clientsById.get(folderPath[1]);
      const result = [
        ...base,
        { label: client ? getClientDisplayName(client) : "Клієнт" },
      ];
      if (folderPath[2]) {
        const caseItem = casesById.get(folderPath[2]);
        result.push({
          label: caseItem
            ? `${caseItem.caseNumber} • ${caseItem.title || "Справa"}`
            : "Справa",
        });
      }
      return result;
    }

    return base;
  }, [casesById, clientsById, folderPath]);

  const handleSearch = (search: string) => {
    setFilters((current) => ({ ...current, search, page: 1 }));
  };

  const handleFilterChange = (
    key: keyof DocumentFilters,
    value: string | undefined,
  ) => {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Ви впевнені, що хочете видалити цей документ?")) {
      return;
    }

    try {
      await documentService.deleteDocument(id);
      setFilters((current) => ({ ...current }));
    } catch (err: any) {
      setError(err.message || "Помилка видалення документа");
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      await documentService.downloadDocument(doc.id, doc.originalName);
    } catch (err: any) {
      setError(err.message || "Помилка завантаження документа");
    }
  };

  const queueFiles = (incomingFiles: FileList | File[]) => {
    const nextDrafts = Array.from(incomingFiles).map((file) => ({
      file,
      name: file.name,
    }));
    setUploadQueue((current) => [...current, ...nextDrafts]);
    setShowUploadPanel(true);
  };

  const handleUploadQueue = async () => {
    if (uploadQueue.length === 0) {
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      for (let index = 0; index < uploadQueue.length; index += 1) {
        const item = uploadQueue[index];
        const renamedFile =
          item.name === item.file.name
            ? item.file
            : new File([item.file], item.name, { type: item.file.type });

        await documentService.uploadDocument(
          renamedFile,
          {
            caseId:
              context.scope === "case"
                ? context.caseItem.id
                : folderPath[2] || filters.caseId,
            clientId:
              context.scope === "client"
                ? context.client.id
                : context.scope === "case"
                  ? context.caseItem.clientId
                  : folderPath[1] || filters.clientId,
            type: "other",
            accessLevel: "internal",
            sourceKind: "file_upload",
          },
          (progress) => {
            setUploadProgress(
              Math.round(((index + progress / 100) / uploadQueue.length) * 100),
            );
          },
        );
      }

      setUploadQueue([]);
      setShowUploadPanel(false);
      setFilters((current) => ({ ...current }));
    } catch (err: any) {
      setError(err.message || "Помилка завантаження файлів");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleMergeImagesIntoPdf = async () => {
    const imageDrafts = uploadQueue.filter((item) =>
      item.file.type.startsWith(IMAGE_MIME_PREFIX),
    );

    if (imageDrafts.length === 0) {
      setError("Додайте JPG, PNG або WebP, щоб зібрати їх у PDF");
      return;
    }

    try {
      setMergingImages(true);
      setError(null);
      const [{ PDFDocument }, preparedFiles] = await Promise.all([
        import("pdf-lib"),
        Promise.all(
          imageDrafts.map((item) => prepareImageForScanUpload(item.file)),
        ),
      ]);
      const pdfDocument = await PDFDocument.create();

      for (const preparedFile of preparedFiles) {
        const bytes = await preparedFile.arrayBuffer();
        const embeddedImage =
          preparedFile.type === "image/png"
            ? await pdfDocument.embedPng(bytes)
            : await pdfDocument.embedJpg(bytes);
        const imageDims = embeddedImage.scale(1);
        const page = pdfDocument.addPage([PDF_A4_WIDTH, PDF_A4_HEIGHT]);
        const scale = Math.min(
          PDF_A4_WIDTH / imageDims.width,
          PDF_A4_HEIGHT / imageDims.height,
        );
        const width = imageDims.width * scale;
        const height = imageDims.height * scale;

        page.drawImage(embeddedImage, {
          x: (PDF_A4_WIDTH - width) / 2,
          y: (PDF_A4_HEIGHT - height) / 2,
          width,
          height,
        });
      }

      const pdfBytes = await pdfDocument.save();
      const pdfFile = new File([pdfBytes], buildMergedPdfName(imageDrafts), {
        type: "application/pdf",
      });

      setUploadQueue((current) => [
        ...current.filter(
          (item) => !item.file.type.startsWith(IMAGE_MIME_PREFIX),
        ),
        {
          file: pdfFile,
          name: pdfFile.name,
        },
      ]);
    } catch (err: any) {
      setError(err.message || "Не вдалося зібрати PDF з обраних зображень");
    } finally {
      setMergingImages(false);
    }
  };

  const navigateToTemplateComposer = () => {
    const params = new URLSearchParams({ mode: "template" });
    const activeCaseId =
      context.scope === "case" ? context.caseItem.id : folderPath[2] || "";
    const activeClientId =
      context.scope === "client"
        ? context.client.id
        : context.scope === "case"
          ? context.caseItem.clientId
          : folderPath[1] || "";

    if (activeCaseId) {
      params.set("caseId", activeCaseId);
    }
    if (activeClientId) {
      params.set("clientId", activeClientId);
    }

    navigate(`/documents/create?${params.toString()}`);
  };

  const navigateToTextComposer = () => {
    const params = new URLSearchParams({ mode: "text" });
    const activeCaseId =
      context.scope === "case" ? context.caseItem.id : folderPath[2] || "";
    const activeClientId =
      context.scope === "client"
        ? context.client.id
        : context.scope === "case"
          ? context.caseItem.clientId
          : folderPath[1] || "";

    if (activeCaseId) {
      params.set("caseId", activeCaseId);
    }
    if (activeClientId) {
      params.set("clientId", activeClientId);
    }

    navigate(`/documents/create?${params.toString()}`);
  };

  const navigateToScan = () => {
    const params = new URLSearchParams();
    const activeCaseId =
      context.scope === "case" ? context.caseItem.id : folderPath[2] || "";
    const activeClientId =
      context.scope === "client"
        ? context.client.id
        : context.scope === "case"
          ? context.caseItem.clientId
          : folderPath[1] || "";

    if (folderPath[0] === "personal") {
      params.set("destinationScope", "personal");
    } else if (activeClientId) {
      params.set("destinationScope", "client");
      params.set("clientId", activeClientId);
    }

    if (activeCaseId) {
      params.set("caseId", activeCaseId);
    }

    navigate(
      `/documents/scan-session${params.toString() ? `?${params.toString()}` : ""}`,
    );
  };

  const totalPages = Math.ceil(total / (filters.limit || 100));

  return (
    <div className="documents-page">
      <Breadcrumbs items={breadcrumbs} />

      <PageHeader
        className="documents-page-header"
        title="Файли"
        subtitle={`Поточна папка: ${currentFolderLabel}`}
        actions={
          <div className="documents-actions">
            <button
              className="btn btn-secondary"
              onClick={navigateToTemplateComposer}
            >
              Створити з шаблону
            </button>
            <button
              className="btn btn-secondary"
              onClick={navigateToTextComposer}
            >
              Створити текстовий документ
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setShowUploadPanel((current) => !current)}
            >
              Завантажити файл
            </button>
            <button className="btn btn-primary" onClick={navigateToScan}>
              Додати скан
            </button>
          </div>
        }
      />

      {showUploadPanel && (
        <section
          className={`content-surface upload-dropzone ${uploading ? "is-uploading" : ""}`}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            if (event.dataTransfer.files.length > 0) {
              queueFiles(event.dataTransfer.files);
            }
          }}
        >
          <div className="upload-dropzone-head">
            <div>
              <h3>Завантаження файлів</h3>
              <p>Перетягніть кілька файлів сюди або виберіть їх вручну.</p>
            </div>
            <input
              ref={dropInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.txt,.md,.csv,.json,.xml,.html,.htm,.rtf,.zip"
              className="visually-hidden-file-input"
              onChange={(event) =>
                event.target.files && queueFiles(event.target.files)
              }
            />
            <button
              className="btn btn-secondary"
              onClick={() => dropInputRef.current?.click()}
            >
              <Upload size={16} />
              Обрати файли
            </button>
          </div>

          {uploadQueue.length > 0 ? (
            <>
              <div className="upload-queue">
                {uploadQueue.map((item, index) => (
                  <label
                    key={`${item.file.name}-${index}`}
                    className="upload-queue-row"
                  >
                    <span>{formatFileSize(item.file.size)}</span>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(event) =>
                        setUploadQueue((current) =>
                          current.map((queueItem, queueIndex) =>
                            queueIndex === index
                              ? { ...queueItem, name: event.target.value }
                              : queueItem,
                          ),
                        )
                      }
                    />
                    <button
                      className="btn btn-secondary"
                      onClick={() =>
                        setUploadQueue((current) =>
                          current.filter(
                            (_, queueIndex) => queueIndex !== index,
                          ),
                        )
                      }
                    >
                      Видалити
                    </button>
                  </label>
                ))}
              </div>

              <div className="upload-panel-actions">
                <button
                  className="btn btn-secondary"
                  onClick={handleMergeImagesIntoPdf}
                  disabled={uploading || mergingImages}
                >
                  {mergingImages
                    ? "Збирання PDF..."
                    : "Зібрати зображення в 1 PDF"}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleUploadQueue}
                  disabled={uploading}
                >
                  {uploading
                    ? `Завантаження... ${uploadProgress}%`
                    : "Завантажити у Файли"}
                </button>
              </div>
            </>
          ) : (
            <div className="upload-dropzone-empty">
              Додайте файли, щоб відредагувати назви перед збереженням.
            </div>
          )}
        </section>
      )}

      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      <RegistrySurface className="documents-shell">
        <div className="documents-toolbar">
          <RegistryFilterBar className="documents-filters">
            <RegistrySearchField
              placeholder="Пошук файлів..."
              value={filters.search || ""}
              onChange={handleSearch}
            />
            <select
              value={filters.type || ""}
              onChange={(event) =>
                handleFilterChange("type", event.target.value || undefined)
              }
            >
              <option value="">Усі типи</option>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={filters.status || ""}
              onChange={(event) =>
                handleFilterChange("status", event.target.value || undefined)
              }
            >
              <option value="">Усі статуси</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={filters.accessLevel || ""}
              onChange={(event) =>
                handleFilterChange(
                  "accessLevel",
                  event.target.value || undefined,
                )
              }
            >
              <option value="">Усі рівні доступу</option>
              {Object.entries(ACCESS_LEVEL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </RegistryFilterBar>

          <div className="documents-view-toggle">
            <button
              type="button"
              className={viewMode === "icons" ? "active" : ""}
              onClick={() => setViewMode("icons")}
              title="Іконки"
            >
              <LayoutGrid size={16} />
              <span>Іконки</span>
            </button>
            <button
              type="button"
              className={viewMode === "list" ? "active" : ""}
              onClick={() => setViewMode("list")}
              title="Список"
            >
              <List size={16} />
              <span>Список</span>
            </button>
          </div>
        </div>

        {loading || contextLoading || supportLoading ? (
          <RegistryLoadingState />
        ) : viewMode === "icons" ? (
          <div className="documents-icons-view">
            {folderPath.length > 0 && (
              <button
                className="documents-back-button"
                onClick={() => syncFolderPath(folderPath.slice(0, -1))}
              >
                Назад
              </button>
            )}

            {iconFolders.length > 0 && (
              <div className="documents-folder-grid">
                {iconFolders.map((folder) => (
                  <button
                    key={folder.key}
                    className="documents-folder-card"
                    onClick={folder.onClick}
                  >
                    <Folder size={28} />
                    <strong>{folder.label}</strong>
                    <span>{folder.description}</span>
                  </button>
                ))}
              </div>
            )}

            {iconDocuments.length > 0 ? (
              <div className="documents-file-grid">
                {iconDocuments.map((doc) => (
                  <article key={doc.id} className="documents-file-card">
                    <div
                      className={`file-icon file-icon-${getFileIconName(doc.mimeType)}`}
                    >
                      <FileText size={26} />
                    </div>
                    <strong>
                      <Link to={`/documents/${doc.id}`}>
                        {doc.originalName}
                      </Link>
                    </strong>
                    <span>{formatFileSize(doc.fileSize)}</span>
                    <span>
                      {new Date(doc.createdAt).toLocaleDateString("uk-UA")}
                    </span>
                    <RecordActionsMenu
                      actions={[
                        {
                          label: "Відкрити",
                          to: `/documents/${doc.id}`,
                        },
                        {
                          label: "Завантажити",
                          onClick: () => handleDownload(doc),
                        },
                        ...(doc.caseId
                          ? [
                              {
                                label: "Відкрити справу",
                                to: `/cases/${doc.caseId}`,
                              },
                            ]
                          : []),
                        ...(doc.clientId
                          ? [
                              {
                                label: "Відкрити клієнта",
                                to: `/clients/${doc.clientId}`,
                              },
                            ]
                          : []),
                        {
                          label: "Видалити",
                          onClick: () => handleDelete(doc.id),
                          danger: true,
                        },
                      ]}
                    />
                  </article>
                ))}
              </div>
            ) : folderPath.length > 0 || iconFolders.length === 0 ? (
              <RegistryEmptyState
                icon={<ScanLine size={56} />}
                title="У цій папці поки немає файлів"
                description="Створіть документ, завантажте файл або додайте скан."
              />
            ) : null}
          </div>
        ) : (
          <>
            <RegistryTableShell className="documents-table">
              <table>
                <thead>
                  <tr>
                    <th>Назва</th>
                    <th>Клієнт</th>
                    <th>Справa</th>
                    <th>Дата створення</th>
                    <th>Дата редагування</th>
                    <th>Швидкі дії</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => {
                    const client = doc.clientId
                      ? clientsById.get(doc.clientId)
                      : null;
                    const caseItem = doc.caseId
                      ? casesById.get(doc.caseId)
                      : null;
                    return (
                      <tr key={doc.id}>
                        <td data-label="Назва">
                          <div className="document-table-name">
                            <strong>
                              <Link to={`/documents/${doc.id}`}>
                                {doc.originalName}
                              </Link>
                            </strong>
                            <span>
                              {TYPE_LABELS[doc.type]} •{" "}
                              {formatFileSize(doc.fileSize)}
                            </span>
                          </div>
                        </td>
                        <td data-label="Клієнт">
                          {client ? (
                            <Link to={`/clients/${client.id}`}>
                              {getClientDisplayName(client)}
                            </Link>
                          ) : (
                            "Власна"
                          )}
                        </td>
                        <td data-label="Справa">
                          {caseItem ? (
                            <Link to={`/cases/${caseItem.id}`}>
                              {caseItem.caseNumber}
                            </Link>
                          ) : (
                            "Без справи"
                          )}
                        </td>
                        <td data-label="Дата створення">
                          {new Date(doc.createdAt).toLocaleDateString("uk-UA")}
                        </td>
                        <td data-label="Дата редагування">
                          {new Date(doc.updatedAt).toLocaleDateString("uk-UA")}
                        </td>
                        <td data-label="Швидкі дії">
                          <RecordActionsMenu
                            actions={[
                              {
                                label: "Відкрити",
                                to: `/documents/${doc.id}`,
                              },
                              {
                                label: "Завантажити",
                                onClick: () => handleDownload(doc),
                              },
                              ...(doc.caseId
                                ? [
                                    {
                                      label: "Відкрити справу",
                                      to: `/cases/${doc.caseId}`,
                                    },
                                  ]
                                : []),
                              ...(doc.clientId
                                ? [
                                    {
                                      label: "Відкрити клієнта",
                                      to: `/clients/${doc.clientId}`,
                                    },
                                  ]
                                : []),
                              {
                                label: "Видалити",
                                onClick: () => handleDelete(doc.id),
                                danger: true,
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </RegistryTableShell>

            {totalPages > 1 && (
              <RegistryPagination
                page={page}
                totalPages={totalPages}
                totalItems={total}
                onPrevious={() =>
                  setFilters((current) => ({ ...current, page: page - 1 }))
                }
                onNext={() =>
                  setFilters((current) => ({ ...current, page: page + 1 }))
                }
              />
            )}
          </>
        )}
      </RegistrySurface>
    </div>
  );
};

export default DocumentsPage;
