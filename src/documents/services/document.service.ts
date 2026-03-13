import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull, In } from "typeorm";
import { Readable } from "stream";
import { Document } from "../../database/entities/Document.entity";
import {
  DocumentProcessingArtifact,
  PageProcessingStatus,
} from "../../database/entities/DocumentProcessingArtifact.entity";
import {
  DocumentProcessingJob,
  DocumentProcessingStatus,
} from "../../database/entities/DocumentProcessingJob.entity";
import { DocumentSignature } from "../../database/entities/DocumentSignature.entity";
import {
  UploadDocumentDto,
  UpdateDocumentDto,
  DocumentFiltersDto,
  SignDocumentDto,
  GenerateSignedUrlDto,
  ProcessPdfDocumentDto,
} from "../dto/document.dto";
import { validateFileUpload } from "../../common/utils/validation.util";
import { FileStorageService } from "../../file-storage/services/file-storage.service";
import { JwtPayload } from "../../auth/interfaces/jwt.interface";
import {
  assertCanAccessRecord,
  assertSameTenant,
  buildScopedQueryCondition,
} from "../../common/security/access-control";
import { TrustVerificationService } from "../../trust-verification/services/trust-verification.service";
import { FileScanService } from "../../file-storage/services/file-scan.service";
import { PdfPostProcessingService } from "./pdf-post-processing.service";

const SUPPORTED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/rtf",
  "application/json",
  "application/xml",
  "application/zip",
  "application/x-zip-compressed",
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/gif",
  "image/webp",
  "text/plain",
  "text/markdown",
  "text/csv",
  "text/html",
  "text/xml",
];

const parseMetadataJson = (value?: string): Record<string, unknown> => {
  if (!value?.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return {};
  }

  return {};
};

const PDF_PROCESSING_SOURCE_KINDS = new Set([
  "viewer_pdf_scan_revision",
  "viewer_pdf_scan_ocr_revision",
  "server_pdf_postprocess_revision",
  "server_pdf_postprocess_ocr_revision",
]);

const normalizeDocumentProcessingStatus = (
  sourceKind?: string,
  ocrEnabled?: boolean,
): DocumentProcessingStatus => {
  if (sourceKind === "viewer_pdf_scan_ocr_revision" || ocrEnabled) {
    return "completed";
  }

  if (
    sourceKind === "viewer_pdf_scan_revision" ||
    sourceKind === "server_pdf_postprocess_revision"
  ) {
    return "pdf_assembled";
  }

  return "uploaded";
};

/**
 * Document Service
 */
@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);
  private readonly activePdfProcessingJobs = new Set<string>();

  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(DocumentProcessingJob)
    private readonly documentProcessingJobRepository: Repository<DocumentProcessingJob>,
    @InjectRepository(DocumentProcessingArtifact)
    private readonly documentProcessingArtifactRepository: Repository<DocumentProcessingArtifact>,
    @InjectRepository(DocumentSignature)
    private readonly documentSignatureRepository: Repository<DocumentSignature>,
    private readonly fileStorageService: FileStorageService,
    private readonly trustVerificationService: TrustVerificationService,
    private readonly fileScanService: FileScanService,
    private readonly pdfPostProcessingService: PdfPostProcessingService,
  ) {}

  /**
   * Get all documents with filters
   */
  async findAll(
    tenantId: string,
    filters: DocumentFiltersDto = {},
    actor?: JwtPayload,
  ): Promise<{ data: Document[]; total: number; page: number; limit: number }> {
    if (actor) {
      assertSameTenant(actor, tenantId);
    }

    const query = this.documentRepository
      .createQueryBuilder("document")
      .where("document.tenantId = :tenantId AND document.deletedAt IS NULL", {
        tenantId,
      });

    const scopeCondition = buildScopedQueryCondition("document", actor, [
      "document.uploadedBy",
      "document.signedBy",
    ]);

    if (scopeCondition) {
      query.andWhere(scopeCondition.clause, scopeCondition.parameters);
    }

    // Filter by case
    if (filters.caseId) {
      query.andWhere("document.caseId = :caseId", { caseId: filters.caseId });
    }

    // Filter by client
    if (filters.clientId) {
      query.andWhere("document.clientId = :clientId", {
        clientId: filters.clientId,
      });
    }

    // Filter by type
    if (filters.type) {
      query.andWhere("document.type = :type", { type: filters.type });
    }

    // Filter by status
    if (filters.status) {
      query.andWhere("document.status = :status", { status: filters.status });
    }

    if (filters.malwareScanStatus) {
      query.andWhere("document.malwareScanStatus = :malwareScanStatus", {
        malwareScanStatus: filters.malwareScanStatus,
      });
    }

    // Filter by access level
    if (filters.accessLevel) {
      query.andWhere("document.accessLevel = :accessLevel", {
        accessLevel: filters.accessLevel,
      });
    }

    // Search
    if (filters.search) {
      query.andWhere(
        "(document.fileName ILIKE :search OR " +
          "document.description ILIKE :search OR " +
          "document.originalName ILIKE :search)",
        { search: `%${filters.search}%` },
      );
    }

    // Sorting
    const sortBy = filters.sortBy || "uploadedAt";
    const sortOrder = filters.sortOrder || "DESC";
    query.orderBy(`document.${sortBy}`, sortOrder);

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    query.skip(skip).take(limit);

    // Include relations
    query.leftJoinAndSelect("document.uploadedByUser", "uploadedByUser");
    query.leftJoinAndSelect("document.case", "case");

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Get document by ID
   */
  async findById(
    tenantId: string,
    id: string,
    actor?: JwtPayload,
  ): Promise<Document> {
    if (actor) {
      assertSameTenant(actor, tenantId);
    }

    const document = await this.documentRepository.findOne({
      where: {
        id,
        tenantId,
        deletedAt: IsNull(),
      },
      relations: ["uploadedByUser", "case", "signedByUser"],
    });

    if (!document) {
      throw new NotFoundException("Документ не знайдено");
    }

    if (actor) {
      assertCanAccessRecord(actor, document);
    }

    return document;
  }

  /**
   * Upload document
   */
  async upload(
    tenantId: string,
    userId: string,
    file: Express.Multer.File,
    dto: UploadDocumentDto,
    actor?: JwtPayload,
  ): Promise<Document> {
    if (actor) {
      assertSameTenant(actor, tenantId);
    }

    const parentDocument = dto.parentDocumentId
      ? await this.findById(tenantId, dto.parentDocumentId, actor)
      : null;

    const maxSize = 50 * 1024 * 1024; // 50 MB

    const validation = validateFileUpload(
      file,
      SUPPORTED_DOCUMENT_MIME_TYPES,
      maxSize,
    );
    if (!validation.valid) {
      throw new BadRequestException(validation.error);
    }

    const caseId = dto.caseId ?? parentDocument?.caseId;
    const clientId = dto.clientId ?? parentDocument?.clientId;
    const accessLevel =
      dto.accessLevel ?? parentDocument?.accessLevel ?? "internal";
    const accessScope =
      dto.accessScope ?? parentDocument?.accessScope ?? "assigned";
    const version = parentDocument ? (parentDocument.version || 1) + 1 : 1;
    const metadata = {
      ...(parentDocument?.metadata || {}),
      ...(dto.eventId ? { eventId: dto.eventId } : {}),
      ...(dto.calculationId ? { calculationId: dto.calculationId } : {}),
      ...(dto.sourceKind ? { sourceKind: dto.sourceKind } : {}),
      ...(dto.sourceTemplateId
        ? { sourceTemplateId: dto.sourceTemplateId }
        : {}),
      ...(dto.plainTextContent !== undefined
        ? { plainTextContent: dto.plainTextContent }
        : {}),
      ...parseMetadataJson(dto.metadataJson),
      ...(parentDocument ? { revisionOf: parentDocument.id } : {}),
    };

    // Upload file using file storage service
    const uploadResult = await this.fileStorageService.uploadFile(
      tenantId,
      userId,
      file,
      {
        caseId,
        clientId,
        folder: "documents",
        isPublic: false,
        metadata: {
          documentType: dto.type,
          description: dto.description || parentDocument?.description || "",
        },
      },
    );

    const document = this.documentRepository.create({
      tenantId,
      caseId,
      clientId,
      fileName: uploadResult.path.split("/").pop() || uploadResult.path,
      originalName: file.originalname,
      type: dto.type,
      description: dto.description ?? parentDocument?.description,
      mimeType: file.mimetype,
      fileSize: file.size,
      status: "draft",
      storagePath: uploadResult.path,
      cdnUrl: uploadResult.url,
      malwareScanStatus: uploadResult.malwareScanStatus || "pending",
      malwareScannedAt: null,
      malwareScanner: null,
      malwareSignature: null,
      malwareScanError: null,
      accessLevel,
      accessScope,
      metadata,
      uploadedBy: userId,
      uploadedAt: new Date(),
      version,
      parentDocumentId: parentDocument?.id,
      createdBy: userId,
      updatedBy: userId,
    });

    const savedDocument = await this.documentRepository.save(document);
    await this.fileScanService.linkDocument(
      tenantId,
      savedDocument.storagePath,
      savedDocument.id,
    );
    await this.recordPdfProcessingArtifacts(
      tenantId,
      savedDocument,
      parentDocument,
      metadata,
    );

    return savedDocument;
  }

  /**
   * Update document metadata
   */
  async update(
    tenantId: string,
    id: string,
    userId: string,
    dto: UpdateDocumentDto,
    actor?: JwtPayload,
  ): Promise<Document> {
    const document = await this.findById(tenantId, id, actor);

    Object.assign(document, dto, {
      updatedBy: userId,
    });

    return this.documentRepository.save(document);
  }

  /**
   * Sign document
   */
  async sign(
    tenantId: string,
    id: string,
    userId: string,
    dto: SignDocumentDto,
    actor?: JwtPayload,
  ): Promise<Document> {
    const document = await this.findById(tenantId, id, actor);

    // TODO: Verify signature hash
    // This would integrate with the e-signature service

    document.status = "signed";
    document.signatureHash = dto.signatureHash;
    document.signatureAlgorithm = dto.signatureAlgorithm || "ECDSA";
    document.signedAt = new Date();
    document.signedBy = userId;
    document.updatedBy = userId;
    document.version += 1;

    const savedDocument = await this.documentRepository.save(document);

    const savedSignature = await this.documentSignatureRepository.save(
      this.documentSignatureRepository.create({
        tenantId,
        documentId: savedDocument.id,
        userId,
        provider: dto.provider,
        verificationStatus: "pending",
        signatureHash: dto.signatureHash,
        signatureAlgorithm: dto.signatureAlgorithm || "ECDSA",
        signedPayloadHash: dto.signedPayloadHash,
        certificateSerialNumber: dto.certificateSerialNumber,
        certificateIssuer: dto.certificateIssuer,
        verifiedAt: null,
        lastCheckedAt: null,
        verificationAttempts: 0,
        nextCheckAt: new Date(),
        lastError: null,
        externalVerificationId: null,
        signatureTime: new Date(),
        metadata: {
          ipAddress: dto.ipAddress,
          userAgent: dto.userAgent,
        },
      }),
    );

    await this.trustVerificationService.queueSignatureVerification(
      savedSignature,
    );

    return savedDocument;
  }

  /**
   * Generate signed URL (time-limited)
   */
  async generateSignedUrl(
    tenantId: string,
    id: string,
    dto: GenerateSignedUrlDto,
    actor?: JwtPayload,
  ): Promise<{ url: string; expiresAt: Date }> {
    const document = await this.findById(tenantId, id, actor);
    await this.ensureDocumentFileAccessible(tenantId, document);

    const expiresIn = dto.expiresIn || 7 * 24 * 60 * 60;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Generate signed URL using storage service
    const signedUrl = await this.fileStorageService.generateSignedUrl(
      tenantId,
      document.storagePath,
      {
        expiresIn,
        disposition: dto.disposition || "attachment",
        contentType: dto.contentType || document.mimeType || undefined,
      },
    );

    // Store signed URL info in metadata
    document.signedUrl = signedUrl;
    document.metadata = {
      ...document.metadata,
      signedUrlExpiresAt: expiresAt.toISOString(),
    };

    await this.documentRepository.save(document);

    return {
      url: signedUrl,
      expiresAt,
    };
  }

  async getContent(
    tenantId: string,
    id: string,
    actor?: JwtPayload,
  ): Promise<{
    buffer: Buffer;
    contentType: string;
    fileName: string;
  }> {
    const document = await this.findById(tenantId, id, actor);
    await this.ensureDocumentFileAccessible(tenantId, document);

    const buffer = await this.fileStorageService.downloadFile(
      tenantId,
      document.storagePath,
    );

    return {
      buffer,
      contentType: document.mimeType || "application/octet-stream",
      fileName: document.originalName || document.fileName,
    };
  }

  /**
   * Delete document (soft delete)
   */
  async delete(
    tenantId: string,
    id: string,
    userId: string,
    actor?: JwtPayload,
  ): Promise<void> {
    const document = await this.findById(tenantId, id, actor);

    // Delete file from storage
    if (document.storagePath) {
      await this.fileStorageService.deleteFile(tenantId, document.storagePath);
    }

    await this.documentRepository.update(
      { id, tenantId },
      {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    );
  }

  private isTrustedInternalScanDocument(document: Document): boolean {
    return (
      Boolean(document.storagePath) &&
      document.mimeType === "application/pdf" &&
      document.metadata?.sourceKind === "scan_session"
    );
  }

  private async ensureDocumentFileAccessible(
    tenantId: string,
    document: Document,
  ): Promise<void> {
    if (!document.storagePath) {
      throw new NotFoundException("Файл документа не знайдено у сховищі");
    }

    if (document.malwareScanStatus === "clean") {
      return;
    }

    if (!this.isTrustedInternalScanDocument(document)) {
      throw new ForbiddenException(
        "Документ недоступний до завершення перевірки на шкідливе ПЗ",
      );
    }

    await this.fileScanService.markFileAsClean({
      tenantId,
      storagePath: document.storagePath,
      fileName: document.originalName || document.fileName,
      mimeType: document.mimeType,
      documentId: document.id,
      scannerEngine: "internal_scan_pdf",
      metadata: {
        sourceKind: "scan_session",
        recoveryPath: "document_content_access",
      },
    });

    document.malwareScanStatus = "clean";
    document.malwareScannedAt = new Date();
    document.malwareScanner = "internal_scan_pdf";
    document.malwareSignature = null;
    document.malwareScanError = null;

    await this.documentRepository.save(document);
  }

  /**
   * Bulk upload documents
   */
  async bulkUpload(
    tenantId: string,
    userId: string,
    files: Express.Multer.File[],
    dtos: UploadDocumentDto[],
    actor?: JwtPayload,
  ): Promise<{ success: number; failed: number; documents: Document[] }> {
    if (actor) {
      assertSameTenant(actor, tenantId);
    }

    const results = {
      success: 0,
      failed: 0,
      documents: [] as Document[],
    };

    for (let i = 0; i < files.length && i < dtos.length; i++) {
      try {
        const document = await this.upload(
          tenantId,
          userId,
          files[i],
          dtos[i],
          actor,
        );
        results.success++;
        results.documents.push(document);
      } catch (error) {
        results.failed++;
      }
    }

    return results;
  }

  /**
   * Get document statistics
   */
  async getStatistics(
    tenantId: string,
    actor?: JwtPayload,
  ): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    totalSize: number;
  }> {
    if (actor) {
      assertSameTenant(actor, tenantId);
    }

    const scopeCondition = buildScopedQueryCondition("document", actor, [
      "document.uploadedBy",
      "document.signedBy",
    ]);
    const [total] = await this.documentRepository
      .createQueryBuilder("document")
      .select("COUNT(*)")
      .where("document.tenantId = :tenantId AND document.deletedAt IS NULL", {
        tenantId,
      })
      .andWhere(
        scopeCondition?.clause || "1=1",
        scopeCondition?.parameters || {},
      )
      .getRawMany();

    const [totalSize] = await this.documentRepository
      .createQueryBuilder("document")
      .select("SUM(document.fileSize)")
      .where("document.tenantId = :tenantId AND document.deletedAt IS NULL", {
        tenantId,
      })
      .andWhere(
        scopeCondition?.clause || "1=1",
        scopeCondition?.parameters || {},
      )
      .getRawMany();

    const byType = await this.documentRepository
      .createQueryBuilder("document")
      .select("document.type", "COUNT(*) as count")
      .where("document.tenantId = :tenantId AND document.deletedAt IS NULL", {
        tenantId,
      })
      .andWhere(
        scopeCondition?.clause || "1=1",
        scopeCondition?.parameters || {},
      )
      .groupBy("document.type")
      .getRawMany();

    const byStatus = await this.documentRepository
      .createQueryBuilder("document")
      .select("document.status", "COUNT(*) as count")
      .where("document.tenantId = :tenantId AND document.deletedAt IS NULL", {
        tenantId,
      })
      .andWhere(
        scopeCondition?.clause || "1=1",
        scopeCondition?.parameters || {},
      )
      .groupBy("document.status")
      .getRawMany();

    return {
      total: parseInt(total[0].count),
      totalSize: parseInt(totalSize[0].sum) || 0,
      byType: byType.reduce(
        (acc, row) => {
          acc[row.type] = parseInt(row.count);
          return acc;
        },
        {} as Record<string, number>,
      ),
      byStatus: byStatus.reduce(
        (acc, row) => {
          acc[row.status] = parseInt(row.count);
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }

  async getProcessingSummary(
    tenantId: string,
    id: string,
    actor?: JwtPayload,
  ): Promise<{
    job: DocumentProcessingJob | null;
    artifacts: DocumentProcessingArtifact[];
  }> {
    await this.findById(tenantId, id, actor);

    const job = await this.documentProcessingJobRepository.findOne({
      where: { tenantId, documentId: id },
      order: { createdAt: "DESC" },
    });

    if (!job) {
      return { job: null, artifacts: [] };
    }

    const artifacts = await this.documentProcessingArtifactRepository.find({
      where: { tenantId, documentId: id, processingJobId: job.id },
      order: { pageNumber: "ASC", createdAt: "ASC" },
    });

    return { job, artifacts };
  }

  async getProcessingRuntime(): Promise<unknown> {
    return this.pdfPostProcessingService.getRuntimeCapabilities();
  }

  async processUploadedPdf(
    tenantId: string,
    id: string,
    userId: string,
    dto: ProcessPdfDocumentDto,
    actor?: JwtPayload,
  ): Promise<{
    job: DocumentProcessingJob;
    resultDocument: Document | null;
  }> {
    const sourceDocument = await this.findById(tenantId, id, actor);
    await this.ensureDocumentFileAccessible(tenantId, sourceDocument);

    if (sourceDocument.mimeType !== "application/pdf") {
      throw new BadRequestException(
        "Серверна постобробка доступна лише для PDF",
      );
    }

    const runtime =
      await this.pdfPostProcessingService.getRuntimeCapabilities();
    const ocrEnabled = dto.ocrEnabled !== false;
    const ocrLanguage = dto.ocrLanguage || "ukr+rus+spa+eng";
    const activeJob = await this.documentProcessingJobRepository
      .createQueryBuilder("job")
      .where("job.tenantId = :tenantId", { tenantId })
      .andWhere("job.documentId = :documentId", {
        documentId: sourceDocument.id,
      })
      .andWhere("job.status IN (:...statuses)", {
        statuses: [
          "uploaded",
          "analyzing",
          "preprocessing",
          "geometry_corrected",
          "enhanced",
          "pdf_assembled",
          "ocr_processing",
        ],
      })
      .orderBy("job.createdAt", "DESC")
      .getOne();

    if (activeJob) {
      throw new ConflictException("Документ уже обробляється на сервері");
    }

    const job = await this.documentProcessingJobRepository.save(
      this.documentProcessingJobRepository.create({
        tenantId,
        documentId: sourceDocument.id,
        sourceDocumentId: sourceDocument.id,
        status: "uploaded",
        ocrEnabled,
        ocrLanguage,
        processingMode: dto.processingMode || "document",
        targetPageFormat: dto.targetPageFormat || "auto",
        pageCount: 0,
        processedPageCount: 0,
        metadata: {
          pipeline: "server_pdf_postprocessing",
          requestedBy: userId,
          runtime,
          useUnpaper: dto.useUnpaper !== false,
          sourceDocumentName: sourceDocument.originalName,
          queue: {
            queuedAt: new Date().toISOString(),
            nextAttemptAt: new Date().toISOString(),
            attempts: 0,
            maxAttempts: 3,
            timeoutMs: 15 * 60 * 1000,
          },
        },
        lastError: null,
        completedAt: null,
      }),
    );

    await this.documentProcessingArtifactRepository.save(
      this.documentProcessingArtifactRepository.create({
        tenantId,
        documentId: sourceDocument.id,
        processingJobId: job.id,
        artifactKind: "original_pdf",
        pageNumber: null,
        storagePath: sourceDocument.storagePath,
        mimeType: sourceDocument.mimeType,
        textContent: null,
        ocrConfidence: null,
        pageStatus: null,
        metadata: {
          sourceDocumentId: sourceDocument.id,
        },
      }),
    );

    return { job, resultDocument: null };
  }

  async processDuePdfJobs(limit: number = 1): Promise<number> {
    const candidates = await this.documentProcessingJobRepository.find({
      where: {
        status: In([
          "uploaded",
          "analyzing",
          "preprocessing",
          "enhanced",
          "pdf_assembled",
          "ocr_processing",
        ]),
      },
      order: {
        createdAt: "ASC",
      },
      take: Math.max(1, limit * 4),
    });

    let processed = 0;
    const now = Date.now();

    for (const job of candidates) {
      if (processed >= limit) {
        break;
      }

      const queueState = this.getPdfQueueState(job);
      if (this.activePdfProcessingJobs.has(job.id)) {
        continue;
      }

      if (job.status === "uploaded") {
        if (Date.parse(queueState.nextAttemptAt) > now) {
          continue;
        }

        await this.runPdfProcessingJob({
          tenantId: job.tenantId,
          userId:
            typeof job.metadata?.requestedBy === "string"
              ? job.metadata.requestedBy
              : "",
          sourceDocumentId: job.sourceDocumentId || job.documentId,
          jobId: job.id,
          dto: {
            processingMode: job.processingMode || "document",
            targetPageFormat: job.targetPageFormat || "auto",
            ocrEnabled: job.ocrEnabled,
            ocrLanguage: job.ocrLanguage || "ukr+rus+spa+eng",
            useUnpaper: Boolean(job.metadata?.useUnpaper ?? true),
          },
        });
        processed += 1;
        continue;
      }

      if (
        queueState.startedAt &&
        now - Date.parse(queueState.startedAt) > queueState.timeoutMs
      ) {
        await this.requeueTimedOutPdfJob(job, queueState);
        processed += 1;
      }
    }

    return processed;
  }

  private async runPdfProcessingJob(data: {
    tenantId: string;
    userId: string;
    sourceDocumentId: string;
    jobId: string;
    dto: ProcessPdfDocumentDto;
  }): Promise<void> {
    if (this.activePdfProcessingJobs.has(data.jobId)) {
      return;
    }

    this.activePdfProcessingJobs.add(data.jobId);

    try {
      const job = await this.documentProcessingJobRepository.findOneByOrFail({
        id: data.jobId,
        tenantId: data.tenantId,
      });
      const sourceDocument = await this.findById(
        data.tenantId,
        data.sourceDocumentId,
      );

      job.status = "preprocessing";
      job.lastError = null;
      job.metadata = {
        ...(job.metadata || {}),
        queue: {
          ...this.getPdfQueueState(job),
          startedAt: new Date().toISOString(),
          attempts: this.getPdfQueueState(job).attempts + 1,
        },
      };
      await this.documentProcessingJobRepository.save(job);

      const sourceBuffer =
        await this.fileStorageService.downloadFileForInternalProcessing(
          data.tenantId,
          sourceDocument.storagePath,
        );
      const result = await this.pdfPostProcessingService.processPdf(
        sourceBuffer,
        {
          processingMode: data.dto.processingMode || "document",
          targetPageFormat: data.dto.targetPageFormat || "auto",
          ocrEnabled: data.dto.ocrEnabled !== false,
          ocrLanguage: data.dto.ocrLanguage || "ukr+rus+spa+eng",
          useUnpaper: data.dto.useUnpaper !== false,
        },
      );

      job.status = "enhanced";
      job.pageCount = result.pageArtifacts.length;
      job.processedPageCount = 0;
      job.metadata = {
        ...(job.metadata || {}),
        processorMetadata: result.metadata,
      };
      await this.documentProcessingJobRepository.save(job);

      const revisionSourceKind =
        data.dto.ocrEnabled !== false
          ? "server_pdf_postprocess_ocr_revision"
          : "server_pdf_postprocess_revision";
      const revisionMetadata = {
        sourceKind: revisionSourceKind,
        processingPipeline: "server_pdf_postprocessing",
        processingMode: data.dto.processingMode || "document",
        targetPageFormat: data.dto.targetPageFormat || "auto",
        ocrEnabled: data.dto.ocrEnabled !== false,
        ocrLanguage: data.dto.ocrLanguage || "ukr+rus+spa+eng",
        useUnpaper: data.dto.useUnpaper !== false,
        runtime: result.runtime,
        processorMetadata: result.metadata,
        sourceDocumentId: sourceDocument.id,
      };

      const resultDocument = await this.upload(
        data.tenantId,
        data.userId,
        this.createVirtualUploadFile(
          sourceDocument.originalName,
          "application/pdf",
          result.processedPdfBuffer,
        ),
        {
          caseId: sourceDocument.caseId,
          clientId: sourceDocument.clientId,
          type: sourceDocument.type,
          description: sourceDocument.description,
          accessLevel: sourceDocument.accessLevel,
          accessScope: sourceDocument.accessScope,
          parentDocumentId: sourceDocument.id,
          sourceKind: revisionSourceKind,
          plainTextContent: result.plainTextContent || undefined,
          metadataJson: JSON.stringify(revisionMetadata),
        },
      );

      job.status =
        data.dto.ocrEnabled !== false ? "ocr_processing" : "pdf_assembled";
      job.metadata = {
        ...(job.metadata || {}),
        resultDocumentId: resultDocument.id,
        resultStoragePath: resultDocument.storagePath,
      };
      await this.documentProcessingJobRepository.save(job);

      await this.persistServerProcessingArtifacts(
        data.tenantId,
        data.userId,
        sourceDocument,
        job,
        resultDocument,
        revisionMetadata,
        result,
      );

      job.status = "completed";
      job.processedPageCount = result.pageArtifacts.length;
      job.completedAt = new Date();
      job.metadata = {
        ...(job.metadata || {}),
        resultDocumentId: resultDocument.id,
        resultStoragePath: resultDocument.storagePath,
        processorMetadata: result.metadata,
        queue: {
          ...this.getPdfQueueState(job),
          finishedAt: new Date().toISOString(),
        },
      };
      await this.documentProcessingJobRepository.save(job);
    } catch (error: any) {
      const job = await this.documentProcessingJobRepository.findOne({
        where: { id: data.jobId, tenantId: data.tenantId },
      });
      if (job) {
        const queueState = this.getPdfQueueState(job);
        const nextAttempt = queueState.attempts < queueState.maxAttempts;
        job.status = nextAttempt ? "uploaded" : "failed";
        job.lastError =
          error instanceof Error
            ? error.message
            : String(error) || "Unknown error";
        job.metadata = {
          ...(job.metadata || {}),
          queue: {
            ...queueState,
            nextAttemptAt: new Date(
              Date.now() + Math.min(60_000 * queueState.attempts, 5 * 60_000),
            ).toISOString(),
            failedAt: new Date().toISOString(),
            lastError: job.lastError,
          },
        };
        await this.documentProcessingJobRepository.save(job);
      }
      this.logger.error(
        `Server PDF processing job failed: ${data.jobId}`,
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      this.activePdfProcessingJobs.delete(data.jobId);
    }
  }

  private async recordPdfProcessingArtifacts(
    tenantId: string,
    savedDocument: Document,
    parentDocument: Document | null,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    const sourceKind =
      typeof metadata.sourceKind === "string" ? metadata.sourceKind : null;

    if (!sourceKind || !PDF_PROCESSING_SOURCE_KINDS.has(sourceKind)) {
      return;
    }

    const pageAnalyses =
      metadata.pageAnalyses &&
      typeof metadata.pageAnalyses === "object" &&
      !Array.isArray(metadata.pageAnalyses)
        ? (metadata.pageAnalyses as Record<string, any>)
        : {};
    const ocrEnabled = Boolean(metadata.ocrEnabled);
    const ocrLanguage =
      typeof metadata.ocrLanguage === "string"
        ? metadata.ocrLanguage
        : ocrEnabled
          ? "ukr+rus+spa+eng"
          : null;
    const pageCount = Number(
      metadata.pageCount || Object.keys(pageAnalyses).length || 0,
    );
    const processingMode =
      typeof metadata.processingMode === "string"
        ? metadata.processingMode
        : null;
    const targetPageFormat =
      typeof metadata.targetPageFormat === "string"
        ? metadata.targetPageFormat
        : null;

    const job = await this.documentProcessingJobRepository.save(
      this.documentProcessingJobRepository.create({
        tenantId,
        documentId: savedDocument.id,
        sourceDocumentId: parentDocument?.id || null,
        status: normalizeDocumentProcessingStatus(sourceKind, ocrEnabled),
        ocrEnabled,
        ocrLanguage,
        processingMode,
        targetPageFormat,
        pageCount,
        processedPageCount: pageCount,
        metadata,
        lastError: null,
        completedAt:
          sourceKind === "viewer_pdf_scan_ocr_revision" ||
          sourceKind === "server_pdf_postprocess_ocr_revision" ||
          sourceKind === "server_pdf_postprocess_revision"
            ? new Date()
            : null,
      }),
    );

    const artifacts: DocumentProcessingArtifact[] = [
      this.documentProcessingArtifactRepository.create({
        tenantId,
        documentId: savedDocument.id,
        processingJobId: job.id,
        artifactKind: "processed_pdf",
        pageNumber: null,
        storagePath: savedDocument.storagePath,
        mimeType: savedDocument.mimeType,
        textContent: null,
        ocrConfidence: null,
        pageStatus: null,
        metadata: {
          sourceKind,
        },
      }),
      this.documentProcessingArtifactRepository.create({
        tenantId,
        documentId: savedDocument.id,
        processingJobId: job.id,
        artifactKind: "processing_metadata",
        pageNumber: null,
        storagePath: null,
        mimeType: "application/json",
        textContent: JSON.stringify(metadata),
        ocrConfidence: null,
        pageStatus: null,
        metadata,
      }),
    ];

    if (parentDocument?.storagePath) {
      artifacts.push(
        this.documentProcessingArtifactRepository.create({
          tenantId,
          documentId: savedDocument.id,
          processingJobId: job.id,
          artifactKind: "original_pdf",
          pageNumber: null,
          storagePath: parentDocument.storagePath,
          mimeType: parentDocument.mimeType,
          textContent: null,
          ocrConfidence: null,
          pageStatus: null,
          metadata: {
            sourceDocumentId: parentDocument.id,
          },
        }),
      );
    }

    if (savedDocument.storagePath && ocrEnabled) {
      artifacts.push(
        this.documentProcessingArtifactRepository.create({
          tenantId,
          documentId: savedDocument.id,
          processingJobId: job.id,
          artifactKind: "searchable_pdf",
          pageNumber: null,
          storagePath: savedDocument.storagePath,
          mimeType: savedDocument.mimeType,
          textContent: null,
          ocrConfidence: null,
          pageStatus: null,
          metadata: {
            derivedFromProcessedPdf: true,
          },
        }),
      );
    }

    const fullOcrText =
      typeof metadata.plainTextContent === "string"
        ? metadata.plainTextContent
        : typeof savedDocument.metadata?.plainTextContent === "string"
          ? savedDocument.metadata.plainTextContent
          : null;

    if (fullOcrText?.trim()) {
      artifacts.push(
        this.documentProcessingArtifactRepository.create({
          tenantId,
          documentId: savedDocument.id,
          processingJobId: job.id,
          artifactKind: "full_ocr_text",
          pageNumber: null,
          storagePath: null,
          mimeType: "text/plain",
          textContent: fullOcrText,
          ocrConfidence: null,
          pageStatus: null,
          metadata: {
            ocrLanguage,
          },
        }),
      );
    }

    Object.entries(pageAnalyses).forEach(([pageKey, value]) => {
      const pageNumber = Number(pageKey);
      const pageAnalysis = value && typeof value === "object" ? value : {};
      const pageStatus =
        typeof pageAnalysis.pageProcessingStatus === "string"
          ? (pageAnalysis.pageProcessingStatus as PageProcessingStatus)
          : "pending";
      const pageText =
        typeof pageAnalysis.ocrText === "string" ? pageAnalysis.ocrText : null;
      const ocrConfidence =
        typeof pageAnalysis.ocrConfidence === "number"
          ? pageAnalysis.ocrConfidence
          : null;

      artifacts.push(
        this.documentProcessingArtifactRepository.create({
          tenantId,
          documentId: savedDocument.id,
          processingJobId: job.id,
          artifactKind: "page_preview",
          pageNumber,
          storagePath: null,
          mimeType: "application/json",
          textContent: null,
          ocrConfidence,
          pageStatus,
          metadata: pageAnalysis,
        }),
      );

      if (pageText?.trim()) {
        artifacts.push(
          this.documentProcessingArtifactRepository.create({
            tenantId,
            documentId: savedDocument.id,
            processingJobId: job.id,
            artifactKind: "ocr_text_per_page",
            pageNumber,
            storagePath: null,
            mimeType: "text/plain",
            textContent: pageText,
            ocrConfidence,
            pageStatus: ocrEnabled ? "ocr_done" : pageStatus,
            metadata: {
              ocrLanguage,
            },
          }),
        );
      }
    });

    await this.documentProcessingArtifactRepository.save(artifacts);
  }

  private createVirtualUploadFile(
    originalName: string,
    mimeType: string,
    buffer: Buffer,
  ): Express.Multer.File {
    return {
      fieldname: "file",
      originalname: originalName,
      encoding: "7bit",
      mimetype: mimeType,
      size: buffer.length,
      buffer,
      destination: "",
      filename: originalName,
      path: "",
      stream: Readable.from(buffer),
    } as Express.Multer.File;
  }

  private async persistServerProcessingArtifacts(
    tenantId: string,
    userId: string,
    sourceDocument: Document,
    job: DocumentProcessingJob,
    resultDocument: Document,
    revisionMetadata: Record<string, unknown>,
    result: Awaited<ReturnType<PdfPostProcessingService["processPdf"]>>,
  ): Promise<void> {
    const artifacts: DocumentProcessingArtifact[] = [
      this.documentProcessingArtifactRepository.create({
        tenantId,
        documentId: sourceDocument.id,
        processingJobId: job.id,
        artifactKind:
          revisionMetadata.ocrEnabled === true
            ? "searchable_pdf"
            : "processed_pdf",
        pageNumber: null,
        storagePath: resultDocument.storagePath,
        mimeType: resultDocument.mimeType,
        textContent: null,
        ocrConfidence: null,
        pageStatus: null,
        metadata: {
          resultDocumentId: resultDocument.id,
        },
      }),
      this.documentProcessingArtifactRepository.create({
        tenantId,
        documentId: sourceDocument.id,
        processingJobId: job.id,
        artifactKind: "processing_metadata",
        pageNumber: null,
        storagePath: null,
        mimeType: "application/json",
        textContent: JSON.stringify(revisionMetadata),
        ocrConfidence: null,
        pageStatus: null,
        metadata: revisionMetadata,
      }),
    ];

    if (result.plainTextContent?.trim()) {
      artifacts.push(
        this.documentProcessingArtifactRepository.create({
          tenantId,
          documentId: sourceDocument.id,
          processingJobId: job.id,
          artifactKind: "full_ocr_text",
          pageNumber: null,
          storagePath: null,
          mimeType: "text/plain",
          textContent: result.plainTextContent,
          ocrConfidence: null,
          pageStatus: null,
          metadata: {
            ocrLanguage:
              typeof revisionMetadata.ocrLanguage === "string"
                ? revisionMetadata.ocrLanguage
                : null,
          },
        }),
      );
    }

    for (const pageArtifact of result.pageArtifacts) {
      const baseFileName = `${sourceDocument.id}-job-${job.id}-page-${String(
        pageArtifact.pageNumber,
      ).padStart(4, "0")}`;

      const originalPagePath = pageArtifact.originalImageBuffer
        ? await this.uploadInternalProcessingArtifact(
            tenantId,
            userId,
            job.id,
            this.createVirtualUploadFile(
              `${baseFileName}-original.png`,
              "image/png",
              pageArtifact.originalImageBuffer,
            ),
          )
        : null;
      const processedPagePath = pageArtifact.processedImageBuffer
        ? await this.uploadInternalProcessingArtifact(
            tenantId,
            userId,
            job.id,
            this.createVirtualUploadFile(
              `${baseFileName}-processed.png`,
              "image/png",
              pageArtifact.processedImageBuffer,
            ),
          )
        : null;
      const previewPagePath = pageArtifact.previewImageBuffer
        ? await this.uploadInternalProcessingArtifact(
            tenantId,
            userId,
            job.id,
            this.createVirtualUploadFile(
              `${baseFileName}-preview.png`,
              "image/png",
              pageArtifact.previewImageBuffer,
            ),
          )
        : null;

      if (originalPagePath) {
        artifacts.push(
          this.documentProcessingArtifactRepository.create({
            tenantId,
            documentId: sourceDocument.id,
            processingJobId: job.id,
            artifactKind: "original_page_image",
            pageNumber: pageArtifact.pageNumber,
            storagePath: originalPagePath,
            mimeType: "image/png",
            textContent: null,
            ocrConfidence: null,
            pageStatus: "analyzed",
            metadata: pageArtifact.metadata,
          }),
        );
      }

      if (processedPagePath) {
        artifacts.push(
          this.documentProcessingArtifactRepository.create({
            tenantId,
            documentId: sourceDocument.id,
            processingJobId: job.id,
            artifactKind: "processed_page_image",
            pageNumber: pageArtifact.pageNumber,
            storagePath: processedPagePath,
            mimeType: "image/png",
            textContent: null,
            ocrConfidence: pageArtifact.ocrConfidence,
            pageStatus:
              (pageArtifact.pageStatus as PageProcessingStatus | null) ||
              "enhanced",
            metadata: pageArtifact.metadata,
          }),
        );
      }

      if (previewPagePath) {
        artifacts.push(
          this.documentProcessingArtifactRepository.create({
            tenantId,
            documentId: sourceDocument.id,
            processingJobId: job.id,
            artifactKind: "page_preview",
            pageNumber: pageArtifact.pageNumber,
            storagePath: previewPagePath,
            mimeType: "image/png",
            textContent: null,
            ocrConfidence: pageArtifact.ocrConfidence,
            pageStatus:
              (pageArtifact.pageStatus as PageProcessingStatus | null) ||
              "enhanced",
            metadata: {
              preview: true,
            },
          }),
        );
      }

      if (pageArtifact.ocrText?.trim()) {
        artifacts.push(
          this.documentProcessingArtifactRepository.create({
            tenantId,
            documentId: sourceDocument.id,
            processingJobId: job.id,
            artifactKind: "ocr_text_per_page",
            pageNumber: pageArtifact.pageNumber,
            storagePath: null,
            mimeType: "text/plain",
            textContent: pageArtifact.ocrText,
            ocrConfidence: pageArtifact.ocrConfidence,
            pageStatus: "ocr_done",
            metadata: pageArtifact.metadata,
          }),
        );
      }

      job.processedPageCount = pageArtifact.pageNumber;
      await this.documentProcessingJobRepository.save(job);
    }

    await this.documentProcessingArtifactRepository.save(artifacts);
  }

  private async uploadInternalProcessingArtifact(
    tenantId: string,
    userId: string,
    jobId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const uploadResult = await this.fileStorageService.uploadFile(
      tenantId,
      userId,
      file,
      {
        folder: `processing-artifacts/${jobId}`,
        metadata: {
          internalArtifact: "true",
          processingJobId: jobId,
        },
      },
    );

    await this.fileScanService.markFileAsClean({
      tenantId,
      storagePath: uploadResult.path,
      fileName: file.originalname,
      mimeType: file.mimetype,
      scannerEngine: "internal_pdf_processing_artifact",
      metadata: {
        processingJobId: jobId,
        internalArtifact: true,
      },
    });

    return uploadResult.path;
  }

  private getPdfQueueState(job: DocumentProcessingJob): {
    queuedAt: string;
    nextAttemptAt: string;
    attempts: number;
    maxAttempts: number;
    timeoutMs: number;
    startedAt?: string;
    finishedAt?: string;
    failedAt?: string;
    lastError?: string;
  } {
    const queue =
      job.metadata?.queue &&
      typeof job.metadata.queue === "object" &&
      !Array.isArray(job.metadata.queue)
        ? (job.metadata.queue as Record<string, unknown>)
        : {};

    return {
      queuedAt:
        typeof queue.queuedAt === "string"
          ? queue.queuedAt
          : job.createdAt.toISOString(),
      nextAttemptAt:
        typeof queue.nextAttemptAt === "string"
          ? queue.nextAttemptAt
          : job.createdAt.toISOString(),
      attempts:
        typeof queue.attempts === "number" && Number.isFinite(queue.attempts)
          ? queue.attempts
          : 0,
      maxAttempts:
        typeof queue.maxAttempts === "number" &&
        Number.isFinite(queue.maxAttempts)
          ? queue.maxAttempts
          : 3,
      timeoutMs:
        typeof queue.timeoutMs === "number" && Number.isFinite(queue.timeoutMs)
          ? queue.timeoutMs
          : 15 * 60 * 1000,
      ...(typeof queue.startedAt === "string"
        ? { startedAt: queue.startedAt }
        : {}),
      ...(typeof queue.finishedAt === "string"
        ? { finishedAt: queue.finishedAt }
        : {}),
      ...(typeof queue.failedAt === "string"
        ? { failedAt: queue.failedAt }
        : {}),
      ...(typeof queue.lastError === "string"
        ? { lastError: queue.lastError }
        : {}),
    };
  }

  private async requeueTimedOutPdfJob(
    job: DocumentProcessingJob,
    queueState: ReturnType<DocumentService["getPdfQueueState"]>,
  ): Promise<void> {
    const canRetry = queueState.attempts < queueState.maxAttempts;
    job.status = canRetry ? "uploaded" : "failed";
    job.lastError = canRetry
      ? "Попередня спроба обробки перевищила таймаут і була поставлена в повторну чергу"
      : "Обробка перевищила таймаут і вичерпала всі спроби";
    job.metadata = {
      ...(job.metadata || {}),
      queue: {
        ...queueState,
        nextAttemptAt: new Date(Date.now() + 60_000).toISOString(),
        failedAt: new Date().toISOString(),
        lastError: job.lastError,
      },
    };
    await this.documentProcessingJobRepository.save(job);
  }
}
