/**
 * Notification Type Enums
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get NotificationChannel () {
        return NotificationChannel;
    },
    get NotificationPlatform () {
        return NotificationPlatform;
    },
    get NotificationPriority () {
        return NotificationPriority;
    },
    get NotificationStatus () {
        return NotificationStatus;
    },
    get NotificationType () {
        return NotificationType;
    }
});
var NotificationType = /*#__PURE__*/ function(NotificationType) {
    // System notifications
    NotificationType["SYSTEM"] = "system";
    NotificationType["MAINTENANCE"] = "maintenance";
    NotificationType["UPDATE"] = "update";
    // Authentication & Security
    NotificationType["LOGIN"] = "login";
    NotificationType["LOGOUT"] = "logout";
    NotificationType["PASSWORD_CHANGE"] = "password_change";
    NotificationType["MFA_ENABLED"] = "mfa_enabled";
    NotificationType["SUSPICIOUS_ACTIVITY"] = "suspicious_activity";
    // Case related
    NotificationType["CASE_CREATED"] = "case_created";
    NotificationType["CASE_UPDATED"] = "case_updated";
    NotificationType["CASE_CLOSED"] = "case_closed";
    NotificationType["CASE_DEADLINE"] = "case_deadline";
    NotificationType["CASE_ASSIGNED"] = "case_assigned";
    // Client related
    NotificationType["CLIENT_CREATED"] = "client_created";
    NotificationType["CLIENT_UPDATED"] = "client_updated";
    // Document related
    NotificationType["DOCUMENT_UPLOADED"] = "document_uploaded";
    NotificationType["DOCUMENT_SHARED"] = "document_shared";
    NotificationType["DOCUMENT_EXPIRING"] = "document_expiring";
    // Billing related
    NotificationType["INVOICE_CREATED"] = "invoice_created";
    NotificationType["INVOICE_PAID"] = "invoice_paid";
    NotificationType["INVOICE_OVERDUE"] = "invoice_overdue";
    NotificationType["PAYMENT_RECEIVED"] = "payment_received";
    NotificationType["SUBSCRIPTION_RENEWAL"] = "subscription_renewal";
    NotificationType["SUBSCRIPTION_EXPIRED"] = "subscription_expired";
    // Calendar/Events
    NotificationType["EVENT_REMINDER"] = "event_reminder";
    NotificationType["EVENT_CREATED"] = "event_created";
    NotificationType["EVENT_UPDATED"] = "event_updated";
    // Team/Invitation
    NotificationType["TEAM_INVITATION"] = "team_invitation";
    NotificationType["TEAM_MEMBER_JOINED"] = "team_member_joined";
    // General
    NotificationType["MENTION"] = "mention";
    NotificationType["COMMENT"] = "comment";
    NotificationType["TASK_ASSIGNED"] = "task_assigned";
    NotificationType["TASK_COMPLETED"] = "task_completed";
    return NotificationType;
}({});
var NotificationStatus = /*#__PURE__*/ function(NotificationStatus) {
    NotificationStatus["PENDING"] = "pending";
    NotificationStatus["QUEUED"] = "queued";
    NotificationStatus["SENT"] = "sent";
    NotificationStatus["DELIVERED"] = "delivered";
    NotificationStatus["READ"] = "read";
    NotificationStatus["FAILED"] = "failed";
    NotificationStatus["CANCELLED"] = "cancelled";
    return NotificationStatus;
}({});
var NotificationPriority = /*#__PURE__*/ function(NotificationPriority) {
    NotificationPriority["LOW"] = "low";
    NotificationPriority["NORMAL"] = "normal";
    NotificationPriority["HIGH"] = "high";
    NotificationPriority["URGENT"] = "urgent";
    return NotificationPriority;
}({});
var NotificationChannel = /*#__PURE__*/ function(NotificationChannel) {
    NotificationChannel["EMAIL"] = "email";
    NotificationChannel["SMS"] = "sms";
    NotificationChannel["PUSH"] = "push";
    NotificationChannel["IN_APP"] = "in_app";
    return NotificationChannel;
}({});
var NotificationPlatform = /*#__PURE__*/ function(NotificationPlatform) {
    NotificationPlatform["WEB"] = "web";
    NotificationPlatform["MOBILE"] = "mobile";
    NotificationPlatform["DESKTOP"] = "desktop";
    return NotificationPlatform;
}({});

//# sourceMappingURL=notification-types.enum.js.map