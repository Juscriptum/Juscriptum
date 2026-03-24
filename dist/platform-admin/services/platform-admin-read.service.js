"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PlatformAdminReadService", {
    enumerable: true,
    get: function() {
        return PlatformAdminReadService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _entities = require("../../database/entities");
const _health = require("../../common/health");
const _logging = require("../../common/logging");
const _subscriptionenum = require("../../database/entities/enums/subscription.enum");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
const DEFAULT_USER_AGGREGATE = {
    usersCount: 0,
    activeUsersCount: 0,
    suspendedUsersCount: 0,
    mfaEnabledUsersCount: 0,
    ownersWithoutMfa: 0,
    lockedUsersCount: 0,
    lastLoginAt: null
};
const DEFAULT_DOCUMENT_AGGREGATE = {
    storageBytes: 0,
    documentsCount: 0,
    pendingMalwareScans: 0,
    infectedDocuments: 0,
    lastUploadedAt: null
};
const DEFAULT_AUDIT_AGGREGATE = {
    auditEntriesLast30d: 0,
    lastAuditAt: null
};
let PlatformAdminReadService = class PlatformAdminReadService {
    async getDashboardSummary() {
        const generatedAt = new Date();
        const organizations = await this.organizationRepository.find({
            where: {
                deletedAt: (0, _typeorm1.IsNull)()
            },
            order: {
                createdAt: "DESC"
            }
        });
        const organizationTotals = this.buildOrganizationTotals(organizations);
        const organizationIds = organizations.map((organization)=>organization.id);
        const usersTotals = await this.getGlobalUserTotals(organizationIds);
        const documentTotals = await this.getGlobalDocumentTotals(organizationIds);
        const monitoring = await this.getMonitoringSummary();
        return {
            generatedAt: generatedAt.toISOString(),
            organizations: organizationTotals,
            users: usersTotals,
            storageBytes: documentTotals.storageBytes,
            pendingMalwareScans: documentTotals.pendingMalwareScans,
            infectedDocuments: documentTotals.infectedDocuments,
            monitoring,
            alerts: this.buildDashboardAlerts(generatedAt, organizationTotals, usersTotals, documentTotals, monitoring)
        };
    }
    async getOrganizations(query) {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const queryBuilder = this.organizationRepository.createQueryBuilder("organization").where("organization.deletedAt IS NULL");
        if (query.q?.trim()) {
            const normalized = `%${query.q.trim().toLowerCase()}%`;
            queryBuilder.andWhere("(LOWER(organization.name) LIKE :q OR LOWER(COALESCE(organization.customDomain, '')) LIKE :q OR organization.id = :exactId)", {
                q: normalized,
                exactId: query.q.trim()
            });
        }
        if (query.status) {
            queryBuilder.andWhere("organization.status = :status", {
                status: query.status
            });
        }
        if (query.plan) {
            queryBuilder.andWhere("organization.subscriptionPlan = :plan", {
                plan: query.plan
            });
        }
        if (query.subscriptionStatus) {
            queryBuilder.andWhere("organization.subscriptionStatus = :subscriptionStatus", {
                subscriptionStatus: query.subscriptionStatus
            });
        }
        const [organizations, total] = await queryBuilder.orderBy("organization.createdAt", "DESC").skip((page - 1) * limit).take(limit).getManyAndCount();
        const items = await this.buildOrganizationSummaries(organizations);
        return {
            items,
            page,
            limit,
            total
        };
    }
    async getOrganizationDetail(organizationId) {
        const organization = await this.organizationRepository.findOne({
            where: {
                id: organizationId,
                deletedAt: (0, _typeorm1.IsNull)()
            }
        });
        if (!organization) {
            throw new _common.NotFoundException("Організацію не знайдено");
        }
        const tenantIds = [
            organization.id
        ];
        const [owners, subscriptions, users, documents, audits] = await Promise.all([
            this.getOwnerMap(tenantIds),
            this.getSubscriptionMap(tenantIds),
            this.getUserAggregates(tenantIds),
            this.getDocumentAggregates(tenantIds),
            this.getAuditAggregates(tenantIds)
        ]);
        const owner = owners.get(organization.id);
        const subscription = subscriptions.get(organization.id) || null;
        const userAggregate = users.get(organization.id) || DEFAULT_USER_AGGREGATE;
        const documentAggregate = documents.get(organization.id) || DEFAULT_DOCUMENT_AGGREGATE;
        const auditAggregate = audits.get(organization.id) || DEFAULT_AUDIT_AGGREGATE;
        const riskFlags = this.getRiskFlags(organization, userAggregate, documentAggregate);
        return {
            id: organization.id,
            name: organization.name,
            status: organization.status,
            legalForm: organization.legalForm,
            city: organization.city,
            region: organization.region,
            country: organization.country,
            customDomain: organization.customDomain,
            organizationEmailMasked: this.maskEmail(organization.email),
            maxUsers: organization.maxUsers,
            auditRetentionDays: organization.auditRetentionDays,
            owner: this.buildOwnerDto(owner, organization),
            billing: this.buildOrganizationBilling(organization, subscription),
            security: this.buildOrganizationSecurity(organization, userAggregate),
            ops: this.buildOrganizationOps(organization, documentAggregate, auditAggregate, userAggregate),
            riskFlags,
            createdAt: organization.createdAt.toISOString(),
            updatedAt: organization.updatedAt.toISOString()
        };
    }
    async getOrganizationUsers(organizationId) {
        const organization = await this.organizationRepository.findOne({
            where: {
                id: organizationId,
                deletedAt: (0, _typeorm1.IsNull)()
            }
        });
        if (!organization) {
            throw new _common.NotFoundException("Організацію не знайдено");
        }
        const members = await this.userRepository.find({
            where: {
                tenantId: organizationId,
                deletedAt: (0, _typeorm1.IsNull)()
            },
            order: {
                role: "ASC",
                createdAt: "ASC"
            }
        });
        return members.map((member)=>({
                id: member.id,
                fullName: this.formatFullName(member.firstName, member.lastName),
                emailMasked: this.maskEmail(member.email),
                role: member.role,
                status: member.status,
                mfaEnabled: member.mfaEnabled,
                emailVerified: member.emailVerified,
                lastLoginAt: member.lastLoginAt?.toISOString() || null,
                lockedUntil: member.lockedUntil?.toISOString() || null
            }));
    }
    async buildOrganizationSummaries(organizations) {
        const tenantIds = organizations.map((organization)=>organization.id);
        const [owners, users, documents, audits] = await Promise.all([
            this.getOwnerMap(tenantIds),
            this.getUserAggregates(tenantIds),
            this.getDocumentAggregates(tenantIds),
            this.getAuditAggregates(tenantIds)
        ]);
        return organizations.map((organization)=>{
            const owner = owners.get(organization.id);
            const userAggregate = users.get(organization.id) || DEFAULT_USER_AGGREGATE;
            const documentAggregate = documents.get(organization.id) || DEFAULT_DOCUMENT_AGGREGATE;
            const auditAggregate = audits.get(organization.id) || DEFAULT_AUDIT_AGGREGATE;
            return {
                id: organization.id,
                name: organization.name,
                status: organization.status,
                subscriptionPlan: organization.subscriptionPlan,
                subscriptionStatus: organization.subscriptionStatus,
                owner: this.buildOwnerDto(owner, organization),
                usersCount: userAggregate.usersCount,
                activeUsersCount: userAggregate.activeUsersCount,
                storageBytes: documentAggregate.storageBytes,
                lastActivityAt: this.computeLastActivityAt(organization.updatedAt, userAggregate.lastLoginAt, documentAggregate.lastUploadedAt, auditAggregate.lastAuditAt) || null,
                riskFlags: this.getRiskFlags(organization, userAggregate, documentAggregate),
                createdAt: organization.createdAt.toISOString()
            };
        });
    }
    buildOrganizationTotals(organizations) {
        return organizations.reduce((accumulator, organization)=>{
            accumulator.total += 1;
            if (organization.status === _subscriptionenum.OrganizationStatus.ACTIVE) {
                accumulator.active += 1;
            }
            if (organization.status === _subscriptionenum.OrganizationStatus.SUSPENDED) {
                accumulator.suspended += 1;
            }
            if (organization.status === _subscriptionenum.OrganizationStatus.PROVISIONING) {
                accumulator.provisioning += 1;
            }
            if (organization.subscriptionStatus === _subscriptionenum.SubscriptionStatus.TRIALING) {
                accumulator.trialing += 1;
            }
            if (organization.subscriptionStatus === _subscriptionenum.SubscriptionStatus.PAST_DUE || organization.subscriptionStatus === _subscriptionenum.SubscriptionStatus.UNPAID) {
                accumulator.pastDue += 1;
            }
            return accumulator;
        }, {
            total: 0,
            active: 0,
            suspended: 0,
            provisioning: 0,
            trialing: 0,
            pastDue: 0
        });
    }
    async getGlobalUserTotals(tenantIds) {
        if (tenantIds.length === 0) {
            return {
                total: 0,
                active: 0,
                locked: 0,
                organizationsWithoutOwnerMfa: 0
            };
        }
        const now = new Date();
        const users = await this.userRepository.find({
            where: {
                tenantId: (0, _typeorm1.In)(tenantIds),
                deletedAt: (0, _typeorm1.IsNull)()
            }
        });
        const organizationsWithoutOwnerMfa = new Set(users.filter((user)=>user.role === _subscriptionenum.UserRole.ORGANIZATION_OWNER && user.mfaEnabled !== true).map((user)=>user.tenantId));
        return {
            total: users.length,
            active: users.filter((user)=>user.status === _subscriptionenum.UserStatus.ACTIVE).length,
            locked: users.filter((user)=>Boolean(user.lockedUntil && user.lockedUntil > now)).length,
            organizationsWithoutOwnerMfa: organizationsWithoutOwnerMfa.size
        };
    }
    async getGlobalDocumentTotals(tenantIds) {
        if (tenantIds.length === 0) {
            return {
                storageBytes: 0,
                pendingMalwareScans: 0,
                infectedDocuments: 0
            };
        }
        const raw = await this.documentRepository.createQueryBuilder("document").select("COALESCE(SUM(COALESCE(document.fileSize, 0)), 0)", "storageBytes").addSelect("SUM(CASE WHEN document.malwareScanStatus = :pendingStatus THEN 1 ELSE 0 END)", "pendingMalwareScans").addSelect("SUM(CASE WHEN document.malwareScanStatus = :infectedStatus THEN 1 ELSE 0 END)", "infectedDocuments").where("document.tenantId IN (:...tenantIds)", {
            tenantIds
        }).andWhere("document.deletedAt IS NULL").setParameters({
            pendingStatus: "pending",
            infectedStatus: "infected"
        }).getRawOne();
        return {
            storageBytes: this.toNumber(raw?.storageBytes),
            pendingMalwareScans: this.toNumber(raw?.pendingMalwareScans),
            infectedDocuments: this.toNumber(raw?.infectedDocuments)
        };
    }
    async getMonitoringSummary() {
        try {
            const report = await this.operationalMonitoringService.getReadinessReport();
            return {
                readinessStatus: report.status,
                databaseStatus: report.components.database.status,
                redisStatus: report.components.redis.status,
                authStatus: report.components.monitoring.auth.status,
                billingStatus: report.components.monitoring.billing.status,
                trustVerificationStatus: report.components.monitoring.workers.trustVerification.status,
                malwareScanningStatus: report.components.monitoring.workers.malwareScanning.status,
                outboxStatus: report.components.monitoring.workers.outbox.status,
                trustVerificationDue: report.components.monitoring.workers.trustVerification.due,
                trustVerificationFailed: report.components.monitoring.workers.trustVerification.failed,
                malwareScanningDue: report.components.monitoring.workers.malwareScanning.due,
                malwareScanningFailed: report.components.monitoring.workers.malwareScanning.failed,
                infectedLast24h: report.components.monitoring.workers.malwareScanning.infectedLast24h,
                outboxPending: report.components.monitoring.workers.outbox.pending,
                outboxDeadLetterRisk: report.components.monitoring.workers.outbox.deadLetterRisk
            };
        } catch (error) {
            this.loggingService.warn("Platform-admin monitoring summary fallback engaged", {
                error: error instanceof Error ? error.message : String(error)
            });
            return {
                readinessStatus: "degraded",
                databaseStatus: "unknown",
                redisStatus: "unknown",
                authStatus: "unknown",
                billingStatus: "unknown",
                trustVerificationStatus: "unknown",
                malwareScanningStatus: "unknown",
                outboxStatus: "unknown",
                trustVerificationDue: 0,
                trustVerificationFailed: 0,
                malwareScanningDue: 0,
                malwareScanningFailed: 0,
                infectedLast24h: 0,
                outboxPending: 0,
                outboxDeadLetterRisk: 0
            };
        }
    }
    buildDashboardAlerts(generatedAt, organizations, users, documents, monitoring) {
        const alerts = [];
        const pushAlert = (type, severity, message)=>{
            alerts.push({
                id: `${type}:${generatedAt.getTime()}:${alerts.length}`,
                type,
                severity,
                message,
                createdAt: generatedAt.toISOString()
            });
        };
        if (organizations.pastDue > 0) {
            pushAlert("billing_anomalies", "medium", `${organizations.pastDue} organizations are in past_due or unpaid billing states.`);
        }
        if (users.organizationsWithoutOwnerMfa > 0) {
            pushAlert("owner_mfa_missing", "high", `${users.organizationsWithoutOwnerMfa} organizations still have an owner without MFA enabled.`);
        }
        if (users.locked > 0) {
            pushAlert("locked_accounts", "high", `${users.locked} tenant user accounts are currently locked.`);
        }
        if (documents.infectedDocuments > 0) {
            pushAlert("infected_documents", "critical", `${documents.infectedDocuments} documents are marked as infected.`);
        }
        if (documents.pendingMalwareScans > 0) {
            pushAlert("malware_backlog", "medium", `${documents.pendingMalwareScans} documents are still waiting for malware scan completion.`);
        }
        if (monitoring.trustVerificationFailed > 0) {
            pushAlert("trust_verification_failed", "high", `${monitoring.trustVerificationFailed} trust verification jobs are currently failed.`);
        }
        if (monitoring.outboxDeadLetterRisk > 0) {
            pushAlert("outbox_dead_letter_risk", "high", `${monitoring.outboxDeadLetterRisk} outbox events are at dead-letter risk.`);
        }
        return alerts;
    }
    async getOwnerMap(tenantIds) {
        const owners = new Map();
        if (tenantIds.length === 0) {
            return owners;
        }
        const users = await this.userRepository.createQueryBuilder("user").where("user.tenantId IN (:...tenantIds)", {
            tenantIds
        }).andWhere("user.deletedAt IS NULL").andWhere("user.role IN (:...roles)", {
            roles: [
                _subscriptionenum.UserRole.ORGANIZATION_OWNER,
                _subscriptionenum.UserRole.ORGANIZATION_ADMIN
            ]
        }).orderBy("user.createdAt", "ASC").getMany();
        for (const user of users){
            const current = owners.get(user.tenantId);
            if (!current) {
                owners.set(user.tenantId, user);
                continue;
            }
            if (current.role !== _subscriptionenum.UserRole.ORGANIZATION_OWNER && user.role === _subscriptionenum.UserRole.ORGANIZATION_OWNER) {
                owners.set(user.tenantId, user);
            }
        }
        return owners;
    }
    async getSubscriptionMap(tenantIds) {
        const subscriptions = new Map();
        if (tenantIds.length === 0) {
            return subscriptions;
        }
        const rows = await this.subscriptionRepository.find({
            where: {
                tenantId: (0, _typeorm1.In)(tenantIds)
            },
            order: {
                updatedAt: "DESC"
            }
        });
        for (const row of rows){
            if (!subscriptions.has(row.tenantId)) {
                subscriptions.set(row.tenantId, row);
            }
        }
        return subscriptions;
    }
    async getUserAggregates(tenantIds) {
        const aggregates = new Map();
        if (tenantIds.length === 0) {
            return aggregates;
        }
        const now = new Date();
        const rows = await this.userRepository.createQueryBuilder("user").select("user.tenantId", "tenantId").addSelect("COUNT(*)", "usersCount").addSelect("SUM(CASE WHEN user.status = :activeStatus THEN 1 ELSE 0 END)", "activeUsersCount").addSelect("SUM(CASE WHEN user.status = :suspendedStatus THEN 1 ELSE 0 END)", "suspendedUsersCount").addSelect("SUM(CASE WHEN user.mfaEnabled = :mfaEnabled THEN 1 ELSE 0 END)", "mfaEnabledUsersCount").addSelect("SUM(CASE WHEN user.role = :ownerRole AND user.mfaEnabled = :mfaDisabled THEN 1 ELSE 0 END)", "ownersWithoutMfa").addSelect("SUM(CASE WHEN user.lockedUntil IS NOT NULL AND user.lockedUntil > :now THEN 1 ELSE 0 END)", "lockedUsersCount").addSelect("MAX(user.lastLoginAt)", "lastLoginAt").where("user.tenantId IN (:...tenantIds)", {
            tenantIds
        }).andWhere("user.deletedAt IS NULL").groupBy("user.tenantId").setParameters({
            activeStatus: _subscriptionenum.UserStatus.ACTIVE,
            suspendedStatus: _subscriptionenum.UserStatus.SUSPENDED,
            mfaEnabled: true,
            mfaDisabled: false,
            ownerRole: _subscriptionenum.UserRole.ORGANIZATION_OWNER,
            now
        }).getRawMany();
        for (const row of rows){
            aggregates.set(row.tenantId, {
                usersCount: this.toNumber(row.usersCount),
                activeUsersCount: this.toNumber(row.activeUsersCount),
                suspendedUsersCount: this.toNumber(row.suspendedUsersCount),
                mfaEnabledUsersCount: this.toNumber(row.mfaEnabledUsersCount),
                ownersWithoutMfa: this.toNumber(row.ownersWithoutMfa),
                lockedUsersCount: this.toNumber(row.lockedUsersCount),
                lastLoginAt: this.toDate(row.lastLoginAt)
            });
        }
        return aggregates;
    }
    async getDocumentAggregates(tenantIds) {
        const aggregates = new Map();
        if (tenantIds.length === 0) {
            return aggregates;
        }
        const rows = await this.documentRepository.createQueryBuilder("document").select("document.tenantId", "tenantId").addSelect("COUNT(*)", "documentsCount").addSelect("COALESCE(SUM(COALESCE(document.fileSize, 0)), 0)", "storageBytes").addSelect("SUM(CASE WHEN document.malwareScanStatus = :pendingStatus THEN 1 ELSE 0 END)", "pendingMalwareScans").addSelect("SUM(CASE WHEN document.malwareScanStatus = :infectedStatus THEN 1 ELSE 0 END)", "infectedDocuments").addSelect("MAX(document.uploadedAt)", "lastUploadedAt").where("document.tenantId IN (:...tenantIds)", {
            tenantIds
        }).andWhere("document.deletedAt IS NULL").groupBy("document.tenantId").setParameters({
            pendingStatus: "pending",
            infectedStatus: "infected"
        }).getRawMany();
        for (const row of rows){
            aggregates.set(row.tenantId, {
                documentsCount: this.toNumber(row.documentsCount),
                storageBytes: this.toNumber(row.storageBytes),
                pendingMalwareScans: this.toNumber(row.pendingMalwareScans),
                infectedDocuments: this.toNumber(row.infectedDocuments),
                lastUploadedAt: this.toDate(row.lastUploadedAt)
            });
        }
        return aggregates;
    }
    async getAuditAggregates(tenantIds) {
        const aggregates = new Map();
        if (tenantIds.length === 0) {
            return aggregates;
        }
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const rows = await this.auditLogRepository.createQueryBuilder("audit").select("audit.tenantId", "tenantId").addSelect("COUNT(*)", "auditEntriesLast30d").addSelect("MAX(audit.createdAt)", "lastAuditAt").where("audit.tenantId IN (:...tenantIds)", {
            tenantIds
        }).andWhere("audit.createdAt >= :since", {
            since
        }).groupBy("audit.tenantId").getRawMany();
        for (const row of rows){
            aggregates.set(row.tenantId, {
                auditEntriesLast30d: this.toNumber(row.auditEntriesLast30d),
                lastAuditAt: this.toDate(row.lastAuditAt)
            });
        }
        return aggregates;
    }
    buildOwnerDto(owner, organization) {
        if (!owner) {
            return {
                fullName: "Owner not assigned",
                emailMasked: this.maskEmail(organization.email),
                mfaEnabled: false,
                lastLoginAt: null
            };
        }
        return {
            id: owner.id,
            fullName: this.formatFullName(owner.firstName, owner.lastName),
            emailMasked: this.maskEmail(owner.email),
            mfaEnabled: owner.mfaEnabled,
            lastLoginAt: owner.lastLoginAt?.toISOString() || null
        };
    }
    buildOrganizationBilling(organization, subscription) {
        return {
            subscriptionPlan: organization.subscriptionPlan,
            subscriptionStatus: organization.subscriptionStatus,
            provider: subscription?.provider || null,
            amountCents: typeof subscription?.amountCents === "number" ? subscription.amountCents : null,
            currency: subscription?.currency || null,
            trialEndAt: organization.trialEndAt?.toISOString() || null,
            currentPeriodEndAt: organization.currentPeriodEndAt?.toISOString() || null,
            cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd || false,
            lastSyncedAt: subscription?.lastSyncedAt?.toISOString() || null
        };
    }
    buildOrganizationSecurity(organization, userAggregate) {
        return {
            organizationMfaRequired: organization.mfaRequired,
            ownerMfaEnabled: userAggregate.ownersWithoutMfa === 0,
            ownersWithoutMfa: userAggregate.ownersWithoutMfa,
            mfaEnabledUsersCount: userAggregate.mfaEnabledUsersCount,
            lockedUsersCount: userAggregate.lockedUsersCount,
            suspendedUsersCount: userAggregate.suspendedUsersCount
        };
    }
    buildOrganizationOps(organization, documentAggregate, auditAggregate, userAggregate) {
        return {
            documentsCount: documentAggregate.documentsCount,
            storageBytes: documentAggregate.storageBytes,
            pendingMalwareScans: documentAggregate.pendingMalwareScans,
            infectedDocuments: documentAggregate.infectedDocuments,
            auditEntriesLast30d: auditAggregate.auditEntriesLast30d,
            lastActivityAt: this.computeLastActivityAt(organization.updatedAt, userAggregate.lastLoginAt, documentAggregate.lastUploadedAt, auditAggregate.lastAuditAt) || null
        };
    }
    getRiskFlags(organization, userAggregate, documentAggregate) {
        const riskFlags = new Set();
        if (organization.subscriptionStatus === _subscriptionenum.SubscriptionStatus.PAST_DUE || organization.subscriptionStatus === _subscriptionenum.SubscriptionStatus.UNPAID) {
            riskFlags.add("billing_past_due");
        }
        if (organization.status === _subscriptionenum.OrganizationStatus.SUSPENDED) {
            riskFlags.add("organization_suspended");
        }
        if (userAggregate.ownersWithoutMfa > 0) {
            riskFlags.add("owner_mfa_missing");
        }
        if (userAggregate.lockedUsersCount > 0) {
            riskFlags.add("locked_users_present");
        }
        if (documentAggregate.infectedDocuments > 0) {
            riskFlags.add("infected_documents_detected");
        }
        if (documentAggregate.pendingMalwareScans > 0) {
            riskFlags.add("malware_scan_backlog");
        }
        return [
            ...riskFlags
        ];
    }
    computeLastActivityAt(...values) {
        const timestamps = values.map((value)=>this.toDate(value)).filter((value)=>Boolean(value)).map((value)=>value.getTime());
        if (timestamps.length === 0) {
            return null;
        }
        return new Date(Math.max(...timestamps)).toISOString();
    }
    formatFullName(firstName, lastName) {
        return [
            firstName,
            lastName
        ].filter(Boolean).join(" ").trim() || "Unknown";
    }
    maskEmail(value) {
        if (!value) {
            return null;
        }
        const [localPart, domainPart] = value.split("@");
        if (!localPart || !domainPart) {
            return "***";
        }
        const maskedLocal = localPart.length <= 2 ? `${localPart.slice(0, 1)}***` : `${localPart.slice(0, 2)}***${localPart.slice(-1)}`;
        const [domainName, ...suffixParts] = domainPart.split(".");
        const maskedDomain = domainName.length <= 2 ? `${domainName.slice(0, 1)}***` : `${domainName.slice(0, 1)}***${domainName.slice(-1)}`;
        const suffix = suffixParts.length > 0 ? `.${suffixParts.join(".")}` : "";
        return `${maskedLocal}@${maskedDomain}${suffix}`;
    }
    toNumber(value) {
        if (typeof value === "number") {
            return Number.isFinite(value) ? value : 0;
        }
        if (typeof value === "string" && value.trim()) {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : 0;
        }
        return 0;
    }
    toDate(value) {
        if (!value) {
            return null;
        }
        if (value instanceof Date) {
            return Number.isNaN(value.getTime()) ? null : value;
        }
        const parsed = new Date(String(value));
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    constructor(organizationRepository, userRepository, subscriptionRepository, documentRepository, auditLogRepository, operationalMonitoringService, loggingService){
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.documentRepository = documentRepository;
        this.auditLogRepository = auditLogRepository;
        this.operationalMonitoringService = operationalMonitoringService;
        this.loggingService = loggingService;
        this.loggingService.setContext(PlatformAdminReadService.name);
    }
};
PlatformAdminReadService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_entities.Organization)),
    _ts_param(1, (0, _typeorm.InjectRepository)(_entities.User)),
    _ts_param(2, (0, _typeorm.InjectRepository)(_entities.Subscription)),
    _ts_param(3, (0, _typeorm.InjectRepository)(_entities.Document)),
    _ts_param(4, (0, _typeorm.InjectRepository)(_entities.AuditLog)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _health.OperationalMonitoringService === "undefined" ? Object : _health.OperationalMonitoringService,
        typeof _logging.LoggingService === "undefined" ? Object : _logging.LoggingService
    ])
], PlatformAdminReadService);

//# sourceMappingURL=platform-admin-read.service.js.map