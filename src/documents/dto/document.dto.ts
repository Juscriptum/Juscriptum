import {
  IsEnum,
  IsString,
  IsOptional,
  IsUUID,
  ValidateNested,
  ArrayMinSize,
  Min,
  Max,
  IsArray,
} from "class-validator";
import { Type } from "class-transformer";
import {
  DocumentType,
  DocumentStatus,
} from "../../database/entities/Document.entity";
import { DataAccessScope } from "../../common/security/access-control";
import { TrustProviderType } from "../../database/entities/UserIdentity.entity";
import { MalwareScanStatus } from "../../database/entities/FileScanRecord.entity";

/**
 * Upload Document DTO
 */
export class UploadDocumentDto {
  @IsOptional()
  @IsUUID()
  caseId?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsEnum([
    "contract",
    "agreement",
    "court_order",
    "evidence",
    "invoice",
    "other",
  ])
  type: DocumentType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(["public", "internal", "confidential"])
  accessLevel?: "public" | "internal" | "confidential";

  @IsOptional()
  @IsEnum(["private", "assigned", "tenant"])
  accessScope?: DataAccessScope;

  @IsOptional()
  @IsUUID()
  parentDocumentId?: string;

  @IsOptional()
  @IsUUID()
  eventId?: string;

  @IsOptional()
  @IsUUID()
  calculationId?: string;

  @IsOptional()
  @IsString()
  sourceKind?: string;

  @IsOptional()
  @IsString()
  sourceTemplateId?: string;

  @IsOptional()
  @IsString()
  plainTextContent?: string;

  @IsOptional()
  @IsString()
  metadataJson?: string;
}

/**
 * Update Document DTO
 */
export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(["draft", "signed", "rejected", "archived"])
  status?: DocumentStatus;

  @IsOptional()
  @IsEnum(["public", "internal", "confidential"])
  accessLevel?: "public" | "internal" | "confidential";

  @IsOptional()
  @IsEnum(["private", "assigned", "tenant"])
  accessScope?: DataAccessScope;
}

/**
 * Document Filters DTO
 */
export class DocumentFiltersDto {
  @IsOptional()
  @IsUUID()
  caseId?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsEnum([
    "contract",
    "agreement",
    "court_order",
    "evidence",
    "invoice",
    "other",
  ])
  type?: DocumentType;

  @IsOptional()
  @IsEnum(["draft", "uploading", "signed", "rejected", "archived"])
  status?: DocumentStatus;

  @IsOptional()
  @IsEnum(["public", "internal", "confidential"])
  accessLevel?: "public" | "internal" | "confidential";

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(["pending", "clean", "infected", "failed"])
  malwareScanStatus?: MalwareScanStatus;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: "ASC" | "DESC";
}

/**
 * Bulk Upload Documents DTO
 */
export class BulkUploadDocumentsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UploadDocumentDto)
  documents: UploadDocumentDto[];
}

/**
 * Sign Document DTO
 */
export class SignDocumentDto {
  @IsUUID()
  documentId: string;

  @IsString()
  signatureHash: string;

  @IsOptional()
  @IsString()
  signatureAlgorithm?: string;

  @IsEnum(["acsk", "diia", "bankid_nbu", "manual"])
  provider: TrustProviderType;

  @IsOptional()
  @IsString()
  certificateSerialNumber?: string;

  @IsOptional()
  @IsString()
  certificateIssuer?: string;

  @IsOptional()
  @IsString()
  signedPayloadHash?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}

/**
 * Generate Signed URL DTO
 */
export class GenerateSignedUrlDto {
  @IsUUID()
  documentId: string;

  @IsOptional()
  @Type(() => Number)
  @Max(7 * 24 * 60 * 60) // 7 days in seconds
  expiresIn?: number;

  @IsOptional()
  @IsEnum(["attachment", "inline"])
  disposition?: "attachment" | "inline";

  @IsOptional()
  @IsString()
  contentType?: string;
}

export class DocumentContentQueryDto {
  @IsOptional()
  @IsEnum(["attachment", "inline"])
  disposition?: "attachment" | "inline";
}

export class ProcessPdfDocumentDto {
  @IsOptional()
  @IsString()
  processingMode?: string;

  @IsOptional()
  @IsString()
  targetPageFormat?: string;

  @IsOptional()
  @Type(() => Boolean)
  ocrEnabled?: boolean;

  @IsOptional()
  @IsString()
  ocrLanguage?: string;

  @IsOptional()
  @Type(() => Boolean)
  useUnpaper?: boolean;
}
