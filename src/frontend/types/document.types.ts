/**
 * Document Types
 */
export interface Document {
  id: string;
  tenantId: string;
  caseId?: string;
  clientId?: string;
  fileName: string;
  originalName: string;
  type: DocumentType;
  mimeType?: string;
  fileSize?: number;
  description?: string;
  status: DocumentStatus;
  malwareScanStatus?: MalwareScanStatus;
  malwareScannedAt?: string | null;
  malwareScanError?: string | null;
  storagePath?: string;
  cdnUrl?: string;
  signedUrl?: string;
  signatureHash?: string;
  signatureAlgorithm?: string;
  signedAt?: string;
  signedBy?: string;
  signedByUser?: any;
  uploadedBy: string;
  uploadedByUser?: any;
  uploadedAt: string;
  uploadIp?: string;
  version: number;
  parentDocumentId?: string;
  accessLevel: AccessLevel;
  accessScope: DocumentAccessScope;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type DocumentType =
  | "contract"
  | "agreement"
  | "court_order"
  | "evidence"
  | "invoice"
  | "other";

export type DocumentStatus =
  | "draft"
  | "uploading"
  | "signed"
  | "rejected"
  | "archived";

export type AccessLevel = "public" | "internal" | "confidential";
export type DocumentAccessScope = "private" | "assigned" | "tenant";
export type MalwareScanStatus = "pending" | "clean" | "infected" | "failed";

export interface UploadDocumentDto {
  caseId?: string;
  clientId?: string;
  type: DocumentType;
  description?: string;
  accessLevel?: AccessLevel;
  accessScope?: DocumentAccessScope;
  parentDocumentId?: string;
  eventId?: string;
  calculationId?: string;
  sourceKind?: string;
  sourceTemplateId?: string;
  plainTextContent?: string;
  metadataJson?: string;
}

export interface UpdateDocumentDto {
  description?: string;
  status?: DocumentStatus;
  accessLevel?: AccessLevel;
  accessScope?: DocumentAccessScope;
}

export interface DocumentFilters {
  caseId?: string;
  clientId?: string;
  type?: DocumentType;
  status?: DocumentStatus;
  accessLevel?: AccessLevel;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface DocumentListResponse {
  data: Document[];
  total: number;
  page: number;
  limit: number;
}

export interface DocumentStatistics {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  totalSize: number;
}

export type DocumentProcessingStatus =
  | "uploaded"
  | "analyzing"
  | "preprocessing"
  | "geometry_corrected"
  | "enhanced"
  | "pdf_assembled"
  | "ocr_processing"
  | "completed"
  | "failed";

export type PageProcessingStatus =
  | "pending"
  | "analyzed"
  | "cropped"
  | "corrected"
  | "enhanced"
  | "ocr_done"
  | "failed";

export type DocumentProcessingArtifactKind =
  | "original_pdf"
  | "processed_pdf"
  | "searchable_pdf"
  | "page_preview"
  | "original_page_image"
  | "processed_page_image"
  | "ocr_text_per_page"
  | "full_ocr_text"
  | "processing_metadata";

export interface DocumentProcessingJobSummary {
  id: string;
  tenantId: string;
  documentId: string;
  sourceDocumentId?: string | null;
  status: DocumentProcessingStatus;
  ocrEnabled: boolean;
  ocrLanguage?: string | null;
  processingMode?: string | null;
  targetPageFormat?: string | null;
  pageCount: number;
  processedPageCount: number;
  metadata?: Record<string, any> | null;
  lastError?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentProcessingArtifactSummary {
  id: string;
  tenantId: string;
  documentId: string;
  processingJobId: string;
  artifactKind: DocumentProcessingArtifactKind;
  pageNumber?: number | null;
  storagePath?: string | null;
  mimeType?: string | null;
  textContent?: string | null;
  ocrConfidence?: number | null;
  pageStatus?: PageProcessingStatus | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentProcessingSummary {
  job: DocumentProcessingJobSummary | null;
  artifacts: DocumentProcessingArtifactSummary[];
}

export interface ProcessPdfDocumentDto {
  processingMode?: string;
  targetPageFormat?: string;
  ocrEnabled?: boolean;
  ocrLanguage?: string;
  useUnpaper?: boolean;
}

export interface DocumentProcessingRuntimeCapabilities {
  python3: boolean;
  pdftoppm: boolean;
  ocrmypdf: boolean;
  unpaper: boolean;
  tesseract: boolean;
  pipelineScript: boolean;
  cv2: boolean;
  pillow: boolean;
  ready: boolean;
}

export interface ProcessPdfDocumentResponse {
  job: DocumentProcessingJobSummary;
  resultDocument: Document | null;
}

export interface SignDocumentDto {
  documentId: string;
  signatureHash: string;
  signatureAlgorithm?: string;
}

export interface GenerateSignedUrlDto {
  documentId: string;
  expiresIn?: number;
  disposition?: "attachment" | "inline";
  contentType?: string;
}

export interface SignedUrlResponse {
  url: string;
  expiresAt: string;
}

export type ScanSessionStatus =
  | "created"
  | "opened"
  | "capturing"
  | "uploading"
  | "uploaded"
  | "preprocessing"
  | "assembling_pdf"
  | "ocr_processing"
  | "indexing"
  | "completed"
  | "failed"
  | "expired"
  | "cancelled";

export type ScanDocumentFormat = "A4" | "Original";
export type ScanDestinationScope = "root" | "personal" | "client";

export interface ScanSessionPage {
  id: string;
  pageNumber: number;
  status: string;
  previewUrl: string | null;
  rotation: number;
  fileSize: number;
}

export interface ScanSessionResponse {
  id: string;
  status: ScanSessionStatus;
  pagesCount: number;
  uploadedPages: number;
  processedPages: number;
  finalDocumentId: string | null;
  caseId: string | null;
  clientId: string | null;
  destinationScope: ScanDestinationScope;
  mobileUrl: string;
  desktopUrl: string | null;
  expiresAt: string;
  documentFormat: ScanDocumentFormat;
  ocrStatus: "pending" | "not_configured" | "completed" | "failed";
  lastError: string | null;
  pages: ScanSessionPage[];
}

export interface CreateScanSessionResponse {
  sessionId: string;
  mobileUrl: string;
  desktopUrl: string;
  qrCode: string;
  expiresAt: string;
  status: ScanSessionStatus;
}
