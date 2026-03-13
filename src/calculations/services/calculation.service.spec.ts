import { BadRequestException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import { CalculationService } from "./calculation.service";
import { Calculation } from "../../database/entities/Calculation.entity";
import { CalculationItem } from "../../database/entities/CalculationItem.entity";
import { PricelistItem } from "../../database/entities/PricelistItem.entity";
import { Case } from "../../database/entities/Case.entity";
import { Client } from "../../database/entities/Client.entity";

describe("CalculationService", () => {
  let service: CalculationService;
  let calculationRepository: jest.Mocked<Repository<Calculation>>;
  let calculationItemRepository: jest.Mocked<Repository<CalculationItem>>;
  let pricelistItemRepository: jest.Mocked<Repository<PricelistItem>>;
  let caseRepository: jest.Mocked<Repository<Case>>;
  let clientRepository: jest.Mocked<Repository<Client>>;

  const tenantId = "tenant-1";
  const userId = "user-1";

  const calculationQueryBuilder = {
    withDeleted: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalculationService,
        {
          provide: getRepositoryToken(Calculation),
          useValue: {
            createQueryBuilder: jest
              .fn()
              .mockReturnValue(calculationQueryBuilder),
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CalculationItem),
          useValue: {
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PricelistItem),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Case),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Client),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CalculationService>(CalculationService);
    calculationRepository = module.get(getRepositoryToken(Calculation));
    calculationItemRepository = module.get(getRepositoryToken(CalculationItem));
    pricelistItemRepository = module.get(getRepositoryToken(PricelistItem));
    caseRepository = module.get(getRepositoryToken(Case));
    clientRepository = module.get(getRepositoryToken(Client));

    calculationQueryBuilder.withDeleted.mockReturnThis();
    calculationQueryBuilder.where.mockReturnThis();
    calculationQueryBuilder.andWhere.mockReturnThis();
    calculationQueryBuilder.getMany.mockResolvedValue([]);

    calculationRepository.create.mockImplementation(
      (value) => value as unknown as Calculation,
    );
    calculationRepository.save.mockImplementation(
      async (value) =>
        ({
          id: "calculation-1",
          ...value,
        }) as Calculation,
    );
    calculationItemRepository.save.mockResolvedValue({} as CalculationItem);
    pricelistItemRepository.findOne.mockResolvedValue(null);
    caseRepository.findOne.mockResolvedValue(null);
    clientRepository.findOne.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should generate case-based calculation numbers with shared sequential index and income suffix", async () => {
    caseRepository.findOne.mockResolvedValue({
      id: "case-1",
      tenantId,
      clientId: "client-1",
      caseNumber: "007/002",
    } as Case);
    clientRepository.findOne.mockResolvedValue({
      id: "client-1",
      tenantId,
      metadata: { client_number: "007" },
    } as unknown as Client);
    calculationQueryBuilder.getMany.mockResolvedValue([
      { number: "007/002/01-П" } as Calculation,
      { number: "007/002/02-В" } as Calculation,
      { number: "CALC-2026-03-0001" } as Calculation,
    ]);

    const created = await service.create(tenantId, userId, {
      caseId: "case-1",
      name: "Прибуткова операція",
      calculationDate: "2026-03-11",
      items: [
        {
          description: "Послуга",
          quantity: 1,
          unitPrice: 1000,
        },
      ],
      metadata: {
        clientId: "client-1",
        operationType: "income",
      },
    });

    expect(caseRepository.findOne).toHaveBeenCalledWith({
      where: {
        id: "case-1",
        tenantId,
        deletedAt: IsNull(),
      },
    });
    expect(calculationQueryBuilder.andWhere).toHaveBeenCalledWith(
      "calculation.caseId = :caseId",
      { caseId: "case-1" },
    );
    expect(calculationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        number: "007/002/03-П",
      }),
    );
    expect(created.number).toBe("007/002/03-П");
  });

  it("should generate client-only numbers with 000 case sequence and expense suffix", async () => {
    clientRepository.findOne.mockResolvedValue({
      id: "client-1",
      tenantId,
      metadata: { client_number: "007" },
    } as unknown as Client);
    calculationQueryBuilder.getMany.mockResolvedValue([
      { number: "007/000/01-П" } as Calculation,
      { number: "008/000/04-В" } as Calculation,
      { number: "000/000/02-В" } as Calculation,
    ]);

    const created = await service.create(tenantId, userId, {
      name: "Видаткова операція",
      calculationDate: "2026-03-11",
      items: [
        {
          description: "Оренда",
          quantity: 1,
          unitPrice: 500,
        },
      ],
      metadata: {
        clientId: "client-1",
        operationType: "expense",
      },
    });

    expect(calculationQueryBuilder.andWhere).toHaveBeenCalledWith(
      "calculation.caseId IS NULL",
    );
    expect(calculationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        number: "007/000/02-В",
      }),
    );
    expect(created.number).toBe("007/000/02-В");
  });

  it("should keep self-accounting flow by falling back to 000/000 bucket", async () => {
    calculationQueryBuilder.getMany.mockResolvedValue([
      { number: "000/000/01-П" } as Calculation,
      { number: "007/000/03-В" } as Calculation,
    ]);

    const created = await service.create(tenantId, userId, {
      name: "Видаткова операція",
      calculationDate: "2026-03-11",
      items: [
        {
          description: "Канцелярія",
          quantity: 1,
          unitPrice: 250,
        },
      ],
      metadata: {
        subjectType: "self",
        operationType: "expense",
      },
    });

    expect(calculationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        number: "000/000/02-В",
      }),
    );
    expect(created.number).toBe("000/000/02-В");
  });

  it("should reject creation when selected client does not match selected case", async () => {
    caseRepository.findOne.mockResolvedValue({
      id: "case-1",
      tenantId,
      clientId: "client-1",
      caseNumber: "007/002",
    } as Case);

    await expect(
      service.create(tenantId, userId, {
        caseId: "case-1",
        name: "Прибуткова операція",
        calculationDate: "2026-03-11",
        items: [
          {
            description: "Послуга",
            quantity: 1,
            unitPrice: 1000,
          },
        ],
        metadata: {
          clientId: "client-2",
          operationType: "income",
        },
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
