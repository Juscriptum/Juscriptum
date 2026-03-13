export type CalculationStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "paid";

export type CalculationOperationType = "income" | "expense";
export type CalculationSubjectType = "client" | "self";
export type CalculationUnitType = "hourly" | "piecewise" | "fixed";

export interface CalculationItem {
  id: string;
  tenantId: string;
  calculationId: string;
  description: string;
  pricelistItemId?: string | null;
  code?: string | null;
  unitType?: CalculationUnitType | null;
  quantity?: number | null;
  duration?: number | null;
  unitPrice: number;
  lineTotal: number;
  vatRate?: number | null;
  vatAmount?: number | null;
  discountAmount?: number | null;
  displayOrder?: number;
  createdAt: string;
}

export interface CalculationMetadata {
  clientId?: string;
  subjectType?: CalculationSubjectType;
  operationType?: CalculationOperationType;
  clientDisplayName?: string;
  subjectDisplayName?: string;
  [key: string]: any;
}

export interface Calculation {
  id: string;
  tenantId: string;
  caseId?: string | null;
  number: string;
  name: string;
  description?: string | null;
  calculationDate: string;
  dueDate?: string | null;
  subtotal: number;
  discountAmount: number;
  vatAmount: number;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  status: CalculationStatus;
  pricelistId?: string | null;
  internalNotes?: string | null;
  clientNotes?: string | null;
  metadata?: CalculationMetadata;
  items: CalculationItem[];
  case?: {
    id: string;
    caseNumber: string;
    title?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CalculationListResponse {
  data: Calculation[];
  total: number;
  page: number;
  limit: number;
}

export interface CalculationFilters {
  caseId?: string;
  status?: CalculationStatus;
  search?: string;
  calculationDateFrom?: string;
  calculationDateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface CreateCalculationItemDto {
  description: string;
  pricelistItemId?: string;
  code?: string;
  unitType?: CalculationUnitType;
  quantity?: number;
  duration?: number;
  unitPrice?: number;
}

export interface CreateCalculationDto {
  caseId?: string;
  name: string;
  calculationDate: string;
  dueDate?: string;
  description?: string;
  pricelistId?: string;
  items: CreateCalculationItemDto[];
  internalNotes?: string;
  metadata?: CalculationMetadata;
}

export interface UpdateCalculationDto {
  caseId?: string;
  name?: string;
  calculationDate?: string;
  dueDate?: string;
  description?: string;
  pricelistId?: string;
  items?: CreateCalculationItemDto[];
  internalNotes?: string;
  status?: CalculationStatus;
  clientNotes?: string;
  metadata?: CalculationMetadata;
}

export interface ApproveCalculationDto {
  approvalNotes?: string;
}

export interface RejectCalculationDto {
  reason: string;
}
