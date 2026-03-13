import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { StorageProviderService } from "./storage-provider.service";
import { FileScanService } from "./file-scan.service";
import {
  FileUploadOptions,
  FileUploadResult,
  StorageQuota,
} from "../interfaces/file-storage.interfaces";
import * as crypto from "crypto";
import { readFile, unlink } from "fs/promises";

/**
 * Allowed file types for upload
 */
const ALLOWED_MIME_TYPES = [
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
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "text/plain",
  "text/markdown",
  "text/csv",
  "text/html",
  "text/xml",
];

/**
 * Maximum file size per plan (in bytes)
 */
const PLAN_LIMITS: Record<string, number> = {
  basic: 10 * 1024 * 1024, // 10 MB
  professional: 50 * 1024 * 1024, // 50 MB
  enterprise: 100 * 1024 * 1024, // 100 MB
};

/**
 * Storage quotas per plan (in GB)
 */
const STORAGE_QUOTAS: Record<string, number> = {
  basic: 1, // 1 GB
  professional: 10, // 10 GB
  enterprise: 100, // 100 GB
};

/**
 * File Storage Service
 *
 * High-level service that provides business logic for file operations
 */
@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly storageProvider: StorageProviderService,
    private readonly fileScanService: FileScanService,
  ) {}

  /**
   * Upload file with validation and quota check
   */
  async uploadFile(
    tenantId: string,
    userId: string,
    file: Express.Multer.File,
    options: {
      caseId?: string;
      clientId?: string;
      folder?: string;
      isPublic?: boolean;
      metadata?: Record<string, string>;
    } = {},
  ): Promise<FileUploadResult> {
    const fileBuffer =
      file.buffer && file.buffer.length > 0
        ? file.buffer
        : file.path
          ? await readFile(file.path)
          : null;

    if (!fileBuffer) {
      throw new BadRequestException("Uploaded file payload is empty");
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(`Unsupported file type: ${file.mimetype}`);
    }

    // Validate file size (basic check)
    const maxSize = PLAN_LIMITS.basic; // Default to basic limit
    if (file.size > maxSize) {
      throw new BadRequestException(
        `Файл завеликий. Максимальний розмір: ${maxSize / (1024 * 1024)} МБ`,
      );
    }

    // Generate unique file name
    const fileExtension = file.originalname.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExtension}`;

    // Build storage path
    const path = this.buildStoragePath(
      tenantId,
      options.folder,
      options.caseId,
      options.clientId,
    );

    // Prepare upload options
    const uploadOptions: FileUploadOptions = {
      path,
      fileName,
      buffer: fileBuffer,
      contentType: file.mimetype,
      metadata: {
        originalName: file.originalname,
        uploadedBy: userId,
        ...options.metadata,
      },
      isPublic: options.isPublic || false,
    };

    // Upload file
    const result = await this.storageProvider.upload(uploadOptions);
    const scanRecord = await this.fileScanService.createPendingScanRecord({
      tenantId,
      storagePath: result.path,
      fileName: file.originalname,
      mimeType: file.mimetype,
      metadata: {
        uploadedBy: userId,
        originalName: file.originalname,
        fileSize: file.size,
      },
    });

    if (file.path) {
      await unlink(file.path).catch(() => undefined);
    }

    this.logger.log(`File uploaded for tenant ${tenantId}: ${fileName}`);
    return {
      ...result,
      malwareScanStatus: scanRecord.status,
      malwareScanId: scanRecord.id,
    };
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    tenantId: string,
    userId: string,
    files: Express.Multer.File[],
    options: {
      caseId?: string;
      clientId?: string;
      folder?: string;
      isPublic?: boolean;
    } = {},
  ): Promise<{
    success: FileUploadResult[];
    failed: Array<{ fileName: string; error: string }>;
  }> {
    const results = {
      success: [] as FileUploadResult[],
      failed: [] as Array<{ fileName: string; error: string }>,
    };

    for (const file of files) {
      try {
        const result = await this.uploadFile(tenantId, userId, file, options);
        results.success.push(result);
      } catch (error: unknown) {
        results.failed.push({
          fileName: file.originalname,
          error:
            error instanceof Error
              ? error.message
              : String(error) || "Upload failed",
        });
      }
    }

    return results;
  }

  /**
   * Download file
   */
  async downloadFile(tenantId: string, storagePath: string): Promise<Buffer> {
    this.validateTenantAccess(storagePath, tenantId);
    await this.fileScanService.assertFileIsSafe(tenantId, storagePath);

    const result = await this.storageProvider.download({ path: storagePath });
    return result.buffer;
  }

  /**
   * Download file for internal processing pipelines without serving it to users.
   * This intentionally bypasses the malware-serve gate because the file stays
   * inside trusted backend processing.
   */
  async downloadFileForInternalProcessing(
    tenantId: string,
    storagePath: string,
  ): Promise<Buffer> {
    this.validateTenantAccess(storagePath, tenantId);

    const result = await this.storageProvider.download({ path: storagePath });
    return result.buffer;
  }

  /**
   * Generate signed URL for file
   */
  async generateSignedUrl(
    tenantId: string,
    storagePath: string,
    options: {
      expiresIn?: number;
      disposition?: "attachment" | "inline";
      contentType?: string;
    } = {},
  ): Promise<string> {
    this.validateTenantAccess(storagePath, tenantId);
    await this.fileScanService.assertFileIsSafe(tenantId, storagePath);

    return this.storageProvider.generateSignedUrl({
      path: storagePath,
      expiresIn: options.expiresIn,
      disposition: options.disposition,
      contentType: options.contentType,
    });
  }

  /**
   * Delete file
   */
  async deleteFile(tenantId: string, storagePath: string): Promise<void> {
    this.validateTenantAccess(storagePath, tenantId);

    await this.storageProvider.delete(storagePath);
    this.logger.log(`File deleted for tenant ${tenantId}: ${storagePath}`);
  }

  /**
   * Delete multiple files
   */
  async deleteFiles(tenantId: string, storagePaths: string[]): Promise<void> {
    // Validate all paths belong to the tenant
    for (const path of storagePaths) {
      this.validateTenantAccess(path, tenantId);
    }

    await this.storageProvider.deleteMultiple(storagePaths);
    this.logger.log(
      `Deleted ${storagePaths.length} files for tenant ${tenantId}`,
    );
  }

  /**
   * Copy file
   */
  async copyFile(
    tenantId: string,
    sourcePath: string,
    destinationPath: string,
  ): Promise<FileUploadResult> {
    this.validateTenantAccess(sourcePath, tenantId);
    this.validateTenantAccess(destinationPath, tenantId);

    return this.storageProvider.copy(sourcePath, destinationPath);
  }

  /**
   * Move file
   */
  async moveFile(
    tenantId: string,
    sourcePath: string,
    destinationPath: string,
  ): Promise<FileUploadResult> {
    this.validateTenantAccess(sourcePath, tenantId);
    this.validateTenantAccess(destinationPath, tenantId);

    return this.storageProvider.move(sourcePath, destinationPath);
  }

  /**
   * Check if file exists
   */
  async fileExists(tenantId: string, storagePath: string): Promise<boolean> {
    this.validateTenantAccess(storagePath, tenantId);

    return this.storageProvider.exists(storagePath);
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(tenantId: string, storagePath: string) {
    this.validateTenantAccess(storagePath, tenantId);

    const [metadata, scanRecord] = await Promise.all([
      this.storageProvider.getMetadata(storagePath),
      this.fileScanService.getScanRecord(tenantId, storagePath),
    ]);

    return {
      ...metadata,
      malwareScan: scanRecord
        ? {
            id: scanRecord.id,
            status: scanRecord.status,
            scannedAt: scanRecord.scannedAt,
            scannerEngine: scanRecord.scannerEngine,
            malwareSignature: scanRecord.malwareSignature,
            scanError: scanRecord.scanError,
            attempts: scanRecord.scanAttempts,
          }
        : null,
    };
  }

  /**
   * Get storage quota for tenant
   */
  async getStorageQuota(
    tenantId: string,
    plan: string = "basic",
  ): Promise<StorageQuota> {
    const quotaGB = STORAGE_QUOTAS[plan] || STORAGE_QUOTAS.basic;
    const total = quotaGB * 1024 * 1024 * 1024;

    const prefix = `tenants/${tenantId}/`;
    const used = await this.storageProvider.getStorageUsage(prefix);

    return {
      total,
      used,
      available: total - used,
      usagePercentage: (used / total) * 100,
    };
  }

  /**
   * Validate file before upload
   */
  validateFile(file: Express.Multer.File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: "No file provided" };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return { valid: false, error: `Unsupported file type: ${file.mimetype}` };
    }

    if (file.size > PLAN_LIMITS.basic) {
      return {
        valid: false,
        error: `Файл завеликий. Максимальний розмір: ${PLAN_LIMITS.basic / (1024 * 1024)} МБ`,
      };
    }

    return { valid: true };
  }

  /**
   * Get allowed MIME types
   */
  getAllowedMimeTypes(): string[] {
    return ALLOWED_MIME_TYPES;
  }

  /**
   * Get file size limit for a plan
   */
  getFileSizeLimit(plan: string = "basic"): number {
    return PLAN_LIMITS[plan] || PLAN_LIMITS.basic;
  }

  /**
   * Build storage path
   */
  private buildStoragePath(
    tenantId: string,
    folder?: string,
    caseId?: string,
    clientId?: string,
  ): string {
    let path = `tenants/${tenantId}/`;

    if (folder) {
      path += `${folder}/`;
    }

    if (caseId) {
      path += `cases/${caseId}/`;
    }

    if (clientId) {
      path += `clients/${clientId}/`;
    }

    return path;
  }

  /**
   * Validate tenant access to storage path
   */
  private validateTenantAccess(storagePath: string, tenantId: string): void {
    const tenantPrefix = `tenants/${tenantId}/`;
    if (!storagePath.startsWith(tenantPrefix)) {
      throw new BadRequestException("Access denied to file");
    }
  }
}
