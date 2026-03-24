import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, IsNull, Repository } from "typeorm";
import {
  AuditLog,
  Document,
  Organization,
  Subscription,
  User,
} from "../../database/entities";
import { OperationalMonitoringService } from "../../common/health";
import { LoggingService } from "../../common/logging";
import {
  OrganizationStatus,
  SubscriptionPlan,
  SubscriptionStatus,
  UserRole,
  UserStatus,
} from "../../database/entities/enums/subscription.enum";
import {
  PlatformAdminDashboardAlertDto,
  PlatformAdminDashboardSummaryDto,
  PlatformAdminMonitoringSummaryDto,
  PlatformAdminOrganizationBillingDto,
  PlatformAdminOrganizationDetailDto,
  PlatformAdminOrganizationListResponseDto,
  PlatformAdminOrganizationOpsDto,
  PlatformAdminOrganizationOwnerDto,
  PlatformAdminOrganizationsQueryDto,
  PlatformAdminOrganizationSecurityDto,
  PlatformAdminOrganizationSummaryDto,
  PlatformAdminOrganizationTotalsDto,
  PlatformAdminOrganizationUserDto,
  PlatformAdminUserTotalsDto,
} from "../dto/platform-admin-read-model.dto";

interface OrganizationUserAggregate {
  usersCount: number;
  activeUsersCount: number;
  suspendedUsersCount: number;
  mfaEnabledUsersCount: number;
  ownersWithoutMfa: number;
  lockedUsersCount: number;
  lastLoginAt: Date | null;
}

interface OrganizationDocumentAggregate {
  storageBytes: number;
  documentsCount: number;
  pendingMalwareScans: number;
  infectedDocuments: number;
  lastUploadedAt: Date | null;
}

interface OrganizationAuditAggregate {
  auditEntriesLast30d: number;
  lastAuditAt: Date | null;
}

const DEFAULT_USER_AGGREGATE: OrganizationUserAggregate = {
  usersCount: 0,
  activeUsersCount: 0,
  suspendedUsersCount: 0,
  mfaEnabledUsersCount: 0,
  ownersWithoutMfa: 0,
  lockedUsersCount: 0,
  lastLoginAt: null,
};

const DEFAULT_DOCUMENT_AGGREGATE: OrganizationDocumentAggregate = {
  storageBytes: 0,
  documentsCount: 0,
  pendingMalwareScans: 0,
  infectedDocuments: 0,
  lastUploadedAt: null,
};

const DEFAULT_AUDIT_AGGREGATE: OrganizationAuditAggregate = {
  auditEntriesLast30d: 0,
  lastAuditAt: null,
};

@Injectable()
export class PlatformAdminReadService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    private readonly operationalMonitoringService: OperationalMonitoringService,
    private readonly loggingService: LoggingService,
  ) {
    this.loggingService.setContext(PlatformAdminReadService.name);
  }

  async getDashboardSummary(): Promise<PlatformAdminDashboardSummaryDto> {
    const generatedAt = new Date();
    const organizations = await this.organizationRepository.find({
      where: { deletedAt: IsNull() },
      order: { createdAt: "DESC" },
    });

    const organizationTotals = this.buildOrganizationTotals(organizations);
    const organizationIds = organizations.map(
      (organization) => organization.id,
    );
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
      alerts: this.buildDashboardAlerts(
        generatedAt,
        organizationTotals,
        usersTotals,
        documentTotals,
        monitoring,
      ),
    };
  }

  async getOrganizations(
    query: PlatformAdminOrganizationsQueryDto,
  ): Promise<PlatformAdminOrganizationListResponseDto> {
    const page = query.page || 1;
    const limit = query.limit || 10;

    const queryBuilder = this.organizationRepository
      .createQueryBuilder("organization")
      .where("organization.deletedAt IS NULL");

    if (query.q?.trim()) {
      const normalized = `%${query.q.trim().toLowerCase()}%`;
      queryBuilder.andWhere(
        "(LOWER(organization.name) LIKE :q OR LOWER(COALESCE(organization.customDomain, '')) LIKE :q OR organization.id = :exactId)",
        {
          q: normalized,
          exactId: query.q.trim(),
        },
      );
    }

    if (query.status) {
      queryBuilder.andWhere("organization.status = :status", {
        status: query.status,
      });
    }

    if (query.plan) {
      queryBuilder.andWhere("organization.subscriptionPlan = :plan", {
        plan: query.plan,
      });
    }

    if (query.subscriptionStatus) {
      queryBuilder.andWhere(
        "organization.subscriptionStatus = :subscriptionStatus",
        {
          subscriptionStatus: query.subscriptionStatus,
        },
      );
    }

    const [organizations, total] = await queryBuilder
      .orderBy("organization.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const items = await this.buildOrganizationSummaries(organizations);

    return {
      items,
      page,
      limit,
      total,
    };
  }

  async getOrganizationDetail(
    organizationId: string,
  ): Promise<PlatformAdminOrganizationDetailDto> {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId, deletedAt: IsNull() },
    });

    if (!organization) {
      throw new NotFoundException("Організацію не знайдено");
    }

    const tenantIds = [organization.id];
    const [owners, subscriptions, users, documents, audits] = await Promise.all(
      [
        this.getOwnerMap(tenantIds),
        this.getSubscriptionMap(tenantIds),
        this.getUserAggregates(tenantIds),
        this.getDocumentAggregates(tenantIds),
        this.getAuditAggregates(tenantIds),
      ],
    );

    const owner = owners.get(organization.id);
    const subscription = subscriptions.get(organization.id) || null;
    const userAggregate = users.get(organization.id) || DEFAULT_USER_AGGREGATE;
    const documentAggregate =
      documents.get(organization.id) || DEFAULT_DOCUMENT_AGGREGATE;
    const auditAggregate =
      audits.get(organization.id) || DEFAULT_AUDIT_AGGREGATE;
    const riskFlags = this.getRiskFlags(
      organization,
      userAggregate,
      documentAggregate,
    );

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
      ops: this.buildOrganizationOps(
        organization,
        documentAggregate,
        auditAggregate,
        userAggregate,
      ),
      riskFlags,
      createdAt: organization.createdAt.toISOString(),
      updatedAt: organization.updatedAt.toISOString(),
    };
  }

  async getOrganizationUsers(
    organizationId: string,
  ): Promise<PlatformAdminOrganizationUserDto[]> {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId, deletedAt: IsNull() },
    });

    if (!organization) {
      throw new NotFoundException("Організацію не знайдено");
    }

    const members = await this.userRepository.find({
      where: { tenantId: organizationId, deletedAt: IsNull() },
      order: {
        role: "ASC",
        createdAt: "ASC",
      },
    });

    return members.map((member) => ({
      id: member.id,
      fullName: this.formatFullName(member.firstName, member.lastName),
      emailMasked: this.maskEmail(member.email),
      role: member.role,
      status: member.status,
      mfaEnabled: member.mfaEnabled,
      emailVerified: member.emailVerified,
      lastLoginAt: member.lastLoginAt?.toISOString() || null,
      lockedUntil: member.lockedUntil?.toISOString() || null,
    }));
  }

  private async buildOrganizationSummaries(
    organizations: Organization[],
  ): Promise<PlatformAdminOrganizationSummaryDto[]> {
    const tenantIds = organizations.map((organization) => organization.id);
    const [owners, users, documents, audits] = await Promise.all([
      this.getOwnerMap(tenantIds),
      this.getUserAggregates(tenantIds),
      this.getDocumentAggregates(tenantIds),
      this.getAuditAggregates(tenantIds),
    ]);

    return organizations.map((organization) => {
      const owner = owners.get(organization.id);
      const userAggregate =
        users.get(organization.id) || DEFAULT_USER_AGGREGATE;
      const documentAggregate =
        documents.get(organization.id) || DEFAULT_DOCUMENT_AGGREGATE;
      const auditAggregate =
        audits.get(organization.id) || DEFAULT_AUDIT_AGGREGATE;

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
        lastActivityAt:
          this.computeLastActivityAt(
            organization.updatedAt,
            userAggregate.lastLoginAt,
            documentAggregate.lastUploadedAt,
            auditAggregate.lastAuditAt,
          ) || null,
        riskFlags: this.getRiskFlags(
          organization,
          userAggregate,
          documentAggregate,
        ),
        createdAt: organization.createdAt.toISOString(),
      };
    });
  }

  private buildOrganizationTotals(
    organizations: Organization[],
  ): PlatformAdminOrganizationTotalsDto {
    return organizations.reduce<PlatformAdminOrganizationTotalsDto>(
      (accumulator, organization) => {
        accumulator.total += 1;

        if (organization.status === OrganizationStatus.ACTIVE) {
          accumulator.active += 1;
        }

        if (organization.status === OrganizationStatus.SUSPENDED) {
          accumulator.suspended += 1;
        }

        if (organization.status === OrganizationStatus.PROVISIONING) {
          accumulator.provisioning += 1;
        }

        if (organization.subscriptionStatus === SubscriptionStatus.TRIALING) {
          accumulator.trialing += 1;
        }

        if (
          organization.subscriptionStatus === SubscriptionStatus.PAST_DUE ||
          organization.subscriptionStatus === SubscriptionStatus.UNPAID
        ) {
          accumulator.pastDue += 1;
        }

        return accumulator;
      },
      {
        total: 0,
        active: 0,
        suspended: 0,
        provisioning: 0,
        trialing: 0,
        pastDue: 0,
      },
    );
  }

  private async getGlobalUserTotals(
    tenantIds: string[],
  ): Promise<PlatformAdminUserTotalsDto> {
    if (tenantIds.length === 0) {
      return {
        total: 0,
        active: 0,
        locked: 0,
        organizationsWithoutOwnerMfa: 0,
      };
    }

    const now = new Date();
    const users = await this.userRepository.find({
      where: {
        tenantId: In(tenantIds),
        deletedAt: IsNull(),
      },
    });

    const organizationsWithoutOwnerMfa = new Set(
      users
        .filter(
          (user) =>
            user.role === UserRole.ORGANIZATION_OWNER &&
            user.mfaEnabled !== true,
        )
        .map((user) => user.tenantId),
    );

    return {
      total: users.length,
      active: users.filter((user) => user.status === UserStatus.ACTIVE).length,
      locked: users.filter((user) =>
        Boolean(user.lockedUntil && user.lockedUntil > now),
      ).length,
      organizationsWithoutOwnerMfa: organizationsWithoutOwnerMfa.size,
    };
  }

  private async getGlobalDocumentTotals(tenantIds: string[]): Promise<{
    storageBytes: number;
    pendingMalwareScans: number;
    infectedDocuments: number;
  }> {
    if (tenantIds.length === 0) {
      return {
        storageBytes: 0,
        pendingMalwareScans: 0,
        infectedDocuments: 0,
      };
    }

    const raw = await this.documentRepository
      .createQueryBuilder("document")
      .select(
        "COALESCE(SUM(COALESCE(document.fileSize, 0)), 0)",
        "storageBytes",
      )
      .addSelect(
        "SUM(CASE WHEN document.malwareScanStatus = :pendingStatus THEN 1 ELSE 0 END)",
        "pendingMalwareScans",
      )
      .addSelect(
        "SUM(CASE WHEN document.malwareScanStatus = :infectedStatus THEN 1 ELSE 0 END)",
        "infectedDocuments",
      )
      .where("document.tenantId IN (:...tenantIds)", { tenantIds })
      .andWhere("document.deletedAt IS NULL")
      .setParameters({
        pendingStatus: "pending",
        infectedStatus: "infected",
      })
      .getRawOne<{
        storageBytes?: unknown;
        pendingMalwareScans?: unknown;
        infectedDocuments?: unknown;
      }>();

    return {
      storageBytes: this.toNumber(raw?.storageBytes),
      pendingMalwareScans: this.toNumber(raw?.pendingMalwareScans),
      infectedDocuments: this.toNumber(raw?.infectedDocuments),
    };
  }

  private async getMonitoringSummary(): Promise<PlatformAdminMonitoringSummaryDto> {
    try {
      const report =
        await this.operationalMonitoringService.getReadinessReport();

      return {
        readinessStatus: report.status,
        databaseStatus: report.components.database.status,
        redisStatus: report.components.redis.status,
        authStatus: report.components.monitoring.auth.status,
        billingStatus: report.components.monitoring.billing.status,
        trustVerificationStatus:
          report.components.monitoring.workers.trustVerification.status,
        malwareScanningStatus:
          report.components.monitoring.workers.malwareScanning.status,
        outboxStatus: report.components.monitoring.workers.outbox.status,
        trustVerificationDue:
          report.components.monitoring.workers.trustVerification.due,
        trustVerificationFailed:
          report.components.monitoring.workers.trustVerification.failed,
        malwareScanningDue:
          report.components.monitoring.workers.malwareScanning.due,
        malwareScanningFailed:
          report.components.monitoring.workers.malwareScanning.failed,
        infectedLast24h:
          report.components.monitoring.workers.malwareScanning.infectedLast24h,
        outboxPending: report.components.monitoring.workers.outbox.pending,
        outboxDeadLetterRisk:
          report.components.monitoring.workers.outbox.deadLetterRisk,
      };
    } catch (error) {
      this.loggingService.warn(
        "Platform-admin monitoring summary fallback engaged",
        {
          error: error instanceof Error ? error.message : String(error),
        },
      );

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
        outboxDeadLetterRisk: 0,
      };
    }
  }

  private buildDashboardAlerts(
    generatedAt: Date,
    organizations: PlatformAdminOrganizationTotalsDto,
    users: PlatformAdminUserTotalsDto,
    documents: {
      pendingMalwareScans: number;
      infectedDocuments: number;
    },
    monitoring: PlatformAdminMonitoringSummaryDto,
  ): PlatformAdminDashboardAlertDto[] {
    const alerts: PlatformAdminDashboardAlertDto[] = [];

    const pushAlert = (
      type: string,
      severity: "medium" | "high" | "critical",
      message: string,
    ) => {
      alerts.push({
        id: `${type}:${generatedAt.getTime()}:${alerts.length}`,
        type,
        severity,
        message,
        createdAt: generatedAt.toISOString(),
      });
    };

    if (organizations.pastDue > 0) {
      pushAlert(
        "billing_anomalies",
        "medium",
        `${organizations.pastDue} organizations are in past_due or unpaid billing states.`,
      );
    }

    if (users.organizationsWithoutOwnerMfa > 0) {
      pushAlert(
        "owner_mfa_missing",
        "high",
        `${users.organizationsWithoutOwnerMfa} organizations still have an owner without MFA enabled.`,
      );
    }

    if (users.locked > 0) {
      pushAlert(
        "locked_accounts",
        "high",
        `${users.locked} tenant user accounts are currently locked.`,
      );
    }

    if (documents.infectedDocuments > 0) {
      pushAlert(
        "infected_documents",
        "critical",
        `${documents.infectedDocuments} documents are marked as infected.`,
      );
    }

    if (documents.pendingMalwareScans > 0) {
      pushAlert(
        "malware_backlog",
        "medium",
        `${documents.pendingMalwareScans} documents are still waiting for malware scan completion.`,
      );
    }

    if (monitoring.trustVerificationFailed > 0) {
      pushAlert(
        "trust_verification_failed",
        "high",
        `${monitoring.trustVerificationFailed} trust verification jobs are currently failed.`,
      );
    }

    if (monitoring.outboxDeadLetterRisk > 0) {
      pushAlert(
        "outbox_dead_letter_risk",
        "high",
        `${monitoring.outboxDeadLetterRisk} outbox events are at dead-letter risk.`,
      );
    }

    return alerts;
  }

  private async getOwnerMap(tenantIds: string[]): Promise<Map<string, User>> {
    const owners = new Map<string, User>();

    if (tenantIds.length === 0) {
      return owners;
    }

    const users = await this.userRepository
      .createQueryBuilder("user")
      .where("user.tenantId IN (:...tenantIds)", { tenantIds })
      .andWhere("user.deletedAt IS NULL")
      .andWhere("user.role IN (:...roles)", {
        roles: [UserRole.ORGANIZATION_OWNER, UserRole.ORGANIZATION_ADMIN],
      })
      .orderBy("user.createdAt", "ASC")
      .getMany();

    for (const user of users) {
      const current = owners.get(user.tenantId);

      if (!current) {
        owners.set(user.tenantId, user);
        continue;
      }

      if (
        current.role !== UserRole.ORGANIZATION_OWNER &&
        user.role === UserRole.ORGANIZATION_OWNER
      ) {
        owners.set(user.tenantId, user);
      }
    }

    return owners;
  }

  private async getSubscriptionMap(
    tenantIds: string[],
  ): Promise<Map<string, Subscription>> {
    const subscriptions = new Map<string, Subscription>();

    if (tenantIds.length === 0) {
      return subscriptions;
    }

    const rows = await this.subscriptionRepository.find({
      where: { tenantId: In(tenantIds) },
      order: { updatedAt: "DESC" },
    });

    for (const row of rows) {
      if (!subscriptions.has(row.tenantId)) {
        subscriptions.set(row.tenantId, row);
      }
    }

    return subscriptions;
  }

  private async getUserAggregates(
    tenantIds: string[],
  ): Promise<Map<string, OrganizationUserAggregate>> {
    const aggregates = new Map<string, OrganizationUserAggregate>();

    if (tenantIds.length === 0) {
      return aggregates;
    }

    const now = new Date();
    const rows = await this.userRepository
      .createQueryBuilder("user")
      .select("user.tenantId", "tenantId")
      .addSelect("COUNT(*)", "usersCount")
      .addSelect(
        "SUM(CASE WHEN user.status = :activeStatus THEN 1 ELSE 0 END)",
        "activeUsersCount",
      )
      .addSelect(
        "SUM(CASE WHEN user.status = :suspendedStatus THEN 1 ELSE 0 END)",
        "suspendedUsersCount",
      )
      .addSelect(
        "SUM(CASE WHEN user.mfaEnabled = :mfaEnabled THEN 1 ELSE 0 END)",
        "mfaEnabledUsersCount",
      )
      .addSelect(
        "SUM(CASE WHEN user.role = :ownerRole AND user.mfaEnabled = :mfaDisabled THEN 1 ELSE 0 END)",
        "ownersWithoutMfa",
      )
      .addSelect(
        "SUM(CASE WHEN user.lockedUntil IS NOT NULL AND user.lockedUntil > :now THEN 1 ELSE 0 END)",
        "lockedUsersCount",
      )
      .addSelect("MAX(user.lastLoginAt)", "lastLoginAt")
      .where("user.tenantId IN (:...tenantIds)", { tenantIds })
      .andWhere("user.deletedAt IS NULL")
      .groupBy("user.tenantId")
      .setParameters({
        activeStatus: UserStatus.ACTIVE,
        suspendedStatus: UserStatus.SUSPENDED,
        mfaEnabled: true,
        mfaDisabled: false,
        ownerRole: UserRole.ORGANIZATION_OWNER,
        now,
      })
      .getRawMany<{
        tenantId: string;
        usersCount?: unknown;
        activeUsersCount?: unknown;
        suspendedUsersCount?: unknown;
        mfaEnabledUsersCount?: unknown;
        ownersWithoutMfa?: unknown;
        lockedUsersCount?: unknown;
        lastLoginAt?: unknown;
      }>();

    for (const row of rows) {
      aggregates.set(row.tenantId, {
        usersCount: this.toNumber(row.usersCount),
        activeUsersCount: this.toNumber(row.activeUsersCount),
        suspendedUsersCount: this.toNumber(row.suspendedUsersCount),
        mfaEnabledUsersCount: this.toNumber(row.mfaEnabledUsersCount),
        ownersWithoutMfa: this.toNumber(row.ownersWithoutMfa),
        lockedUsersCount: this.toNumber(row.lockedUsersCount),
        lastLoginAt: this.toDate(row.lastLoginAt),
      });
    }

    return aggregates;
  }

  private async getDocumentAggregates(
    tenantIds: string[],
  ): Promise<Map<string, OrganizationDocumentAggregate>> {
    const aggregates = new Map<string, OrganizationDocumentAggregate>();

    if (tenantIds.length === 0) {
      return aggregates;
    }

    const rows = await this.documentRepository
      .createQueryBuilder("document")
      .select("document.tenantId", "tenantId")
      .addSelect("COUNT(*)", "documentsCount")
      .addSelect(
        "COALESCE(SUM(COALESCE(document.fileSize, 0)), 0)",
        "storageBytes",
      )
      .addSelect(
        "SUM(CASE WHEN document.malwareScanStatus = :pendingStatus THEN 1 ELSE 0 END)",
        "pendingMalwareScans",
      )
      .addSelect(
        "SUM(CASE WHEN document.malwareScanStatus = :infectedStatus THEN 1 ELSE 0 END)",
        "infectedDocuments",
      )
      .addSelect("MAX(document.uploadedAt)", "lastUploadedAt")
      .where("document.tenantId IN (:...tenantIds)", { tenantIds })
      .andWhere("document.deletedAt IS NULL")
      .groupBy("document.tenantId")
      .setParameters({
        pendingStatus: "pending",
        infectedStatus: "infected",
      })
      .getRawMany<{
        tenantId: string;
        documentsCount?: unknown;
        storageBytes?: unknown;
        pendingMalwareScans?: unknown;
        infectedDocuments?: unknown;
        lastUploadedAt?: unknown;
      }>();

    for (const row of rows) {
      aggregates.set(row.tenantId, {
        documentsCount: this.toNumber(row.documentsCount),
        storageBytes: this.toNumber(row.storageBytes),
        pendingMalwareScans: this.toNumber(row.pendingMalwareScans),
        infectedDocuments: this.toNumber(row.infectedDocuments),
        lastUploadedAt: this.toDate(row.lastUploadedAt),
      });
    }

    return aggregates;
  }

  private async getAuditAggregates(
    tenantIds: string[],
  ): Promise<Map<string, OrganizationAuditAggregate>> {
    const aggregates = new Map<string, OrganizationAuditAggregate>();

    if (tenantIds.length === 0) {
      return aggregates;
    }

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const rows = await this.auditLogRepository
      .createQueryBuilder("audit")
      .select("audit.tenantId", "tenantId")
      .addSelect("COUNT(*)", "auditEntriesLast30d")
      .addSelect("MAX(audit.createdAt)", "lastAuditAt")
      .where("audit.tenantId IN (:...tenantIds)", { tenantIds })
      .andWhere("audit.createdAt >= :since", { since })
      .groupBy("audit.tenantId")
      .getRawMany<{
        tenantId: string;
        auditEntriesLast30d?: unknown;
        lastAuditAt?: unknown;
      }>();

    for (const row of rows) {
      aggregates.set(row.tenantId, {
        auditEntriesLast30d: this.toNumber(row.auditEntriesLast30d),
        lastAuditAt: this.toDate(row.lastAuditAt),
      });
    }

    return aggregates;
  }

  private buildOwnerDto(
    owner: User | undefined,
    organization: Organization,
  ): PlatformAdminOrganizationOwnerDto {
    if (!owner) {
      return {
        fullName: "Owner not assigned",
        emailMasked: this.maskEmail(organization.email),
        mfaEnabled: false,
        lastLoginAt: null,
      };
    }

    return {
      id: owner.id,
      fullName: this.formatFullName(owner.firstName, owner.lastName),
      emailMasked: this.maskEmail(owner.email),
      mfaEnabled: owner.mfaEnabled,
      lastLoginAt: owner.lastLoginAt?.toISOString() || null,
    };
  }

  private buildOrganizationBilling(
    organization: Organization,
    subscription: Subscription | null,
  ): PlatformAdminOrganizationBillingDto {
    return {
      subscriptionPlan: organization.subscriptionPlan,
      subscriptionStatus: organization.subscriptionStatus,
      provider: subscription?.provider || null,
      amountCents:
        typeof subscription?.amountCents === "number"
          ? subscription.amountCents
          : null,
      currency: subscription?.currency || null,
      trialEndAt: organization.trialEndAt?.toISOString() || null,
      currentPeriodEndAt:
        organization.currentPeriodEndAt?.toISOString() || null,
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd || false,
      lastSyncedAt: subscription?.lastSyncedAt?.toISOString() || null,
    };
  }

  private buildOrganizationSecurity(
    organization: Organization,
    userAggregate: OrganizationUserAggregate,
  ): PlatformAdminOrganizationSecurityDto {
    return {
      organizationMfaRequired: organization.mfaRequired,
      ownerMfaEnabled: userAggregate.ownersWithoutMfa === 0,
      ownersWithoutMfa: userAggregate.ownersWithoutMfa,
      mfaEnabledUsersCount: userAggregate.mfaEnabledUsersCount,
      lockedUsersCount: userAggregate.lockedUsersCount,
      suspendedUsersCount: userAggregate.suspendedUsersCount,
    };
  }

  private buildOrganizationOps(
    organization: Organization,
    documentAggregate: OrganizationDocumentAggregate,
    auditAggregate: OrganizationAuditAggregate,
    userAggregate: OrganizationUserAggregate,
  ): PlatformAdminOrganizationOpsDto {
    return {
      documentsCount: documentAggregate.documentsCount,
      storageBytes: documentAggregate.storageBytes,
      pendingMalwareScans: documentAggregate.pendingMalwareScans,
      infectedDocuments: documentAggregate.infectedDocuments,
      auditEntriesLast30d: auditAggregate.auditEntriesLast30d,
      lastActivityAt:
        this.computeLastActivityAt(
          organization.updatedAt,
          userAggregate.lastLoginAt,
          documentAggregate.lastUploadedAt,
          auditAggregate.lastAuditAt,
        ) || null,
    };
  }

  private getRiskFlags(
    organization: Organization,
    userAggregate: OrganizationUserAggregate,
    documentAggregate: OrganizationDocumentAggregate,
  ): string[] {
    const riskFlags = new Set<string>();

    if (
      organization.subscriptionStatus === SubscriptionStatus.PAST_DUE ||
      organization.subscriptionStatus === SubscriptionStatus.UNPAID
    ) {
      riskFlags.add("billing_past_due");
    }

    if (organization.status === OrganizationStatus.SUSPENDED) {
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

    return [...riskFlags];
  }

  private computeLastActivityAt(
    ...values: Array<Date | string | null | undefined>
  ): string | null {
    const timestamps = values
      .map((value) => this.toDate(value))
      .filter((value): value is Date => Boolean(value))
      .map((value) => value.getTime());

    if (timestamps.length === 0) {
      return null;
    }

    return new Date(Math.max(...timestamps)).toISOString();
  }

  private formatFullName(
    firstName?: string | null,
    lastName?: string | null,
  ): string {
    return [firstName, lastName].filter(Boolean).join(" ").trim() || "Unknown";
  }

  private maskEmail(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    const [localPart, domainPart] = value.split("@");
    if (!localPart || !domainPart) {
      return "***";
    }

    const maskedLocal =
      localPart.length <= 2
        ? `${localPart.slice(0, 1)}***`
        : `${localPart.slice(0, 2)}***${localPart.slice(-1)}`;

    const [domainName, ...suffixParts] = domainPart.split(".");
    const maskedDomain =
      domainName.length <= 2
        ? `${domainName.slice(0, 1)}***`
        : `${domainName.slice(0, 1)}***${domainName.slice(-1)}`;

    const suffix = suffixParts.length > 0 ? `.${suffixParts.join(".")}` : "";

    return `${maskedLocal}@${maskedDomain}${suffix}`;
  }

  private toNumber(value: unknown): number {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  }

  private toDate(value: unknown): Date | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    const parsed = new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
}
