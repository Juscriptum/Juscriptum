export type PricelistType =
  | "general"
  | "consultation"
  | "court"
  | "document"
  | "other";
export type PricelistStatus = "active" | "inactive" | "archived";
export type PricelistItemUnitType = "hourly" | "fixed" | "piecewise";

export interface PricelistItemMetadata {
  note?: string;
  [key: string]: any;
}

export interface PricelistMetadata {
  currency?: string;
  [key: string]: any;
}

export interface PricelistCategory {
  id: string;
  tenantId: string;
  pricelistId: string;
  parentId?: string | null;
  name: string;
  displayOrder: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface PricelistItem {
  id: string;
  tenantId: string;
  pricelistId: string;
  name: string;
  code: string;
  description?: string;
  category: string;
  unitType: PricelistItemUnitType;
  basePrice: number;
  currency: string;
  defaultDuration?: number;
  unit?: string;
  minQuantity?: number;
  isActive: boolean;
  displayOrder: number;
  metadata?: PricelistItemMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface Pricelist {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  type: PricelistType;
  status: PricelistStatus;
  isDefault: boolean;
  roundingRule?: "up" | "down" | "none";
  roundingPrecision?: number;
  vatRate?: number | null;
  vatIncluded: boolean;
  discountEnabled?: boolean;
  discountType?: "percentage" | "fixed" | null;
  discountValue?: number | null;
  metadata?: PricelistMetadata;
  categories: PricelistCategory[];
  items: PricelistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PricelistFilters {
  search?: string;
  type?: PricelistType;
  status?: PricelistStatus;
  isDefault?: boolean;
  category?: string;
  page?: number;
  limit?: number;
}

export interface PricelistListResponse {
  data: Pricelist[];
  total: number;
  page: number;
  limit: number;
}

export interface CreatePricelistDto {
  name: string;
  description?: string;
  type: PricelistType;
  status?: PricelistStatus;
  isDefault?: boolean;
  roundingRule?: "up" | "down" | "none";
  roundingPrecision?: number;
  vatRate?: number;
  vatIncluded?: boolean;
  discountEnabled?: boolean;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  metadata?: PricelistMetadata;
}

export interface UpdatePricelistDto extends Partial<CreatePricelistDto> {}

export interface CreatePricelistCategoryDto {
  name: string;
  parentId?: string;
  displayOrder?: number;
  metadata?: Record<string, any>;
}

export interface UpdatePricelistCategoryDto extends Partial<CreatePricelistCategoryDto> {
  parentId?: string | null;
}

export interface CreatePricelistItemDto {
  name: string;
  code: string;
  description?: string;
  category: string;
  unitType: PricelistItemUnitType;
  basePrice: number;
  defaultDuration?: number;
  unit?: string;
  minQuantity?: number;
  currency?: string;
  isActive?: boolean;
  displayOrder?: number;
  metadata?: PricelistItemMetadata;
}

export interface UpdatePricelistItemDto extends Partial<CreatePricelistItemDto> {}
