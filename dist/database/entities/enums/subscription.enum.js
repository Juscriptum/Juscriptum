"use strict";
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
    get AuditAction () {
        return AuditAction;
    },
    get InvitationStatus () {
        return InvitationStatus;
    },
    get LegalForm () {
        return LegalForm;
    },
    get OnboardingStep () {
        return OnboardingStep;
    },
    get OrganizationStatus () {
        return OrganizationStatus;
    },
    get SubscriptionPlan () {
        return SubscriptionPlan;
    },
    get SubscriptionProvider () {
        return SubscriptionProvider;
    },
    get SubscriptionStatus () {
        return SubscriptionStatus;
    },
    get UserRole () {
        return UserRole;
    },
    get UserStatus () {
        return UserStatus;
    }
});
var SubscriptionPlan = /*#__PURE__*/ function(SubscriptionPlan) {
    SubscriptionPlan["BASIC"] = "basic";
    SubscriptionPlan["PROFESSIONAL"] = "professional";
    SubscriptionPlan["ENTERPRISE"] = "enterprise";
    return SubscriptionPlan;
}({});
var SubscriptionStatus = /*#__PURE__*/ function(SubscriptionStatus) {
    SubscriptionStatus["TRIALING"] = "trialing";
    SubscriptionStatus["ACTIVE"] = "active";
    SubscriptionStatus["PAST_DUE"] = "past_due";
    SubscriptionStatus["CANCELED"] = "canceled";
    SubscriptionStatus["UNPAID"] = "unpaid";
    return SubscriptionStatus;
}({});
var SubscriptionProvider = /*#__PURE__*/ function(SubscriptionProvider) {
    SubscriptionProvider["STRIPE"] = "stripe";
    SubscriptionProvider["WAYFORPAY"] = "wayforpay";
    return SubscriptionProvider;
}({});
var UserRole = /*#__PURE__*/ function(UserRole) {
    UserRole["SUPER_ADMIN"] = "super_admin";
    UserRole["ORGANIZATION_OWNER"] = "organization_owner";
    UserRole["ORGANIZATION_ADMIN"] = "organization_admin";
    UserRole["LAWYER"] = "lawyer";
    UserRole["ASSISTANT"] = "assistant";
    UserRole["ACCOUNTANT"] = "accountant";
    return UserRole;
}({});
var UserStatus = /*#__PURE__*/ function(UserStatus) {
    UserStatus["PENDING"] = "pending";
    UserStatus["ACTIVE"] = "active";
    UserStatus["SUSPENDED"] = "suspended";
    UserStatus["DELETED"] = "deleted";
    return UserStatus;
}({});
var InvitationStatus = /*#__PURE__*/ function(InvitationStatus) {
    InvitationStatus["PENDING"] = "pending";
    InvitationStatus["ACCEPTED"] = "accepted";
    InvitationStatus["EXPIRED"] = "expired";
    InvitationStatus["REVOKED"] = "revoked";
    return InvitationStatus;
}({});
var OrganizationStatus = /*#__PURE__*/ function(OrganizationStatus) {
    OrganizationStatus["PROVISIONING"] = "provisioning";
    OrganizationStatus["ACTIVE"] = "active";
    OrganizationStatus["SUSPENDED"] = "suspended";
    OrganizationStatus["DELETED"] = "deleted";
    return OrganizationStatus;
}({});
var AuditAction = /*#__PURE__*/ function(AuditAction) {
    AuditAction["CREATE"] = "create";
    AuditAction["UPDATE"] = "update";
    AuditAction["DELETE"] = "delete";
    AuditAction["LOGIN"] = "login";
    AuditAction["LOGOUT"] = "logout";
    AuditAction["PERMISSION_CHANGE"] = "permission_change";
    AuditAction["VERIFY"] = "verify";
    AuditAction["REVOKE"] = "revoke";
    return AuditAction;
}({});
var OnboardingStep = /*#__PURE__*/ function(OnboardingStep) {
    OnboardingStep["ORGANIZATION_DETAILS"] = "organization_details";
    OnboardingStep["USER_PROFILE"] = "user_profile";
    OnboardingStep["SUBSCRIPTION_SETUP"] = "subscription_setup";
    OnboardingStep["TEAM_INVITATION"] = "team_invitation";
    OnboardingStep["FIRST_CASE_CREATED"] = "first_case_created";
    return OnboardingStep;
}({});
var LegalForm = /*#__PURE__*/ function(LegalForm) {
    LegalForm["SOLE_PROPRIETOR"] = "sole_proprietor";
    LegalForm["LLC"] = "llc";
    LegalForm["JOINT_STOCK"] = "joint_stock";
    LegalForm["PARTNERSHIP"] = "partnership";
    LegalForm["OTHER"] = "other";
    return LegalForm;
}({});

//# sourceMappingURL=subscription.enum.js.map