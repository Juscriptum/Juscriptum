/**
 * Case Types (Ukrainian legal categories)
 */
export interface Case {
  id: string;
  tenantId: string;
  caseNumber: string;
  registryCaseNumber?: string;
  caseType: CaseType;
  assignedLawyerId: string;
  assignedLawyer?: any;
  clientId: string;
  client?: any;
  title?: string;
  description?: string;
  priority: CasePriority;
  status: CaseStatus;
  startDate?: string;
  endDate?: string;
  nextHearingDate?: string;
  deadlineDate?: string;
  estimatedAmount?: number;
  paidAmount?: number;
  courtFee?: number;
  courtName?: string;
  courtAddress?: string;
  judgeName?: string;
  proceedingStage?: string;
  plaintiffName?: string;
  defendantName?: string;
  thirdParties?: string;
  internalNotes?: string;
  clientNotes?: string;
  metadata?: Record<string, any>;
  documents?: any[];
  events?: any[];
  createdAt: string;
  updatedAt: string;
}

export type CaseType =
  | "judicial_case"
  | "criminal_proceeding"
  | "enforcement_proceeding"
  | "contract_work"
  | "consultation_case"
  | "corporate_case"
  | "registration_case"
  | "administrative_appeal"
  | "mediation_negotiation"
  | "compliance_audit";

export type CasePriority = "low" | "medium" | "high" | "urgent";
export type CaseStatus = "draft" | "active" | "on_hold" | "closed" | "archived";

export interface CreateCaseDto {
  caseNumber?: string;
  registryCaseNumber?: string;
  caseType: CaseType;
  clientId: string;
  assignedLawyerId: string;
  title?: string;
  description?: string;
  priority: CasePriority;
  startDate?: string;
  endDate?: string;
  deadlineDate?: string;
  estimatedAmount?: number;
  courtFee?: number;
  courtName?: string;
  courtAddress?: string;
  judgeName?: string;
  proceedingStage?: string;
  plaintiffName?: string;
  defendantName?: string;
  thirdParties?: string;
  internalNotes?: string;
  clientNotes?: string;
  metadata?: Record<string, any>;
}

export interface UpdateCaseDto extends Partial<CreateCaseDto> {
  status?: CaseStatus;
  nextHearingDate?: string;
  paidAmount?: number;
}

export interface CaseFilters {
  clientId?: string;
  assignedLawyerId?: string;
  caseType?: CaseType;
  priority?: CasePriority;
  status?: CaseStatus;
  search?: string;
  startDateFrom?: string;
  startDateTo?: string;
  deadlineFrom?: string;
  deadlineTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface CaseListResponse {
  data: Case[];
  total: number;
  page: number;
  limit: number;
}

export interface CaseStatistics {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  activeCases: number;
  upcomingDeadlines: number;
}

export interface NextCaseNumberResponse {
  caseNumber: string;
}

export type RegistrySearchSource = "court_registry" | "asvp";

export interface CaseRegistrySearchResult {
  source: RegistrySearchSource;
  sourceLabel: string;
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
  counterpartyName?: string;
  counterpartyRole?: string;
  enforcementState?: string;
}

export interface TimelineEvent {
  type: "event" | "document";
  date: string;
  data: any;
}
