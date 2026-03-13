import api from "./api";
import {
  Document,
  UploadDocumentDto,
  UpdateDocumentDto,
  DocumentFilters,
  DocumentListResponse,
  DocumentStatistics,
  DocumentProcessingSummary,
  DocumentProcessingRuntimeCapabilities,
  ProcessPdfDocumentDto,
  ProcessPdfDocumentResponse,
  SignDocumentDto,
  GenerateSignedUrlDto,
  SignedUrlResponse,
  CreateScanSessionResponse,
  ScanDocumentFormat,
  ScanDestinationScope,
  ScanSessionResponse,
} from "../types/document.types";

/**
 * Document Service
 */
class DocumentService {
  private baseUrl = "/documents";

  /**
   * Get all documents
   */
  async getDocuments(filters?: DocumentFilters): Promise<DocumentListResponse> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const query = params.toString();
    return api.get<DocumentListResponse>(
      `${this.baseUrl}${query ? `?${query}` : ""}`,
    );
  }

  /**
   * Get document by ID
   */
  async getDocument(id: string): Promise<Document> {
    return api.get<Document>(`${this.baseUrl}/${id}`);
  }

  async getProcessingSummary(id: string): Promise<DocumentProcessingSummary> {
    return api.get<DocumentProcessingSummary>(
      `${this.baseUrl}/${id}/processing`,
    );
  }

  async getProcessingRuntime(): Promise<DocumentProcessingRuntimeCapabilities> {
    return api.get<DocumentProcessingRuntimeCapabilities>(
      `${this.baseUrl}/processing/runtime`,
    );
  }

  async processPdfDocument(
    id: string,
    data: ProcessPdfDocumentDto,
  ): Promise<ProcessPdfDocumentResponse> {
    return api.post<ProcessPdfDocumentResponse>(
      `${this.baseUrl}/${id}/process-pdf`,
      data,
    );
  }

  /**
   * Upload document
   */
  async uploadDocument(
    file: File,
    data: UploadDocumentDto,
    onProgress?: (progress: number) => void,
  ): Promise<Document> {
    const formData = new FormData();
    formData.append("file", file);
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    return api.upload<Document>(`${this.baseUrl}/upload`, formData, onProgress);
  }

  /**
   * Update document
   */
  async updateDocument(id: string, data: UpdateDocumentDto): Promise<Document> {
    return api.put<Document>(`${this.baseUrl}/${id}`, data);
  }

  async getDocumentContent(
    id: string,
    disposition: "attachment" | "inline" = "inline",
  ): Promise<Blob> {
    return api.getBlob(
      `${this.baseUrl}/${id}/content?disposition=${disposition}`,
    );
  }

  /**
   * Sign document
   */
  async signDocument(id: string, data: SignDocumentDto): Promise<Document> {
    return api.post<Document>(`${this.baseUrl}/${id}/sign`, data);
  }

  /**
   * Generate signed URL
   */
  async generateSignedUrl(
    id: string,
    data: GenerateSignedUrlDto,
  ): Promise<SignedUrlResponse> {
    return api.post<SignedUrlResponse>(
      `${this.baseUrl}/${id}/signed-url`,
      data,
    );
  }

  /**
   * Delete document
   */
  async deleteDocument(id: string): Promise<void> {
    return api.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * Get document statistics
   */
  async getStatistics(): Promise<DocumentStatistics> {
    return api.get<DocumentStatistics>(`${this.baseUrl}/statistics`);
  }

  /**
   * Download document
   */
  async downloadDocument(id: string, filename: string): Promise<void> {
    return api.download(`${this.baseUrl}/${id}/download`, filename);
  }

  async createRevision(
    document: Document,
    file: File,
    overrides?: Partial<
      Pick<
        UploadDocumentDto,
        | "description"
        | "accessLevel"
        | "accessScope"
        | "sourceKind"
        | "sourceTemplateId"
        | "plainTextContent"
        | "metadataJson"
      >
    >,
    onProgress?: (progress: number) => void,
  ): Promise<Document> {
    return this.uploadDocument(
      file,
      {
        caseId: document.caseId,
        clientId: document.clientId,
        type: document.type,
        description: overrides?.description ?? document.description,
        accessLevel: overrides?.accessLevel ?? document.accessLevel,
        accessScope: overrides?.accessScope ?? document.accessScope,
        parentDocumentId: document.id,
        sourceKind: overrides?.sourceKind ?? "viewer_revision",
        sourceTemplateId: overrides?.sourceTemplateId,
        plainTextContent: overrides?.plainTextContent,
        metadataJson: overrides?.metadataJson,
      },
      onProgress,
    );
  }

  async createScanSession(data?: {
    documentFormat?: ScanDocumentFormat;
    destinationScope?: ScanDestinationScope;
    clientId?: string;
    caseId?: string;
  }): Promise<CreateScanSessionResponse> {
    return api.post<CreateScanSessionResponse>(`/scan-sessions`, data || {});
  }

  async getScanSession(sessionId: string): Promise<ScanSessionResponse> {
    return api.get<ScanSessionResponse>(`/scan-sessions/${sessionId}`);
  }

  async openMobileScanSession(
    sessionId: string,
    token: string,
  ): Promise<ScanSessionResponse> {
    const params = new URLSearchParams({ token });
    return api.get<ScanSessionResponse>(
      `/scan-sessions/${sessionId}/mobile?${params.toString()}`,
    );
  }

  async uploadScanPage(
    sessionId: string,
    file: File,
    data: { token: string; clientPageNumber: number; rotation?: number },
    onProgress?: (progress: number) => void,
  ): Promise<ScanSessionResponse> {
    const formData = new FormData();
    formData.append("image_file", file);
    formData.append("token", data.token);
    formData.append("clientPageNumber", String(data.clientPageNumber));
    if (data.rotation !== undefined) {
      formData.append("rotation", String(data.rotation));
    }

    return api.upload<ScanSessionResponse>(
      `/scan-sessions/${sessionId}/pages`,
      formData,
      onProgress,
    );
  }

  async deleteScanPage(
    sessionId: string,
    pageId: string,
    token: string,
  ): Promise<ScanSessionResponse> {
    const params = new URLSearchParams({ token });
    return api.delete<ScanSessionResponse>(
      `/scan-sessions/${sessionId}/pages/${pageId}?${params.toString()}`,
    );
  }

  async reorderScanPages(
    sessionId: string,
    data: {
      token: string;
      pages: Array<{ pageId: string; pageNumber: number }>;
    },
  ): Promise<ScanSessionResponse> {
    return api.patch<ScanSessionResponse>(
      `/scan-sessions/${sessionId}/pages/reorder`,
      data,
    );
  }

  async finalizeScanSession(
    sessionId: string,
    data: { token: string; documentFormat?: ScanDocumentFormat },
  ): Promise<ScanSessionResponse> {
    return api.post<ScanSessionResponse>(
      `/scan-sessions/${sessionId}/finalize`,
      data,
    );
  }
}

export const documentService = new DocumentService();
export default documentService;
