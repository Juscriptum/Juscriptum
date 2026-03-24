import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotFoundException } from "@nestjs/common";
import { CaseService } from "./case.service";
import { CaseRegistrySyncService } from "./case-registry-sync.service";
import { Case } from "../../database/entities/Case.entity";
import { Client } from "../../database/entities/Client.entity";
import { Organization } from "../../database/entities/Organization.entity";
import { Event } from "../../database/entities/Event.entity";
import { CourtRegistryService } from "../../clients/services/court-registry.service";

describe("CaseService", () => {
  let service: CaseService;
  let caseRepository: jest.Mocked<Repository<Case>>;
  let clientRepository: jest.Mocked<Repository<Client>>;
  let organizationRepository: jest.Mocked<Repository<Organization>>;
  let eventRepository: jest.Mocked<Repository<Event>>;
  let caseRegistrySyncService: jest.Mocked<CaseRegistrySyncService>;
  let courtRegistryService: jest.Mocked<CourtRegistryService>;

  const mockTenantId = "tenant-1";
  const mockUserId = "user-1";
  const mockClientId = "client-1";

  const mockCaseQueryBuilder = {
    withDeleted: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  beforeEach(async () => {
    const transaction = jest.fn(async (callback: any) =>
      callback({
        getRepository: (entity: unknown) =>
          entity === Case
            ? caseRepository
            : entity === Event
              ? eventRepository
              : clientRepository,
      }),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CaseService,
        {
          provide: getRepositoryToken(Case),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(mockCaseQueryBuilder),
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
            manager: {
              transaction,
            },
          },
        },
        {
          provide: getRepositoryToken(Client),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Event),
          useValue: {
            update: jest.fn(),
          },
        },
        {
          provide: CaseRegistrySyncService,
          useValue: {
            handleCaseLifecycleChange: jest.fn(),
          },
        },
        {
          provide: CourtRegistryService,
          useValue: {
            searchInCourtRegistry: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CaseService>(CaseService);
    caseRepository = module.get(getRepositoryToken(Case));
    clientRepository = module.get(getRepositoryToken(Client));
    organizationRepository = module.get(getRepositoryToken(Organization));
    eventRepository = module.get(getRepositoryToken(Event));
    caseRegistrySyncService = module.get(CaseRegistrySyncService);
    courtRegistryService = module.get(CourtRegistryService);

    mockCaseQueryBuilder.withDeleted.mockReturnThis();
    mockCaseQueryBuilder.where.mockReturnThis();
    mockCaseQueryBuilder.getMany.mockResolvedValue([]);
    caseRepository.count.mockResolvedValue(0);
    eventRepository.update.mockResolvedValue({} as any);
    organizationRepository.findOne.mockResolvedValue({
      subscriptionPlan: "professional",
    } as Organization);
    courtRegistryService.searchInCourtRegistry.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should preview next case number as clientNumber/001 for a new client", async () => {
    clientRepository.findOne.mockResolvedValue({
      id: mockClientId,
      tenantId: mockTenantId,
      metadata: { client_number: "001" },
    } as unknown as Client);

    const result = await service.getNextCaseNumber(mockTenantId, mockClientId);

    expect(result).toEqual({ caseNumber: "001/001" });
    expect(mockCaseQueryBuilder.where).toHaveBeenCalledWith(
      "case.tenantId = :tenantId AND case.clientId = :clientId",
      {
        tenantId: mockTenantId,
        clientId: mockClientId,
      },
    );
  });

  it("should increment only internal case numbers for the selected client", async () => {
    clientRepository.findOne.mockResolvedValue({
      id: mockClientId,
      tenantId: mockTenantId,
      metadata: { client_number: "001" },
    } as unknown as Client);
    mockCaseQueryBuilder.getMany.mockResolvedValue([
      { caseNumber: "001/001" },
      { caseNumber: "001/004" },
      { caseNumber: "757/12345/23-ц" },
    ] as Case[]);

    const result = await service.getNextCaseNumber(mockTenantId, mockClientId);

    expect(result).toEqual({ caseNumber: "001/005" });
  });

  it("should generate internal case number on create and keep registry case number separately", async () => {
    const client = {
      id: mockClientId,
      tenantId: mockTenantId,
      metadata: { client_number: "007" },
    } as unknown as Client;
    const savedCase = {
      id: "case-1",
      caseNumber: "007/002",
      registryCaseNumber: "757/12345/23-ц",
    } as Case;

    clientRepository.findOne.mockResolvedValue(client);
    mockCaseQueryBuilder.getMany.mockResolvedValue([
      { caseNumber: "007/001" } as Case,
    ]);
    caseRepository.create.mockImplementation((value) => value as Case);
    caseRepository.save.mockResolvedValue(savedCase);

    const result = await service.create(mockTenantId, mockUserId, {
      caseNumber: "manual-value-that-must-be-ignored",
      registryCaseNumber: "757/12345/23-ц",
      caseType: "judicial_case",
      clientId: mockClientId,
      assignedLawyerId: mockUserId,
      priority: "medium",
    });

    expect(caseRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        caseNumber: "007/002",
        registryCaseNumber: "757/12345/23-ц",
      }),
    );
    expect(result).toBe(savedCase);
  });

  it("should reject create when basic plan case quota is exhausted", async () => {
    caseRepository.count.mockResolvedValue(3);

    await expect(
      service.create(
        mockTenantId,
        mockUserId,
        {
          caseType: "judicial_case",
          clientId: mockClientId,
          assignedLawyerId: mockUserId,
          priority: "medium",
        } as any,
        {
          tenant_id: mockTenantId,
          user_id: mockUserId,
          role: "organization_owner",
          subscription_plan: "basic",
        } as any,
      ),
    ).rejects.toThrow("максимум 3 справ");
  });

  it("should throw when client has no internal number", async () => {
    clientRepository.findOne.mockResolvedValue({
      id: mockClientId,
      tenantId: mockTenantId,
      metadata: {},
    } as unknown as Client);

    await expect(
      service.getNextCaseNumber(mockTenantId, mockClientId),
    ).rejects.toThrow(NotFoundException);
  });

  it("should trigger registry sync after create", async () => {
    const client = {
      id: mockClientId,
      tenantId: mockTenantId,
      metadata: { client_number: "007" },
    } as unknown as Client;
    const savedCase = {
      id: "case-2",
      caseNumber: "007/001",
      registryCaseNumber: "916/4127/25",
    } as Case;

    clientRepository.findOne.mockResolvedValue(client);
    mockCaseQueryBuilder.getMany.mockResolvedValue([]);
    caseRepository.create.mockImplementation((value) => value as Case);
    caseRepository.save.mockResolvedValue(savedCase);

    await service.create(mockTenantId, mockUserId, {
      caseType: "judicial_case",
      clientId: mockClientId,
      assignedLawyerId: mockUserId,
      priority: "medium",
      registryCaseNumber: "916/4127/25",
    });

    expect(
      caseRegistrySyncService.handleCaseLifecycleChange,
    ).toHaveBeenCalledWith(savedCase, mockUserId);
  });

  it("archives linked events when a case is archived", async () => {
    caseRepository.findOne.mockResolvedValue({
      id: "case-archive",
      tenantId: mockTenantId,
      clientId: mockClientId,
      assignedLawyerId: mockUserId,
      caseType: "judicial_case",
      priority: "medium",
      status: "active",
    } as unknown as Case);
    caseRepository.save.mockImplementation(async (value) => value as Case);

    const result = await service.changeStatus(
      mockTenantId,
      "case-archive",
      mockUserId,
      "archived",
    );

    expect(eventRepository.update).toHaveBeenCalledWith(
      {
        tenantId: mockTenantId,
        caseId: "case-archive",
        deletedAt: expect.anything(),
      },
      {
        status: "archived",
        updatedBy: mockUserId,
      },
    );
    expect(result.status).toBe("archived");
  });

  it("soft deletes linked events when a case is deleted", async () => {
    caseRepository.findOne.mockResolvedValue({
      id: "case-delete",
      tenantId: mockTenantId,
      clientId: mockClientId,
      assignedLawyerId: mockUserId,
      caseType: "judicial_case",
      priority: "medium",
      status: "active",
      events: [],
      documents: [],
    } as unknown as Case);

    await service.delete(mockTenantId, "case-delete", mockUserId);

    expect(eventRepository.update).toHaveBeenCalledWith(
      {
        tenantId: mockTenantId,
        caseId: "case-delete",
        deletedAt: expect.anything(),
      },
      {
        deletedAt: expect.any(Date),
        updatedBy: mockUserId,
      },
    );
  });

  it("adds the latest meaningful court_stan stage to the timeline when it is not duplicated by court_dates", async () => {
    caseRepository.findOne.mockResolvedValue({
      id: "case-1",
      tenantId: mockTenantId,
      events: [
        {
          id: "event-1",
          type: "court_sitting",
          title: "Судове засідання у справі 175/2344/26",
          eventDate: "2026-04-02T00:00:00.000Z",
          eventTime: "12:10",
          participants: { syncSource: "court_dates" },
        },
      ],
      documents: [],
      clientId: mockClientId,
      assignedLawyerId: mockUserId,
      caseType: "judicial_case",
      priority: "medium",
      status: "active",
      registryCaseNumber: "175/2344/26",
    } as unknown as Case);
    courtRegistryService.searchInCourtRegistry.mockResolvedValue([
      {
        source: "court_registry",
        sourceLabel: "Судовий реєстр",
        person: "Позивач",
        role: "Позивач",
        caseDescription: "",
        caseNumber: "175/2344/26",
        courtName: "Жовтневий районний суд",
        caseProc: "",
        registrationDate: "01.04.2026",
        judge: "",
        type: "",
        stageDate: "02.04.2026",
        stageName: "Відкладено розгляд справи",
        participants: "",
      },
    ]);

    const timeline = await service.getTimeline(mockTenantId, "case-1");

    expect(timeline).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "registry_stage",
          data: expect.objectContaining({
            stageName: "Відкладено розгляд справи",
            stageDate: "02.04.2026",
          }),
        }),
      ]),
    );
  });

  it("returns all case events in reverse chronological order without mixing in documents", async () => {
    caseRepository.findOne.mockResolvedValue({
      id: "case-3",
      tenantId: mockTenantId,
      events: [
        {
          id: "event-old",
          type: "meeting",
          title: "Стара подія",
          eventDate: "2026-03-01T00:00:00.000Z",
        },
        {
          id: "event-new",
          type: "court_sitting",
          title: "Нова подія",
          eventDate: "2026-04-05T00:00:00.000Z",
        },
      ],
      documents: [
        {
          id: "doc-1",
          originalName: "Документ.pdf",
          uploadedAt: "2026-05-01T00:00:00.000Z",
        },
      ],
      clientId: mockClientId,
      assignedLawyerId: mockUserId,
      caseType: "judicial_case",
      priority: "medium",
      status: "active",
      registryCaseNumber: null,
    } as unknown as Case);

    const timeline = await service.getTimeline(mockTenantId, "case-3");

    expect(timeline.map((item: any) => item.data.id)).toEqual([
      "event-new",
      "event-old",
    ]);
    expect(timeline.some((item: any) => item.type === "document")).toBe(false);
  });

  it("skips the latest court_stan stage when it only repeats the synced court_dates hearing meaning", async () => {
    caseRepository.findOne.mockResolvedValue({
      id: "case-2",
      tenantId: mockTenantId,
      events: [
        {
          id: "event-1",
          type: "court_sitting",
          title: "Судове засідання у справі 175/2344/26",
          eventDate: "2026-04-02T00:00:00.000Z",
          eventTime: "12:10",
          participants: { syncSource: "court_dates" },
        },
      ],
      documents: [],
      clientId: mockClientId,
      assignedLawyerId: mockUserId,
      caseType: "judicial_case",
      priority: "medium",
      status: "active",
      registryCaseNumber: "175/2344/26",
    } as unknown as Case);
    courtRegistryService.searchInCourtRegistry.mockResolvedValue([
      {
        source: "court_registry",
        sourceLabel: "Судовий реєстр",
        person: "Позивач",
        role: "Позивач",
        caseDescription: "",
        caseNumber: "175/2344/26",
        courtName: "Жовтневий районний суд",
        caseProc: "",
        registrationDate: "01.04.2026",
        judge: "",
        type: "",
        stageDate: "02.04.2026 12:10",
        stageName: "Призначено до судового розгляду 02.04.2026 12:10",
        participants: "",
      },
    ]);

    const timeline = await service.getTimeline(mockTenantId, "case-2");

    expect(timeline.some((item: any) => item.type === "registry_stage")).toBe(
      false,
    );
  });
});
