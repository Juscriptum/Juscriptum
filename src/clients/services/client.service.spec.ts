import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotFoundException, ForbiddenException } from "@nestjs/common";
import { ClientService } from "./client.service";
import { Client } from "../../database/entities/Client.entity";
import { Case } from "../../database/entities/Case.entity";
import { Event } from "../../database/entities/Event.entity";
import { ClientNumberRelease } from "../../database/entities/ClientNumberRelease.entity";
import { Organization } from "../../database/entities/Organization.entity";
import * as validationUtil from "../../common/utils/validation.util";

// Mock validation utilities
jest.mock("../../common/utils/validation.util");

describe("ClientService", () => {
  let service: ClientService;
  let clientRepository: jest.Mocked<Repository<Client>>;
  let caseRepository: jest.Mocked<Repository<Case>>;
  let eventRepository: jest.Mocked<Repository<Event>>;
  let clientNumberReleaseRepository: jest.Mocked<
    Repository<ClientNumberRelease>
  >;
  let organizationRepository: jest.Mocked<Repository<Organization>>;

  const mockTenantId = "test-tenant-id";
  const mockUserId = "test-user-id";
  const mockClientId = "test-client-id";

  const mockClient = {
    id: mockClientId,
    tenantId: mockTenantId,
    type: "individual",
    firstName: "Іван",
    lastName: "Петренко",
    patronymic: "Іванович",
    companyName: null,
    edrpou: null,
    edrpouBlindIndex: null,
    inn: null,
    innBlindIndex: null,
    email: "ivan@example.com",
    emailBlindIndex: "blind-email",
    phone: "+380501234567",
    phoneBlindIndex: "blind-phone",
    secondaryPhone: null,
    address: null,
    city: null,
    region: null,
    postalCode: null,
    country: "UA",
    status: "active",
    source: null,
    assignedUserId: null,
    passportNumber: null,
    passportDate: null,
    notes: null,
    metadata: {},
    assignedUser: undefined,
    cases: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: mockUserId,
    updatedBy: mockUserId,
    accessScope: "assigned",
    syncBlindIndexes: jest.fn(),
  } as unknown as Client;

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    withDeleted: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getMany: jest.fn(),
    select: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  };

  beforeEach(async () => {
    const transaction = jest.fn(async (callback: any) =>
      callback({
        getRepository: (entity: unknown) => {
          if (entity === Client) {
            return clientRepository;
          }

          if (entity === Case) {
            return caseRepository;
          }

          if (entity === Event) {
            return eventRepository;
          }

          return clientNumberReleaseRepository;
        },
      }),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientService,
        {
          provide: getRepositoryToken(Client),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
            manager: {
              transaction,
            },
          },
        },
        {
          provide: getRepositoryToken(Case),
          useValue: {
            find: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Event),
          useValue: {
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ClientNumberRelease),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ClientService>(ClientService);
    clientRepository = module.get(getRepositoryToken(Client));
    caseRepository = module.get(getRepositoryToken(Case));
    eventRepository = module.get(getRepositoryToken(Event));
    clientNumberReleaseRepository = module.get(
      getRepositoryToken(ClientNumberRelease),
    );
    organizationRepository = module.get(getRepositoryToken(Organization));

    // Reset mock query builder
    Object.keys(mockQueryBuilder).forEach((key) => {
      mockQueryBuilder[key as keyof typeof mockQueryBuilder].mockClear();
    });
    mockQueryBuilder.where.mockReturnThis();
    mockQueryBuilder.withDeleted.mockReturnThis();
    mockQueryBuilder.andWhere.mockReturnThis();
    mockQueryBuilder.orderBy.mockReturnThis();
    mockQueryBuilder.skip.mockReturnThis();
    mockQueryBuilder.take.mockReturnThis();
    mockQueryBuilder.leftJoinAndSelect.mockReturnThis();
    mockQueryBuilder.select.mockReturnThis();
    mockQueryBuilder.getMany.mockResolvedValue([]);

    clientNumberReleaseRepository.findOne.mockResolvedValue(null);
    clientNumberReleaseRepository.create.mockImplementation(
      (value) => value as ClientNumberRelease,
    );
    clientNumberReleaseRepository.save.mockResolvedValue(
      {} as ClientNumberRelease,
    );
    clientNumberReleaseRepository.remove.mockResolvedValue(
      {} as ClientNumberRelease,
    );
    caseRepository.find.mockResolvedValue([]);
    caseRepository.update.mockResolvedValue({} as any);
    eventRepository.update.mockResolvedValue({} as any);
    clientRepository.count.mockResolvedValue(0);
    organizationRepository.findOne.mockResolvedValue({
      subscriptionPlan: "professional",
    } as Organization);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findAll", () => {
    it("should return paginated clients", async () => {
      const mockClients = [mockClient];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockClients, 1]);

      const result = await service.findAll(mockTenantId, {});

      expect(result.data).toEqual(mockClients);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it("should apply search filter", async () => {
      (validationUtil.detectSqlInjection as jest.Mock).mockReturnValue(false);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll(mockTenantId, { search: "Іван" });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(expect.anything());
    });

    it("should use blind indexes for searchable email lookup", async () => {
      (validationUtil.detectSqlInjection as jest.Mock).mockReturnValue(false);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll(mockTenantId, { search: "ivan@example.com" });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(expect.anything());
    });

    it("should throw ForbiddenException for SQL injection attempt", async () => {
      (validationUtil.detectSqlInjection as jest.Mock).mockReturnValue(true);

      await expect(
        service.findAll(mockTenantId, { search: "'; DROP TABLE clients; --" }),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should apply type filter", async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll(mockTenantId, { type: "individual" });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "client.type = :type",
        { type: "individual" },
      );
    });

    it("should apply status filter", async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll(mockTenantId, { status: "active" });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "client.status = :status",
        { status: "active" },
      );
    });

    it("should apply assigned user filter", async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll(mockTenantId, { assignedUserId: mockUserId });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "client.assignedUserId = :assignedUserId",
        { assignedUserId: mockUserId },
      );
    });

    it("should apply pagination", async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll(mockTenantId, { page: 2, limit: 10 });

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it("should apply sorting", async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll(mockTenantId, {
        sortBy: "lastName",
        sortOrder: "ASC",
      });

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        "client.lastName",
        "ASC",
      );
    });
  });

  describe("findById", () => {
    it("should return client by ID", async () => {
      clientRepository.findOne.mockResolvedValue(mockClient);

      const result = await service.findById(mockTenantId, mockClientId);

      expect(result).toEqual(mockClient);
      expect(clientRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: mockClientId,
          tenantId: mockTenantId,
          deletedAt: expect.any(Object),
        },
        relations: ["assignedUser", "cases"],
      });
    });

    it("should throw NotFoundException for non-existent client", async () => {
      clientRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findById(mockTenantId, mockClientId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    const createDto = {
      type: "individual" as const,
      firstName: "Іван",
      lastName: "Петренко",
      email: "ivan@example.com",
      phone: "+380501234567",
    };

    beforeEach(() => {
      (validationUtil.validateEdrpou as jest.Mock).mockReturnValue(true);
      (validationUtil.validateTaxNumber as jest.Mock).mockReturnValue(true);
    });

    it("should create a new client", async () => {
      const createdClient = {
        ...mockClient,
        metadata: { client_number: "001" },
      } as unknown as Client;
      clientRepository.create.mockReturnValue(createdClient);
      clientRepository.save.mockResolvedValue(createdClient);

      const result = await service.create(mockTenantId, mockUserId, createDto);

      expect(result).toEqual(createdClient);
      expect(clientRepository.create).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        ...createDto,
        metadata: {
          client_number: "001",
        },
        accessScope: "assigned",
        createdBy: mockUserId,
        updatedBy: mockUserId,
      });
    });

    it("should persist a custom createdAt date from the create dto", async () => {
      const createdClient = {
        ...mockClient,
        createdAt: new Date("2026-02-27T12:00:00.000Z"),
        metadata: { client_number: "001" },
      } as unknown as Client;
      clientRepository.create.mockReturnValue(createdClient);
      clientRepository.save.mockResolvedValue(createdClient);

      await service.create(mockTenantId, mockUserId, {
        ...createDto,
        createdAt: "2026-02-27T12:00:00.000Z",
      });

      expect(clientRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: new Date("2026-02-27T12:00:00.000Z"),
        }),
      );
    });

    it("should reject create when basic plan client quota is exhausted", async () => {
      clientRepository.count.mockResolvedValue(1);

      await expect(
        service.create(mockTenantId, mockUserId, createDto, {
          tenant_id: mockTenantId,
          user_id: mockUserId,
          role: "organization_owner",
          subscription_plan: "basic",
        } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should reuse released client number before incrementing", async () => {
      clientNumberReleaseRepository.findOne.mockResolvedValue({
        id: "release-1",
        tenantId: mockTenantId,
        clientNumber: 7,
      } as ClientNumberRelease);
      clientRepository.create.mockReturnValue(mockClient);
      clientRepository.save.mockResolvedValue(mockClient);

      await service.create(mockTenantId, mockUserId, createDto);

      expect(clientNumberReleaseRepository.remove).toHaveBeenCalledWith(
        expect.objectContaining({
          clientNumber: 7,
        }),
      );
      expect(clientRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            client_number: "007",
          },
        }),
      );
    });

    it("should throw ForbiddenException for invalid EDRPOU", async () => {
      (validationUtil.validateEdrpou as jest.Mock).mockReturnValue(false);

      await expect(
        service.create(mockTenantId, mockUserId, {
          ...createDto,
          edrpou: "invalid",
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should throw ForbiddenException for invalid INN", async () => {
      (validationUtil.validateTaxNumber as jest.Mock).mockReturnValue(false);

      await expect(
        service.create(mockTenantId, mockUserId, {
          ...createDto,
          inn: "invalid",
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should create legal entity client", async () => {
      const legalEntityDto = {
        type: "legal_entity" as const,
        companyName: 'ТОВ "Тест"',
        edrpou: "12345678",
        email: "test@company.com",
      };
      const mockLegalClient = {
        ...mockClient,
        ...legalEntityDto,
      } as unknown as Client;
      clientRepository.create.mockReturnValue(mockLegalClient);
      clientRepository.save.mockResolvedValue(mockLegalClient);

      const result = await service.create(
        mockTenantId,
        mockUserId,
        legalEntityDto,
      );

      expect(result.type).toBe("legal_entity");
    });

    it("should create FOP client with director metadata", async () => {
      const fopDto = {
        type: "fop" as const,
        firstName: "Іван",
        lastName: "Петренко",
        patronymic: "Іванович",
        inn: "1234567890",
        email: "fop@example.com",
        phone: "+380501234567",
        metadata: {
          fop: {
            taxationAuthority: "kyiv",
            taxationBasis: "Стаття 3",
            director: {
              firstName: "Іван",
              lastName: "Петренко",
              patronymic: "Іванович",
              inn: "1234567890",
            },
            banking: {
              bankName: "ПриватБанк",
              mfo: "305299",
              iban: "UA123456789012345678901234567",
            },
          },
          contact: {
            additional_phones: ["+380671234567"],
            additional_emails: ["secondary@example.com"],
          },
          addresses: {
            registration: {
              region: "Київська область",
              city: "Київ",
              street: "Хрещатик",
              building: "1",
            },
            is_same_address: true,
          },
        },
      };

      const mockFopClient = {
        ...mockClient,
        companyName: "ФОП Петренко Іван Іванович",
        ...fopDto,
      } as unknown as Client;
      clientRepository.create.mockReturnValue(mockFopClient);
      clientRepository.save.mockResolvedValue(mockFopClient);

      const result = await service.create(mockTenantId, mockUserId, fopDto);

      expect(result.type).toBe("fop");
      expect(result.companyName).toContain("ФОП");
      expect(result.metadata.fop.director.firstName).toBe("Іван");
      expect(result.metadata.fop.banking.mfo).toBe("305299");
    });

    it("should create FOP client with different director", async () => {
      const fopDto = {
        type: "fop" as const,
        firstName: "Іван",
        lastName: "Петренко",
        patronymic: "Іванович",
        inn: "1234567890",
        email: "fop@example.com",
        phone: "+380501234567",
        metadata: {
          fop: {
            taxationAuthority: "kyiv",
            taxationBasis: "Стаття 3",
            director: {
              is_same_as_client: false,
              firstName: "Петро",
              lastName: "Сидоренко",
              patronymic: "Миколайович",
              taxationBasis: "Доручення",
            },
          },
        },
      };

      const mockFopClient = {
        ...mockClient,
        ...fopDto,
      } as unknown as Client;
      clientRepository.create.mockReturnValue(mockFopClient);
      clientRepository.save.mockResolvedValue(mockFopClient);

      const result = await service.create(mockTenantId, mockUserId, fopDto);

      expect(result.type).toBe("fop");
      expect(result.metadata.fop.director.is_same_as_client).toBe(false);
      expect(result.metadata.fop.director.firstName).toBe("Петро");
    });

    it("should create individual client with nested address metadata", async () => {
      const individualDto = {
        type: "individual" as const,
        firstName: "Олена",
        lastName: "Коваленко",
        patronymic: "Петрівна",
        inn: "0987654321",
        email: "olena@example.com",
        phone: "+380631234567",
        metadata: {
          contact: {
            additional_phones: ["+380671111111"],
            additional_emails: ["work@example.com"],
            messengers: {
              telegram: "@olenak",
              viber: "+380631234567",
            },
          },
          addresses: {
            registration: {
              region: "Львівська область",
              city: "Львів",
              city_code: "032",
              street: "Вулиця Котляревського",
              building: "15",
              apartment: "42",
            },
            actual: {
              region: "Львівська область",
              city: "Львів",
              street: "Інша вулиця",
              building: "10",
            },
            is_same_address: false,
          },
        },
      };

      const mockIndividualClient = {
        ...mockClient,
        ...individualDto,
      } as unknown as Client;
      clientRepository.create.mockReturnValue(mockIndividualClient);
      clientRepository.save.mockResolvedValue(mockIndividualClient);

      const result = await service.create(
        mockTenantId,
        mockUserId,
        individualDto,
      );

      expect(result.type).toBe("individual");
      expect(result.metadata.contact.messengers.telegram).toBe("@olenak");
      expect(result.metadata.addresses.is_same_address).toBe(false);
      expect(result.metadata.addresses.actual.street).toBe("Інша вулиця");
    });
  });

  describe("update", () => {
    const updateDto = {
      firstName: "Петро",
      lastName: "Іваненко",
    };

    beforeEach(() => {
      (validationUtil.validateEdrpou as jest.Mock).mockReturnValue(true);
      (validationUtil.validateTaxNumber as jest.Mock).mockReturnValue(true);
    });

    it("should update existing client", async () => {
      clientRepository.findOne.mockResolvedValue(mockClient);
      clientRepository.save.mockResolvedValue({
        ...mockClient,
        ...updateDto,
      } as unknown as Client);

      const result = await service.update(
        mockTenantId,
        mockClientId,
        mockUserId,
        updateDto,
      );

      expect(result.firstName).toBe("Петро");
      expect(result.lastName).toBe("Іваненко");
    });

    it("should throw NotFoundException for non-existent client", async () => {
      clientRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(mockTenantId, mockClientId, mockUserId, updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ForbiddenException for invalid EDRPOU", async () => {
      clientRepository.findOne.mockResolvedValue(mockClient);
      (validationUtil.validateEdrpou as jest.Mock).mockReturnValue(false);

      await expect(
        service.update(mockTenantId, mockClientId, mockUserId, {
          edrpou: "invalid",
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should update client status", async () => {
      clientRepository.findOne.mockResolvedValue(mockClient);
      clientRepository.save.mockResolvedValue({
        ...mockClient,
        status: "inactive",
      } as unknown as Client);

      const result = await service.update(
        mockTenantId,
        mockClientId,
        mockUserId,
        {
          status: "inactive",
        },
      );

      expect(result.status).toBe("inactive");
    });
  });

  describe("delete", () => {
    it("should soft delete client", async () => {
      clientRepository.findOne.mockResolvedValue({
        ...mockClient,
        metadata: { client_number: "001" },
      } as unknown as Client);
      clientRepository.update.mockResolvedValue({} as any);

      await service.delete(mockTenantId, mockClientId, mockUserId);

      expect(clientRepository.update).toHaveBeenCalledWith(
        { id: mockClientId, tenantId: mockTenantId },
        {
          deletedAt: expect.any(Date),
          updatedBy: mockUserId,
        },
      );
      expect(caseRepository.update).toHaveBeenCalledWith(
        {
          tenantId: mockTenantId,
          clientId: mockClientId,
          deletedAt: expect.anything(),
        },
        {
          deletedAt: expect.any(Date),
          updatedBy: mockUserId,
        },
      );
    });

    it("should release client number when requested", async () => {
      clientRepository.findOne.mockResolvedValue({
        ...mockClient,
        metadata: { client_number: "001" },
      } as unknown as Client);
      clientRepository.update.mockResolvedValue({} as any);

      await service.delete(mockTenantId, mockClientId, mockUserId, {
        releaseClientNumber: true,
      });

      expect(clientNumberReleaseRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: mockTenantId,
          clientNumber: 1,
          releasedFromClientId: mockClientId,
        }),
      );
    });

    it("should throw NotFoundException for non-existent client", async () => {
      clientRepository.findOne.mockResolvedValue(null);

      await expect(
        service.delete(mockTenantId, mockClientId, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("restore", () => {
    it("should restore deleted client", async () => {
      clientRepository.findOne.mockResolvedValue({
        ...mockClient,
        deletedAt: new Date(),
        metadata: { client_number: "001" },
      } as unknown as Client);
      clientRepository.update.mockResolvedValue({} as any);

      const result = await service.restore(
        mockTenantId,
        mockClientId,
        mockUserId,
      );

      expect(clientRepository.update).toHaveBeenCalledWith(
        { id: mockClientId, tenantId: mockTenantId },
        {
          deletedAt: null,
          updatedBy: mockUserId,
        },
      );
      expect(result).toEqual(
        expect.objectContaining({
          id: mockClientId,
        }),
      );
    });
  });

  describe("archive cascade", () => {
    it("should archive all active client cases and events when client is archived", async () => {
      clientRepository.findOne.mockResolvedValue({
        ...mockClient,
        status: "active",
      } as unknown as Client);
      clientRepository.save.mockResolvedValue({
        ...mockClient,
        status: "archived",
      } as unknown as Client);
      caseRepository.find.mockResolvedValue([{ id: "case-1" } as Case]);

      const result = await service.update(
        mockTenantId,
        mockClientId,
        mockUserId,
        {
          status: "archived",
        },
      );

      expect(caseRepository.update).toHaveBeenCalledWith(
        {
          tenantId: mockTenantId,
          clientId: mockClientId,
          deletedAt: expect.anything(),
        },
        {
          status: "archived",
          updatedBy: mockUserId,
        },
      );
      expect(eventRepository.update).toHaveBeenCalledWith(
        {
          tenantId: mockTenantId,
          caseId: expect.anything(),
          deletedAt: expect.anything(),
        },
        {
          status: "archived",
          updatedBy: mockUserId,
        },
      );
      expect(result.status).toBe("archived");
    });

    it("should soft delete client events linked through client cases", async () => {
      clientRepository.findOne.mockResolvedValue(mockClient);
      caseRepository.find.mockResolvedValue([{ id: "case-1" } as Case]);

      await service.delete(mockTenantId, mockClientId, mockUserId);

      expect(eventRepository.update).toHaveBeenCalledWith(
        {
          tenantId: mockTenantId,
          caseId: expect.anything(),
          deletedAt: expect.anything(),
        },
        {
          deletedAt: expect.any(Date),
          updatedBy: mockUserId,
        },
      );
    });
  });

  describe("getNextClientNumber", () => {
    it("should return next sequential client number", async () => {
      mockQueryBuilder.getMany.mockResolvedValue([
        { metadata: { client_number: "001" } },
        { metadata: { client_number: "009" } },
      ]);

      const result = await service.getNextClientNumber(mockTenantId);

      expect(result).toEqual({ clientNumber: "010" });
    });

    it("should prefer the smallest released number", async () => {
      clientNumberReleaseRepository.findOne.mockResolvedValue({
        id: "release-1",
        tenantId: mockTenantId,
        clientNumber: 3,
      } as ClientNumberRelease);

      const result = await service.getNextClientNumber(mockTenantId);

      expect(result).toEqual({ clientNumber: "003" });
    });
  });

  describe("bulkImport", () => {
    const clientsToImport = [
      { type: "individual" as const, firstName: "Іван", lastName: "Петренко" },
      { type: "individual" as const, firstName: "Петро", lastName: "Іваненко" },
    ];

    beforeEach(() => {
      (validationUtil.validateEdrpou as jest.Mock).mockReturnValue(true);
      (validationUtil.validateTaxNumber as jest.Mock).mockReturnValue(true);
    });

    it("should import multiple clients successfully", async () => {
      clientRepository.create.mockReturnValue(mockClient);
      clientRepository.save.mockResolvedValue(mockClient);

      const result = await service.bulkImport(
        mockTenantId,
        mockUserId,
        clientsToImport,
      );

      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle partial failures", async () => {
      clientRepository.create.mockReturnValue(mockClient);
      clientRepository.save
        .mockResolvedValueOnce(mockClient)
        .mockRejectedValueOnce(new Error("Database error"));

      const result = await service.bulkImport(
        mockTenantId,
        mockUserId,
        clientsToImport,
      );

      expect(result.success).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });

    it("should handle validation errors", async () => {
      const invalidClients = [
        { type: "legal_entity" as const, edrpou: "invalid" },
      ];
      (validationUtil.validateEdrpou as jest.Mock).mockReturnValue(false);

      const result = await service.bulkImport(
        mockTenantId,
        mockUserId,
        invalidClients,
      );

      expect(result.success).toBe(0);
      expect(result.failed).toBe(1);
    });

    it("should reject bulk import when basic plan quota would be exceeded", async () => {
      clientRepository.count.mockResolvedValue(1);

      await expect(
        service.bulkImport(
          mockTenantId,
          mockUserId,
          [{ type: "individual", firstName: "Іван" } as any],
          {
            tenant_id: mockTenantId,
            user_id: mockUserId,
            role: "organization_owner",
            subscription_plan: "basic",
          } as any,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("getStatistics", () => {
    it("should return client statistics", async () => {
      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce([{ count: "100" }])
        .mockResolvedValueOnce([{ count: "80" }])
        .mockResolvedValueOnce([{ count: "15" }])
        .mockResolvedValueOnce([{ count: "5" }])
        .mockResolvedValueOnce([{ count: "60" }])
        .mockResolvedValueOnce([{ count: "40" }]);

      const result = await service.getStatistics(mockTenantId);

      expect(result).toEqual({
        total: 100,
        active: 80,
        inactive: 15,
        archived: 5,
        individuals: 60,
        legalEntities: 40,
      });
    });

    it("should handle empty statistics", async () => {
      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce([{ count: "0" }])
        .mockResolvedValueOnce([{ count: "0" }])
        .mockResolvedValueOnce([{ count: "0" }])
        .mockResolvedValueOnce([{ count: "0" }])
        .mockResolvedValueOnce([{ count: "0" }])
        .mockResolvedValueOnce([{ count: "0" }]);

      const result = await service.getStatistics(mockTenantId);

      expect(result.total).toBe(0);
    });
  });
});
