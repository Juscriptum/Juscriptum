import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";
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
 * S3 Storage Service
 *
 * Provides S3-compatible storage (works with AWS S3, MinIO, DigitalOcean Spaces, etc.)
 */
@Injectable()
export class S3StorageService implements IStorageProvider {
  private readonly logger = new Logger(S3StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>("AWS_ENDPOINT");
    const region = this.configService.get<string>("AWS_REGION", "us-east-1");
    const accessKeyId = this.configService.get<string>("AWS_ACCESS_KEY_ID");
    const secretAccessKey = this.configService.get<string>(
      "AWS_SECRET_ACCESS_KEY",
    );

    this.bucket = this.configService.get<string>(
      "AWS_S3_BUCKET",
      "law-organizer-uploads",
    );

    this.s3Client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId: accessKeyId || "",
        secretAccessKey: secretAccessKey || "",
      },
      forcePathStyle: !!endpoint, // Required for MinIO
    });

    this.logger.log(
      `S3 Storage initialized with bucket: ${this.bucket}, endpoint: ${endpoint || "AWS S3"}`,
    );
  }

  /**
   * Upload file to S3
   */
  async upload(options: FileUploadOptions): Promise<FileUploadResult> {
    const key = `${options.path}${options.fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: options.buffer,
      ContentType: options.contentType,
      Metadata: options.metadata,
      ACL: options.isPublic ? "public-read" : "private",
    });

    const result = await this.s3Client.send(command);

    this.logger.log(`File uploaded: ${key}`);

    return {
      path: key,
      url: this.getPublicUrl(key),
      size: options.buffer.length,
      etag: result.ETag,
      versionId: result.VersionId,
    };
  }

  /**
   * Download file from S3
   */
  async download(options: FileDownloadOptions): Promise<FileDownloadResult> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: options.path,
      Range: options.range,
    });

    const result = await this.s3Client.send(command);

    const buffer = await this.streamToBuffer(result.Body as Readable);

    return {
      buffer,
      contentType: result.ContentType || "application/octet-stream",
      contentLength: result.ContentLength || 0,
      lastModified: result.LastModified,
      etag: result.ETag,
    };
  }

  /**
   * Delete file from S3
   */
  async delete(path: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: path,
    });

    await this.s3Client.send(command);
    this.logger.log(`File deleted: ${path}`);
  }

  /**
   * Check if file exists in S3
   */
  async exists(path: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: path,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        "name" in error &&
        (error as any).name === "NotFound"
      ) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get file metadata from S3
   */
  async getMetadata(path: string): Promise<FileMetadata> {
    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: path,
    });

    const result = await this.s3Client.send(command);

    return {
      fileName: path.split("/").pop() || path,
      contentType: result.ContentType || "application/octet-stream",
      size: result.ContentLength || 0,
      lastModified: result.LastModified || new Date(),
      metadata: result.Metadata,
      url: this.getPublicUrl(path),
    };
  }

  /**
   * Generate signed URL for temporary access
   */
  async generateSignedUrl(options: SignedUrlOptions): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: options.path,
      ResponseContentDisposition: options.disposition
        ? `${options.disposition}; filename="${options.path.split("/").pop()}"`
        : undefined,
      ResponseContentType: options.contentType,
    });

    const expiresIn = options.expiresIn || 3600;
    const url = await getSignedUrl(this.s3Client, command, { expiresIn });

    return url;
  }

  /**
   * List all versions of a file
   */
  async listVersions(path: string): Promise<FileVersion[]> {
    // This requires bucket versioning to be enabled
    // For now, return a single version
    const metadata = await this.getMetadata(path);

    return [
      {
        versionId: "null",
        path,
        size: metadata.size,
        lastModified: metadata.lastModified,
        isLatest: true,
      },
    ];
  }

  /**
   * Copy file within S3
   */
  async copy(
    sourcePath: string,
    destinationPath: string,
  ): Promise<FileUploadResult> {
    const command = new CopyObjectCommand({
      Bucket: this.bucket,
      CopySource: `${this.bucket}/${sourcePath}`,
      Key: destinationPath,
    });

    const result = await this.s3Client.send(command);

    return {
      path: destinationPath,
      url: this.getPublicUrl(destinationPath),
      size: 0, // Need to get metadata to get size
      etag: result.CopyObjectResult?.ETag,
      versionId: result.VersionId,
    };
  }

  /**
   * Move file within S3 (copy + delete)
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
   * Delete multiple files from S3
   */
  async deleteMultiple(paths: string[]): Promise<void> {
    // S3 allows deleting up to 1000 objects at a time
    const batchSize = 1000;

    for (let i = 0; i < paths.length; i += batchSize) {
      const batch = paths.slice(i, i + batchSize);
      const command = new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: {
          Objects: batch.map((path) => ({ Key: path })),
          Quiet: false,
        },
      });

      await this.s3Client.send(command);
    }

    this.logger.log(`Deleted ${paths.length} files`);
  }

  /**
   * Get storage usage for a prefix (tenant)
   */
  async getStorageUsage(prefix: string): Promise<number> {
    // This would require listing all objects under the prefix
    // For production, you might want to use CloudWatch metrics or maintain a counter
    // For now, return 0
    this.logger.warn(
      `Storage usage calculation not implemented for prefix: ${prefix}`,
    );
    return 0;
  }

  /**
   * Convert stream to buffer
   */
  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("error", reject);
      stream.on("end", () => resolve(Buffer.concat(chunks)));
    });
  }

  /**
   * Get public URL for a file
   */
  private getPublicUrl(key: string): string {
    const endpoint = this.configService.get<string>("AWS_ENDPOINT");
    const cdnDomain = this.configService.get<string>("CDN_DOMAIN");

    if (cdnDomain) {
      return `https://${cdnDomain}/${key}`;
    }

    if (endpoint) {
      return `${endpoint}/${this.bucket}/${key}`;
    }

    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }
}

// Add missing import for DeleteObjectsCommand
import { DeleteObjectsCommand } from "@aws-sdk/client-s3";
