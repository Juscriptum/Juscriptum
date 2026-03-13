import {
  IsEnum,
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  IsObject,
  IsInt,
} from "class-validator";
import { Type } from "class-transformer";
import {
  PricelistType,
  PricelistStatus,
} from "../../database/entities/Pricelist.entity";

/**
 * Create Pricelist DTO
 */
export class CreatePricelistDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(["general", "consultation", "court", "document", "other"])
  type: PricelistType;

  @IsOptional()
  @IsEnum(["active", "inactive", "archived"])
  status?: PricelistStatus;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsEnum(["up", "down", "none"])
  roundingRule?: "up" | "down" | "none";

  @IsOptional()
  @IsNumber()
  roundingPrecision?: number;

  @IsOptional()
  @IsNumber()
  vatRate?: number;

  @IsOptional()
  @IsBoolean()
  vatIncluded?: boolean;

  @IsOptional()
  discountEnabled?: boolean;

  @IsOptional()
  @IsEnum(["percentage", "fixed"])
  discountType?: "percentage" | "fixed";

  @IsOptional()
  @IsNumber()
  discountValue?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * Create PricelistItem DTO
 */
export class CreatePricelistItemDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  category: string;

  @IsEnum(["hourly", "fixed", "piecewise"])
  unitType: "hourly" | "fixed" | "piecewise";

  @IsNumber()
  basePrice: number;

  @IsOptional()
  @IsNumber()
  defaultDuration?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  minQuantity?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  displayOrder?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CreatePricelistCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsInt()
  displayOrder?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * Update Pricelist DTO
 */
export class UpdatePricelistDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(["active", "inactive", "archived"])
  status?: PricelistStatus;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  vatIncluded?: boolean;

  @IsOptional()
  @IsNumber()
  vatRate?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * Update PricelistItem DTO
 */
export class UpdatePricelistItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  basePrice?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsEnum(["hourly", "fixed", "piecewise"])
  unitType?: "hourly" | "fixed" | "piecewise";

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  defaultDuration?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  minQuantity?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdatePricelistCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  parentId?: string | null;

  @IsOptional()
  @IsInt()
  displayOrder?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * Pricelist Filters DTO
 */
export class PricelistFiltersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(["general", "consultation", "court", "document", "other"])
  type?: PricelistType;

  @IsOptional()
  @IsEnum(["active", "inactive", "archived"])
  status?: PricelistStatus;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsString()
  category?: string;

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
}
