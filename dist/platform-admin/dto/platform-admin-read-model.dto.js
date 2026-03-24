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
    get PlatformAdminDashboardAlertDto () {
        return PlatformAdminDashboardAlertDto;
    },
    get PlatformAdminDashboardSummaryDto () {
        return PlatformAdminDashboardSummaryDto;
    },
    get PlatformAdminMonitoringSummaryDto () {
        return PlatformAdminMonitoringSummaryDto;
    },
    get PlatformAdminOrganizationBillingDto () {
        return PlatformAdminOrganizationBillingDto;
    },
    get PlatformAdminOrganizationDetailDto () {
        return PlatformAdminOrganizationDetailDto;
    },
    get PlatformAdminOrganizationListResponseDto () {
        return PlatformAdminOrganizationListResponseDto;
    },
    get PlatformAdminOrganizationOpsDto () {
        return PlatformAdminOrganizationOpsDto;
    },
    get PlatformAdminOrganizationOwnerDto () {
        return PlatformAdminOrganizationOwnerDto;
    },
    get PlatformAdminOrganizationSecurityDto () {
        return PlatformAdminOrganizationSecurityDto;
    },
    get PlatformAdminOrganizationSummaryDto () {
        return PlatformAdminOrganizationSummaryDto;
    },
    get PlatformAdminOrganizationTotalsDto () {
        return PlatformAdminOrganizationTotalsDto;
    },
    get PlatformAdminOrganizationUserDto () {
        return PlatformAdminOrganizationUserDto;
    },
    get PlatformAdminOrganizationsQueryDto () {
        return PlatformAdminOrganizationsQueryDto;
    },
    get PlatformAdminUserTotalsDto () {
        return PlatformAdminUserTotalsDto;
    }
});
const _classtransformer = require("class-transformer");
const _classvalidator = require("class-validator");
const _subscriptionenum = require("../../database/entities/enums/subscription.enum");
const _swagger = require("@nestjs/swagger");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let PlatformAdminDashboardAlertDto = class PlatformAdminDashboardAlertDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], PlatformAdminDashboardAlertDto.prototype, "id", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], PlatformAdminDashboardAlertDto.prototype, "type", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        enum: [
            "medium",
            "high",
            "critical"
        ]
    }),
    _ts_metadata("design:type", String)
], PlatformAdminDashboardAlertDto.prototype, "severity", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], PlatformAdminDashboardAlertDto.prototype, "message", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    _ts_metadata("design:type", String)
], PlatformAdminDashboardAlertDto.prototype, "organizationId", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    _ts_metadata("design:type", String)
], PlatformAdminDashboardAlertDto.prototype, "organizationName", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], PlatformAdminDashboardAlertDto.prototype, "createdAt", void 0);
let PlatformAdminOrganizationTotalsDto = class PlatformAdminOrganizationTotalsDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminOrganizationTotalsDto.prototype, "total", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminOrganizationTotalsDto.prototype, "active", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminOrganizationTotalsDto.prototype, "suspended", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminOrganizationTotalsDto.prototype, "provisioning", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminOrganizationTotalsDto.prototype, "trialing", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminOrganizationTotalsDto.prototype, "pastDue", void 0);
let PlatformAdminUserTotalsDto = class PlatformAdminUserTotalsDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminUserTotalsDto.prototype, "total", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminUserTotalsDto.prototype, "active", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminUserTotalsDto.prototype, "locked", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminUserTotalsDto.prototype, "organizationsWithoutOwnerMfa", void 0);
let PlatformAdminMonitoringSummaryDto = class PlatformAdminMonitoringSummaryDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], PlatformAdminMonitoringSummaryDto.prototype, "readinessStatus", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], PlatformAdminMonitoringSummaryDto.prototype, "databaseStatus", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], PlatformAdminMonitoringSummaryDto.prototype, "redisStatus", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], PlatformAdminMonitoringSummaryDto.prototype, "authStatus", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], PlatformAdminMonitoringSummaryDto.prototype, "billingStatus", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], PlatformAdminMonitoringSummaryDto.prototype, "trustVerificationStatus", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], PlatformAdminMonitoringSummaryDto.prototype, "malwareScanningStatus", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], PlatformAdminMonitoringSummaryDto.prototype, "outboxStatus", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminMonitoringSummaryDto.prototype, "trustVerificationDue", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminMonitoringSummaryDto.prototype, "trustVerificationFailed", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminMonitoringSummaryDto.prototype, "malwareScanningDue", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminMonitoringSummaryDto.prototype, "malwareScanningFailed", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminMonitoringSummaryDto.prototype, "infectedLast24h", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminMonitoringSummaryDto.prototype, "outboxPending", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminMonitoringSummaryDto.prototype, "outboxDeadLetterRisk", void 0);
let PlatformAdminDashboardSummaryDto = class PlatformAdminDashboardSummaryDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], PlatformAdminDashboardSummaryDto.prototype, "generatedAt", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        type: PlatformAdminOrganizationTotalsDto
    }),
    _ts_metadata("design:type", typeof PlatformAdminOrganizationTotalsDto === "undefined" ? Object : PlatformAdminOrganizationTotalsDto)
], PlatformAdminDashboardSummaryDto.prototype, "organizations", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        type: PlatformAdminUserTotalsDto
    }),
    _ts_metadata("design:type", typeof PlatformAdminUserTotalsDto === "undefined" ? Object : PlatformAdminUserTotalsDto)
], PlatformAdminDashboardSummaryDto.prototype, "users", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminDashboardSummaryDto.prototype, "storageBytes", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminDashboardSummaryDto.prototype, "pendingMalwareScans", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminDashboardSummaryDto.prototype, "infectedDocuments", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        type: PlatformAdminMonitoringSummaryDto
    }),
    _ts_metadata("design:type", typeof PlatformAdminMonitoringSummaryDto === "undefined" ? Object : PlatformAdminMonitoringSummaryDto)
], PlatformAdminDashboardSummaryDto.prototype, "monitoring", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        type: [
            PlatformAdminDashboardAlertDto
        ]
    }),
    _ts_metadata("design:type", Array)
], PlatformAdminDashboardSummaryDto.prototype, "alerts", void 0);
let PlatformAdminOrganizationOwnerDto = class PlatformAdminOrganizationOwnerDto {
};
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    _ts_metadata("design:type", String)
], PlatformAdminOrganizationOwnerDto.prototype, "id", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], PlatformAdminOrganizationOwnerDto.prototype, "fullName", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    _ts_metadata("design:type", Object)
], PlatformAdminOrganizationOwnerDto.prototype, "emailMasked", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Boolean)
], PlatformAdminOrganizationOwnerDto.prototype, "mfaEnabled", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    _ts_metadata("design:type", Object)
], PlatformAdminOrganizationOwnerDto.prototype, "lastLoginAt", void 0);
let PlatformAdminOrganizationSummaryDto = class PlatformAdminOrganizationSummaryDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], PlatformAdminOrganizationSummaryDto.prototype, "id", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], PlatformAdminOrganizationSummaryDto.prototype, "name", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], PlatformAdminOrganizationSummaryDto.prototype, "status", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        enum: _subscriptionenum.SubscriptionPlan
    }),
    _ts_metadata("design:type", typeof _subscriptionenum.SubscriptionPlan === "undefined" ? Object : _subscriptionenum.SubscriptionPlan)
], PlatformAdminOrganizationSummaryDto.prototype, "subscriptionPlan", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        enum: _subscriptionenum.SubscriptionStatus
    }),
    _ts_metadata("design:type", typeof _subscriptionenum.SubscriptionStatus === "undefined" ? Object : _subscriptionenum.SubscriptionStatus)
], PlatformAdminOrganizationSummaryDto.prototype, "subscriptionStatus", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        type: PlatformAdminOrganizationOwnerDto
    }),
    _ts_metadata("design:type", typeof PlatformAdminOrganizationOwnerDto === "undefined" ? Object : PlatformAdminOrganizationOwnerDto)
], PlatformAdminOrganizationSummaryDto.prototype, "owner", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminOrganizationSummaryDto.prototype, "usersCount", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminOrganizationSummaryDto.prototype, "activeUsersCount", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminOrganizationSummaryDto.prototype, "storageBytes", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    _ts_metadata("design:type", Object)
], PlatformAdminOrganizationSummaryDto.prototype, "lastActivityAt", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        type: [
            String
        ]
    }),
    _ts_metadata("design:type", Array)
], PlatformAdminOrganizationSummaryDto.prototype, "riskFlags", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], PlatformAdminOrganizationSummaryDto.prototype, "createdAt", void 0);
let PlatformAdminOrganizationListResponseDto = class PlatformAdminOrganizationListResponseDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        type: [
            PlatformAdminOrganizationSummaryDto
        ]
    }),
    _ts_metadata("design:type", Array)
], PlatformAdminOrganizationListResponseDto.prototype, "items", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminOrganizationListResponseDto.prototype, "page", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminOrganizationListResponseDto.prototype, "limit", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminOrganizationListResponseDto.prototype, "total", void 0);
let PlatformAdminOrganizationBillingDto = class PlatformAdminOrganizationBillingDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        enum: _subscriptionenum.SubscriptionPlan
    }),
    _ts_metadata("design:type", typeof _subscriptionenum.SubscriptionPlan === "undefined" ? Object : _subscriptionenum.SubscriptionPlan)
], PlatformAdminOrganizationBillingDto.prototype, "subscriptionPlan", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        enum: _subscriptionenum.SubscriptionStatus
    }),
    _ts_metadata("design:type", typeof _subscriptionenum.SubscriptionStatus === "undefined" ? Object : _subscriptionenum.SubscriptionStatus)
], PlatformAdminOrganizationBillingDto.prototype, "subscriptionStatus", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    _ts_metadata("design:type", Object)
], PlatformAdminOrganizationBillingDto.prototype, "provider", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    _ts_metadata("design:type", Object)
], PlatformAdminOrganizationBillingDto.prototype, "amountCents", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    _ts_metadata("design:type", Object)
], PlatformAdminOrganizationBillingDto.prototype, "currency", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    _ts_metadata("design:type", Object)
], PlatformAdminOrganizationBillingDto.prototype, "trialEndAt", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    _ts_metadata("design:type", Object)
], PlatformAdminOrganizationBillingDto.prototype, "currentPeriodEndAt", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Boolean)
], PlatformAdminOrganizationBillingDto.prototype, "cancelAtPeriodEnd", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    _ts_metadata("design:type", Object)
], PlatformAdminOrganizationBillingDto.prototype, "lastSyncedAt", void 0);
let PlatformAdminOrganizationSecurityDto = class PlatformAdminOrganizationSecurityDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Boolean)
], PlatformAdminOrganizationSecurityDto.prototype, "organizationMfaRequired", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Boolean)
], PlatformAdminOrganizationSecurityDto.prototype, "ownerMfaEnabled", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminOrganizationSecurityDto.prototype, "ownersWithoutMfa", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminOrganizationSecurityDto.prototype, "mfaEnabledUsersCount", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminOrganizationSecurityDto.prototype, "lockedUsersCount", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminOrganizationSecurityDto.prototype, "suspendedUsersCount", void 0);
let PlatformAdminOrganizationOpsDto = class PlatformAdminOrganizationOpsDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminOrganizationOpsDto.prototype, "documentsCount", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminOrganizationOpsDto.prototype, "storageBytes", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminOrganizationOpsDto.prototype, "pendingMalwareScans", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminOrganizationOpsDto.prototype, "infectedDocuments", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminOrganizationOpsDto.prototype, "auditEntriesLast30d", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    _ts_metadata("design:type", Object)
], PlatformAdminOrganizationOpsDto.prototype, "lastActivityAt", void 0);
let PlatformAdminOrganizationDetailDto = class PlatformAdminOrganizationDetailDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], PlatformAdminOrganizationDetailDto.prototype, "id", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], PlatformAdminOrganizationDetailDto.prototype, "name", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], PlatformAdminOrganizationDetailDto.prototype, "status", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], PlatformAdminOrganizationDetailDto.prototype, "legalForm", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    _ts_metadata("design:type", Object)
], PlatformAdminOrganizationDetailDto.prototype, "city", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    _ts_metadata("design:type", Object)
], PlatformAdminOrganizationDetailDto.prototype, "region", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], PlatformAdminOrganizationDetailDto.prototype, "country", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    _ts_metadata("design:type", Object)
], PlatformAdminOrganizationDetailDto.prototype, "customDomain", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    _ts_metadata("design:type", Object)
], PlatformAdminOrganizationDetailDto.prototype, "organizationEmailMasked", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminOrganizationDetailDto.prototype, "maxUsers", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], PlatformAdminOrganizationDetailDto.prototype, "auditRetentionDays", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        type: PlatformAdminOrganizationOwnerDto
    }),
    _ts_metadata("design:type", typeof PlatformAdminOrganizationOwnerDto === "undefined" ? Object : PlatformAdminOrganizationOwnerDto)
], PlatformAdminOrganizationDetailDto.prototype, "owner", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        type: PlatformAdminOrganizationBillingDto
    }),
    _ts_metadata("design:type", typeof PlatformAdminOrganizationBillingDto === "undefined" ? Object : PlatformAdminOrganizationBillingDto)
], PlatformAdminOrganizationDetailDto.prototype, "billing", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        type: PlatformAdminOrganizationSecurityDto
    }),
    _ts_metadata("design:type", typeof PlatformAdminOrganizationSecurityDto === "undefined" ? Object : PlatformAdminOrganizationSecurityDto)
], PlatformAdminOrganizationDetailDto.prototype, "security", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        type: PlatformAdminOrganizationOpsDto
    }),
    _ts_metadata("design:type", typeof PlatformAdminOrganizationOpsDto === "undefined" ? Object : PlatformAdminOrganizationOpsDto)
], PlatformAdminOrganizationDetailDto.prototype, "ops", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        type: [
            String
        ]
    }),
    _ts_metadata("design:type", Array)
], PlatformAdminOrganizationDetailDto.prototype, "riskFlags", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], PlatformAdminOrganizationDetailDto.prototype, "createdAt", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], PlatformAdminOrganizationDetailDto.prototype, "updatedAt", void 0);
let PlatformAdminOrganizationUserDto = class PlatformAdminOrganizationUserDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], PlatformAdminOrganizationUserDto.prototype, "id", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], PlatformAdminOrganizationUserDto.prototype, "fullName", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    _ts_metadata("design:type", Object)
], PlatformAdminOrganizationUserDto.prototype, "emailMasked", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], PlatformAdminOrganizationUserDto.prototype, "role", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], PlatformAdminOrganizationUserDto.prototype, "status", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Boolean)
], PlatformAdminOrganizationUserDto.prototype, "mfaEnabled", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Boolean)
], PlatformAdminOrganizationUserDto.prototype, "emailVerified", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    _ts_metadata("design:type", Object)
], PlatformAdminOrganizationUserDto.prototype, "lastLoginAt", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    _ts_metadata("design:type", Object)
], PlatformAdminOrganizationUserDto.prototype, "lockedUntil", void 0);
let PlatformAdminOrganizationsQueryDto = class PlatformAdminOrganizationsQueryDto {
    constructor(){
        this.page = 1;
        this.limit = 10;
    }
};
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], PlatformAdminOrganizationsQueryDto.prototype, "q", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        enum: _subscriptionenum.OrganizationStatus
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)(_subscriptionenum.OrganizationStatus),
    _ts_metadata("design:type", typeof _subscriptionenum.OrganizationStatus === "undefined" ? Object : _subscriptionenum.OrganizationStatus)
], PlatformAdminOrganizationsQueryDto.prototype, "status", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        enum: _subscriptionenum.SubscriptionPlan
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)(_subscriptionenum.SubscriptionPlan),
    _ts_metadata("design:type", typeof _subscriptionenum.SubscriptionPlan === "undefined" ? Object : _subscriptionenum.SubscriptionPlan)
], PlatformAdminOrganizationsQueryDto.prototype, "plan", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        enum: _subscriptionenum.SubscriptionStatus
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)(_subscriptionenum.SubscriptionStatus),
    _ts_metadata("design:type", typeof _subscriptionenum.SubscriptionStatus === "undefined" ? Object : _subscriptionenum.SubscriptionStatus)
], PlatformAdminOrganizationsQueryDto.prototype, "subscriptionStatus", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        default: 1
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.Min)(1),
    _ts_metadata("design:type", Number)
], PlatformAdminOrganizationsQueryDto.prototype, "page", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        default: 10
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.Min)(1),
    (0, _classvalidator.Max)(50),
    _ts_metadata("design:type", Number)
], PlatformAdminOrganizationsQueryDto.prototype, "limit", void 0);

//# sourceMappingURL=platform-admin-read-model.dto.js.map