import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotFoundException } from "@nestjs/common";
import { CaseService } from "./case.service";
import { CaseRegistrySyncService } from "./case-registry-sync.service";
import { Case } from "../../database/entities/Case.entity";
import { Client } from "../../database/entities/Client.entity";
import { Organization } from "../../database/entities/Organization.entity";

describe("CaseService", () => {
  let service: CaseService;
  let caseRepository: jest.Mocked<Repository<Case>>;
  let clientRepository: jest.Mocked<Repository<Client>>;
  let organizationRepository: jest.Mocked<Repository<Organization>>;
  let caseRegistrySyncService: jest.Mocked<CaseRegistrySyncService>;

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
          entity === Case ? caseRepository : clientRepository,
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
          provide: CaseRegistrySyncService,
          useValue: {
            handleCaseLifecycleChange: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CaseService>(CaseService);
    caseRepository = module.get(getRepositoryToken(Case));
    clientRepository = module.get(getRepositoryToken(Client));
    organizationRepository = module.get(getRepositoryToken(Organization));
    caseRegistrySyncService = module.get(CaseRegistrySyncService);

    mockCaseQueryBuilder.withDeleted.mockReturnThis();
    mockCaseQueryBuilder.where.mockReturnThis();
    mockCaseQueryBuilder.getMany.mockResolvedValue([]);
    caseRepository.count.mockResolvedValue(0);
    organizationRepository.findOne.mockResolvedValue({
      subscriptionPlan: "professional",
    } as Organization);
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
});
