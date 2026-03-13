export type TeamRole =
  | "super_admin"
  | "organization_owner"
  | "organization_admin"
  | "lawyer"
  | "assistant"
  | "accountant";

export type TeamMemberStatus = "pending" | "active" | "suspended" | "deleted";

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  patronymic?: string;
  email: string;
  phone?: string;
  position?: string;
  role: TeamRole;
  status: TeamMemberStatus;
  emailVerified: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: TeamRole;
  status: InvitationStatus;
  message?: string | null;
  expiresAt: string;
  createdAt: string;
  invitedBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

export interface CreateInvitationData {
  email: string;
  role: TeamRole;
  message?: string;
}

export interface UpdateMemberData {
  role?: TeamRole;
  status?: TeamMemberStatus;
}
