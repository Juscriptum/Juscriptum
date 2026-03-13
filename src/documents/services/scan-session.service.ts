import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { PDFDocument } from "pdf-lib";
import * as QRCode from "qrcode";
import * as crypto from "crypto";
import { IsNull, Repository } from "typeorm";
import { JwtPayload } from "../../auth/interfaces/jwt.interface";
import { assertSameTenant } from "../../common/security/access-control";
import { Case } from "../../database/entities/Case.entity";
import { Client } from "../../database/entities/Client.entity";
import { Document } from "../../database/entities/Document.entity";
import { ScanPage } from "../../database/entities/ScanPage.entity";
import {
  ScanDocumentFormat,
  ScanDestinationScope,
  ScanSession,
  ScanSessionStatus,
} from "../../database/entities/ScanSession.entity";
import { FileStorageService } from "../../file-storage/services/file-storage.service";
import {
  CreateScanSessionDto,
  FinalizeScanSessionDto,
  ReorderScanPagesDto,
  ScanSessionStatusResponseDto,
  UploadScanPageDto,
} from "../dto/scan-session.dto";
import { FileScanService } from "../../file-storage/services/file-scan.service";

const MAX_SCAN_PAGES = 50;
const MAX_PAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_SESSION_BYTES = 200 * 1024 * 1024;
const DEFAULT_SESSION_LIFETIME_MS = 8 * 60 * 60 * 1000;

@Injectable()
export class ScanSessionService {
  constructor(
    @InjectRepository(ScanSession)
    private readonly scanSessionRepository: Repository<ScanSession>,
    @InjectRepository(ScanPage)
    private readonly scanPageRepository: Repository<ScanPage>,
    @InjectRepository(Case)
    private readonly caseRepository: Repository<Case>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    private readonly fileStorageService: FileStorageService,
    private readonly fileScanService: FileScanService,
    private readonly configService: ConfigService,
  ) {}

  async createSession(
    tenantId: string,
    userId: string,
    dto: CreateScanSessionDto,
    actor?: JwtPayload,
  ): Promise<{
    sessionId: string;
    mobileUrl: string;
    desktopUrl: string;
    qrCode: string;
    expiresAt: Date;
    status: ScanSessionStatus;
  }> {
    if (actor) {
      assertSameTenant(actor, tenantId);
    }
    const destinationScope = dto.destinationScope || "root";
    let clientId: string | null = null;
    let caseId: string | null = null;

    if (destinationScope === "client") {
      if (!dto.clientId) {
        throw new BadRequestException(
          "Для розміщення в папці клієнта потрібно обрати клієнта",
        );
      }

      const clientRecord = await this.clientRepository.findOne({
        where: { id: dto.clientId, tenantId, deletedAt: IsNull() },
      });

      if (!clientRecord) {
        throw new NotFoundException("Клієнта не знайдено");
      }

      clientId = clientRecord.id;

      if (dto.caseId) {
        const caseRecord = await this.caseRepository.findOne({
          where: { id: dto.caseId, tenantId, deletedAt: IsNull() },
        });

        if (!caseRecord) {
          throw new NotFoundException("Справу не знайдено");
        }

        if (caseRecord.clientId !== clientId) {
          throw new BadRequestException("Справа не належить обраному клієнту");
        }

        caseId = caseRecord.id;
      }
    } else if (dto.caseId) {
      throw new BadRequestException(
        "Справу можна вибрати лише разом з клієнтом",
      );
    }

    const token = crypto.randomBytes(24).toString("hex");
    const tokenHash = this.hashToken(token);
    const frontendBaseUrl = this.getFrontendBaseUrl();
    const sessionId = crypto.randomUUID();
    const mobileUrl = `${frontendBaseUrl}/mobile-scan?session=${sessionId}&token=${token}`;
    const desktopUrl = `${frontendBaseUrl}/documents/scan-session?sessionId=${sessionId}`;
    const expiresAt = this.getNextSessionExpiry();

    const session = this.scanSessionRepository.create({
      id: sessionId,
      tenantId,
      caseId,
      clientId,
      createdByUserId: userId,
      tokenHash,
      status: "created",
      mobileUrl,
      desktopUrl,
      expiresAt,
      documentFormat: dto.documentFormat || "A4",
      destinationScope,
      ocrStatus: "pending",
    });

    await this.scanSessionRepository.save(session);
    const qrCode = await QRCode.toDataURL(mobileUrl, { margin: 1, width: 320 });

    return {
      sessionId: session.id,
      mobileUrl,
      desktopUrl,
      qrCode,
      expiresAt,
      status: session.status,
    };
  }

  async getStatus(
    tenantId: string,
    sessionId: string,
    actor?: JwtPayload,
  ): Promise<ScanSessionStatusResponseDto> {
    if (actor) {
      assertSameTenant(actor, tenantId);
    }

    const session = await this.findSessionOrThrow(sessionId, tenantId);
    const pages = await this.scanPageRepository.find({
      where: { scanSessionId: session.id },
      order: { pageNumber: "ASC", createdAt: "ASC" },
    });

    return this.toStatusResponse(session, pages);
  }

  async openMobileSession(
    sessionId: string,
    token: string,
  ): Promise<ScanSessionStatusResponseDto> {
    const session = await this.validateMobileAccess(sessionId, token);
    const pages = await this.scanPageRepository.find({
      where: { scanSessionId: session.id },
      order: { pageNumber: "ASC", createdAt: "ASC" },
    });

    if (session.status === "created") {
      session.status = "opened";
      session.startedAt = session.startedAt || new Date();
    }

    this.refreshSessionExpiry(session);
    await this.scanSessionRepository.save(session);

    return this.toStatusResponse(session, pages);
  }

  async uploadPage(
    sessionId: string,
    file: Express.Multer.File,
    dto: UploadScanPageDto,
  ): Promise<ScanSessionStatusResponseDto> {
    const session = await this.validateMobileAccess(sessionId, dto.token);
    const existingPages = await this.scanPageRepository.find({
      where: { scanSessionId: session.id },
      order: { pageNumber: "ASC", createdAt: "ASC" },
    });

    if (existingPages.length >= MAX_SCAN_PAGES) {
      throw new BadRequestException(
        "До одного скану можна додати не більше 50 сторінок",
      );
    }

    if (!file) {
      throw new BadRequestException("Зображення сторінки не передано");
    }

    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.mimetype)) {
      throw new BadRequestException("Підтримуються лише JPG та PNG");
    }

    if (file.size > MAX_PAGE_SIZE_BYTES) {
      throw new BadRequestException("Розмір сторінки перевищує 10 МБ");
    }

    const nextTotalBytes =
      Number(session.totalBytes || 0) + Number(file.size || 0);
    if (nextTotalBytes > MAX_SESSION_BYTES) {
      throw new BadRequestException("Сумарний розмір скану перевищує 200 МБ");
    }

    session.status = "uploading";
    session.startedAt = session.startedAt || new Date();
    this.refreshSessionExpiry(session);
    await this.scanSessionRepository.save(session);

    const uploadResult = await this.fileStorageService.uploadFile(
      session.tenantId,
      session.createdByUserId,
      file,
      {
        caseId: session.caseId || undefined,
        clientId: session.clientId || undefined,
        folder: "scan-sessions",
        isPublic: false,
        metadata: {
          scanSessionId: session.id,
          clientPageNumber: String(dto.clientPageNumber),
        },
      },
    );

    const page = this.scanPageRepository.create({
      scanSessionId: session.id,
      pageNumber: dto.clientPageNumber,
      status: "uploaded",
      originalFilePath: uploadResult.path,
      thumbnailPath: uploadResult.url,
      fileSize: file.size,
      width: null,
      height: null,
      rotation: dto.rotation || 0,
    });

    await this.scanPageRepository.save(page);
    await this.normalizePageNumbers(session.id);

    const refreshedPages = await this.scanPageRepository.find({
      where: { scanSessionId: session.id },
      order: { pageNumber: "ASC", createdAt: "ASC" },
    });

    session.status = refreshedPages.length > 0 ? "uploaded" : "capturing";
    session.pagesCount = refreshedPages.length;
    session.uploadedPages = refreshedPages.length;
    session.totalBytes = refreshedPages.reduce(
      (total, item) => total + Number(item.fileSize || 0),
      0,
    );
    this.refreshSessionExpiry(session);
    await this.scanSessionRepository.save(session);

    return this.toStatusResponse(session, refreshedPages);
  }

  async deletePage(
    sessionId: string,
    pageId: string,
    token: string,
  ): Promise<ScanSessionStatusResponseDto> {
    const session = await this.validateMobileAccess(sessionId, token);
    const page = await this.scanPageRepository.findOne({
      where: { id: pageId, scanSessionId: session.id },
    });

    if (!page) {
      throw new NotFoundException("Сторінку не знайдено");
    }

    if (page.originalFilePath) {
      await this.fileStorageService.deleteFile(
        session.tenantId,
        page.originalFilePath,
      );
    }

    await this.scanPageRepository.delete(page.id);
    await this.normalizePageNumbers(session.id);

    const refreshedPages = await this.scanPageRepository.find({
      where: { scanSessionId: session.id },
      order: { pageNumber: "ASC", createdAt: "ASC" },
    });

    session.pagesCount = refreshedPages.length;
    session.uploadedPages = refreshedPages.length;
    session.totalBytes = refreshedPages.reduce(
      (total, item) => total + Number(item.fileSize || 0),
      0,
    );
    session.status = refreshedPages.length === 0 ? "opened" : "capturing";
    this.refreshSessionExpiry(session);
    await this.scanSessionRepository.save(session);

    return this.toStatusResponse(session, refreshedPages);
  }

  async reorderPages(
    sessionId: string,
    dto: ReorderScanPagesDto,
  ): Promise<ScanSessionStatusResponseDto> {
    const session = await this.validateMobileAccess(sessionId, dto.token);
    const pages = await this.scanPageRepository.find({
      where: { scanSessionId: session.id },
    });

    const pageMap = new Map(pages.map((page) => [page.id, page]));
    dto.pages.forEach((item) => {
      const page = pageMap.get(item.pageId);
      if (page) {
        page.pageNumber = item.pageNumber;
      }
    });

    await this.scanPageRepository.save([...pageMap.values()]);
    await this.normalizePageNumbers(session.id);

    const refreshedPages = await this.scanPageRepository.find({
      where: { scanSessionId: session.id },
      order: { pageNumber: "ASC", createdAt: "ASC" },
    });

    this.refreshSessionExpiry(session);
    await this.scanSessionRepository.save(session);

    return this.toStatusResponse(session, refreshedPages);
  }

  async finalizeSession(
    sessionId: string,
    dto: FinalizeScanSessionDto,
  ): Promise<ScanSessionStatusResponseDto> {
    const session = await this.validateMobileAccess(sessionId, dto.token);
    const pages = await this.scanPageRepository.find({
      where: { scanSessionId: session.id },
      order: { pageNumber: "ASC", createdAt: "ASC" },
    });

    if (pages.length === 0) {
      throw new BadRequestException("Немає жодної сторінки для формування PDF");
    }

    if (session.finalDocumentId) {
      throw new BadRequestException("Скан уже завершено");
    }

    session.documentFormat = dto.documentFormat || session.documentFormat;
    session.status = "assembling_pdf";
    this.refreshSessionExpiry(session);
    await this.scanSessionRepository.save(session);

    try {
      const pdfBuffer = await this.buildPdfFromPages(
        session.tenantId,
        pages,
        session.documentFormat,
      );
      const uploadedPdf = await this.fileStorageService.uploadFile(
        session.tenantId,
        session.createdByUserId,
        {
          fieldname: "file",
          originalname: `scan-${session.id}.pdf`,
          encoding: "7bit",
          mimetype: "application/pdf",
          size: pdfBuffer.length,
          destination: "",
          filename: `scan-${session.id}.pdf`,
          path: "",
          buffer: pdfBuffer,
          stream: undefined as never,
        },
        {
          caseId: session.caseId || undefined,
          clientId: session.clientId || undefined,
          folder: "documents",
          isPublic: false,
          metadata: {
            sourceKind: "scan_session",
            scanSessionId: session.id,
            ocrStatus: "not_configured",
          },
        },
      );

      const documentSeed: Partial<Document> = {
        tenantId: session.tenantId,
        caseId: session.caseId ?? undefined,
        clientId: session.clientId ?? undefined,
        fileName: uploadedPdf.path.split("/").pop() || uploadedPdf.path,
        originalName: `${this.buildScanFileName(new Date())}.pdf`,
        type: "other",
        description: "PDF, сформований із мобільного скану",
        mimeType: "application/pdf",
        fileSize: pdfBuffer.length,
        status: "draft",
        storagePath: uploadedPdf.path,
        cdnUrl: uploadedPdf.url,
        malwareScanStatus: uploadedPdf.malwareScanStatus || "pending",
        accessLevel: "internal",
        accessScope: "assigned",
        uploadedBy: session.createdByUserId,
        uploadedAt: new Date(),
        createdBy: session.createdByUserId,
        updatedBy: session.createdByUserId,
        metadata: {
          sourceKind: "scan_session",
          scanSessionId: session.id,
          scanPagesCount: pages.length,
          documentFormat: session.documentFormat,
          destinationScope: session.destinationScope,
          ocrStatus: "not_configured",
        },
      };

      const document = this.documentRepository.create(documentSeed);

      const savedDocument = await this.documentRepository.save(document);
      await this.fileScanService.markFileAsClean({
        tenantId: session.tenantId,
        storagePath: savedDocument.storagePath,
        fileName: savedDocument.originalName,
        mimeType: savedDocument.mimeType,
        documentId: savedDocument.id,
        scannerEngine: "internal_scan_pdf",
        metadata: {
          sourceKind: "scan_session",
          scanSessionId: session.id,
        },
      });

      pages.forEach((page) => {
        page.status = "processed";
      });
      await this.scanPageRepository.save(pages);

      session.status = "completed";
      session.completedAt = new Date();
      session.finalDocumentId = savedDocument.id;
      session.processedPages = pages.length;
      session.ocrStatus = "not_configured";
      session.lastError = null;
      await this.scanSessionRepository.save(session);

      return this.toStatusResponse(session, pages);
    } catch (error) {
      session.status = "failed";
      session.lastError =
        error instanceof Error
          ? error.message
          : "Не вдалося завершити сканування";
      session.ocrStatus = "failed";
      await this.scanSessionRepository.save(session);
      throw error;
    }
  }

  private async buildPdfFromPages(
    tenantId: string,
    pages: ScanPage[],
    format: ScanDocumentFormat,
  ): Promise<Buffer> {
    const pdf = await PDFDocument.create();

    for (const page of pages) {
      if (!page.originalFilePath) {
        throw new BadRequestException("У сторінки відсутній оригінальний файл");
      }

      const originalFilePath = page.originalFilePath;
      const buffer = await this.fileStorageService
        .downloadFile(tenantId, originalFilePath)
        .catch(async (error) => {
          if (
            error instanceof ForbiddenException &&
            /malware scan/i.test(error.message)
          ) {
            return this.fileStorageService.downloadFileForInternalProcessing(
              tenantId,
              originalFilePath,
            );
          }

          throw error;
        });

      const isPng = originalFilePath.toLowerCase().endsWith(".png");
      const image = isPng
        ? await pdf.embedPng(buffer)
        : await pdf.embedJpg(buffer);
      const imageDims = image.scale(1);

      if (format === "Original") {
        const pdfPage = pdf.addPage([imageDims.width, imageDims.height]);
        pdfPage.drawImage(image, {
          x: 0,
          y: 0,
          width: imageDims.width,
          height: imageDims.height,
        });
        continue;
      }

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const pdfPage = pdf.addPage([pageWidth, pageHeight]);
      const ratio = Math.min(
        pageWidth / imageDims.width,
        pageHeight / imageDims.height,
      );
      const targetWidth = imageDims.width * ratio;
      const targetHeight = imageDims.height * ratio;

      pdfPage.drawImage(image, {
        x: (pageWidth - targetWidth) / 2,
        y: (pageHeight - targetHeight) / 2,
        width: targetWidth,
        height: targetHeight,
      });
    }

    return Buffer.from(await pdf.save());
  }

  private async normalizePageNumbers(sessionId: string): Promise<void> {
    const pages = await this.scanPageRepository.find({
      where: { scanSessionId: sessionId },
      order: { pageNumber: "ASC", createdAt: "ASC" },
    });

    pages.forEach((page, index) => {
      page.pageNumber = index + 1;
    });
    await this.scanPageRepository.save(pages);
  }

  private async findSessionOrThrow(
    sessionId: string,
    tenantId?: string,
  ): Promise<ScanSession> {
    const session = await this.scanSessionRepository.findOne({
      where: { id: sessionId, ...(tenantId ? { tenantId } : {}) },
    });

    if (!session) {
      throw new NotFoundException("Сесію сканування не знайдено");
    }

    const now = Date.now();
    if (session.expiresAt.getTime() <= now && session.status !== "completed") {
      if (this.canResumeActiveSession(session, now)) {
        session.status = this.getActiveSessionStatus(session);
        this.refreshSessionExpiry(session, now);
        await this.scanSessionRepository.save(session);
        return session;
      }

      session.status = "expired";
      await this.scanSessionRepository.save(session);
      throw new ForbiddenException("Сесія сканування вже прострочена");
    }

    return session;
  }

  private async validateMobileAccess(
    sessionId: string,
    token: string,
  ): Promise<ScanSession> {
    const session = await this.findSessionOrThrow(sessionId);

    if (session.tokenHash !== this.hashToken(token)) {
      throw new ForbiddenException("Невірний токен сканування");
    }

    if (
      ["completed", "cancelled", "failed", "expired"].includes(session.status)
    ) {
      throw new BadRequestException("Сесія сканування вже недоступна");
    }

    return session;
  }

  private toStatusResponse(
    session: ScanSession,
    pages: ScanPage[],
  ): ScanSessionStatusResponseDto {
    return {
      id: session.id,
      status: session.status,
      pagesCount: session.pagesCount,
      uploadedPages: session.uploadedPages,
      processedPages: session.processedPages,
      finalDocumentId: session.finalDocumentId,
      caseId: session.caseId,
      clientId: session.clientId,
      destinationScope: session.destinationScope,
      mobileUrl: session.mobileUrl,
      desktopUrl: session.desktopUrl,
      expiresAt: session.expiresAt,
      documentFormat: session.documentFormat,
      ocrStatus: session.ocrStatus,
      lastError: session.lastError,
      pages: pages.map((page) => ({
        id: page.id,
        pageNumber: page.pageNumber,
        status: page.status,
        previewUrl: page.thumbnailPath,
        rotation: page.rotation,
        fileSize: Number(page.fileSize || 0),
      })),
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  private getSessionLifetimeMs(): number {
    const lifetimeMinutes = Number(
      this.configService.get<string>("SCAN_SESSION_LIFETIME_MINUTES"),
    );

    if (Number.isFinite(lifetimeMinutes) && lifetimeMinutes > 0) {
      return lifetimeMinutes * 60 * 1000;
    }

    return DEFAULT_SESSION_LIFETIME_MS;
  }

  private getNextSessionExpiry(now = Date.now()): Date {
    return new Date(now + this.getSessionLifetimeMs());
  }

  private refreshSessionExpiry(session: ScanSession, now = Date.now()): void {
    if (["completed", "cancelled", "failed"].includes(session.status)) {
      return;
    }

    session.expiresAt = this.getNextSessionExpiry(now);
  }

  private canResumeActiveSession(
    session: ScanSession,
    now = Date.now(),
  ): boolean {
    if (["completed", "cancelled", "failed"].includes(session.status)) {
      return false;
    }

    const lastActivityAt =
      session.updatedAt?.getTime() ||
      session.startedAt?.getTime() ||
      session.createdAt?.getTime() ||
      0;

    return lastActivityAt + this.getSessionLifetimeMs() > now;
  }

  private getActiveSessionStatus(session: ScanSession): ScanSessionStatus {
    if (session.status !== "expired") {
      return session.status;
    }

    if (session.finalDocumentId) {
      return "completed";
    }

    if (session.pagesCount > 0 || session.uploadedPages > 0) {
      return "uploaded";
    }

    if (session.startedAt) {
      return "opened";
    }

    return "created";
  }

  private getFrontendBaseUrl(): string {
    const mobileScanBaseUrl =
      this.configService.get<string>("MOBILE_SCAN_BASE_URL") ||
      this.configService.get<string>("APP_URL");
    return (mobileScanBaseUrl || "http://localhost:5173").replace(/\/$/, "");
  }

  private buildScanFileName(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, "0");
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = String(date.getFullYear()).slice(-2);
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return `Скан-${day}${month}${year}-${hours}${minutes}`;
  }
}
