import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  IsEnum,
} from "class-validator";

/**
 * Upload file query parameters
 */
export class UploadFileQueryDto {
  @ApiPropertyOptional({ description: "Case ID to associate file with" })
  @IsOptional()
  @IsString()
  caseId?: string;

  @ApiPropertyOptional({ description: "Client ID to associate file with" })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ description: "Folder name within tenant directory" })
  @IsOptional()
  @IsString()
  folder?: string;

  @ApiPropertyOptional({ description: "Whether file should be public" })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

/**
 * Upload multiple files query parameters
 */
export class UploadMultipleFilesQueryDto extends UploadFileQueryDto {
  @ApiPropertyOptional({
    description: "Number of files to upload (max: 10)",
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  maxFiles?: number;
}

/**
 * Generate signed URL query parameters
 */
export class GenerateSignedUrlQueryDto {
  @ApiProperty({ description: "Storage path of the file" })
  @IsString()
  path: string;

  @ApiPropertyOptional({
    description: "URL expiration time in seconds",
    default: 3600,
  })
  @IsOptional()
  @IsNumber()
  expiresIn?: number;

  @ApiPropertyOptional({
    description: "Content disposition",
    enum: ["attachment", "inline"],
  })
  @IsOptional()
  @IsEnum(["attachment", "inline"])
  disposition?: "attachment" | "inline";

  @ApiPropertyOptional({ description: "Override content type" })
  @IsOptional()
  @IsString()
  contentType?: string;
}

/**
 * Copy file DTO
 */
export class CopyFileDto {
  @ApiProperty({ description: "Source file path" })
  @IsString()
  sourcePath: string;

  @ApiProperty({ description: "Destination file path" })
  @IsString()
  destinationPath: string;
}

/**
 * Move file DTO
 */
export class MoveFileDto {
  @ApiProperty({ description: "Source file path" })
  @IsString()
  sourcePath: string;

  @ApiProperty({ description: "Destination file path" })
  @IsString()
  destinationPath: string;
}

/**
 * Delete multiple files DTO
 */
export class DeleteMultipleFilesDto {
  @ApiProperty({ description: "Array of file paths to delete", type: [String] })
  @IsString({ each: true })
  paths: string[];
}

/**
 * Get quota query parameters
 */
export class GetQuotaQueryDto {
  @ApiPropertyOptional({
    description: "Subscription plan",
    enum: ["basic", "professional", "enterprise"],
    default: "basic",
  })
  @IsOptional()
  @IsEnum(["basic", "professional", "enterprise"])
  plan?: string;
}

/**
 * Get config query parameters
 */
export class GetConfigQueryDto {
  @ApiPropertyOptional({
    description: "Subscription plan",
    enum: ["basic", "professional", "enterprise"],
    default: "basic",
  })
  @IsOptional()
  @IsEnum(["basic", "professional", "enterprise"])
  plan?: string;
}

/**
 * File upload result
 */
export class FileUploadResultDto {
  @ApiProperty({ description: "Storage path" })
  path: string;

  @ApiProperty({ description: "Public URL" })
  url: string;

  @ApiProperty({ description: "File size in bytes" })
  size: number;

  @ApiPropertyOptional({ description: "ETag" })
  etag?: string;

  @ApiPropertyOptional({ description: "Version ID" })
  versionId?: string;
}

/**
 * Bulk upload result
 */
export class BulkUploadResultDto {
  @ApiProperty({
    description: "Successfully uploaded files",
    type: [FileUploadResultDto],
  })
  success: FileUploadResultDto[];

  @ApiProperty({ description: "Failed uploads", type: [Object] })
  failed: Array<{ fileName: string; error: string }>;
}

/**
 * Storage quota response
 */
export class StorageQuotaDto {
  @ApiProperty({ description: "Total quota in bytes" })
  total: number;

  @ApiProperty({ description: "Used space in bytes" })
  used: number;

  @ApiProperty({ description: "Available space in bytes" })
  available: number;

  @ApiProperty({ description: "Usage percentage (0-100)" })
  usagePercentage: number;
}

/**
 * File storage config response
 */
export class FileStorageConfigDto {
  @ApiProperty({ description: "Allowed MIME types", type: [String] })
  allowedMimeTypes: string[];

  @ApiProperty({ description: "Max file size in bytes" })
  fileSizeLimit: number;
}
