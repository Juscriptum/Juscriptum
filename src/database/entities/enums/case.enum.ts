/**
 * Case-related Enums
 */
export enum CaseStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  ON_HOLD = "on_hold",
  CLOSED = "closed",
  ARCHIVED = "archived",
}

export enum CasePriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

export enum CaseType {
  JUDICIAL_CASE = "judicial_case",
  CRIMINAL_PROCEEDING = "criminal_proceeding",
  ENFORCEMENT_PROCEEDING = "enforcement_proceeding",
  CONTRACT_WORK = "contract_work",
  CONSULTATION_CASE = "consultation_case",
  CORPORATE_CASE = "corporate_case",
  REGISTRATION_CASE = "registration_case",
  ADMINISTRATIVE_APPEAL = "administrative_appeal",
  MEDIATION_NEGOTIATION = "mediation_negotiation",
  COMPLIANCE_AUDIT = "compliance_audit",
}
