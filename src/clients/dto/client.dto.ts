import {
  IsEnum,
  IsString,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
  IsUUID,
  Min,
  Max,
  IsBoolean,
} from "class-validator";
import { Type } from "class-transformer";
import {
  ClientType,
  ClientStatus,
} from "../../database/entities/Client.entity";
import { DataAccessScope } from "../../common/security/access-control";

/**
 * Create Client DTO
 */
export class CreateClientDto {
  @IsEnum(["individual", "fop", "legal_entity"])
  type: "individual" | "fop" | "legal_entity";

  @IsDateString()
  @IsOptional()
  createdAt?: string;

  // Individual fields
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  patronymic?: string;

  // Legal entity fields
  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  edrpou?: string;

  @IsString()
  @IsOptional()
  inn?: string;

  // Contact
  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  secondaryPhone?: string;

  // Address
  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  region?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  country?: string;

  // Additional
  @IsString()
  @IsOptional()
  source?: string;

  @IsUUID()
  @IsOptional()
  assignedUserId?: string;

  @IsString()
  @IsOptional()
  passportNumber?: string;

  @IsDateString()
  @IsOptional()
  passportDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  /**
   * JSONB metadata for type-specific fields
   * Structure varies by client type:
   * - individual: { contact, addresses }
   * - fop: { fop, contact, addresses }
   * - legal_entity: { legalEntity, addresses }
   */
  @IsOptional()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsEnum(["private", "assigned", "tenant"])
  accessScope?: DataAccessScope;
}

/**
 * Update Client DTO
 */
export class UpdateClientDto {
  @IsOptional()
  @IsEnum(["individual", "fop", "legal_entity"])
  type?: "individual" | "fop" | "legal_entity";

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  patronymic?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  edrpou?: string;

  @IsOptional()
  @IsString()
  inn?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  secondaryPhone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsEnum(["active", "inactive", "blocked", "archived"])
  status?: ClientStatus;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsEnum(["private", "assigned", "tenant"])
  accessScope?: DataAccessScope;
}

/**
 * Client Filters DTO
 */
export class ClientFiltersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(["individual", "fop", "legal_entity"])
  type?: "individual" | "fop" | "legal_entity";

  @IsOptional()
  @IsEnum(["active", "inactive", "blocked", "archived"])
  status?: ClientStatus;

  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsDateString()
  createdAtFrom?: string;

  @IsOptional()
  @IsDateString()
  createdAtTo?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: "ASC" | "DESC";

  @IsOptional()
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  @Max(100)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class DeleteClientDto {
  @IsOptional()
  @IsBoolean()
  releaseClientNumber?: boolean;
}

/**
 * Bulk Import Clients DTO
 */
export class BulkImportClientsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateClientDto)
  clients: CreateClientDto[];
}
