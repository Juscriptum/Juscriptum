export enum SubscriptionPlan {
  BASIC = "basic",
  PROFESSIONAL = "professional",
  ENTERPRISE = "enterprise",
}

export enum SubscriptionStatus {
  TRIALING = "trialing",
  ACTIVE = "active",
  PAST_DUE = "past_due",
  CANCELED = "canceled",
  UNPAID = "unpaid",
}

export enum SubscriptionProvider {
  STRIPE = "stripe",
  WAYFORPAY = "wayforpay",
}

export enum UserRole {
  SUPER_ADMIN = "super_admin",
  ORGANIZATION_OWNER = "organization_owner",
  ORGANIZATION_ADMIN = "organization_admin",
  LAWYER = "lawyer",
  ASSISTANT = "assistant",
  ACCOUNTANT = "accountant",
}

export enum UserStatus {
  PENDING = "pending",
  ACTIVE = "active",
  SUSPENDED = "suspended",
  DELETED = "deleted",
}

export enum InvitationStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  EXPIRED = "expired",
  REVOKED = "revoked",
}

export enum OrganizationStatus {
  PROVISIONING = "provisioning",
  ACTIVE = "active",
  SUSPENDED = "suspended",
  DELETED = "deleted",
}

export enum AuditAction {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LOGIN = "login",
  LOGOUT = "logout",
  PERMISSION_CHANGE = "permission_change",
  VERIFY = "verify",
  REVOKE = "revoke",
}

export enum OnboardingStep {
  ORGANIZATION_DETAILS = "organization_details",
  USER_PROFILE = "user_profile",
  SUBSCRIPTION_SETUP = "subscription_setup",
  TEAM_INVITATION = "team_invitation",
  FIRST_CASE_CREATED = "first_case_created",
}

export enum LegalForm {
  SOLE_PROPRIETOR = "sole_proprietor",
  LLC = "llc",
  JOINT_STOCK = "joint_stock",
  PARTNERSHIP = "partnership",
  OTHER = "other",
}
