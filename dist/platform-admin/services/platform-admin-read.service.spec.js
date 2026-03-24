"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _testing = require("@nestjs/testing");
const _typeorm = require("@nestjs/typeorm");
const _health = require("../../common/health");
const _logging = require("../../common/logging");
const _entities = require("../../database/entities");
const _subscriptionenum = require("../../database/entities/enums/subscription.enum");
const _platformadminreadservice = require("./platform-admin-read.service");
describe("PlatformAdminReadService", ()=>{
    let service;
    let organizationRepository;
    const createRepository = ()=>({
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn()
        });
    const baseOrganization = {
        id: "tenant-1",
        name: "Lex Growth",
        status: _subscriptionenum.OrganizationStatus.ACTIVE,
        legalForm: "llc",
        city: "Kyiv",
        region: "Kyiv",
        country: "UA",
        email: "office@lexgrowth.ua",
        customDomain: "lexgrowth.example.com",
        subscriptionPlan: _subscriptionenum.SubscriptionPlan.PROFESSIONAL,
        subscriptionStatus: _subscriptionenum.SubscriptionStatus.PAST_DUE,
        trialEndAt: null,
        currentPeriodEndAt: new Date("2026-04-01T00:00:00.000Z"),
        maxUsers: 10,
        mfaRequired: true,
        auditRetentionDays: 90,
        settings: {},
        metadata: {},
        createdAt: new Date("2026-01-10T10:00:00.000Z"),
        updatedAt: new Date("2026-03-20T10:00:00.000Z"),
        deletedAt: null
    };
    beforeEach(async ()=>{
        const module = await _testing.Test.createTestingModule({
            providers: [
                _platformadminreadservice.PlatformAdminReadService,
                {
                    provide: (0, _typeorm.getRepositoryToken)(_entities.Organization),
                    useFactory: createRepository
                },
                {
                    provide: (0, _typeorm.getRepositoryToken)(_entities.User),
                    useFactory: createRepository
                },
                {
                    provide: (0, _typeorm.getRepositoryToken)(_entities.Subscription),
                    useFactory: createRepository
                },
                {
                    provide: (0, _typeorm.getRepositoryToken)(_entities.Document),
                    useFactory: createRepository
                },
                {
                    provide: (0, _typeorm.getRepositoryToken)(_entities.AuditLog),
                    useFactory: createRepository
                },
                {
                    provide: _health.OperationalMonitoringService,
                    useValue: {
                        getReadinessReport: jest.fn()
                    }
                },
                {
                    provide: _logging.LoggingService,
                    useValue: {
                        setContext: jest.fn(),
                        warn: jest.fn()
                    }
                }
            ]
        }).compile();
        service = module.get(_platformadminreadservice.PlatformAdminReadService);
        organizationRepository = module.get((0, _typeorm.getRepositoryToken)(_entities.Organization));
    });
    afterEach(()=>{
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });
    it("returns allow-listed organization summaries with masked owner contacts", async ()=>{
        const queryBuilder = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            getManyAndCount: jest.fn().mockResolvedValue([
                [
                    baseOrganization
                ],
                1
            ])
        };
        organizationRepository.createQueryBuilder.mockReturnValue(queryBuilder);
        jest.spyOn(service, "getOwnerMap").mockResolvedValue(new Map([
            [
                baseOrganization.id,
                {
                    id: "owner-1",
                    tenantId: baseOrganization.id,
                    firstName: "Olena",
                    lastName: "Kravets",
                    email: "owner@lexgrowth.ua",
                    role: _subscriptionenum.UserRole.ORGANIZATION_OWNER,
                    mfaEnabled: false,
                    lastLoginAt: new Date("2026-03-21T09:00:00.000Z")
                }
            ]
        ]));
        jest.spyOn(service, "getUserAggregates").mockResolvedValue(new Map([
            [
                baseOrganization.id,
                {
                    usersCount: 4,
                    activeUsersCount: 3,
                    suspendedUsersCount: 1,
                    mfaEnabledUsersCount: 2,
                    ownersWithoutMfa: 1,
                    lockedUsersCount: 1,
                    lastLoginAt: new Date("2026-03-21T09:00:00.000Z")
                }
            ]
        ]));
        jest.spyOn(service, "getDocumentAggregates").mockResolvedValue(new Map([
            [
                baseOrganization.id,
                {
                    storageBytes: 4096,
                    documentsCount: 8,
                    pendingMalwareScans: 2,
                    infectedDocuments: 0,
                    lastUploadedAt: new Date("2026-03-22T08:00:00.000Z")
                }
            ]
        ]));
        jest.spyOn(service, "getAuditAggregates").mockResolvedValue(new Map([
            [
                baseOrganization.id,
                {
                    auditEntriesLast30d: 12,
                    lastAuditAt: new Date("2026-03-22T08:30:00.000Z")
                }
            ]
        ]));
        const result = await service.getOrganizations({
            page: 1,
            limit: 10
        });
        expect(result.total).toBe(1);
        expect(result.items[0].owner.emailMasked).toContain("***");
        expect(result.items[0].riskFlags).toEqual(expect.arrayContaining([
            "billing_past_due",
            "owner_mfa_missing",
            "locked_users_present",
            "malware_scan_backlog"
        ]));
    });
    it("returns safe organization detail without raw contact exposure", async ()=>{
        organizationRepository.findOne.mockResolvedValue(baseOrganization);
        jest.spyOn(service, "getOwnerMap").mockResolvedValue(new Map([
            [
                baseOrganization.id,
                {
                    id: "owner-1",
                    tenantId: baseOrganization.id,
                    firstName: "Olena",
                    lastName: "Kravets",
                    email: "owner@lexgrowth.ua",
                    role: _subscriptionenum.UserRole.ORGANIZATION_OWNER,
                    mfaEnabled: true,
                    lastLoginAt: new Date("2026-03-21T09:00:00.000Z")
                }
            ]
        ]));
        jest.spyOn(service, "getSubscriptionMap").mockResolvedValue(new Map([
            [
                baseOrganization.id,
                {
                    tenantId: baseOrganization.id,
                    provider: "stripe",
                    amountCents: 490000,
                    currency: "UAH",
                    cancelAtPeriodEnd: false,
                    lastSyncedAt: new Date("2026-03-21T12:00:00.000Z")
                }
            ]
        ]));
        jest.spyOn(service, "getUserAggregates").mockResolvedValue(new Map([
            [
                baseOrganization.id,
                {
                    usersCount: 4,
                    activeUsersCount: 3,
                    suspendedUsersCount: 1,
                    mfaEnabledUsersCount: 3,
                    ownersWithoutMfa: 0,
                    lockedUsersCount: 0,
                    lastLoginAt: new Date("2026-03-21T09:00:00.000Z")
                }
            ]
        ]));
        jest.spyOn(service, "getDocumentAggregates").mockResolvedValue(new Map([
            [
                baseOrganization.id,
                {
                    storageBytes: 8192,
                    documentsCount: 12,
                    pendingMalwareScans: 0,
                    infectedDocuments: 0,
                    lastUploadedAt: new Date("2026-03-22T08:00:00.000Z")
                }
            ]
        ]));
        jest.spyOn(service, "getAuditAggregates").mockResolvedValue(new Map([
            [
                baseOrganization.id,
                {
                    auditEntriesLast30d: 14,
                    lastAuditAt: new Date("2026-03-22T09:00:00.000Z")
                }
            ]
        ]));
        const result = await service.getOrganizationDetail(baseOrganization.id);
        expect(result.organizationEmailMasked).toContain("***");
        expect(result.owner.fullName).toBe("Olena Kravets");
        expect(result.billing.amountCents).toBe(490000);
        expect(result.security.ownerMfaEnabled).toBe(true);
        expect(result.ops.documentsCount).toBe(12);
    });
    it("builds dashboard summary alerts from safe aggregates", async ()=>{
        organizationRepository.find.mockResolvedValue([
            baseOrganization,
            {
                ...baseOrganization,
                id: "tenant-2",
                name: "Trial Tenant",
                status: _subscriptionenum.OrganizationStatus.SUSPENDED,
                subscriptionStatus: _subscriptionenum.SubscriptionStatus.TRIALING
            }
        ]);
        jest.spyOn(service, "getGlobalUserTotals").mockResolvedValue({
            total: 7,
            active: 5,
            locked: 2,
            organizationsWithoutOwnerMfa: 1
        });
        jest.spyOn(service, "getGlobalDocumentTotals").mockResolvedValue({
            storageBytes: 12288,
            pendingMalwareScans: 3,
            infectedDocuments: 1
        });
        jest.spyOn(service, "getMonitoringSummary").mockResolvedValue({
            readinessStatus: "degraded",
            databaseStatus: "ok",
            redisStatus: "disabled",
            authStatus: "degraded",
            billingStatus: "degraded",
            trustVerificationStatus: "error",
            malwareScanningStatus: "degraded",
            outboxStatus: "ok",
            trustVerificationDue: 2,
            trustVerificationFailed: 1,
            malwareScanningDue: 3,
            malwareScanningFailed: 0,
            infectedLast24h: 1,
            outboxPending: 0,
            outboxDeadLetterRisk: 0
        });
        const result = await service.getDashboardSummary();
        expect(result.organizations.total).toBe(2);
        expect(result.users.locked).toBe(2);
        expect(result.alerts).toEqual(expect.arrayContaining([
            expect.objectContaining({
                type: "owner_mfa_missing"
            }),
            expect.objectContaining({
                type: "infected_documents"
            }),
            expect.objectContaining({
                type: "trust_verification_failed"
            })
        ]));
    });
});

//# sourceMappingURL=platform-admin-read.service.spec.js.map