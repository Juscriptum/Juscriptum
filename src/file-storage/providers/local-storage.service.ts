import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { promises as fs } from "fs";
import { join } from "path";
import { createReadStream, createWriteStream } from "fs";
import { stat, unlink, mkdir } from "fs/promises";
import { pipeline } from "stream/promises";
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

/**
 * Local Storage Service
 *
 * Provides local filesystem storage for development
 */
@Injectable()
export class LocalStorageService implements IStorageProvider {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly baseDir: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseDir =
      this.configService.get<string>("LOCAL_STORAGE_DIR", "./storage") ||
      "./storage";
    this.baseUrl = this.normalizeBaseUrl(
      this.configService.get<string>("LOCAL_STORAGE_URL", "/storage") ||
        "/storage",
    );

    this.ensureBaseDir();
    this.logger.log(`Local Storage initialized at: ${this.baseDir}`);
  }

  /**
   * Upload file to local filesystem
   */
  async upload(options: FileUploadOptions): Promise<FileUploadResult> {
    const fullPath = join(this.baseDir, options.path);
    const filePath = join(fullPath, options.fileName);

    await fs.mkdir(fullPath, { recursive: true });
    await fs.writeFile(filePath, options.buffer);

    this.logger.log(`File uploaded: ${filePath}`);

    return {
      path: `${options.path}${options.fileName}`,
      url: this.getPublicUrl(options.path, options.fileName),
      size: options.buffer.length,
    };
  }

  /**
   * Download file from local filesystem
   */
  async download(options: FileDownloadOptions): Promise<FileDownloadResult> {
    const filePath = join(this.baseDir, options.path);
    const stats = await stat(filePath);
    const buffer = await fs.readFile(filePath);

    return {
      buffer,
      contentType: this.getMimeType(options.path),
      contentLength: stats.size,
      lastModified: stats.mtime,
    };
  }

  /**
   * Delete file from local filesystem
   */
  async delete(path: string): Promise<void> {
    const filePath = join(this.baseDir, path);
    await unlink(filePath);
    this.logger.log(`File deleted: ${filePath}`);
  }

  /**
   * Check if file exists
   */
  async exists(path: string): Promise<boolean> {
    try {
      await stat(join(this.baseDir, path));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file metadata
   */
  async getMetadata(path: string): Promise<FileMetadata> {
    const filePath = join(this.baseDir, path);
    const stats = await stat(filePath);

    return {
      fileName: path.split("/").pop() || path,
      contentType: this.getMimeType(path),
      size: stats.size,
      lastModified: stats.mtime,
      url: this.getPublicUrl(
        path.split("/").slice(0, -1).join("/"),
        path.split("/").pop() || "",
      ),
    };
  }

  /**
   * Generate signed URL (not applicable for local storage, returns public URL)
   */
  async generateSignedUrl(options: SignedUrlOptions): Promise<string> {
    // Local storage doesn't support signed URLs
    // Return the public URL with timestamp query param for logging
    const fileName = options.path.split("/").pop();
    const path = options.path.split("/").slice(0, -1).join("/");
    return `${this.getPublicUrl(path, fileName || "")}?expires=${Date.now() + (options.expiresIn || 3600) * 1000}`;
  }

  /**
   * List file versions (not supported for local storage)
   */
  async listVersions(path: string): Promise<FileVersion[]> {
    const metadata = await this.getMetadata(path);
    return [
      {
        versionId: "1",
        path,
        size: metadata.size,
        lastModified: metadata.lastModified,
        isLatest: true,
      },
    ];
  }

  /**
   * Copy file
   */
  async copy(
    sourcePath: string,
    destinationPath: string,
  ): Promise<FileUploadResult> {
    const sourceFilePath = join(this.baseDir, sourcePath);
    const destDir = join(
      this.baseDir,
      destinationPath.split("/").slice(0, -1).join("/"),
    );
    const destFileName = destinationPath.split("/").pop() || "";
    const destFilePath = join(this.baseDir, destinationPath);

    await mkdir(destDir, { recursive: true });

    await pipeline(
      createReadStream(sourceFilePath),
      createWriteStream(destFilePath),
    );

    return {
      path: destinationPath,
      url: this.getPublicUrl(
        destinationPath.split("/").slice(0, -1).join("/"),
        destFileName,
      ),
      size: (await stat(destFilePath)).size,
    };
  }

  /**
   * Move file
   */
  async move(
    sourcePath: string,
    destinationPath: string,
  ): Promise<FileUploadResult> {
    const result = await this.copy(sourcePath, destinationPath);
    await this.delete(sourcePath);
    return result;
  }

  /**
   * Delete multiple files
   */
  async deleteMultiple(paths: string[]): Promise<void> {
    await Promise.all(paths.map((path) => this.delete(path)));
    this.logger.log(`Deleted ${paths.length} files`);
  }

  /**
   * Get storage usage for a prefix
   */
  async getStorageUsage(prefix: string): Promise<number> {
    const dir = join(this.baseDir, prefix);
    let totalSize = 0;

    try {
      const files = await fs.readdir(dir, { recursive: true });

      for (const file of files) {
        try {
          const filePath = join(dir, file);
          const stats = await stat(filePath);
          if (stats.isFile()) {
            totalSize += stats.size;
          }
        } catch {
          // Skip files that can't be accessed
        }
      }
    } catch {
      // Directory doesn't exist
    }

    return totalSize;
  }

  /**
   * Ensure base directory exists
   */
  private async ensureBaseDir(): Promise<void> {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
    } catch (error: unknown) {
      this.logger.error(
        `Failed to create base directory: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get public URL for a file
   */
  private getPublicUrl(path: string, fileName: string): string {
    const normalizedPath = `${path}${fileName}`.replace(/^\/+/, "");
    return `${this.baseUrl}/${normalizedPath}`;
  }

  private normalizeBaseUrl(value: string): string {
    const trimmed = value.trim();

    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed.replace(/\/+$/, "");
    }

    return `/${trimmed.replace(/^\/+|\/+$/g, "")}`;
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeType(path: string): string {
    const ext = path.split(".").pop()?.toLowerCase() || "";
    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
    };
    return mimeTypes[ext] || "application/octet-stream";
  }
}
