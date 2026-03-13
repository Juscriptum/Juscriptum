import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Crop,
  Download,
  Eye,
  FileArchive,
  FileText,
  Frame,
  ScanLine,
  RotateCcw,
  RotateCw,
  Save,
  Settings2,
  Sparkles,
  SplitSquareVertical,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import Cropper, { type Area } from "react-easy-crop";
import { Document as PdfDocument, Page, pdfjs } from "react-pdf";
import { strFromU8, unzipSync } from "fflate";
import { Alert } from "../../components/Alert";
import { Spinner } from "../../components/Spinner";
import { PageHeader } from "../../components/PageHeader";
import { Breadcrumbs } from "../../components/navigation";
import documentService from "../../services/document.service";
import {
  AccessLevel,
  Document,
  DocumentAccessScope,
  DocumentProcessingRuntimeCapabilities,
  DocumentProcessingSummary,
} from "../../types/document.types";
import { getErrorMessage } from "../../utils/errors";
import {
  A4_ASPECT_RATIO,
  analyzeScanPage,
  buildCornersFromArea,
  canvasToBlob,
  detectDocumentArea,
  getBoundingAreaFromCorners,
  getPageFormatAspectRatio,
  getSuggestedDocumentArea,
  renderProcessedScanCanvas,
  ScanCornerPoint,
  ScanPageAnalysis,
  ScanProcessingMode,
  ScanTargetPageFormat,
} from "../../utils/scanProcessing";
import "./DocumentViewerPage.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

type PreviewKind = "pdf" | "image" | "text" | "docx" | "zip" | "unsupported";
type ArchivePreviewKind = "text" | "image" | "pdf" | "unsupported";

interface ArchiveEntry {
  path: string;
  size: number;
  previewKind: ArchivePreviewKind;
  data: Uint8Array;
}

interface PdfScanPageAsset {
  url: string;
  width: number;
  height: number;
}

interface PdfProcessingMetadata {
  processingPipeline: string;
  pdfType: PdfDocumentKind;
  processingMode: ScanProcessingMode;
  targetPageFormat: ScanTargetPageFormat;
  ocrEnabled: boolean;
  pageCount: number;
  pageAnalyses: Record<string, unknown>;
}

type PageProcessingStatus =
  | "pending"
  | "analyzed"
  | "cropped"
  | "corrected"
  | "enhanced"
  | "ocr_done"
  | "failed";

type PdfDocumentKind = "digital" | "scanned" | "mixed" | "unknown";

const SERVER_PROCESSING_STATUS_LABELS: Record<string, string> = {
  uploaded: "Завантажено",
  analyzing: "Аналізується",
  preprocessing: "Попередня обробка",
  geometry_corrected: "Геометрію виправлено",
  enhanced: "Покращено",
  pdf_assembled: "PDF зібрано",
  ocr_processing: "OCR виконується",
  completed: "Завершено",
  failed: "Помилка",
};

const PDF_SCAN_RENDER_TARGET_WIDTH = 1500;
const SCAN_OCR_LANGS = "ukr+rus+spa+eng";
const PDF_A4_WIDTH = 595.28;
const PDF_A4_HEIGHT = 841.89;

const PROCESSING_MODE_LABELS: Record<ScanProcessingMode, string> = {
  color: "Кольоровий",
  document: "Документ",
  black_white: "Чорно-білий",
  grayscale: "Відтінки сірого",
  original: "Оригінал",
};

const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  public: "Публічний",
  internal: "Внутрішній",
  confidential: "Конфіденційний",
};

const ACCESS_SCOPE_LABELS: Record<DocumentAccessScope, string> = {
  private: "Приватний",
  assigned: "Призначений",
  tenant: "В межах організації",
};

const PAGE_FORMAT_LABELS: Record<ScanTargetPageFormat, string> = {
  auto: "Автовизначення",
  original: "Оригінальний розмір",
  a4_portrait: "A4 книжковий",
  a4_landscape: "A4 альбомний",
  a5: "A5",
  letter: "Letter",
  legal: "Legal",
};

const PAGE_PROCESSING_STATUS_LABELS: Record<PageProcessingStatus, string> = {
  pending: "Очікує",
  analyzed: "Проаналізовано",
  cropped: "Обрізано",
  corrected: "Скориговано",
  enhanced: "Покращено",
  ocr_done: "OCR готовий",
  failed: "Помилка",
};

const TEXT_EXTENSIONS = new Set([
  "txt",
  "md",
  "csv",
  "json",
  "xml",
  "html",
  "htm",
  "log",
  "rtf",
]);

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp"]);
const ARCHIVE_EXTENSIONS = new Set(["zip"]);

const getFileExtension = (fileName: string) => {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() || "" : "";
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

const guessMimeType = (fileName: string): string => {
  const ext = getFileExtension(fileName);

  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "doc":
      return "application/msword";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "txt":
    case "log":
      return "text/plain";
    case "md":
      return "text/markdown";
    case "csv":
      return "text/csv";
    case "json":
      return "application/json";
    case "xml":
      return "application/xml";
    case "html":
    case "htm":
      return "text/html";
    case "rtf":
      return "application/rtf";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "zip":
      return "application/zip";
    default:
      return "application/octet-stream";
  }
};

const getPreviewKind = (documentItem: Document): PreviewKind => {
  const mimeType = documentItem.mimeType?.toLowerCase() || "";
  const extension = getFileExtension(documentItem.originalName);

  if (mimeType.includes("pdf") || extension === "pdf") {
    return "pdf";
  }

  if (mimeType.startsWith("image/") || IMAGE_EXTENSIONS.has(extension)) {
    return "image";
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === "docx"
  ) {
    return "docx";
  }

  if (
    mimeType === "application/zip" ||
    mimeType === "application/x-zip-compressed" ||
    ARCHIVE_EXTENSIONS.has(extension)
  ) {
    return "zip";
  }

  if (
    mimeType.startsWith("text/") ||
    ["application/json", "application/xml", "application/rtf"].includes(
      mimeType,
    ) ||
    TEXT_EXTENSIONS.has(extension)
  ) {
    return "text";
  }

  return "unsupported";
};

const getArchivePreviewKind = (entryPath: string): ArchivePreviewKind => {
  const mimeType = guessMimeType(entryPath);
  const extension = getFileExtension(entryPath);

  if (mimeType.startsWith("image/") || IMAGE_EXTENSIONS.has(extension)) {
    return "image";
  }

  if (mimeType === "application/pdf" || extension === "pdf") {
    return "pdf";
  }

  if (
    mimeType.startsWith("text/") ||
    ["application/json", "application/xml"].includes(mimeType) ||
    TEXT_EXTENSIONS.has(extension)
  ) {
    return "text";
  }

  return "unsupported";
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("Не вдалося завантажити зображення"));
    image.src = src;
  });

const getRadianAngle = (degrees: number) => (degrees * Math.PI) / 180;

const rotateSize = (width: number, height: number, rotation: number) => ({
  width:
    Math.abs(Math.cos(getRadianAngle(rotation)) * width) +
    Math.abs(Math.sin(getRadianAngle(rotation)) * height),
  height:
    Math.abs(Math.sin(getRadianAngle(rotation)) * width) +
    Math.abs(Math.cos(getRadianAngle(rotation)) * height),
});

const exportEditedImage = async (
  imageUrl: string,
  crop: Area,
  rotation: number,
  mimeType: string,
): Promise<Blob> => {
  const image = await loadImage(imageUrl);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Не вдалося підготувати полотно для збереження");
  }

  const safeMimeType = mimeType.startsWith("image/") ? mimeType : "image/png";
  const maxSize = rotateSize(image.width, image.height, rotation);

  canvas.width = maxSize.width;
  canvas.height = maxSize.height;

  context.translate(maxSize.width / 2, maxSize.height / 2);
  context.rotate(getRadianAngle(rotation));
  context.drawImage(image, -image.width / 2, -image.height / 2);

  const croppedCanvas = document.createElement("canvas");
  const croppedContext = croppedCanvas.getContext("2d");

  if (!croppedContext) {
    throw new Error("Не вдалося обрізати зображення");
  }

  croppedCanvas.width = crop.width;
  croppedCanvas.height = crop.height;

  croppedContext.drawImage(
    canvas,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  );

  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Не вдалося створити файл зображення"));
          return;
        }

        resolve(blob);
      },
      safeMimeType,
      safeMimeType === "image/png" ? undefined : 0.92,
    );
  });
};

const buildDownloadName = (path: string) => path.split("/").pop() || path;

const buildPdfFromProcessedCanvases = async (
  canvases: HTMLCanvasElement[],
): Promise<Uint8Array> => {
  const { PDFDocument } = await import("pdf-lib");
  const pdfDocument = await PDFDocument.create();

  for (const canvas of canvases) {
    const pageBlob = await canvasToBlob(canvas, "image/jpeg", 0.92);
    const bytes = await pageBlob.arrayBuffer();
    const image = await pdfDocument.embedJpg(bytes);
    const pageAspect = canvas.width / canvas.height;
    const isA4PortraitLike = Math.abs(pageAspect - A4_ASPECT_RATIO) < 0.03;
    const isA4LandscapeLike = Math.abs(pageAspect - 1 / A4_ASPECT_RATIO) < 0.03;
    const pageWidth = isA4PortraitLike
      ? PDF_A4_WIDTH
      : isA4LandscapeLike
        ? PDF_A4_HEIGHT
        : canvas.width;
    const pageHeight = isA4PortraitLike
      ? PDF_A4_HEIGHT
      : isA4LandscapeLike
        ? PDF_A4_WIDTH
        : canvas.height;
    const targetScale = Math.min(
      pageWidth / canvas.width,
      pageHeight / canvas.height,
    );
    const targetWidth = canvas.width * targetScale;
    const targetHeight = canvas.height * targetScale;
    const page = pdfDocument.addPage([pageWidth, pageHeight]);

    page.drawImage(image, {
      x: (pageWidth - targetWidth) / 2,
      y: (pageHeight - targetHeight) / 2,
      width: targetWidth,
      height: targetHeight,
    });
  }

  return pdfDocument.save();
};

const mergeOcrPagePdfs = async (
  pagePdfs: Uint8Array[],
): Promise<Uint8Array> => {
  const { PDFDocument } = await import("pdf-lib");
  const mergedDocument = await PDFDocument.create();

  for (const pagePdf of pagePdfs) {
    const pageDocument = await PDFDocument.load(pagePdf);
    const copiedPages = await mergedDocument.copyPages(
      pageDocument,
      pageDocument.getPageIndices(),
    );

    copiedPages.forEach((page) => {
      const { width, height } = page.getSize();
      const isA4Like = Math.abs(width / height - A4_ASPECT_RATIO) < 0.03;

      if (isA4Like) {
        const scale = Math.min(PDF_A4_WIDTH / width, PDF_A4_HEIGHT / height);
        page.scaleContent(scale, scale);
        page.setSize(PDF_A4_WIDTH, PDF_A4_HEIGHT);
        page.translateContent(
          (PDF_A4_WIDTH - width * scale) / 2,
          (PDF_A4_HEIGHT - height * scale) / 2,
        );
      }

      mergedDocument.addPage(page);
    });
  }

  return mergedDocument.save();
};

const ManualCornerEditor: React.FC<{
  imageUrl: string;
  width: number;
  height: number;
  corners: [ScanCornerPoint, ScanCornerPoint, ScanCornerPoint, ScanCornerPoint];
  onChange: (
    corners: [
      ScanCornerPoint,
      ScanCornerPoint,
      ScanCornerPoint,
      ScanCornerPoint,
    ],
  ) => void;
}> = ({ imageUrl, width, height, corners, onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragIndexRef = useRef<number | null>(null);

  const updatePoint = (clientX: number, clientY: number) => {
    const container = containerRef.current;
    const dragIndex = dragIndexRef.current;
    if (!container || dragIndex === null) {
      return;
    }

    const rect = container.getBoundingClientRect();
    const nextPoint = {
      x: Math.max(
        0,
        Math.min(width, ((clientX - rect.left) / rect.width) * width),
      ),
      y: Math.max(
        0,
        Math.min(height, ((clientY - rect.top) / rect.height) * height),
      ),
    };

    const nextCorners = corners.map((corner, index) =>
      index === dragIndex ? nextPoint : corner,
    ) as [ScanCornerPoint, ScanCornerPoint, ScanCornerPoint, ScanCornerPoint];
    onChange(nextCorners);
  };

  return (
    <div
      ref={containerRef}
      className="document-viewer-corner-editor"
      onPointerMove={(event) => {
        if (dragIndexRef.current !== null) {
          updatePoint(event.clientX, event.clientY);
        }
      }}
      onPointerUp={() => {
        dragIndexRef.current = null;
      }}
      onPointerLeave={() => {
        dragIndexRef.current = null;
      }}
    >
      <img
        className="document-viewer-corner-editor-image"
        src={imageUrl}
        alt="Редактор кутів сторінки"
      />
      <svg
        className="document-viewer-corner-editor-overlay"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        <polygon
          points={corners.map((corner) => `${corner.x},${corner.y}`).join(" ")}
        />
      </svg>
      {corners.map((corner, index) => (
        <button
          key={index}
          type="button"
          className="document-viewer-corner-handle"
          style={{
            left: `${(corner.x / width) * 100}%`,
            top: `${(corner.y / height) * 100}%`,
          }}
          onPointerDown={(event) => {
            dragIndexRef.current = index;
            updatePoint(event.clientX, event.clientY);
          }}
          aria-label={`Кут ${index + 1}`}
        />
      ))}
    </div>
  );
};

const ToolbarIconButton = ({
  active = false,
  children,
  disabled,
  label,
  onClick,
  tone = "default",
}: {
  active?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  onClick?: () => void;
  tone?: "default" | "primary";
}) => (
  <button
    type="button"
    className={`document-viewer-tool-button ${
      tone === "primary" ? "is-primary" : ""
    } ${active ? "is-active" : ""}`}
    title={label}
    aria-label={label}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

export const DocumentViewerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const docxContainerRef = useRef<HTMLDivElement>(null);
  const previewHostRef = useRef<HTMLDivElement>(null);
  const pdfDocumentRef = useRef<any>(null);
  const pdfPageAssetUrlsRef = useRef<Record<number, string>>({});
  const scanPreviewUrlRef = useRef<string | null>(null);
  const [previewWidth, setPreviewWidth] = useState(720);
  const [documentItem, setDocumentItem] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [metadataSaving, setMetadataSaving] = useState(false);
  const [contentBlob, setContentBlob] = useState<Blob | null>(null);
  const [contentUrl, setContentUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [revisionSaving, setRevisionSaving] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [accessLevelDraft, setAccessLevelDraft] =
    useState<AccessLevel>("internal");
  const [accessScopeDraft, setAccessScopeDraft] =
    useState<DocumentAccessScope>("assigned");
  const [textContent, setTextContent] = useState("");
  const [initialTextContent, setInitialTextContent] = useState("");
  const [imageCrop, setImageCrop] = useState({ x: 0, y: 0 });
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const [imageAspect, setImageAspect] = useState(4 / 3);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [pdfPageNumber, setPdfPageNumber] = useState(1);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [pdfRotations, setPdfRotations] = useState<Record<number, number>>({});
  const [pdfScanMode, setPdfScanMode] = useState(false);
  const [scanEnableOcr, setScanEnableOcr] = useState(true);
  const [scanProcessingMode, setScanProcessingMode] =
    useState<ScanProcessingMode>("document");
  const [scanTargetPageFormat, setScanTargetPageFormat] =
    useState<ScanTargetPageFormat>("auto");
  const [scanShowProcessedPreview, setScanShowProcessedPreview] =
    useState(false);
  const [scanManualCornerMode, setScanManualCornerMode] = useState(false);
  const [scanProgress, setScanProgress] = useState<string | null>(null);
  const [pdfScanPageLoading, setPdfScanPageLoading] = useState(false);
  const [pdfScanCropNonce, setPdfScanCropNonce] = useState(0);
  const [pdfScanCrop, setPdfScanCrop] = useState({ x: 0, y: 0 });
  const [pdfScanZoom, setPdfScanZoom] = useState(1);
  const [scanPreviewUrl, setScanPreviewUrl] = useState<string | null>(null);
  const [pdfScanPageAssets, setPdfScanPageAssets] = useState<
    Record<number, PdfScanPageAsset>
  >({});
  const [pdfDetectedAreas, setPdfDetectedAreas] = useState<
    Record<number, Area>
  >({});
  const [pdfPageAnalyses, setPdfPageAnalyses] = useState<
    Record<number, ScanPageAnalysis>
  >({});
  const [pdfPageCorners, setPdfPageCorners] = useState<
    Record<
      number,
      [ScanCornerPoint, ScanCornerPoint, ScanCornerPoint, ScanCornerPoint]
    >
  >({});
  const [pdfPageProcessingStatuses, setPdfPageProcessingStatuses] = useState<
    Record<number, PageProcessingStatus>
  >({});
  const [pdfPageCropAreas, setPdfPageCropAreas] = useState<
    Record<number, Area>
  >({});
  const [pdfType, setPdfType] = useState<PdfDocumentKind>("unknown");
  const [pageOcrConfidence, setPageOcrConfidence] = useState<
    Record<number, number>
  >({});
  const [processingSummary, setProcessingSummary] =
    useState<DocumentProcessingSummary | null>(null);
  const [activeServerJobId, setActiveServerJobId] = useState<string | null>(
    null,
  );
  const [serverProcessingRuntime, setServerProcessingRuntime] =
    useState<DocumentProcessingRuntimeCapabilities | null>(null);
  const [serverProcessingAvailable, setServerProcessingAvailable] = useState<
    boolean | null
  >(null);
  const [zipEntries, setZipEntries] = useState<ArchiveEntry[]>([]);
  const [selectedZipEntryPath, setSelectedZipEntryPath] = useState<
    string | null
  >(null);
  const [archivePreviewUrl, setArchivePreviewUrl] = useState<string | null>(
    null,
  );
  const [archiveTextPreview, setArchiveTextPreview] = useState("");

  const previewKind = useMemo(
    () => (documentItem ? getPreviewKind(documentItem) : "unsupported"),
    [documentItem],
  );

  const activeZipEntry = useMemo(
    () =>
      zipEntries.find((entry) => entry.path === selectedZipEntryPath) || null,
    [selectedZipEntryPath, zipEntries],
  );

  const isScanLikePdf =
    previewKind === "pdf" &&
    typeof documentItem?.metadata?.sourceKind === "string" &&
    /scan/i.test(documentItem.metadata.sourceKind);
  const isServerPrimaryScanPdf =
    previewKind === "pdf" &&
    documentItem?.metadata?.sourceKind === "scan_session";

  const currentPdfScanAsset = pdfScanPageAssets[pdfPageNumber] || null;
  const currentPdfAnalysis = pdfPageAnalyses[pdfPageNumber] || null;
  const currentTargetAspect = getPageFormatAspectRatio(
    scanTargetPageFormat,
    currentPdfScanAsset
      ? currentPdfScanAsset.width / currentPdfScanAsset.height
      : undefined,
  );
  const currentPdfSuggestedArea = useMemo(() => {
    if (!currentPdfScanAsset) {
      return null;
    }

    return getSuggestedDocumentArea(
      currentPdfScanAsset.width,
      currentPdfScanAsset.height,
      pdfDetectedAreas[pdfPageNumber],
      currentTargetAspect,
    );
  }, [
    currentPdfScanAsset,
    currentTargetAspect,
    pdfDetectedAreas,
    pdfPageNumber,
  ]);

  const currentPdfCropArea =
    pdfPageCropAreas[pdfPageNumber] || currentPdfSuggestedArea;
  const currentPdfCorners =
    pdfPageCorners[pdfPageNumber] ||
    (currentPdfCropArea ? buildCornersFromArea(currentPdfCropArea) : null);
  const currentPageUsesManualCorners =
    pdfPageProcessingStatuses[pdfPageNumber] === "corrected";

  const viewerBreadcrumbs = useMemo(() => {
    if (!documentItem) {
      return [{ label: "Файли", to: "/documents" }];
    }

    const items = [
      { label: "Головна", to: "/dashboard" },
      { label: "Файли", to: "/documents" },
    ];

    if (!documentItem.clientId && !documentItem.caseId) {
      items.push({ label: "Власна", to: "/documents?folder=personal" });
    }

    items.push({ label: documentItem.originalName });

    return items;
  }, [documentItem]);

  const textDirty = textContent !== initialTextContent;
  const metadataDirty =
    descriptionDraft !== (documentItem?.description || "") ||
    accessLevelDraft !== (documentItem?.accessLevel || "internal") ||
    accessScopeDraft !== (documentItem?.accessScope || "assigned");
  const imageDirty =
    imageRotation !== 0 ||
    imageZoom !== 1 ||
    imageCrop.x !== 0 ||
    imageCrop.y !== 0;
  const pdfRotationDirty = Object.values(pdfRotations).some(
    (rotation) => ((rotation % 360) + 360) % 360 !== 0,
  );
  const pdfDirty =
    pdfRotationDirty ||
    pdfScanMode ||
    scanProcessingMode !== "document" ||
    scanTargetPageFormat !== "auto";

  const revokePdfScanAssets = () => {
    Object.values(pdfPageAssetUrlsRef.current).forEach((url) => {
      URL.revokeObjectURL(url);
    });
    pdfPageAssetUrlsRef.current = {};
  };

  const clearPdfScanAssets = () => {
    revokePdfScanAssets();
    setPdfScanPageAssets({});
    setPdfDetectedAreas({});
    setPdfPageAnalyses({});
    setPdfPageCorners({});
    setPdfPageProcessingStatuses({});
    setPageOcrConfidence({});
    setPdfPageCropAreas({});
  };

  useEffect(() => {
    if (!previewHostRef.current) {
      return;
    }

    const host = previewHostRef.current;
    const resizeObserver = new ResizeObserver((entries) => {
      const nextWidth = Math.floor(entries[0]?.contentRect.width || 720);
      if (nextWidth > 0) {
        setPreviewWidth(Math.max(320, nextWidth - 48));
      }
    });

    resizeObserver.observe(host);

    return () => resizeObserver.disconnect();
  }, [previewKind]);

  useEffect(() => {
    scanPreviewUrlRef.current = scanPreviewUrl;
  }, [scanPreviewUrl]);

  useEffect(() => {
    return () => {
      revokePdfScanAssets();
      void pdfDocumentRef.current?.destroy?.();
      pdfDocumentRef.current = null;
      if (scanPreviewUrlRef.current) {
        URL.revokeObjectURL(scanPreviewUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!id) {
      setError("Документ не знайдено");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadDocument = async () => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(null);
        setPreviewError(null);
        setContentBlob(null);
        setTextContent("");
        setInitialTextContent("");
        setPdfRotations({});
        setPdfPageNumber(1);
        setPdfPageCount(0);
        setPdfScanMode(false);
        setScanEnableOcr(true);
        setScanProcessingMode("document");
        setScanTargetPageFormat("auto");
        setScanShowProcessedPreview(false);
        setScanManualCornerMode(false);
        setScanProgress(null);
        setPdfScanCropNonce(0);
        setPdfScanCrop({ x: 0, y: 0 });
        setPdfScanZoom(1);
        setPdfType("unknown");
        setScanPreviewUrl((currentUrl) => {
          if (currentUrl) {
            URL.revokeObjectURL(currentUrl);
          }

          return null;
        });
        setZipEntries([]);
        setSelectedZipEntryPath(null);
        setProcessingSummary(null);
        setActiveServerJobId(null);
        setServerProcessingRuntime(null);
        setServerProcessingAvailable(null);
        clearPdfScanAssets();
        void pdfDocumentRef.current?.destroy?.();
        pdfDocumentRef.current = null;

        const [nextDocument, nextProcessingSummary] = await Promise.all([
          documentService.getDocument(id),
          documentService
            .getProcessingSummary(id)
            .catch(() => ({ job: null, artifacts: [] })),
        ]);

        if (cancelled) {
          return;
        }

        setDocumentItem(nextDocument);
        setProcessingSummary(nextProcessingSummary);
        if (
          nextProcessingSummary.job &&
          !["completed", "failed"].includes(nextProcessingSummary.job.status)
        ) {
          setActiveServerJobId(nextProcessingSummary.job.id);
        }
        setDescriptionDraft(nextDocument.description || "");
        setAccessLevelDraft(nextDocument.accessLevel);
        setAccessScopeDraft(nextDocument.accessScope || "assigned");
      } catch (err: any) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Не вдалося завантажити документ"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDocument();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!documentItem || previewKind === "unsupported") {
      return;
    }

    let cancelled = false;

    const loadContent = async () => {
      try {
        setContentLoading(true);
        setPreviewError(null);
        const blob = await documentService.getDocumentContent(documentItem.id);

        if (!cancelled) {
          setContentBlob(blob);
        }
      } catch (err: any) {
        if (!cancelled) {
          setPreviewError(getErrorMessage(err, "Не вдалося відкрити файл"));
        }
      } finally {
        if (!cancelled) {
          setContentLoading(false);
        }
      }
    };

    loadContent();

    return () => {
      cancelled = true;
    };
  }, [documentItem, previewKind]);

  useEffect(() => {
    if (previewKind !== "pdf") {
      setPdfScanMode(false);
      return;
    }

    setPdfScanMode(isScanLikePdf);
    setScanEnableOcr(true);
    setScanProcessingMode("document");
    setScanTargetPageFormat("auto");
    setScanShowProcessedPreview(false);
    setScanManualCornerMode(false);
    setScanProgress(null);
  }, [documentItem?.id, isScanLikePdf, previewKind]);

  useEffect(() => {
    if (!isServerPrimaryScanPdf) {
      setActiveServerJobId(null);
      setServerProcessingRuntime(null);
      setServerProcessingAvailable(null);
      return;
    }

    let cancelled = false;

    void documentService
      .getProcessingRuntime()
      .then((runtime) => {
        if (!cancelled) {
          setServerProcessingRuntime(runtime);
          setServerProcessingAvailable(Boolean(runtime.ready));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setServerProcessingRuntime(null);
          setServerProcessingAvailable(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isServerPrimaryScanPdf]);

  useEffect(() => {
    if (!documentItem || !activeServerJobId) {
      return;
    }

    let cancelled = false;
    const tick = async () => {
      try {
        const nextSummary = await documentService.getProcessingSummary(
          documentItem.id,
        );
        if (cancelled) {
          return;
        }

        setProcessingSummary(nextSummary);
        const activeJob = nextSummary.job;
        if (!activeJob || activeJob.id !== activeServerJobId) {
          return;
        }

        if (activeJob.status === "failed") {
          setRevisionSaving(false);
          setScanProgress(null);
          setActiveServerJobId(null);
          setError(
            activeJob.lastError || "Серверна обробка завершилась помилкою",
          );
          return;
        }

        const resultDocumentId =
          typeof activeJob.metadata?.resultDocumentId === "string"
            ? activeJob.metadata.resultDocumentId
            : null;

        if (activeJob.status === "completed" && resultDocumentId) {
          setActiveServerJobId(null);
          setScanProgress(null);
          setRevisionSaving(false);
          setSuccess("Серверна обробка завершена. Відкриваємо нову версію...");
          navigate(`/documents/${resultDocumentId}`);
          return;
        }

        setScanProgress(
          `Серверна обробка: ${SERVER_PROCESSING_STATUS_LABELS[activeJob.status] || activeJob.status}`,
        );
      } catch (err: any) {
        if (!cancelled) {
          setRevisionSaving(false);
          setScanProgress(null);
          setActiveServerJobId(null);
          setError(getErrorMessage(err, "Не вдалося оновити статус обробки"));
        }
      }
    };

    void tick();
    const intervalId = window.setInterval(() => {
      void tick();
    }, 2000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [activeServerJobId, documentItem, navigate]);

  useEffect(() => {
    if (previewKind !== "pdf" || !contentBlob) {
      void pdfDocumentRef.current?.destroy?.();
      pdfDocumentRef.current = null;
      clearPdfScanAssets();
      return;
    }

    let cancelled = false;
    let loadingTask: any = null;

    const loadPdfDocument = async () => {
      try {
        const bytes = new Uint8Array(await contentBlob.arrayBuffer());
        loadingTask = pdfjs.getDocument({ data: bytes });
        const pdfDocument = await loadingTask.promise;

        if (cancelled) {
          await pdfDocument.destroy();
          return;
        }

        pdfDocumentRef.current = pdfDocument;
        setPdfPageCount(pdfDocument.numPages || 0);
        setPdfPageNumber((current) =>
          Math.min(Math.max(current, 1), pdfDocument.numPages || 1),
        );

        const pagesToInspect = Math.min(pdfDocument.numPages || 0, 3);
        let pagesWithText = 0;

        for (let pageIndex = 1; pageIndex <= pagesToInspect; pageIndex += 1) {
          const page = await pdfDocument.getPage(pageIndex);
          const textContent = await page.getTextContent();
          if ((textContent.items || []).length > 12) {
            pagesWithText += 1;
          }
        }

        if (pagesToInspect === 0) {
          setPdfType("unknown");
        } else if (pagesWithText === 0) {
          setPdfType("scanned");
        } else if (pagesWithText === pagesToInspect) {
          setPdfType("digital");
        } else {
          setPdfType("mixed");
        }
      } catch (err: any) {
        if (!cancelled) {
          setPreviewError(
            getErrorMessage(err, "Не вдалося підготувати PDF до редагування"),
          );
        }
      }
    };

    loadPdfDocument();

    return () => {
      cancelled = true;
      void loadingTask?.destroy?.();
    };
  }, [contentBlob, previewKind]);

  useEffect(() => {
    if (previewKind !== "image" || !contentBlob) {
      setContentUrl((currentUrl) => {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl);
        }

        return null;
      });
      return;
    }

    const nextUrl = URL.createObjectURL(contentBlob);
    setContentUrl(nextUrl);

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [contentBlob, previewKind]);

  useEffect(() => {
    if (!contentUrl || previewKind !== "image") {
      return;
    }

    let cancelled = false;

    const loadMetadata = async () => {
      try {
        const image = await loadImage(contentUrl);
        if (!cancelled && image.width && image.height) {
          setImageAspect(image.width / image.height);
        }
      } catch {
        // Ignore image metadata load failures; preview error is handled elsewhere.
      }
    };

    loadMetadata();

    return () => {
      cancelled = true;
    };
  }, [contentUrl, previewKind]);

  useEffect(() => {
    if (previewKind !== "text" || !contentBlob) {
      return;
    }

    let cancelled = false;

    contentBlob
      .text()
      .then((value) => {
        if (!cancelled) {
          setTextContent(value);
          setInitialTextContent(value);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewError("Не вдалося прочитати текстовий файл");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [contentBlob, previewKind]);

  useEffect(() => {
    if (previewKind !== "docx" || !contentBlob || !docxContainerRef.current) {
      return;
    }

    let cancelled = false;
    const container = docxContainerRef.current;
    container.innerHTML = "";

    const renderDocx = async () => {
      try {
        const [{ renderAsync }, arrayBuffer] = await Promise.all([
          import("docx-preview"),
          contentBlob.arrayBuffer(),
        ]);

        if (cancelled) {
          return;
        }

        await renderAsync(arrayBuffer, container, undefined, {
          className: "docx-preview-surface",
          inWrapper: true,
          ignoreWidth: false,
          breakPages: true,
        });
      } catch (err: any) {
        if (!cancelled) {
          setPreviewError(
            getErrorMessage(err, "Не вдалося відобразити DOCX-файл"),
          );
        }
      }
    };

    renderDocx();

    return () => {
      cancelled = true;
      container.innerHTML = "";
    };
  }, [contentBlob, previewKind]);

  useEffect(() => {
    if (previewKind !== "zip" || !contentBlob) {
      return;
    }

    let cancelled = false;

    const parseArchive = async () => {
      try {
        const buffer = await contentBlob.arrayBuffer();
        const files = unzipSync(new Uint8Array(buffer));
        const entries = Object.entries(files)
          .filter(([path]) => !path.endsWith("/"))
          .map(([path, data]) => ({
            path,
            size: data.byteLength,
            previewKind: getArchivePreviewKind(path),
            data,
          }))
          .sort((left, right) => left.path.localeCompare(right.path, "uk"));

        if (!cancelled) {
          setZipEntries(entries);
          setSelectedZipEntryPath(entries[0]?.path || null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setPreviewError(getErrorMessage(err, "Не вдалося прочитати ZIP"));
        }
      }
    };

    parseArchive();

    return () => {
      cancelled = true;
    };
  }, [contentBlob, previewKind]);

  useEffect(() => {
    setArchivePreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
      return null;
    });
    setArchiveTextPreview("");

    if (!activeZipEntry) {
      return;
    }

    if (activeZipEntry.previewKind === "text") {
      const decoded = strFromU8(activeZipEntry.data.subarray(0, 200000));
      setArchiveTextPreview(decoded);
      return;
    }

    if (["image", "pdf"].includes(activeZipEntry.previewKind)) {
      const nextUrl = URL.createObjectURL(
        new Blob([activeZipEntry.data], {
          type: guessMimeType(activeZipEntry.path),
        }),
      );
      setArchivePreviewUrl(nextUrl);

      return () => {
        URL.revokeObjectURL(nextUrl);
      };
    }
  }, [activeZipEntry]);

  const loadPdfScanAsset = async (
    pageNumber: number,
    force = false,
  ): Promise<PdfScanPageAsset> => {
    const cachedAsset = pdfScanPageAssets[pageNumber];
    if (cachedAsset && !force) {
      return cachedAsset;
    }

    let pdfDocument = pdfDocumentRef.current;

    if (!pdfDocument && contentBlob) {
      const bytes = new Uint8Array(await contentBlob.arrayBuffer());
      pdfDocument = await pdfjs.getDocument({ data: bytes }).promise;
      pdfDocumentRef.current = pdfDocument;
      setPdfPageCount(pdfDocument.numPages || 0);
    }

    if (!pdfDocument) {
      throw new Error("PDF ще не готовий до обробки скану");
    }

    const pdfPage = await pdfDocument.getPage(pageNumber);
    const baseViewport = pdfPage.getViewport({ scale: 1 });
    const renderScale = Math.max(
      1,
      PDF_SCAN_RENDER_TARGET_WIDTH / Math.max(1, baseViewport.width),
    );
    const viewport = pdfPage.getViewport({ scale: renderScale });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", {
      alpha: false,
      willReadFrequently: true,
    });

    if (!context) {
      throw new Error("Не вдалося підготувати сторінку PDF до кропу");
    }

    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    await pdfPage.render({ canvasContext: context, viewport }).promise;

    const blob = await canvasToBlob(canvas, "image/jpeg", 0.94);
    const url = URL.createObjectURL(blob);
    const detectedArea = detectDocumentArea(canvas);
    const analysis = analyzeScanPage(canvas);
    const previousUrl = pdfPageAssetUrlsRef.current[pageNumber];

    if (previousUrl) {
      URL.revokeObjectURL(previousUrl);
    }

    const nextAsset = {
      url,
      width: canvas.width,
      height: canvas.height,
    };

    pdfPageAssetUrlsRef.current = {
      ...pdfPageAssetUrlsRef.current,
      [pageNumber]: url,
    };
    setPdfScanPageAssets((current) => ({
      ...current,
      [pageNumber]: nextAsset,
    }));
    setPdfDetectedAreas((current) => ({
      ...current,
      [pageNumber]: detectedArea,
    }));
    setPdfPageAnalyses((current) => ({
      ...current,
      [pageNumber]: analysis,
    }));
    setPdfPageCorners((current) => ({
      ...current,
      [pageNumber]: analysis.suggestedCorners,
    }));
    setPdfPageProcessingStatuses((current) => ({
      ...current,
      [pageNumber]: "analyzed",
    }));

    return nextAsset;
  };

  useEffect(() => {
    if (previewKind !== "pdf" || !pdfScanMode || pdfPageCount === 0) {
      return;
    }

    let cancelled = false;

    const prepareScanPage = async () => {
      try {
        setPdfScanPageLoading(true);
        await loadPdfScanAsset(pdfPageNumber);
      } catch (err: any) {
        if (!cancelled) {
          setPreviewError(
            getErrorMessage(err, "Не вдалося підготувати сторінку для кропу"),
          );
        }
      } finally {
        if (!cancelled) {
          setPdfScanPageLoading(false);
        }
      }
    };

    prepareScanPage();

    return () => {
      cancelled = true;
    };
  }, [pdfPageCount, pdfPageNumber, pdfScanMode, previewKind]);

  useEffect(() => {
    if (!pdfScanMode) {
      return;
    }

    setPdfScanCrop({ x: 0, y: 0 });
    setPdfScanZoom(1);
    setPdfScanCropNonce((current) => current + 1);
  }, [currentPdfScanAsset?.url, pdfPageNumber, pdfScanMode]);

  useEffect(() => {
    if (
      previewKind !== "pdf" ||
      !pdfScanMode ||
      !scanShowProcessedPreview ||
      !currentPdfScanAsset ||
      !currentPdfCropArea
    ) {
      setScanPreviewUrl((currentUrl) => {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl);
        }

        return null;
      });
      return;
    }

    let cancelled = false;

    const preparePreview = async () => {
      try {
        const canvas = await renderProcessedScanCanvas({
          imageSrc: currentPdfScanAsset.url,
          crop: currentPdfCropArea,
          corners:
            (scanManualCornerMode || currentPageUsesManualCorners) &&
            currentPdfCorners
              ? currentPdfCorners
              : undefined,
          rotation: pdfRotations[pdfPageNumber] || 0,
          processingMode: scanProcessingMode,
          pageFormat: scanTargetPageFormat,
        });
        const blob = await canvasToBlob(canvas, "image/jpeg", 0.94);
        const nextUrl = URL.createObjectURL(blob);

        if (cancelled) {
          URL.revokeObjectURL(nextUrl);
          return;
        }

        setScanPreviewUrl((currentUrl) => {
          if (currentUrl) {
            URL.revokeObjectURL(currentUrl);
          }

          return nextUrl;
        });
      } catch {
        if (!cancelled) {
          setScanPreviewUrl((currentUrl) => {
            if (currentUrl) {
              URL.revokeObjectURL(currentUrl);
            }

            return null;
          });
        }
      }
    };

    void preparePreview();

    return () => {
      cancelled = true;
    };
  }, [
    currentPdfCropArea,
    currentPdfCorners,
    currentPdfScanAsset,
    pdfPageNumber,
    pdfRotations,
    pdfScanMode,
    previewKind,
    currentPageUsesManualCorners,
    scanManualCornerMode,
    scanProcessingMode,
    scanShowProcessedPreview,
    scanTargetPageFormat,
  ]);

  const handleDownload = async () => {
    if (!documentItem) {
      return;
    }

    try {
      await documentService.downloadDocument(
        documentItem.id,
        documentItem.originalName,
      );
    } catch (err: any) {
      setError(getErrorMessage(err, "Не вдалося завантажити файл"));
    }
  };

  const handleSaveMetadata = async () => {
    if (!documentItem) {
      return;
    }

    try {
      setMetadataSaving(true);
      setError(null);
      setSuccess(null);

      const updatedDocument = await documentService.updateDocument(
        documentItem.id,
        {
          description: descriptionDraft || undefined,
          accessLevel: accessLevelDraft,
          accessScope: accessScopeDraft,
        },
      );

      setDocumentItem(updatedDocument);
      setDescriptionDraft(updatedDocument.description || "");
      setAccessLevelDraft(updatedDocument.accessLevel);
      setAccessScopeDraft(updatedDocument.accessScope);
      setSuccess("Властивості документа збережено");
    } catch (err: any) {
      setError(
        getErrorMessage(err, "Не вдалося зберегти властивості документа"),
      );
    } finally {
      setMetadataSaving(false);
    }
  };

  const completeRevisionSave = (savedDocument: Document) => {
    setSuccess("Створено нову версію документа");
    navigate(`/documents/${savedDocument.id}`, { replace: true });
  };

  const saveRevisionWithFallback = async (
    file: File,
    overrides: {
      description?: string;
      accessLevel?: AccessLevel;
      accessScope?: DocumentAccessScope;
      sourceKind?: string;
      plainTextContent?: string;
      metadata?: PdfProcessingMetadata;
    },
  ) => {
    if (!documentItem) {
      throw new Error("Документ не знайдено");
    }

    try {
      return await documentService.createRevision(documentItem, file, {
        description: overrides.description,
        accessLevel: overrides.accessLevel,
        accessScope: overrides.accessScope,
        sourceKind: overrides.sourceKind,
        plainTextContent: overrides.plainTextContent,
        metadataJson: overrides.metadata
          ? JSON.stringify(overrides.metadata)
          : undefined,
      });
    } catch (err: any) {
      if (!overrides.metadata) {
        throw err;
      }

      return documentService.createRevision(documentItem, file, {
        description: overrides.description,
        accessLevel: overrides.accessLevel,
        accessScope: overrides.accessScope,
        sourceKind: overrides.sourceKind,
        plainTextContent: overrides.plainTextContent,
      });
    }
  };

  const handleSaveTextRevision = async () => {
    if (!documentItem) {
      return;
    }

    try {
      setRevisionSaving(true);
      setError(null);
      setSuccess(null);

      const file = new File([textContent], documentItem.originalName, {
        type: documentItem.mimeType || guessMimeType(documentItem.originalName),
      });

      const savedDocument = await saveRevisionWithFallback(file, {
        description: descriptionDraft || undefined,
        accessLevel: accessLevelDraft,
        accessScope: accessScopeDraft,
        sourceKind: "viewer_text_revision",
        plainTextContent: textContent,
      });

      completeRevisionSave(savedDocument);
    } catch (err: any) {
      setError(getErrorMessage(err, "Не вдалося створити нову версію"));
    } finally {
      setRevisionSaving(false);
    }
  };

  const handleSaveImageRevision = async () => {
    if (!documentItem || !contentUrl || !croppedAreaPixels) {
      return;
    }

    try {
      setRevisionSaving(true);
      setError(null);
      setSuccess(null);

      const blob = await exportEditedImage(
        contentUrl,
        croppedAreaPixels,
        imageRotation,
        documentItem.mimeType || guessMimeType(documentItem.originalName),
      );

      const file = new File([blob], documentItem.originalName, {
        type: blob.type || documentItem.mimeType || "image/png",
      });

      const savedDocument = await saveRevisionWithFallback(file, {
        description: descriptionDraft || undefined,
        accessLevel: accessLevelDraft,
        accessScope: accessScopeDraft,
        sourceKind: "viewer_image_revision",
      });

      completeRevisionSave(savedDocument);
    } catch (err: any) {
      setError(getErrorMessage(err, "Не вдалося зберегти нову версію"));
    } finally {
      setRevisionSaving(false);
    }
  };

  const handleAutoFrameCurrentPdfPage = async () => {
    try {
      setPreviewError(null);
      const asset = await loadPdfScanAsset(pdfPageNumber, true);
      const nextArea = getSuggestedDocumentArea(
        asset.width,
        asset.height,
        detectDocumentArea(await loadImage(asset.url)),
        currentTargetAspect,
      );

      setPdfPageCropAreas((current) => ({
        ...current,
        [pdfPageNumber]: nextArea,
      }));
      setPdfScanCropNonce((current) => current + 1);
    } catch (err: any) {
      setPreviewError(
        getErrorMessage(err, "Не вдалося повторно визначити межі документа"),
      );
    }
  };

  const handleResetPdfEdits = () => {
    setPdfRotations({});
    setPdfPageCropAreas({});
    setPdfPageCorners({});
    setScanProcessingMode("document");
    setScanTargetPageFormat("auto");
    setScanShowProcessedPreview(false);
    setScanManualCornerMode(false);
    setScanProgress(null);
    setPdfScanCropNonce((current) => current + 1);
  };

  const handleAutoEnhancePdf = () => {
    setPdfScanMode(true);
    setScanEnableOcr(true);
    setScanProcessingMode("document");
    setScanTargetPageFormat(pdfType === "digital" ? "original" : "auto");
    setScanShowProcessedPreview(true);
    setScanManualCornerMode(false);
    setPdfPageCropAreas({});
    setPdfScanCropNonce((current) => current + 1);
  };

  const handleApplyCurrentCropToAllPages = () => {
    if (!currentPdfCropArea || !currentPdfScanAsset || pdfPageCount === 0) {
      return;
    }

    const xRatio = currentPdfCropArea.x / currentPdfScanAsset.width;
    const yRatio = currentPdfCropArea.y / currentPdfScanAsset.height;
    const widthRatio = currentPdfCropArea.width / currentPdfScanAsset.width;
    const heightRatio = currentPdfCropArea.height / currentPdfScanAsset.height;
    const nextAreas: Record<number, Area> = {};

    for (let pageIndex = 1; pageIndex <= pdfPageCount; pageIndex += 1) {
      const pageAsset = pdfScanPageAssets[pageIndex] || currentPdfScanAsset;
      nextAreas[pageIndex] = {
        x: Math.round(pageAsset.width * xRatio),
        y: Math.round(pageAsset.height * yRatio),
        width: Math.round(pageAsset.width * widthRatio),
        height: Math.round(pageAsset.height * heightRatio),
      };
    }

    setPdfPageCropAreas(nextAreas);
    setPdfScanCropNonce((current) => current + 1);
  };

  const handleApplyCurrentCornersToAllPages = () => {
    if (!currentPdfCorners || !currentPdfScanAsset || pdfPageCount === 0) {
      return;
    }

    const nextCorners: Record<
      number,
      [ScanCornerPoint, ScanCornerPoint, ScanCornerPoint, ScanCornerPoint]
    > = {};

    for (let pageIndex = 1; pageIndex <= pdfPageCount; pageIndex += 1) {
      const pageAsset = pdfScanPageAssets[pageIndex] || currentPdfScanAsset;
      nextCorners[pageIndex] = currentPdfCorners.map((corner) => ({
        x: Math.round((corner.x / currentPdfScanAsset.width) * pageAsset.width),
        y: Math.round(
          (corner.y / currentPdfScanAsset.height) * pageAsset.height,
        ),
      })) as [
        ScanCornerPoint,
        ScanCornerPoint,
        ScanCornerPoint,
        ScanCornerPoint,
      ];
    }

    setPdfPageCorners(nextCorners);
  };

  const handleResetCurrentPageCorners = () => {
    if (!currentPdfAnalysis) {
      return;
    }

    setPdfPageCorners((current) => ({
      ...current,
      [pdfPageNumber]: currentPdfAnalysis.suggestedCorners,
    }));
  };

  const handleSavePdfRevision = async () => {
    if (!documentItem || !contentBlob) {
      return;
    }

    try {
      setRevisionSaving(true);
      setError(null);
      setSuccess(null);
      setScanProgress(null);

      const hasManualPageGeometryEdits =
        Object.keys(pdfPageCropAreas).length > 0 ||
        Object.keys(pdfPageCorners).length > 0;
      const hasManualRotationEdits = Object.values(pdfRotations).some(
        (rotation) => ((rotation % 360) + 360) % 360 !== 0,
      );
      const shouldUseServerPipeline =
        pdfScanMode &&
        isServerPrimaryScanPdf &&
        serverProcessingAvailable === true &&
        !hasManualPageGeometryEdits &&
        !hasManualRotationEdits;

      if (shouldUseServerPipeline) {
        setScanProgress("Сервер обробляє PDF...");
        const response = await documentService.processPdfDocument(
          documentItem.id,
          {
            processingMode: scanProcessingMode,
            targetPageFormat: scanTargetPageFormat,
            ocrEnabled: scanEnableOcr,
            ocrLanguage: SCAN_OCR_LANGS,
            useUnpaper: true,
          },
        );

        setProcessingSummary((current) => ({
          job: response.job,
          artifacts: current?.artifacts || [],
        }));
        setActiveServerJobId(response.job.id);

        if (response.resultDocument) {
          completeRevisionSave(response.resultDocument);
          return;
        }

        return;
      }

      if (pdfScanMode) {
        const totalPages =
          pdfPageCount || pdfDocumentRef.current?.numPages || pdfPageNumber;
        const processedCanvases: HTMLCanvasElement[] = [];

        for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
          setScanProgress(`Підготовка сторінки ${pageNumber} з ${totalPages}`);
          const asset = await loadPdfScanAsset(pageNumber);
          const cropArea = getSuggestedDocumentArea(
            asset.width,
            asset.height,
            pdfPageCropAreas[pageNumber] || pdfDetectedAreas[pageNumber],
            getPageFormatAspectRatio(
              scanTargetPageFormat,
              asset.width / asset.height,
            ),
          );
          const pageCorners =
            pdfPageCorners[pageNumber] || buildCornersFromArea(cropArea);
          const useManualCorners =
            pdfPageProcessingStatuses[pageNumber] === "corrected";

          processedCanvases.push(
            await renderProcessedScanCanvas({
              imageSrc: asset.url,
              crop: cropArea,
              corners: useManualCorners ? pageCorners : undefined,
              rotation: pdfRotations[pageNumber] || 0,
              processingMode: scanProcessingMode,
              pageFormat: scanTargetPageFormat,
            }),
          );
          setPdfPageProcessingStatuses((current) => ({
            ...current,
            [pageNumber]: useManualCorners ? "corrected" : "enhanced",
          }));
        }

        let pdfBytes: Uint8Array;
        let recognizedText = "";
        let sourceKind = "viewer_pdf_scan_revision";
        const ocrConfidenceMap: Record<number, number> = {};
        const ocrTextPerPage: Record<number, string> = {};

        if (scanEnableOcr) {
          setScanProgress("Запускаємо OCR...");
          const tesseractModule = await import("tesseract.js");
          const tesseractApi = (
            "createWorker" in tesseractModule
              ? tesseractModule
              : (tesseractModule as { default?: typeof tesseractModule })
                  .default
          ) as typeof tesseractModule;
          const worker = await tesseractApi.createWorker(SCAN_OCR_LANGS, 1, {
            logger: ({ progress, status }) => {
              const percent = Math.max(
                0,
                Math.min(100, Math.round(progress * 100)),
              );
              setScanProgress(`${status} ${percent}%`);
            },
          });

          try {
            await worker.setParameters({
              preserve_interword_spaces: "1",
              tessedit_pageseg_mode: tesseractApi.PSM.AUTO,
            });

            const ocrPagePdfs: Uint8Array[] = [];
            const pageTexts: string[] = [];
            for (
              let pageIndex = 0;
              pageIndex < processedCanvases.length;
              pageIndex += 1
            ) {
              setScanProgress(
                `OCR сторінка ${pageIndex + 1} з ${processedCanvases.length}`,
              );
              const result = await worker.recognize(
                processedCanvases[pageIndex],
                { pdfTitle: documentItem.originalName },
                { text: true, pdf: true },
              );
              const pagePdf = result.data.pdf
                ? Uint8Array.from(result.data.pdf)
                : null;

              if (pagePdf && pagePdf.length > 0) {
                ocrPagePdfs.push(pagePdf);
              }

              if (result.data.text?.trim()) {
                const normalizedText = result.data.text.trim();
                pageTexts.push(normalizedText);
                ocrTextPerPage[pageIndex + 1] = normalizedText;
              }

              ocrConfidenceMap[pageIndex + 1] = Number(
                (result.data.confidence || 0).toFixed(2),
              );
              setPdfPageProcessingStatuses((current) => ({
                ...current,
                [pageIndex + 1]: "ocr_done",
              }));
            }
            setPageOcrConfidence(ocrConfidenceMap);

            pdfBytes =
              ocrPagePdfs.length === processedCanvases.length
                ? await mergeOcrPagePdfs(ocrPagePdfs)
                : await buildPdfFromProcessedCanvases(processedCanvases);
            recognizedText = pageTexts.join("\n\n");
            sourceKind = "viewer_pdf_scan_ocr_revision";
          } finally {
            await worker.terminate();
          }
        } else {
          pdfBytes = await buildPdfFromProcessedCanvases(processedCanvases);
        }

        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const file = new File([blob], documentItem.originalName, {
          type: "application/pdf",
        });

        const savedDocument = await saveRevisionWithFallback(file, {
          description: descriptionDraft || undefined,
          accessLevel: accessLevelDraft,
          accessScope: accessScopeDraft,
          sourceKind,
          plainTextContent: recognizedText || undefined,
          metadata: {
            processingPipeline: "viewer_pdf_postprocessing",
            pdfType,
            processingMode: scanProcessingMode,
            targetPageFormat: scanTargetPageFormat,
            ocrEnabled: scanEnableOcr,
            pageCount: processedCanvases.length,
            pageAnalyses: Object.fromEntries(
              Object.entries(pdfPageAnalyses).map(([pageKey, analysis]) => [
                pageKey,
                {
                  suggestedArea: analysis.suggestedArea,
                  correctedCorners:
                    pdfPageCorners[Number(pageKey)] ||
                    buildCornersFromArea(analysis.suggestedArea),
                  fillRatio: Number(analysis.fillRatio.toFixed(4)),
                  averageBrightness: Number(
                    analysis.averageBrightness.toFixed(2),
                  ),
                  borderBrightness: Number(
                    analysis.borderBrightness.toFixed(2),
                  ),
                  contrastScore: Number(analysis.contrastScore.toFixed(2)),
                  hasDarkBorders: analysis.hasDarkBorders,
                  hasShadowBias: analysis.hasShadowBias,
                  orientation: analysis.orientation,
                  needsEnhancement: analysis.needsEnhancement,
                  skewAngle: Number(analysis.skewAngle.toFixed(2)),
                  possiblePerspective: analysis.possiblePerspective,
                  rotationAngle: pdfRotations[Number(pageKey)] || 0,
                  pageProcessingStatus:
                    pdfPageProcessingStatuses[Number(pageKey)] || "pending",
                  ocrApplied: scanEnableOcr,
                  ocrText: ocrTextPerPage[Number(pageKey)] || null,
                  ocrConfidence:
                    ocrConfidenceMap[Number(pageKey)] ||
                    pageOcrConfidence[Number(pageKey)] ||
                    null,
                },
              ]),
            ),
          },
        });

        setScanProgress(null);
        completeRevisionSave(savedDocument);
        return;
      }

      const [arrayBuffer, pdfLib] = await Promise.all([
        contentBlob.arrayBuffer(),
        import("pdf-lib"),
      ]);
      const pdfDocument = await pdfLib.PDFDocument.load(arrayBuffer);

      Object.entries(pdfRotations).forEach(([pageKey, rotation]) => {
        const normalizedRotation = ((rotation % 360) + 360) % 360;
        if (normalizedRotation === 0) {
          return;
        }

        const pageIndex = Number(pageKey) - 1;
        const page = pdfDocument.getPage(pageIndex);
        const currentRotation = page.getRotation().angle;
        page.setRotation(
          pdfLib.degrees((currentRotation + normalizedRotation) % 360),
        );
      });

      const bytes = await pdfDocument.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      const file = new File([blob], documentItem.originalName, {
        type: "application/pdf",
      });

      const savedDocument = await saveRevisionWithFallback(file, {
        description: descriptionDraft || undefined,
        accessLevel: accessLevelDraft,
        accessScope: accessScopeDraft,
        sourceKind: "viewer_pdf_revision",
      });

      completeRevisionSave(savedDocument);
    } catch (err: any) {
      setError(getErrorMessage(err, "Не вдалося зберегти нову PDF-версію"));
    } finally {
      setScanProgress(null);
      setRevisionSaving(false);
    }
  };

  const handleArchiveEntryDownload = () => {
    if (!activeZipEntry) {
      return;
    }

    const entryBlob = new Blob([activeZipEntry.data], {
      type: guessMimeType(activeZipEntry.path),
    });
    const url = URL.createObjectURL(entryBlob);
    const link = document.createElement("a");

    link.href = url;
    link.download = buildDownloadName(activeZipEntry.path);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const previewActions = (() => {
    if (!documentItem) {
      return null;
    }

    if (previewKind === "text") {
      return (
        <>
          <button
            className="btn btn-primary"
            onClick={handleSaveTextRevision}
            disabled={revisionSaving || !textDirty}
          >
            <Save size={16} />
            {revisionSaving ? "Збереження..." : "Зберегти нову версію"}
          </button>
        </>
      );
    }

    if (previewKind === "image") {
      return (
        <>
          <button
            className="btn btn-secondary"
            onClick={() =>
              setImageZoom((current) => Math.max(1, current - 0.1))
            }
            disabled={contentLoading}
          >
            <ZoomOut size={16} />
            Масштаб-
          </button>
          <button
            className="btn btn-secondary"
            onClick={() =>
              setImageZoom((current) => Math.min(3, current + 0.1))
            }
            disabled={contentLoading}
          >
            <ZoomIn size={16} />
            Масштаб+
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setImageRotation((current) => current - 90)}
            disabled={contentLoading}
          >
            <RotateCcw size={16} />
            Ліворуч
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setImageRotation((current) => current + 90)}
            disabled={contentLoading}
          >
            <RotateCw size={16} />
            Праворуч
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setImageCrop({ x: 0, y: 0 });
              setImageZoom(1);
              setImageRotation(0);
            }}
            disabled={contentLoading || !imageDirty}
          >
            Скинути
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSaveImageRevision}
            disabled={revisionSaving || !imageDirty || !croppedAreaPixels}
          >
            <Save size={16} />
            {revisionSaving ? "Збереження..." : "Зберегти нову версію"}
          </button>
        </>
      );
    }

    if (previewKind === "pdf") {
      return (
        <>
          <div className="document-viewer-toolbar-strip">
            <ToolbarIconButton
              tone="primary"
              label="Покращити документ"
              onClick={handleAutoEnhancePdf}
              disabled={pdfPageCount === 0}
            >
              <Sparkles size={16} />
            </ToolbarIconButton>
            <ToolbarIconButton
              label="Попередня сторінка"
              onClick={() =>
                setPdfPageNumber((current) => Math.max(1, current - 1))
              }
              disabled={pdfPageNumber <= 1}
            >
              <ArrowLeft size={16} />
            </ToolbarIconButton>
            <ToolbarIconButton
              label="Наступна сторінка"
              onClick={() =>
                setPdfPageNumber((current) =>
                  Math.min(pdfPageCount || current, current + 1),
                )
              }
              disabled={pdfPageCount === 0 || pdfPageNumber >= pdfPageCount}
            >
              <ArrowRight size={16} />
            </ToolbarIconButton>
            <ToolbarIconButton
              label="Повернути ліворуч"
              onClick={() =>
                setPdfRotations((current) => ({
                  ...current,
                  [pdfPageNumber]: (current[pdfPageNumber] || 0) - 90,
                }))
              }
              disabled={pdfPageCount === 0}
            >
              <RotateCcw size={16} />
            </ToolbarIconButton>
            <ToolbarIconButton
              label="Повернути праворуч"
              onClick={() =>
                setPdfRotations((current) => ({
                  ...current,
                  [pdfPageNumber]: (current[pdfPageNumber] || 0) + 90,
                }))
              }
              disabled={pdfPageCount === 0}
            >
              <RotateCw size={16} />
            </ToolbarIconButton>
            <ToolbarIconButton
              active={pdfScanMode}
              label={
                pdfScanMode
                  ? "Режим обробки скану увімкнено"
                  : "Увімкнути режим обробки скану"
              }
              onClick={() => setPdfScanMode((current) => !current)}
              disabled={pdfPageCount === 0}
            >
              <ScanLine size={16} />
            </ToolbarIconButton>
            {pdfScanMode && (
              <ToolbarIconButton
                label="Автоматично знайти межі сторінки"
                onClick={handleAutoFrameCurrentPdfPage}
                disabled={pdfPageCount === 0 || pdfScanPageLoading}
              >
                <Frame size={16} />
              </ToolbarIconButton>
            )}
            {pdfScanMode && (
              <ToolbarIconButton
                active={scanShowProcessedPreview}
                label={
                  scanShowProcessedPreview
                    ? "Показати оригінал"
                    : "Показати результат обробки"
                }
                onClick={() =>
                  setScanShowProcessedPreview((current) => !current)
                }
                disabled={pdfPageCount === 0}
              >
                <SplitSquareVertical size={16} />
              </ToolbarIconButton>
            )}
            {pdfScanMode && (
              <ToolbarIconButton
                label="Застосувати обрізку до всіх сторінок"
                onClick={handleApplyCurrentCropToAllPages}
                disabled={pdfPageCount <= 1 || !currentPdfCropArea}
              >
                <Crop size={16} />
              </ToolbarIconButton>
            )}
            {pdfScanMode && (
              <ToolbarIconButton
                active={scanManualCornerMode}
                label={
                  scanManualCornerMode
                    ? "Режим редагування кутів увімкнено"
                    : "Редагувати кути сторінки"
                }
                onClick={() => setScanManualCornerMode((current) => !current)}
                disabled={!currentPdfCorners}
              >
                <Settings2 size={16} />
              </ToolbarIconButton>
            )}
            {pdfScanMode && scanManualCornerMode && (
              <ToolbarIconButton
                label="Скинути кути до автоаналізу"
                onClick={handleResetCurrentPageCorners}
                disabled={!currentPdfAnalysis}
              >
                <RotateCcw size={16} />
              </ToolbarIconButton>
            )}
            {pdfScanMode && scanManualCornerMode && (
              <ToolbarIconButton
                label="Застосувати кути до всіх сторінок"
                onClick={handleApplyCurrentCornersToAllPages}
                disabled={pdfPageCount <= 1 || !currentPdfCorners}
              >
                <Crop size={16} />
              </ToolbarIconButton>
            )}
            {pdfScanMode && (
              <select
                className="document-viewer-toolbar-select"
                title="Режим візуальної обробки"
                value={scanProcessingMode}
                onChange={(event) =>
                  setScanProcessingMode(
                    event.target.value as ScanProcessingMode,
                  )
                }
              >
                {Object.entries(PROCESSING_MODE_LABELS).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            )}
            {pdfScanMode && (
              <select
                className="document-viewer-toolbar-select"
                title="Формат вихідної сторінки"
                value={scanTargetPageFormat}
                onChange={(event) =>
                  setScanTargetPageFormat(
                    event.target.value as ScanTargetPageFormat,
                  )
                }
              >
                {Object.entries(PAGE_FORMAT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            )}
            {pdfScanMode && (
              <label
                className="document-viewer-toolbar-check"
                title="Увімкнути або вимкнути OCR"
              >
                <input
                  type="checkbox"
                  checked={scanEnableOcr}
                  onChange={(event) => setScanEnableOcr(event.target.checked)}
                />
                <span>OCR</span>
              </label>
            )}
            <ToolbarIconButton
              label="Скинути всі зміни"
              onClick={handleResetPdfEdits}
              disabled={!pdfDirty}
            >
              <RotateCcw size={16} />
            </ToolbarIconButton>
            <button
              className="btn btn-primary document-viewer-toolbar-save is-compact"
              onClick={handleSavePdfRevision}
              disabled={revisionSaving || !pdfDirty}
              title={
                pdfScanMode && scanEnableOcr
                  ? "Зберегти нову версію документа з OCR"
                  : "Зберегти нову версію документа"
              }
            >
              <Save size={15} />
              {revisionSaving
                ? "Збереження..."
                : pdfScanMode && scanEnableOcr
                  ? "Зберегти з OCR"
                  : "Зберегти"}
            </button>
          </div>
        </>
      );
    }

    if (previewKind === "zip") {
      return (
        <button
          className="btn btn-secondary"
          onClick={handleArchiveEntryDownload}
          disabled={!activeZipEntry}
        >
          <Download size={16} />
          Завантажити вкладений файл
        </button>
      );
    }

    return (
      <span className="document-viewer-readonly-tag">
        <Eye size={16} />
        Лише перегляд
      </span>
    );
  })();

  const renderPreview = () => {
    if (contentLoading) {
      return (
        <div className="document-viewer-loading">
          <Spinner size="large" />
        </div>
      );
    }

    if (previewError) {
      return (
        <div className="document-viewer-empty">
          <Alert type="error" message={previewError} />
        </div>
      );
    }

    if (previewKind === "image" && contentUrl) {
      return (
        <div className="document-viewer-image-stage" ref={previewHostRef}>
          <Cropper
            image={contentUrl}
            crop={imageCrop}
            zoom={imageZoom}
            rotation={imageRotation}
            aspect={imageAspect}
            showGrid
            objectFit="contain"
            onCropChange={setImageCrop}
            onZoomChange={setImageZoom}
            onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
          />
        </div>
      );
    }

    if (previewKind === "pdf" && contentBlob) {
      if (pdfScanMode) {
        return (
          <div
            className="document-viewer-pdf-stage document-viewer-scan-stage"
            ref={previewHostRef}
          >
            {pdfScanPageLoading ||
            !currentPdfScanAsset ||
            !currentPdfCropArea ? (
              <div className="document-viewer-loading">
                <Spinner size="large" />
              </div>
            ) : (
              <>
                <div className="document-viewer-scan-hint">
                  {pdfType === "digital"
                    ? "PDF схожий на цифровий: геометрію краще не ламати, тому за замовчуванням підійде Original size або легка обробка."
                    : isScanLikePdf
                      ? "Авторамка знайшла межі аркуша. За потреби підкоригуйте кроп, виберіть режим обробки та перегляньте результат до збереження."
                      : "Цей режим призначений для сканів і фото-PDF: автообрізка, вирівнювання полів, нормалізація формату сторінки та OCR."}
                </div>
                <div className="document-viewer-scan-analysis">
                  <span>Тип PDF: {pdfType}</span>
                  <span>
                    Орієнтація: {currentPdfAnalysis?.orientation || "unknown"}
                  </span>
                  <span>OCR: {scanEnableOcr ? "увімкнено" : "вимкнено"}</span>
                  <span>
                    Поля:{" "}
                    {currentPdfAnalysis?.hasDarkBorders
                      ? "потрібна обрізка"
                      : "стабільні"}
                  </span>
                  <span>
                    Фон:{" "}
                    {currentPdfAnalysis?.hasShadowBias
                      ? "є тіні/нерівномірність"
                      : "рівний"}
                  </span>
                  {isServerPrimaryScanPdf && (
                    <span>
                      Сервер:{" "}
                      {serverProcessingAvailable === null
                        ? "перевірка"
                        : serverProcessingAvailable
                          ? "pipeline готовий"
                          : "fallback у браузері"}
                    </span>
                  )}
                </div>
                <div className="document-viewer-scan-cropper">
                  {scanShowProcessedPreview && scanPreviewUrl ? (
                    <div className="document-viewer-scan-compare">
                      <div className="document-viewer-scan-compare-pane">
                        <span>До</span>
                        <img
                          className="document-viewer-scan-preview-image"
                          src={currentPdfScanAsset.url}
                          alt={`Оригінальна сторінка ${pdfPageNumber}`}
                        />
                      </div>
                      <div className="document-viewer-scan-compare-pane">
                        <span>Після</span>
                        <img
                          className="document-viewer-scan-preview-image"
                          src={scanPreviewUrl}
                          alt={`Оброблена сторінка ${pdfPageNumber}`}
                        />
                      </div>
                    </div>
                  ) : scanManualCornerMode && currentPdfCorners ? (
                    <ManualCornerEditor
                      imageUrl={currentPdfScanAsset.url}
                      width={currentPdfScanAsset.width}
                      height={currentPdfScanAsset.height}
                      corners={currentPdfCorners}
                      onChange={(corners) => {
                        setPdfPageCorners((current) => ({
                          ...current,
                          [pdfPageNumber]: corners,
                        }));
                        setPdfPageProcessingStatuses((current) => ({
                          ...current,
                          [pdfPageNumber]: "corrected",
                        }));
                        setPdfPageCropAreas((current) => ({
                          ...current,
                          [pdfPageNumber]: getBoundingAreaFromCorners(
                            corners,
                            currentPdfScanAsset.width,
                            currentPdfScanAsset.height,
                          ),
                        }));
                      }}
                    />
                  ) : (
                    <Cropper
                      key={`pdf-scan-${pdfPageNumber}-${pdfScanCropNonce}-${scanTargetPageFormat}`}
                      image={currentPdfScanAsset.url}
                      crop={pdfScanCrop}
                      zoom={pdfScanZoom}
                      rotation={pdfRotations[pdfPageNumber] || 0}
                      aspect={
                        currentTargetAspect ||
                        currentPdfScanAsset.width / currentPdfScanAsset.height
                      }
                      showGrid
                      objectFit="contain"
                      initialCroppedAreaPixels={currentPdfCropArea}
                      onCropChange={setPdfScanCrop}
                      onZoomChange={setPdfScanZoom}
                      onCropComplete={(_, pixels) => {
                        setPdfPageCropAreas((current) => ({
                          ...current,
                          [pdfPageNumber]: pixels,
                        }));
                        setPdfPageCorners((current) => ({
                          ...current,
                          [pdfPageNumber]: buildCornersFromArea(pixels),
                        }));
                        setPdfPageProcessingStatuses((current) => ({
                          ...current,
                          [pdfPageNumber]: "cropped",
                        }));
                      }}
                    />
                  )}
                </div>
                <div className="document-viewer-pdf-caption">
                  Сторінка {pdfPageNumber} з {pdfPageCount || 1}
                </div>
              </>
            )}
          </div>
        );
      }

      return (
        <div className="document-viewer-pdf-stage" ref={previewHostRef}>
          <PdfDocument
            file={contentBlob}
            loading={<Spinner size="large" />}
            onLoadSuccess={({ numPages }) => {
              setPdfPageCount(numPages);
              setPdfPageNumber((current) => Math.min(current, numPages));
            }}
            onLoadError={() =>
              setPreviewError("Не вдалося відобразити PDF-документ")
            }
          >
            <Page
              pageNumber={pdfPageNumber}
              rotate={pdfRotations[pdfPageNumber] || 0}
              width={Math.min(previewWidth, 980)}
            />
          </PdfDocument>
          <div className="document-viewer-pdf-caption">
            Сторінка {pdfPageNumber} з {pdfPageCount || 1}
          </div>
        </div>
      );
    }

    if (previewKind === "text") {
      return (
        <div className="document-viewer-text-stage">
          <textarea
            className="document-viewer-textarea"
            value={textContent}
            onChange={(event) => setTextContent(event.target.value)}
            spellCheck={false}
          />
        </div>
      );
    }

    if (previewKind === "docx") {
      return (
        <div className="document-viewer-docx-stage">
          <div ref={docxContainerRef} className="document-viewer-docx-host" />
        </div>
      );
    }

    if (previewKind === "zip") {
      return (
        <div className="document-viewer-archive-stage">
          <aside className="document-viewer-archive-list">
            {zipEntries.length === 0 ? (
              <div className="document-viewer-empty">
                <FileArchive size={32} />
                <p>В архіві не знайдено файлів для попереднього перегляду.</p>
              </div>
            ) : (
              zipEntries.map((entry) => (
                <button
                  key={entry.path}
                  className={`document-viewer-archive-entry ${
                    entry.path === selectedZipEntryPath ? "is-active" : ""
                  }`}
                  onClick={() => setSelectedZipEntryPath(entry.path)}
                >
                  <strong>{buildDownloadName(entry.path)}</strong>
                  <span>{formatFileSize(entry.size)}</span>
                  <span>{entry.path}</span>
                </button>
              ))
            )}
          </aside>
          <div className="document-viewer-archive-preview">
            {!activeZipEntry ? (
              <div className="document-viewer-empty">
                <FileText size={32} />
                <p>Оберіть файл в архіві для перегляду.</p>
              </div>
            ) : activeZipEntry.previewKind === "text" ? (
              <pre className="document-viewer-archive-text">
                {archiveTextPreview}
              </pre>
            ) : activeZipEntry.previewKind === "image" && archivePreviewUrl ? (
              <img
                className="document-viewer-archive-image"
                src={archivePreviewUrl}
                alt={buildDownloadName(activeZipEntry.path)}
              />
            ) : activeZipEntry.previewKind === "pdf" && archivePreviewUrl ? (
              <iframe
                className="document-viewer-archive-frame"
                src={archivePreviewUrl}
                title={buildDownloadName(activeZipEntry.path)}
              />
            ) : (
              <div className="document-viewer-empty">
                <p>Для цього вкладеного файлу доступне лише завантаження.</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="document-viewer-empty">
        <FileText size={42} />
        <h3>Попередній перегляд недоступний</h3>
        <p>Цей тип файлу поки що відкривається лише через завантаження.</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spinner size="large" />
      </div>
    );
  }

  if (!documentItem) {
    return (
      <div className="document-viewer-page">
        <Alert type="error" message={error || "Документ не знайдено"} />
      </div>
    );
  }

  return (
    <div className="document-viewer-page">
      <Breadcrumbs items={viewerBreadcrumbs} />

      <PageHeader
        className="document-viewer-header"
        title={documentItem.originalName}
        subtitle={`Версія ${documentItem.version} • ${formatFileSize(
          documentItem.fileSize,
        )} • ${documentItem.mimeType || guessMimeType(documentItem.originalName)}`}
        actions={
          <div className="document-viewer-header-actions">
            <button
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
              type="button"
            >
              <ArrowLeft size={16} />
              Назад
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleDownload}
              type="button"
            >
              <Download size={16} />
              Завантажити
            </button>
          </div>
        }
      />

      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}
      {success && (
        <Alert
          type="success"
          message={success}
          onClose={() => setSuccess(null)}
        />
      )}

      <section className="content-surface document-viewer-layout">
        <div className="document-viewer-main">
          <div className="document-viewer-toolbar">{previewActions}</div>
          {scanProgress && (
            <div className="document-viewer-progress" role="status">
              {scanProgress}
            </div>
          )}
          <div className="document-viewer-preview">{renderPreview()}</div>
        </div>

        <aside className="document-viewer-sidebar">
          <section className="document-viewer-panel">
            <h3>Властивості документа</h3>
            <label className="document-viewer-field">
              <span>Опис</span>
              <textarea
                value={descriptionDraft}
                onChange={(event) => setDescriptionDraft(event.target.value)}
                rows={4}
              />
            </label>

            <label className="document-viewer-field">
              <span>Рівень доступу</span>
              <select
                value={accessLevelDraft}
                onChange={(event) =>
                  setAccessLevelDraft(event.target.value as AccessLevel)
                }
              >
                {Object.entries(ACCESS_LEVEL_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="document-viewer-field">
              <span>Область доступу</span>
              <select
                value={accessScopeDraft}
                onChange={(event) =>
                  setAccessScopeDraft(event.target.value as DocumentAccessScope)
                }
              >
                {Object.entries(ACCESS_SCOPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <button
              className="btn btn-primary document-viewer-sidebar-action"
              onClick={handleSaveMetadata}
              disabled={metadataSaving || !metadataDirty}
              type="button"
            >
              <Save size={16} />
              {metadataSaving ? "Збереження..." : "Зберегти властивості"}
            </button>
          </section>

          {previewKind === "pdf" && pdfScanMode && (
            <section className="document-viewer-panel">
              <h3>Постобробка PDF</h3>
              <dl className="document-viewer-meta">
                <div>
                  <dt>Тип PDF</dt>
                  <dd>{pdfType}</dd>
                </div>
                <div>
                  <dt>Режим</dt>
                  <dd>{PROCESSING_MODE_LABELS[scanProcessingMode]}</dd>
                </div>
                <div>
                  <dt>Формат сторінки</dt>
                  <dd>{PAGE_FORMAT_LABELS[scanTargetPageFormat]}</dd>
                </div>
                <div>
                  <dt>OCR</dt>
                  <dd>{scanEnableOcr ? "Увімкнено" : "Вимкнено"}</dd>
                </div>
                <div>
                  <dt>Статус сторінки</dt>
                  <dd>
                    {
                      PAGE_PROCESSING_STATUS_LABELS[
                        pdfPageProcessingStatuses[pdfPageNumber] || "pending"
                      ]
                    }
                  </dd>
                </div>
                <div>
                  <dt>Яскравість сторінки</dt>
                  <dd>
                    {currentPdfAnalysis
                      ? `${Math.round(currentPdfAnalysis.averageBrightness)} / 255`
                      : "Ще аналізується"}
                  </dd>
                </div>
                <div>
                  <dt>Стан фону</dt>
                  <dd>
                    {currentPdfAnalysis?.hasShadowBias
                      ? "Тіні або нерівний фон"
                      : "Фон рівний"}
                  </dd>
                </div>
                <div>
                  <dt>Кут вирівнювання</dt>
                  <dd>
                    {currentPdfAnalysis
                      ? `${currentPdfAnalysis.skewAngle.toFixed(1)}°`
                      : "Ще аналізується"}
                  </dd>
                </div>
                <div>
                  <dt>Перспектива</dt>
                  <dd>
                    {currentPdfAnalysis?.possiblePerspective
                      ? "Ймовірна деформація"
                      : "Сильна деформація не виявлена"}
                  </dd>
                </div>
                <div>
                  <dt>Якість OCR</dt>
                  <dd>
                    {pageOcrConfidence[pdfPageNumber] !== undefined
                      ? `${pageOcrConfidence[pdfPageNumber].toFixed(1)}%`
                      : "Ще не виконано"}
                  </dd>
                </div>
              </dl>
            </section>
          )}

          {processingSummary?.job && (
            <section className="document-viewer-panel">
              <h3>Серверна обробка</h3>
              <dl className="document-viewer-meta">
                <div>
                  <dt>Статус документа</dt>
                  <dd>
                    {SERVER_PROCESSING_STATUS_LABELS[
                      processingSummary.job.status
                    ] || processingSummary.job.status}
                  </dd>
                </div>
                <div>
                  <dt>Сторінок</dt>
                  <dd>
                    {processingSummary.job.processedPageCount}/
                    {processingSummary.job.pageCount}
                  </dd>
                </div>
                <div>
                  <dt>Runtime сервера</dt>
                  <dd>
                    {serverProcessingAvailable === null
                      ? "Перевіряється"
                      : serverProcessingAvailable
                        ? "Готовий"
                        : "Неповний, працює browser fallback"}
                  </dd>
                </div>
                <div>
                  <dt>OCR мова</dt>
                  <dd>{processingSummary.job.ocrLanguage || "Не задано"}</dd>
                </div>
                <div>
                  <dt>Режим</dt>
                  <dd>{processingSummary.job.processingMode || "Auto"}</dd>
                </div>
                <div>
                  <dt>Формат</dt>
                  <dd>{processingSummary.job.targetPageFormat || "Auto"}</dd>
                </div>
                <div>
                  <dt>Артефакти</dt>
                  <dd>{processingSummary.artifacts.length}</dd>
                </div>
                {serverProcessingRuntime && (
                  <div>
                    <dt>Залежності</dt>
                    <dd>
                      {[
                        serverProcessingRuntime.pdftoppm && "pdftoppm",
                        serverProcessingRuntime.cv2 && "OpenCV",
                        serverProcessingRuntime.pillow && "Pillow",
                        serverProcessingRuntime.ocrmypdf && "OCRmyPDF",
                        serverProcessingRuntime.tesseract && "Tesseract",
                        serverProcessingRuntime.unpaper && "unpaper",
                      ]
                        .filter(Boolean)
                        .join(", ") || "Недоступні"}
                    </dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          {previewKind === "pdf" && pdfPageCount > 0 && (
            <section className="document-viewer-panel">
              <h3>Сторінки PDF</h3>
              <div className="document-viewer-page-list">
                {Array.from(
                  { length: pdfPageCount },
                  (_, index) => index + 1,
                ).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    className={`document-viewer-page-thumb ${
                      pageNumber === pdfPageNumber ? "is-active" : ""
                    }`}
                    onClick={() => setPdfPageNumber(pageNumber)}
                  >
                    <div className="document-viewer-page-thumb-preview">
                      <PdfDocument file={contentBlob}>
                        <Page
                          pageNumber={pageNumber}
                          width={120}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                        />
                      </PdfDocument>
                    </div>
                    <div className="document-viewer-page-thumb-meta">
                      <strong>Сторінка {pageNumber}</strong>
                      <span>
                        {pdfPageAnalyses[pageNumber]?.needsEnhancement
                          ? "потрібна обробка"
                          : "стабільна"}
                      </span>
                      <span>
                        {
                          PAGE_PROCESSING_STATUS_LABELS[
                            pdfPageProcessingStatuses[pageNumber] || "pending"
                          ]
                        }
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="document-viewer-panel">
            <h3>Деталі</h3>
            <dl className="document-viewer-meta">
              <div>
                <dt>Статус</dt>
                <dd>{documentItem.status}</dd>
              </div>
              <div>
                <dt>Антивірус</dt>
                <dd>{documentItem.malwareScanStatus || "pending"}</dd>
              </div>
              <div>
                <dt>Створено</dt>
                <dd>
                  {new Date(documentItem.createdAt).toLocaleString("uk-UA")}
                </dd>
              </div>
              <div>
                <dt>Оновлено</dt>
                <dd>
                  {new Date(documentItem.updatedAt).toLocaleString("uk-UA")}
                </dd>
              </div>
              <div>
                <dt>Формат</dt>
                <dd>{previewKind}</dd>
              </div>
              <div>
                <dt>Попередня версія</dt>
                <dd>
                  {documentItem.parentDocumentId ? (
                    <Link to={`/documents/${documentItem.parentDocumentId}`}>
                      Відкрити
                    </Link>
                  ) : (
                    "Немає"
                  )}
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </section>
    </div>
  );
};

export default DocumentViewerPage;
