import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  IStorageProvider,
  FileUploadOptions,
  FileUploadResult,
  FileDownloadOptions,
  FileDownloadResult,
  SignedUrlOptions,
  FileMetadata,
  FileVersion,
} from "../interfaces/file-storage.interfaces";
import { S3StorageService } from "../providers/s3-storage.service";
import { LocalStorageService } from "../providers/local-storage.service";

/**
 * Storage Provider Service
 *
 * Provides the appropriate storage provider based on configuration
 */
@Injectable()
export class StorageProviderService {
  private readonly logger = new Logger(StorageProviderService.name);
  private provider: IStorageProvider;

  constructor(
    private readonly configService: ConfigService,
    private readonly s3StorageService: S3StorageService,
    private readonly localStorageService: LocalStorageService,
  ) {
    this.provider = this.getStorageService();
    this.logger.log(`Storage provider initialized: ${this.getProviderType()}`);
  }

  /**
   * Get the storage provider type
   */
  getProviderType(): string {
    const provider = this.configService.get<string>(
      "STORAGE_PROVIDER",
      "local",
    );
    return provider;
  }

  /**
   * Get the appropriate storage service
   */
  getStorageService(): IStorageProvider {
    const provider = this.configService.get<string>(
      "STORAGE_PROVIDER",
      "local",
    );

    switch (provider) {
      case "s3":
        return this.s3StorageService;
      case "local":
      default:
        return this.localStorageService;
    }
  }

  private isDevS3FallbackEnabled(): boolean {
    const provider = this.configService.get<string>(
      "STORAGE_PROVIDER",
      "local",
    );
    const nodeEnv = this.configService.get<string>("NODE_ENV", "development");
    return provider === "s3" && nodeEnv !== "production";
  }

  private shouldFallbackToLocal(error: unknown): boolean {
    if (!this.isDevS3FallbackEnabled()) {
      return false;
    }

    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: string }).code || "")
        : "";

    return ["ENOTFOUND", "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT"].includes(
      code,
    );
  }

  private async withProviderFallback<T>(
    operation: string,
    action: (provider: IStorageProvider) => Promise<T>,
  ): Promise<T> {
    try {
      return await action(this.provider);
    } catch (error) {
      if (!this.shouldFallbackToLocal(error)) {
        throw error;
      }

      this.logger.warn(
        `Storage provider ${this.getProviderType()} failed during ${operation}; falling back to local storage for development`,
      );
      return action(this.localStorageService);
    }
  }

  /**
   * Upload a file
   */
  async upload(options: FileUploadOptions): Promise<FileUploadResult> {
    return this.withProviderFallback("upload", (provider) =>
      provider.upload(options),
    );
  }

  /**
   * Download a file
   */
  async download(options: FileDownloadOptions): Promise<FileDownloadResult> {
    return this.withProviderFallback("download", (provider) =>
      provider.download(options),
    );
  }

  /**
   * Delete a file
   */
  async delete(path: string): Promise<void> {
    return this.withProviderFallback("delete", (provider) =>
      provider.delete(path),
    );
  }

  /**
   * Check if a file exists
   */
  async exists(path: string): Promise<boolean> {
    return this.withProviderFallback("exists", (provider) =>
      provider.exists(path),
    );
  }

  /**
   * Get file metadata
   */
  async getMetadata(path: string): Promise<FileMetadata> {
    return this.withProviderFallback("getMetadata", (provider) =>
      provider.getMetadata(path),
    );
  }

  /**
   * Generate a signed URL
   */
  async generateSignedUrl(options: SignedUrlOptions): Promise<string> {
    return this.withProviderFallback("generateSignedUrl", (provider) =>
      provider.generateSignedUrl(options),
    );
  }

  /**
   * List file versions
   */
  async listVersions(path: string): Promise<FileVersion[]> {
    return this.withProviderFallback("listVersions", (provider) =>
      provider.listVersions(path),
    );
  }

  /**
   * Copy a file
   */
  async copy(
    sourcePath: string,
    destinationPath: string,
  ): Promise<FileUploadResult> {
    return this.withProviderFallback("copy", (provider) =>
      provider.copy(sourcePath, destinationPath),
    );
  }

  /**
   * Move a file
   */
  async move(
    sourcePath: string,
    destinationPath: string,
  ): Promise<FileUploadResult> {
    return this.withProviderFallback("move", (provider) =>
      provider.move(sourcePath, destinationPath),
    );
  }

  /**
   * Delete multiple files
   */
  async deleteMultiple(paths: string[]): Promise<void> {
    return this.withProviderFallback("deleteMultiple", (provider) =>
      provider.deleteMultiple(paths),
    );
  }

  /**
   * Get storage usage for a prefix
   */
  async getStorageUsage(prefix: string): Promise<number> {
    return this.withProviderFallback("getStorageUsage", (provider) =>
      provider.getStorageUsage(prefix),
    );
  }
}
