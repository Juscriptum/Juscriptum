import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThanOrEqual, Repository } from "typeorm";
import { AuditService } from "../../auth/services/audit.service";
import { Document } from "../../database/entities/Document.entity";
import {
  FileScanRecord,
  MalwareScanStatus,
} from "../../database/entities/FileScanRecord.entity";
import { AuditAction } from "../../database/entities/enums/subscription.enum";
import { StorageProviderService } from "./storage-provider.service";
import {
  MalwareScannerService,
  MalwareScanResult,
} from "./malware-scanner.service";
import { shouldRunScheduledTasks } from "../../common/runtime/scheduled-tasks";

@Injectable()
export class FileScanService {
  private readonly logger = new Logger(FileScanService.name);

  constructor(
    @InjectRepository(FileScanRecord)
    private readonly fileScanRepository: Repository<FileScanRecord>,
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    private readonly storageProviderService: StorageProviderService,
    private readonly malwareScannerService: MalwareScannerService,
    private readonly auditService: AuditService,
  ) {}

  async createPendingScanRecord(data: {
    tenantId: string;
    storagePath: string;
    fileName: string;
    mimeType?: string;
    metadata?: Record<string, any>;
  }): Promise<FileScanRecord> {
    const existing = await this.fileScanRepository.findOne({
      where: {
        storagePath: data.storagePath,
      },
    });

    const record =
      existing ||
      this.fileScanRepository.create({
        tenantId: data.tenantId,
        storagePath: data.storagePath,
        fileName: data.fileName,
        mimeType: data.mimeType || null,
        status: "pending",
        scannerEngine: null,
        malwareSignature: null,
        scanError: null,
        scanAttempts: 0,
        maxAttempts: 3,
        nextAttemptAt: new Date(),
        scannedAt: null,
        documentId: null,
        metadata: null,
      } as unknown as Partial<FileScanRecord>);

    Object.assign(record, {
      tenantId: data.tenantId,
      storagePath: data.storagePath,
      fileName: data.fileName,
      mimeType: data.mimeType || null,
      status: "pending",
      scannerEngine: null,
      malwareSignature: null,
      scanError: null,
      nextAttemptAt: new Date(),
      metadata: {
        ...(existing?.metadata || {}),
        ...(data.metadata || {}),
      },
    });

    const savedRecord = await this.fileScanRepository.save(record);

    await this.auditService.log({
      tenantId: data.tenantId,
      action: AuditAction.CREATE,
      entityType: "FileScanRecord",
      entityId: savedRecord.id,
      metadata: {
        event: "file_scan_queued",
        storagePath: data.storagePath,
        fileName: data.fileName,
      },
    });

    return savedRecord;
  }

  async linkDocument(
    tenantId: string,
    storagePath: string,
    documentId: string,
  ): Promise<void> {
    const record = await this.fileScanRepository.findOne({
      where: {
        tenantId,
        storagePath,
      },
    });

    if (!record) {
      throw new NotFoundException("File scan record not found");
    }

    record.documentId = documentId;
    await this.fileScanRepository.save(record);

    await this.documentRepository.update(
      { id: documentId, tenantId },
      {
        malwareScanStatus: record.status,
        malwareScannedAt: record.scannedAt,
        malwareScanner: record.scannerEngine,
        malwareSignature: record.malwareSignature,
        malwareScanError: record.scanError,
      },
    );
  }

  async getScanRecord(
    tenantId: string,
    storagePath: string,
  ): Promise<FileScanRecord | null> {
    return this.fileScanRepository.findOne({
      where: {
        tenantId,
        storagePath,
      },
    });
  }

  async markFileAsClean(data: {
    tenantId: string;
    storagePath: string;
    fileName: string;
    mimeType?: string | null;
    documentId?: string | null;
    scannerEngine?: string;
    metadata?: Record<string, any>;
  }): Promise<FileScanRecord> {
    const existing = await this.fileScanRepository.findOne({
      where: {
        tenantId: data.tenantId,
        storagePath: data.storagePath,
      },
    });

    const record =
      existing ||
      this.fileScanRepository.create({
        tenantId: data.tenantId,
        storagePath: data.storagePath,
        fileName: data.fileName,
        mimeType: data.mimeType || null,
        status: "clean",
        scannerEngine: data.scannerEngine || "internal_trusted",
        malwareSignature: null,
        scanError: null,
        scanAttempts: 0,
        maxAttempts: 1,
        nextAttemptAt: new Date("2999-01-01T00:00:00.000Z"),
        scannedAt: new Date(),
        documentId: data.documentId || null,
        metadata: null,
      } as unknown as Partial<FileScanRecord>);

    Object.assign(record, {
      tenantId: data.tenantId,
      storagePath: data.storagePath,
      fileName: data.fileName,
      mimeType: data.mimeType || null,
      status: "clean",
      scannerEngine: data.scannerEngine || "internal_trusted",
      malwareSignature: null,
      scanError: null,
      scannedAt: new Date(),
      nextAttemptAt: new Date("2999-01-01T00:00:00.000Z"),
      documentId: data.documentId || existing?.documentId || null,
      metadata: {
        ...(existing?.metadata || {}),
        ...(data.metadata || {}),
      },
    });

    const savedRecord = await this.fileScanRepository.save(record);
    await this.syncDocumentState(savedRecord);

    await this.auditService.log({
      tenantId: data.tenantId,
      action: AuditAction.VERIFY,
      entityType: "FileScanRecord",
      entityId: savedRecord.id,
      metadata: {
        event: "file_scan_marked_clean_internal",
        storagePath: data.storagePath,
        fileName: data.fileName,
        engine: savedRecord.scannerEngine,
      },
    });

    return savedRecord;
  }

  async assertFileIsSafe(tenantId: string, storagePath: string): Promise<void> {
    const record = await this.getScanRecord(tenantId, storagePath);
    if (!record) {
      throw new ForbiddenException("File cannot be served before malware scan");
    }

    if (record.status !== "clean") {
      const messageByStatus: Record<MalwareScanStatus, string> = {
        pending: "File is still pending malware scan",
        clean: "File is clean",
        infected: "File was blocked by malware scanner",
        failed: "File cannot be served because malware scan failed",
      };

      throw new ForbiddenException(messageByStatus[record.status]);
    }
  }

  async processDueScans(limit: number = 20): Promise<number> {
    const records = await this.fileScanRepository.find({
      where: [
        { status: "pending", nextAttemptAt: LessThanOrEqual(new Date()) },
        { status: "failed", nextAttemptAt: LessThanOrEqual(new Date()) },
      ],
      order: {
        nextAttemptAt: "ASC",
      },
      take: limit,
    });

    for (const record of records) {
      await this.processScan(record.id);
    }

    return records.length;
  }

  async processScan(recordId: string): Promise<void> {
    const record = await this.fileScanRepository.findOne({
      where: { id: recordId },
    });

    if (!record) {
      throw new NotFoundException("File scan record not found");
    }

    record.scanAttempts += 1;
    record.scanError = null;
    await this.fileScanRepository.save(record);

    try {
      const download = await this.storageProviderService.download({
        path: record.storagePath,
      });
      const result = await this.malwareScannerService.scanFile(
        record.fileName,
        download.buffer,
      );
      await this.applyScanResult(record, result);
    } catch (error: unknown) {
      await this.applyFailure(
        record,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processPendingScans(): Promise<void> {
    if (!shouldRunScheduledTasks()) {
      return;
    }

    const processed = await this.processDueScans();
    if (processed > 0) {
      this.logger.log(`Processed ${processed} malware scan job(s)`);
    }
  }

  private async applyScanResult(
    record: FileScanRecord,
    result: MalwareScanResult,
  ): Promise<void> {
    record.status = result.status;
    record.scannedAt = new Date();
    record.scannerEngine = result.engine;
    record.malwareSignature = result.signature || null;
    record.scanError = null;
    record.nextAttemptAt = new Date("2999-01-01T00:00:00.000Z");
    await this.fileScanRepository.save(record);

    await this.syncDocumentState(record);

    await this.auditService.log({
      tenantId: record.tenantId,
      action:
        result.status === "infected" ? AuditAction.REVOKE : AuditAction.VERIFY,
      entityType: "FileScanRecord",
      entityId: record.id,
      metadata: {
        event:
          result.status === "infected"
            ? "file_scan_infected"
            : "file_scan_clean",
        storagePath: record.storagePath,
        engine: result.engine,
        signature: result.signature,
      },
    });
  }

  private async applyFailure(
    record: FileScanRecord,
    message: string,
  ): Promise<void> {
    const hasAttemptsLeft = record.scanAttempts < record.maxAttempts;
    record.status = "failed";
    record.scanError = message;
    record.scannerEngine = record.scannerEngine || "unavailable";
    record.nextAttemptAt = hasAttemptsLeft
      ? new Date(Date.now() + record.scanAttempts * 60 * 1000)
      : new Date("2999-01-01T00:00:00.000Z");
    await this.fileScanRepository.save(record);

    await this.syncDocumentState(record);

    await this.auditService.log({
      tenantId: record.tenantId,
      action: AuditAction.UPDATE,
      entityType: "FileScanRecord",
      entityId: record.id,
      metadata: {
        event: hasAttemptsLeft
          ? "file_scan_retry_scheduled"
          : "file_scan_failed",
        storagePath: record.storagePath,
        reason: message,
        attemptCount: record.scanAttempts,
      },
    });
  }

  private async syncDocumentState(record: FileScanRecord): Promise<void> {
    if (!record.documentId) {
      return;
    }

    await this.documentRepository.update(
      { id: record.documentId, tenantId: record.tenantId },
      {
        malwareScanStatus: record.status,
        malwareScannedAt: record.scannedAt,
        malwareScanner: record.scannerEngine,
        malwareSignature: record.malwareSignature,
        malwareScanError: record.scanError,
      },
    );
  }
}
