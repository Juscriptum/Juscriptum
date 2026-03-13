/**
 * Notification Type Enums
 */

export enum NotificationType {
  // System notifications
  SYSTEM = "system",
  MAINTENANCE = "maintenance",
  UPDATE = "update",

  // Authentication & Security
  LOGIN = "login",
  LOGOUT = "logout",
  PASSWORD_CHANGE = "password_change",
  MFA_ENABLED = "mfa_enabled",
  SUSPICIOUS_ACTIVITY = "suspicious_activity",

  // Case related
  CASE_CREATED = "case_created",
  CASE_UPDATED = "case_updated",
  CASE_CLOSED = "case_closed",
  CASE_DEADLINE = "case_deadline",
  CASE_ASSIGNED = "case_assigned",

  // Client related
  CLIENT_CREATED = "client_created",
  CLIENT_UPDATED = "client_updated",

  // Document related
  DOCUMENT_UPLOADED = "document_uploaded",
  DOCUMENT_SHARED = "document_shared",
  DOCUMENT_EXPIRING = "document_expiring",

  // Billing related
  INVOICE_CREATED = "invoice_created",
  INVOICE_PAID = "invoice_paid",
  INVOICE_OVERDUE = "invoice_overdue",
  PAYMENT_RECEIVED = "payment_received",
  SUBSCRIPTION_RENEWAL = "subscription_renewal",
  SUBSCRIPTION_EXPIRED = "subscription_expired",

  // Calendar/Events
  EVENT_REMINDER = "event_reminder",
  EVENT_CREATED = "event_created",
  EVENT_UPDATED = "event_updated",

  // Team/Invitation
  TEAM_INVITATION = "team_invitation",
  TEAM_MEMBER_JOINED = "team_member_joined",

  // General
  MENTION = "mention",
  COMMENT = "comment",
  TASK_ASSIGNED = "task_assigned",
  TASK_COMPLETED = "task_completed",
}

export enum NotificationStatus {
  PENDING = "pending",
  QUEUED = "queued",
  SENT = "sent",
  DELIVERED = "delivered",
  READ = "read",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export enum NotificationPriority {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
  URGENT = "urgent",
}

export enum NotificationChannel {
  EMAIL = "email",
  SMS = "sms",
  PUSH = "push",
  IN_APP = "in_app",
}

export enum NotificationPlatform {
  WEB = "web",
  MOBILE = "mobile",
  DESKTOP = "desktop",
}
