import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
  IsArray,
  ArrayMinSize,
} from "class-validator";
import { Type } from "class-transformer";
import {
  ScanDocumentFormat,
  ScanDestinationScope,
  ScanSessionStatus,
} from "../../database/entities/ScanSession.entity";
import { ScanPageStatus } from "../../database/entities/ScanPage.entity";

export class CreateScanSessionDto {
  @IsOptional()
  @IsEnum(["root", "personal", "client"])
  destinationScope?: ScanDestinationScope;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  caseId?: string;

  @IsOptional()
  @IsEnum(["A4", "Original"])
  documentFormat?: ScanDocumentFormat;
}

export class MobileTokenDto {
  @IsString()
  token: string;
}

export class UploadScanPageDto extends MobileTokenDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  clientPageNumber: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(360)
  rotation?: number;
}

export class ReorderScanPageItemDto {
  @IsUUID()
  pageId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageNumber: number;
}

export class ReorderScanPagesDto extends MobileTokenDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderScanPageItemDto)
  pages: ReorderScanPageItemDto[];
}

export class FinalizeScanSessionDto extends MobileTokenDto {
  @IsOptional()
  @IsEnum(["A4", "Original"])
  documentFormat?: ScanDocumentFormat;
}

export class ScanSessionStatusResponseDto {
  id: string;
  status: ScanSessionStatus;
  pagesCount: number;
  uploadedPages: number;
  processedPages: number;
  finalDocumentId: string | null;
  caseId: string | null;
  clientId: string | null;
  destinationScope: ScanDestinationScope;
  mobileUrl: string;
  desktopUrl: string | null;
  expiresAt: Date;
  documentFormat: ScanDocumentFormat;
  ocrStatus: "pending" | "not_configured" | "completed" | "failed";
  lastError: string | null;
  pages: Array<{
    id: string;
    pageNumber: number;
    status: ScanPageStatus;
    previewUrl: string | null;
    rotation: number;
    fileSize: number;
  }>;
}
