import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "../../components/Alert";
import { Spinner } from "../../components/Spinner";
import { documentService } from "../../services/document.service";
import {
  ScanDocumentFormat,
  ScanSessionResponse,
} from "../../types/document.types";
import { getErrorMessage } from "../../utils/errors";
import { prepareImageForScanUpload } from "../../utils/imageCompression";
import "./MobileScanPage.css";

const MOBILE_SCAN_KEEPALIVE_INTERVAL_MS = 60 * 1000;

const MobileScanPage: React.FC = () => {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const sessionId = params.get("session") || "";
  const token = params.get("token") || "";
  const [session, setSession] = useState<ScanSessionResponse | null>(null);
  const [localPreviewUrls, setLocalPreviewUrls] = useState<
    Record<string, string>
  >({});
  const [brokenPreviewIds, setBrokenPreviewIds] = useState<
    Record<string, boolean>
  >({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [documentFormat, setDocumentFormat] =
    useState<ScanDocumentFormat>("A4");
  const [error, setError] = useState<string | null>(null);
  const previewUrlsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    return () => {
      Object.values(previewUrlsRef.current).forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  const setLocalPreview = (pageId: string, previewUrl: string) => {
    const previousUrl = previewUrlsRef.current[pageId];
    if (previousUrl) {
      URL.revokeObjectURL(previousUrl);
    }

    const nextPreviewUrls = {
      ...previewUrlsRef.current,
      [pageId]: previewUrl,
    };
    previewUrlsRef.current = nextPreviewUrls;
    setLocalPreviewUrls(nextPreviewUrls);
    setBrokenPreviewIds((current) => {
      const nextBrokenPreviewIds = { ...current };
      delete nextBrokenPreviewIds[pageId];
      return nextBrokenPreviewIds;
    });
  };

  const clearLocalPreview = (pageId: string) => {
    const previousUrl = previewUrlsRef.current[pageId];
    if (previousUrl) {
      URL.revokeObjectURL(previousUrl);
    }

    const nextPreviewUrls = { ...previewUrlsRef.current };
    delete nextPreviewUrls[pageId];
    previewUrlsRef.current = nextPreviewUrls;
    setLocalPreviewUrls(nextPreviewUrls);
    setBrokenPreviewIds((current) => {
      const nextBrokenPreviewIds = { ...current };
      delete nextBrokenPreviewIds[pageId];
      return nextBrokenPreviewIds;
    });
  };

  const loadSession = async () => {
    if (!sessionId || !token) {
      setError("Відсутні параметри scan session");
      setLoading(false);
      return;
    }

    try {
      const response = await documentService.openMobileScanSession(
        sessionId,
        token,
      );
      setSession(response);
      setDocumentFormat(response.documentFormat);
    } catch (err: any) {
      setError(getErrorMessage(err, "Не вдалося відкрити сканер"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, [sessionId, token]);

  useEffect(() => {
    if (!sessionId || !token || loading || finalizing) {
      return;
    }

    if (
      session?.status &&
      ["completed", "cancelled", "failed"].includes(session.status)
    ) {
      return;
    }

    let isCancelled = false;

    const keepSessionAlive = async () => {
      try {
        const response = await documentService.openMobileScanSession(
          sessionId,
          token,
        );

        if (isCancelled) {
          return;
        }

        setSession(response);
      } catch (err: any) {
        if (isCancelled) {
          return;
        }

        const status = err?.response?.status;
        if ([400, 403, 404].includes(status)) {
          setError(getErrorMessage(err, "Сесію сканування більше недоступно"));
        }
      }
    };

    const intervalId = window.setInterval(
      keepSessionAlive,
      MOBILE_SCAN_KEEPALIVE_INTERVAL_MS,
    );

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void keepSessionAlive();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [finalizing, loading, session?.status, sessionId, token]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !sessionId) {
      return;
    }

    setUploading(true);
    setError(null);

    try {
      let currentSession = session;
      for (const sourceFile of Array.from(files)) {
        const preparedFile = await prepareImageForScanUpload(sourceFile);
        const previousPageIds = new Set(
          (currentSession?.pages || []).map((page) => page.id),
        );

        currentSession = await documentService.uploadScanPage(
          sessionId,
          preparedFile,
          {
            token,
            clientPageNumber: (currentSession?.pages.length || 0) + 1,
          },
        );

        const uploadedPage = currentSession.pages.find(
          (page) => !previousPageIds.has(page.id),
        );
        if (uploadedPage) {
          setLocalPreview(uploadedPage.id, URL.createObjectURL(preparedFile));
        }

        setSession(currentSession);
      }
    } catch (err: any) {
      setError(getErrorMessage(err, "Не вдалося завантажити сторінки"));
    } finally {
      setUploading(false);
    }
  };

  const movePage = async (pageId: string, direction: -1 | 1) => {
    if (!sessionId || !session) {
      return;
    }

    const sortedPages = [...session.pages].sort(
      (left, right) => left.pageNumber - right.pageNumber,
    );
    const index = sortedPages.findIndex((page) => page.id === pageId);
    const swapIndex = index + direction;
    if (index < 0 || swapIndex < 0 || swapIndex >= sortedPages.length) {
      return;
    }

    [sortedPages[index], sortedPages[swapIndex]] = [
      sortedPages[swapIndex],
      sortedPages[index],
    ];

    const response = await documentService.reorderScanPages(sessionId, {
      token,
      pages: sortedPages.map((page, orderIndex) => ({
        pageId: page.id,
        pageNumber: orderIndex + 1,
      })),
    });
    setSession(response);
  };

  const handleDelete = async (pageId: string) => {
    if (!sessionId) {
      return;
    }

    try {
      const response = await documentService.deleteScanPage(
        sessionId,
        pageId,
        token,
      );
      clearLocalPreview(pageId);
      setSession(response);
    } catch (err: any) {
      setError(getErrorMessage(err, "Не вдалося видалити сторінку"));
    }
  };

  const handleFinalize = async () => {
    if (!sessionId) {
      return;
    }

    try {
      setFinalizing(true);
      const response = await documentService.finalizeScanSession(sessionId, {
        token,
        documentFormat,
      });
      setSession(response);
    } catch (err: any) {
      setError(getErrorMessage(err, "Не вдалося завершити сканування"));
    } finally {
      setFinalizing(false);
    }
  };

  if (loading) {
    return (
      <div className="mobile-scan-page mobile-scan-page-loading">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="mobile-scan-page">
      <header className="mobile-scan-header">
        <div>
          <p className="mobile-scan-kicker">Mobile Scanner</p>
          <h1>Сканування документів</h1>
          <span>{session?.status || "created"}</span>
        </div>
      </header>

      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      <section className="mobile-scan-panel">
        <label className="mobile-scan-field">
          <span>Формат документа</span>
          <select
            value={documentFormat}
            onChange={(event) =>
              setDocumentFormat(event.target.value as ScanDocumentFormat)
            }
          >
            <option value="A4">A4</option>
            <option value="Original">Original</option>
          </select>
        </label>

        <div className="mobile-scan-upload-grid">
          <label className="mobile-scan-upload">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={(event) => handleFiles(event.target.files)}
              disabled={uploading || finalizing}
            />
            <span>{uploading ? "Йде завантаження..." : "Зробити фото"}</span>
          </label>

          <label className="mobile-scan-upload">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => handleFiles(event.target.files)}
              disabled={uploading || finalizing}
            />
            <span>
              {uploading ? "Йде завантаження..." : "З медіатеки або файлів"}
            </span>
          </label>
        </div>
        <p className="mobile-scan-hint">
          Фото автоматично стискаються для скану. Цільовий розмір однієї
          сторінки до 10 МБ.
        </p>
        <p className="mobile-scan-hint">
          Сесія сканування автоматично підтримується активною, поки ця сторінка
          відкрита.
        </p>
      </section>

      <section className="mobile-scan-pages">
        {session?.pages?.length ? (
          session.pages
            .sort((left, right) => left.pageNumber - right.pageNumber)
            .map((page) => (
              <article key={page.id} className="mobile-scan-card">
                {!brokenPreviewIds[page.id] &&
                (localPreviewUrls[page.id] || page.previewUrl) ? (
                  <img
                    src={localPreviewUrls[page.id] || page.previewUrl || ""}
                    alt={`Сторінка ${page.pageNumber}`}
                    onError={() =>
                      setBrokenPreviewIds((current) => ({
                        ...current,
                        [page.id]: true,
                      }))
                    }
                  />
                ) : (
                  <div className="mobile-scan-card-placeholder">
                    Сторінка {page.pageNumber}
                  </div>
                )}
                <div className="mobile-scan-card-meta">
                  <strong>Сторінка {page.pageNumber}</strong>
                  <span>{page.status}</span>
                </div>
                <div className="mobile-scan-card-actions">
                  <button onClick={() => movePage(page.id, -1)}>Вище</button>
                  <button onClick={() => movePage(page.id, 1)}>Нижче</button>
                  <button onClick={() => handleDelete(page.id)}>
                    Видалити
                  </button>
                </div>
              </article>
            ))
        ) : (
          <div className="mobile-scan-empty">
            Додайте сторінки документа з камери або галереї.
          </div>
        )}
      </section>

      <footer className="mobile-scan-footer">
        <button
          className="btn btn-primary"
          onClick={handleFinalize}
          disabled={!session?.pages.length || finalizing}
        >
          {finalizing ? "Формування PDF..." : "Завершити сканування"}
        </button>
        {session?.finalDocumentId && (
          <p className="mobile-scan-finished">
            Документ сформовано. Можна повернутися на комп'ютер.
          </p>
        )}
      </footer>
    </div>
  );
};

export default MobileScanPage;
