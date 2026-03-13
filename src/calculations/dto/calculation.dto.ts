import {
  IsEnum,
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsDateString,
  IsNumber,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";
import { CalculationStatus } from "../../database/entities/Calculation.entity";

/**
 * Unit type for calculation items
 */
export type UnitType = "hourly" | "piecewise" | "fixed";

/**
 * Create Calculation DTO
 */
export class CreateCalculationDto {
  @IsOptional()
  @IsUUID()
  caseId?: string;

  @IsString()
  name: string;

  @IsDateString()
  calculationDate: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  pricelistId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateCalculationItemDto)
  items: CreateCalculationItemDto[];

  @IsOptional()
  @IsString()
  internalNotes?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * Create Calculation Item DTO
 */
export class CreateCalculationItemDto {
  @IsString()
  description: string;

  @IsOptional()
  @IsUUID()
  pricelistItemId?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  unitType?: UnitType;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsNumber()
  unitPrice?: number;
}

/**
 * Update Calculation DTO
 */
export class UpdateCalculationDto {
  @IsOptional()
  @IsUUID()
  caseId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsDateString()
  calculationDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  pricelistId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateCalculationItemDto)
  items?: CreateCalculationItemDto[];

  @IsOptional()
  @IsString()
  internalNotes?: string;

  @IsOptional()
  @IsEnum(["draft", "pending_approval", "approved", "rejected", "paid"])
  status?: CalculationStatus;

  @IsOptional()
  @IsString()
  clientNotes?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * Calculation Filters DTO
 */
export class CalculationFiltersDto {
  @IsOptional()
  @IsUUID()
  caseId?: string;

  @IsOptional()
  @IsEnum(["draft", "pending_approval", "approved", "rejected", "paid"])
  status?: CalculationStatus;

  @IsOptional()
  @IsDateString()
  calculationDateFrom?: string;

  @IsOptional()
  @IsDateString()
  calculationDateTo?: string;

  @IsOptional()
  @IsString()
  search?: string;

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
 * Generate PDF DTO
 */
export class GeneratePdfDto {
  @IsUUID()
  calculationId: string;

  @IsOptional()
  @IsUUID()
  userId?: string;
}

/**
 * Approve Calculation DTO
 */
export class ApproveCalculationDto {
  @IsOptional()
  @IsString()
  approvalNotes?: string;
}

/**
 * Reject Calculation DTO
 */
export class RejectCalculationDto {
  @IsString()
  reason: string;
}
