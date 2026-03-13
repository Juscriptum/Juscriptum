import {
  IsEnum,
  IsString,
  IsOptional,
  IsNumber,
  IsDate,
  IsUUID,
  ValidateNested,
  ArrayMinSize,
  IsBoolean,
  IsArray,
  IsDateString,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";
import {
  InvoiceStatus,
  PaymentMethod,
} from "../../database/entities/Invoice.entity";

/**
 * Create Invoice DTO
 */
export class CreateInvoiceDto {
  @IsUUID()
  clientId: string;

  @IsDate()
  invoiceDate: string;

  @IsOptional()
  @IsDate()
  dueDate?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(["hourly", "fixed", "piecewise"])
  unitType?: "hourly" | "fixed" | "piecewise";

  @IsOptional()
  @IsNumber()
  subtotal?: number;

  @IsOptional()
  @IsNumber()
  discountPercentage?: number;

  @IsOptional()
  @IsNumber()
  vatRate?: number;

  @IsOptional()
  @IsBoolean()
  vatIncluded?: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];

  @IsOptional()
  @IsString()
  internalNotes?: string;

  @IsOptional()
  @IsString()
  clientNotes?: string;
}

/**
 * Create Invoice Item DTO
 */
export class CreateInvoiceItemDto {
  @IsString()
  description: string;

  @IsOptional()
  @IsUUID()
  pricelistItemId?: string;

  @IsOptional()
  @IsString()
  code?: string;

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
 * Update Invoice DTO
 */
export class UpdateInvoiceDto {
  @IsOptional()
  @IsDate()
  invoiceDate?: string;

  @IsOptional()
  @IsDate()
  dueDate?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(["draft", "sent", "viewed", "paid", "overdue", "cancelled"])
  status?: InvoiceStatus;

  @IsOptional()
  @IsString()
  internalNotes?: string;
}

/**
 * Invoice Filters DTO
 */
export class InvoiceFiltersDto {
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsEnum(["draft", "sent", "viewed", "paid", "overdue", "cancelled"])
  status?: InvoiceStatus;

  @IsOptional()
  @IsDateString()
  invoiceDateFrom?: string;

  @IsOptional()
  @IsDateString()
  invoiceDateTo?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: "ASC" | "DESC";

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

/**
 * Generate Invoice PDF DTO
 */
export class GenerateInvoicePdfDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  sendSms?: boolean;
}

/**
 * Record Payment DTO
 */
export class RecordPaymentDto {
  @IsNumber()
  amount: number;

  @IsEnum(["cash", "card", "bank_transfer", "wayforpay"])
  method: PaymentMethod;

  @IsOptional()
  @IsString()
  reference?: string;
}
