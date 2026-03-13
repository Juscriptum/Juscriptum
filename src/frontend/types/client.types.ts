/**
 * Client Types
 */
export interface Client {
  id: string;
  tenantId: string;
  type: ClientType;
  // Individual fields
  firstName?: string;
  lastName?: string;
  patronymic?: string;
  // Legal entity fields
  companyName?: string;
  edrpou?: string;
  inn?: string;
  // Contact
  email?: string;
  phone?: string;
  secondaryPhone?: string;
  // Address
  address?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  // Additional
  source?: string;
  status: ClientStatus;
  assignedUserId?: string;
  assignedUser?: any;
  passportNumber?: string;
  passportDate?: string;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type ClientType = "individual" | "fop" | "legal_entity";
export type ClientStatus = "active" | "inactive" | "blocked" | "archived";

export interface CreateClientDto {
  type: ClientType;
  createdAt?: string;
  firstName?: string;
  lastName?: string;
  patronymic?: string;
  companyName?: string;
  edrpou?: string;
  inn?: string;
  email?: string;
  phone?: string;
  secondaryPhone?: string;
  address?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  source?: string;
  assignedUserId?: string;
  passportNumber?: string;
  passportDate?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface DeleteClientOptions {
  releaseClientNumber?: boolean;
}

export interface NextClientNumberResponse {
  clientNumber: string;
}

export interface CourtRegistrySearchResult {
  person: string;
  role: string;
  caseDescription: string;
  caseNumber: string;
  courtName: string;
  caseProc: string;
  registrationDate: string;
  judge: string;
  type: string;
  stageDate: string;
  stageName: string;
  participants: string;
}

export interface CourtRegistrySearchFilters {
  query: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface UpdateClientDto extends Partial<CreateClientDto> {
  status?: ClientStatus;
  metadata?: Record<string, any>;
}

export interface ClientFilters {
  search?: string;
  type?: ClientType;
  status?: ClientStatus;
  assignedUserId?: string;
  city?: string;
  region?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface ClientListResponse {
  data: Client[];
  total: number;
  page: number;
  limit: number;
}

export interface ClientStatistics {
  total: number;
  active: number;
  inactive: number;
  archived?: number;
  individuals: number;
  fops: number;
  legalEntities: number;
}

/**
 * FOP-specific metadata structure
 */
export interface FopMetadata {
  director: {
    firstName: string;
    lastName: string;
    patronymic?: string;
    inn?: string;
    phone?: string;
    email?: string;
    position?: string;
    taxationBasis?: string;
  };
  banking?: {
    bankName: string;
    mfo: string;
    iban: string;
  };
  taxationAuthority?: string;
  taxationBasis?: string;
  registrationDate?: string;
}

/**
 * Address structure for registration and actual addresses
 */
export interface AddressData {
  registration: Address;
  actual?: Address;
  is_same_address: boolean;
}

export interface Address {
  region: string;
  city: string;
  city_code?: string;
  street: string;
  building: string;
  apartment?: string;
}

/**
 * Contact data with messengers
 */
export interface ContactData {
  phone: string;
  additional_phones?: string[];
  email: string;
  additional_emails?: string[];
  messengers?: {
    whatsapp?: string;
    viber?: string;
    skype?: string;
    telegram?: string;
  };
}
