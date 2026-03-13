/**
 * Auth Types
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  patronymic?: string;
  phone?: string;
  position?: string;
  avatarUrl?: string;
  organizationType?: "SELF_EMPLOYED" | "FOP" | "LEGAL_ENTITY";
  taxId?: string;
  phonePrimary?: string;
  phoneSecondary?: string[];
  emailPrimary?: string;
  emailSecondary?: string[];
  legalStatus?: "LAWYER" | "ADVOCATE" | "ADVOCATE_BPD";
  bankName?: string;
  bankMfo?: string;
  iban?: string;
  taxSystem?: "non_profit" | "general" | "simplified" | "other";
  vatPayer?: boolean;
  role: UserRole;
  tenantId: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  status: UserStatus;
}

export type UserRole =
  | "super_admin"
  | "organization_owner"
  | "organization_admin"
  | "lawyer"
  | "assistant"
  | "accountant";

export type UserStatus = "pending" | "active" | "suspended" | "deleted";

export interface LoginCredentials {
  email: string;
  password: string;
  mfaCode?: string;
}

/**
 * Registration collects only tenant bootstrap data.
 */
export interface RegisterCredentials {
  email: string;
  password: string;
}

/**
 * Full organization registration (optional, for later)
 */
export interface RegisterOrganizationCredentials {
  name: string;
  legalForm?: LegalForm;
  edrpou?: string;
  taxNumber?: string;
  address?: string;
  city?: string;
  region?: string;
  phone?: string;
  email: string;
  website?: string;
  subscriptionPlan?: SubscriptionPlan;
  firstName: string;
  lastName: string;
  patronymic?: string;
  password: string;
  position?: string;
  barNumber?: string;
}

export type LegalForm =
  | "sole_proprietor"
  | "llc"
  | "joint_stock"
  | "partnership"
  | "other";

export type SubscriptionPlan = "basic" | "professional" | "enterprise";

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
  organization: Organization;
}

export interface Organization {
  id: string;
  name: string;
  legalForm: LegalForm;
  edrpou?: string;
  taxNumber?: string;
  address?: string;
  city?: string;
  region?: string;
  phone?: string;
  email: string;
  website?: string;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  trialEndAt?: string;
  maxUsers: number;
  status: OrganizationStatus;
}

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid";

export type OrganizationStatus =
  | "provisioning"
  | "active"
  | "suspended"
  | "deleted";

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

export interface VerifyEmailData {
  token: string;
}

export interface Permission {
  resource: string;
  action: string;
  condition?: (user: User, organization: Organization) => boolean;
}
