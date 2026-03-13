/**
 * File storage interfaces and types
 */

/**
 * Storage provider type
 */
export type StorageProviderType = "s3" | "local";

/**
 * File upload options
 */
export interface FileUploadOptions {
  /**
   * File path (with tenant and optional subdirectories)
   * Example: 'tenants/{tenantId}/documents/{caseId}/'
   */
  path: string;

  /**
   * File name
   */
  fileName: string;

  /**
   * Content type (MIME type)
   */
  contentType: string;

  /**
   * File data buffer
   */
  buffer: Buffer;

  /**
   * Metadata to attach to the file
   */
  metadata?: Record<string, string>;

  /**
   * Whether to make the file public (default: false)
   */
  isPublic?: boolean;
}

/**
 * File upload result
 */
export interface FileUploadResult {
  /**
   * Storage path of the file
   */
  path: string;

  /**
   * Public URL (if applicable)
   */
  url: string;

  /**
   * File size in bytes
   */
  size: number;

  /**
   * ETag or checksum
   */
  etag?: string;

  /**
   * Version ID (for versioned storage)
   */
  versionId?: string;

  /**
   * Malware scan status after upload
   */
  malwareScanStatus?: "pending" | "clean" | "infected" | "failed";

  /**
   * File scan record identifier
   */
  malwareScanId?: string;
}

/**
 * File download options
 */
export interface FileDownloadOptions {
  /**
   * File path
   */
  path: string;

  /**
   * Range header for partial downloads
   */
  range?: string;
}

/**
 * File download result
 */
export interface FileDownloadResult {
  /**
   * File data buffer
   */
  buffer: Buffer;

  /**
   * Content type
   */
  contentType: string;

  /**
   * Content length
   */
  contentLength: number;

  /**
   * Last modified date
   */
  lastModified?: Date;

  /**
   * ETag
   */
  etag?: string;
}

/**
 * Signed URL options
 */
export interface SignedUrlOptions {
  /**
   * File path
   */
  path: string;

  /**
   * Expiration time in seconds (default: 3600 = 1 hour)
   */
  expiresIn?: number;

  /**
   * Response content disposition
   */
  disposition?: "attachment" | "inline";

  /**
   * Content type override
   */
  contentType?: string;
}

/**
 * File metadata
 */
export interface FileMetadata {
  /**
   * File name
   */
  fileName: string;

  /**
   * Content type
   */
  contentType: string;

  /**
   * File size in bytes
   */
  size: number;

  /**
   * Last modified date
   */
  lastModified: Date;

  /**
   * Custom metadata
   */
  metadata?: Record<string, string>;

  /**
   * Public URL (if applicable)
   */
  url?: string;
}

/**
 * Storage quota information
 */
export interface StorageQuota {
  /**
   * Total quota in bytes
   */
  total: number;

  /**
   * Used space in bytes
   */
  used: number;

  /**
   * Available space in bytes
   */
  available: number;

  /**
   * Usage percentage (0-100)
   */
  usagePercentage: number;
}

/**
 * File version information
 */
export interface FileVersion {
  /**
   * Version ID
   */
  versionId: string;

  /**
   * Storage path
   */
  path: string;

  /**
   * File size
   */
  size: number;

  /**
   * Last modified date
   */
  lastModified: Date;

  /**
   * Whether this is the latest version
   */
  isLatest: boolean;
}

/**
 * Storage provider interface
 */
export interface IStorageProvider {
  /**
   * Upload a file
   */
  upload(options: FileUploadOptions): Promise<FileUploadResult>;

  /**
   * Download a file
   */
  download(options: FileDownloadOptions): Promise<FileDownloadResult>;

  /**
   * Delete a file
   */
  delete(path: string): Promise<void>;

  /**
   * Check if a file exists
   */
  exists(path: string): Promise<boolean>;

  /**
   * Get file metadata
   */
  getMetadata(path: string): Promise<FileMetadata>;

  /**
   * Generate a signed URL for temporary access
   */
  generateSignedUrl(options: SignedUrlOptions): Promise<string>;

  /**
   * List all versions of a file
   */
  listVersions(path: string): Promise<FileVersion[]>;

  /**
   * Copy a file
   */
  copy(sourcePath: string, destinationPath: string): Promise<FileUploadResult>;

  /**
   * Move a file
   */
  move(sourcePath: string, destinationPath: string): Promise<FileUploadResult>;

  /**
   * Delete multiple files
   */
  deleteMultiple(paths: string[]): Promise<void>;

  /**
   * Get storage usage for a tenant
   */
  getStorageUsage(prefix: string): Promise<number>;
}
