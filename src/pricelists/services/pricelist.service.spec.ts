import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PricelistService } from "./pricelist.service";
import { Pricelist } from "../../database/entities/Pricelist.entity";
import { PricelistCategory } from "../../database/entities/PricelistCategory.entity";
import { PricelistItem } from "../../database/entities/PricelistItem.entity";

describe("PricelistService", () => {
  let service: PricelistService;
  let pricelistRepository: jest.Mocked<Repository<Pricelist>>;
  let pricelistCategoryRepository: jest.Mocked<Repository<PricelistCategory>>;
  let pricelistItemRepository: jest.Mocked<Repository<PricelistItem>>;

  const tenantId = "tenant-1";
  const userId = "user-1";
  const pricelistId = "price-1";

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricelistService,
        {
          provide: getRepositoryToken(Pricelist),
          useValue: {
            createQueryBuilder: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PricelistCategory),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PricelistItem),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PricelistService>(PricelistService);
    pricelistRepository = module.get(getRepositoryToken(Pricelist));
    pricelistCategoryRepository = module.get(
      getRepositoryToken(PricelistCategory),
    );
    pricelistItemRepository = module.get(getRepositoryToken(PricelistItem));

    pricelistRepository.create.mockImplementation(
      (value) => value as Pricelist,
    );
    pricelistCategoryRepository.create.mockImplementation(
      (value) => value as PricelistCategory,
    );
    pricelistItemRepository.create.mockImplementation(
      (value) => value as PricelistItem,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("deleteCategory", () => {
    it("should recursively soft delete descendant categories", async () => {
      pricelistCategoryRepository.findOne.mockResolvedValue({
        id: "root",
        tenantId,
        pricelistId,
        parentId: null,
      } as PricelistCategory);
      pricelistCategoryRepository.find.mockResolvedValue([
        {
          id: "root",
          tenantId,
          pricelistId,
          parentId: null,
          displayOrder: 0,
        },
        {
          id: "child",
          tenantId,
          pricelistId,
          parentId: "root",
          displayOrder: 0,
        },
        {
          id: "grandchild",
          tenantId,
          pricelistId,
          parentId: "child",
          displayOrder: 0,
        },
      ] as PricelistCategory[]);
      pricelistCategoryRepository.update.mockResolvedValue({} as any);

      await service.deleteCategory(tenantId, "root", userId);

      expect(pricelistCategoryRepository.update).toHaveBeenCalledTimes(3);
      expect(pricelistCategoryRepository.update).toHaveBeenNthCalledWith(
        1,
        { id: "root", tenantId },
        expect.objectContaining({
          deletedAt: expect.any(Date),
          updatedBy: userId,
        }),
      );
      expect(pricelistCategoryRepository.update).toHaveBeenNthCalledWith(
        2,
        { id: "child", tenantId },
        expect.objectContaining({
          deletedAt: expect.any(Date),
          updatedBy: userId,
        }),
      );
      expect(pricelistCategoryRepository.update).toHaveBeenNthCalledWith(
        3,
        { id: "grandchild", tenantId },
        expect.objectContaining({
          deletedAt: expect.any(Date),
          updatedBy: userId,
        }),
      );
    });
  });

  describe("duplicatePricelist", () => {
    it("should duplicate nested categories before items and remap parent ids", async () => {
      const originalPricelist = {
        id: pricelistId,
        tenantId,
        name: "Original",
        description: "Desc",
        type: "general",
        status: "active",
        isDefault: true,
        roundingRule: "none",
        roundingPrecision: 2,
        vatRate: 0.2,
        vatIncluded: true,
        discountEnabled: false,
        discountType: null,
        discountValue: null,
        metadata: { currency: "UAH" },
        categories: [
          {
            id: "cat-root",
            name: "Root",
            parentId: null,
            displayOrder: 0,
            metadata: { pathSegments: ["Root"] },
          },
          {
            id: "cat-child",
            name: "Child",
            parentId: "cat-root",
            displayOrder: 1,
            metadata: { pathSegments: ["Root", "Child"] },
          },
        ],
        items: [
          {
            id: "item-1",
            name: "Service",
            code: "svc",
            category: "Root > Child",
            unitType: "fixed",
            basePrice: 1000,
            description: "Service description",
            defaultDuration: null,
            unit: null,
            minQuantity: null,
            currency: "UAH",
            isActive: true,
            displayOrder: 0,
            metadata: { note: "note" },
          },
        ],
      } as unknown as Pricelist;

      const duplicatedBase = {
        id: "duplicate-1",
        tenantId,
        name: "Original (Копія)",
        categories: [],
        items: [],
      } as unknown as Pricelist;

      const duplicatedFinal = {
        ...duplicatedBase,
        categories: [
          {
            id: "dup-root",
            parentId: null,
          },
          {
            id: "dup-child",
            parentId: "dup-root",
          },
        ],
        items: [
          {
            id: "dup-item",
          },
        ],
      } as unknown as Pricelist;

      const findByIdSpy = jest
        .spyOn(service, "findById")
        .mockResolvedValueOnce(originalPricelist)
        .mockResolvedValueOnce(duplicatedFinal);
      const createSpy = jest
        .spyOn(service, "create")
        .mockResolvedValue(duplicatedBase);
      const addCategorySpy = jest
        .spyOn(service, "addCategory")
        .mockResolvedValueOnce({
          id: "dup-root",
        } as PricelistCategory)
        .mockResolvedValueOnce({
          id: "dup-child",
        } as PricelistCategory);
      const addItemSpy = jest
        .spyOn(service, "addItem")
        .mockResolvedValue({ id: "dup-item" } as PricelistItem);

      const result = await service.duplicatePricelist(
        tenantId,
        userId,
        pricelistId,
      );

      expect(createSpy).toHaveBeenCalledWith(
        tenantId,
        userId,
        expect.objectContaining({
          name: "Original (Копія)",
          isDefault: false,
        }),
      );
      expect(addCategorySpy).toHaveBeenNthCalledWith(
        1,
        tenantId,
        userId,
        "duplicate-1",
        expect.objectContaining({
          name: "Root",
          parentId: undefined,
        }),
      );
      expect(addCategorySpy).toHaveBeenNthCalledWith(
        2,
        tenantId,
        userId,
        "duplicate-1",
        expect.objectContaining({
          name: "Child",
          parentId: "dup-root",
        }),
      );
      expect(addItemSpy).toHaveBeenCalledWith(
        tenantId,
        userId,
        "duplicate-1",
        expect.objectContaining({
          name: "Service",
          category: "Root > Child",
        }),
      );
      expect(findByIdSpy).toHaveBeenCalledTimes(2);
      expect(result).toBe(duplicatedFinal);
    });
  });
});
