/**
 * WORM (Write Once Read Many) Audit Storage Configuration
 * Provides immutable audit logging for compliance
 */

export interface WormAuditConfig {
  enabled: boolean;
  retentionDays: number;
  storageType: "s3" | "database" | "file";
  encryptionEnabled: boolean;
  compressionEnabled: boolean;
}

export interface AuditEntry {
  id: string;
  tenantId: string;
  userId?: string;
  action: AuditActionType;
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  changedFields?: string[];
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  hash: string; // Integrity hash
  previousHash?: string; // Blockchain-like chaining
}

export type AuditActionType =
  | "create"
  | "update"
  | "delete"
  | "login"
  | "logout"
  | "login_failed"
  | "permission_change"
  | "role_change"
  | "password_change"
  | "mfa_enabled"
  | "mfa_disabled"
  | "export"
  | "download"
  | "share"
  | "api_key_create"
  | "api_key_revoke"
  | "settings_change"
  | "subscription_change"
  | "user_invite"
  | "user_remove";

export const DEFAULT_WORM_CONFIG: WormAuditConfig = {
  enabled: true,
  retentionDays: 2555, // 7 years for legal compliance
  storageType: "s3",
  encryptionEnabled: true,
  compressionEnabled: true,
};

export const ENTERPRISE_RETENTION_DAYS = 2555; // 7 years
export const STANDARD_RETENTION_DAYS = 365; // 1 year
