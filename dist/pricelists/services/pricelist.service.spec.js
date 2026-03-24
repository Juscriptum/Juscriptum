"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _testing = require("@nestjs/testing");
const _typeorm = require("@nestjs/typeorm");
const _pricelistservice = require("./pricelist.service");
const _Pricelistentity = require("../../database/entities/Pricelist.entity");
const _PricelistCategoryentity = require("../../database/entities/PricelistCategory.entity");
const _PricelistItementity = require("../../database/entities/PricelistItem.entity");
describe("PricelistService", ()=>{
    let service;
    let pricelistRepository;
    let pricelistCategoryRepository;
    let pricelistItemRepository;
    const tenantId = "tenant-1";
    const userId = "user-1";
    const pricelistId = "price-1";
    beforeEach(async ()=>{
        const module = await _testing.Test.createTestingModule({
            providers: [
                _pricelistservice.PricelistService,
                {
                    provide: (0, _typeorm.getRepositoryToken)(_Pricelistentity.Pricelist),
                    useValue: {
                        createQueryBuilder: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                        update: jest.fn()
                    }
                },
                {
                    provide: (0, _typeorm.getRepositoryToken)(_PricelistCategoryentity.PricelistCategory),
                    useValue: {
                        findOne: jest.fn(),
                        find: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                        update: jest.fn()
                    }
                },
                {
                    provide: (0, _typeorm.getRepositoryToken)(_PricelistItementity.PricelistItem),
                    useValue: {
                        findOne: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                        delete: jest.fn(),
                        createQueryBuilder: jest.fn()
                    }
                }
            ]
        }).compile();
        service = module.get(_pricelistservice.PricelistService);
        pricelistRepository = module.get((0, _typeorm.getRepositoryToken)(_Pricelistentity.Pricelist));
        pricelistCategoryRepository = module.get((0, _typeorm.getRepositoryToken)(_PricelistCategoryentity.PricelistCategory));
        pricelistItemRepository = module.get((0, _typeorm.getRepositoryToken)(_PricelistItementity.PricelistItem));
        pricelistRepository.create.mockImplementation((value)=>value);
        pricelistCategoryRepository.create.mockImplementation((value)=>value);
        pricelistItemRepository.create.mockImplementation((value)=>value);
    });
    afterEach(()=>{
        jest.clearAllMocks();
    });
    describe("deleteCategory", ()=>{
        it("should recursively soft delete descendant categories", async ()=>{
            pricelistCategoryRepository.findOne.mockResolvedValue({
                id: "root",
                tenantId,
                pricelistId,
                parentId: null
            });
            pricelistCategoryRepository.find.mockResolvedValue([
                {
                    id: "root",
                    tenantId,
                    pricelistId,
                    parentId: null,
                    displayOrder: 0
                },
                {
                    id: "child",
                    tenantId,
                    pricelistId,
                    parentId: "root",
                    displayOrder: 0
                },
                {
                    id: "grandchild",
                    tenantId,
                    pricelistId,
                    parentId: "child",
                    displayOrder: 0
                }
            ]);
            pricelistCategoryRepository.update.mockResolvedValue({});
            await service.deleteCategory(tenantId, "root", userId);
            expect(pricelistCategoryRepository.update).toHaveBeenCalledTimes(3);
            expect(pricelistCategoryRepository.update).toHaveBeenNthCalledWith(1, {
                id: "root",
                tenantId
            }, expect.objectContaining({
                deletedAt: expect.any(Date),
                updatedBy: userId
            }));
            expect(pricelistCategoryRepository.update).toHaveBeenNthCalledWith(2, {
                id: "child",
                tenantId
            }, expect.objectContaining({
                deletedAt: expect.any(Date),
                updatedBy: userId
            }));
            expect(pricelistCategoryRepository.update).toHaveBeenNthCalledWith(3, {
                id: "grandchild",
                tenantId
            }, expect.objectContaining({
                deletedAt: expect.any(Date),
                updatedBy: userId
            }));
        });
    });
    describe("duplicatePricelist", ()=>{
        it("should duplicate nested categories before items and remap parent ids", async ()=>{
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
                metadata: {
                    currency: "UAH"
                },
                categories: [
                    {
                        id: "cat-root",
                        name: "Root",
                        parentId: null,
                        displayOrder: 0,
                        metadata: {
                            pathSegments: [
                                "Root"
                            ]
                        }
                    },
                    {
                        id: "cat-child",
                        name: "Child",
                        parentId: "cat-root",
                        displayOrder: 1,
                        metadata: {
                            pathSegments: [
                                "Root",
                                "Child"
                            ]
                        }
                    }
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
                        metadata: {
                            note: "note"
                        }
                    }
                ]
            };
            const duplicatedBase = {
                id: "duplicate-1",
                tenantId,
                name: "Original (Копія)",
                categories: [],
                items: []
            };
            const duplicatedFinal = {
                ...duplicatedBase,
                categories: [
                    {
                        id: "dup-root",
                        parentId: null
                    },
                    {
                        id: "dup-child",
                        parentId: "dup-root"
                    }
                ],
                items: [
                    {
                        id: "dup-item"
                    }
                ]
            };
            const findByIdSpy = jest.spyOn(service, "findById").mockResolvedValueOnce(originalPricelist).mockResolvedValueOnce(duplicatedFinal);
            const createSpy = jest.spyOn(service, "create").mockResolvedValue(duplicatedBase);
            const addCategorySpy = jest.spyOn(service, "addCategory").mockResolvedValueOnce({
                id: "dup-root"
            }).mockResolvedValueOnce({
                id: "dup-child"
            });
            const addItemSpy = jest.spyOn(service, "addItem").mockResolvedValue({
                id: "dup-item"
            });
            const result = await service.duplicatePricelist(tenantId, userId, pricelistId);
            expect(createSpy).toHaveBeenCalledWith(tenantId, userId, expect.objectContaining({
                name: "Original (Копія)",
                isDefault: false
            }));
            expect(addCategorySpy).toHaveBeenNthCalledWith(1, tenantId, userId, "duplicate-1", expect.objectContaining({
                name: "Root",
                parentId: undefined
            }));
            expect(addCategorySpy).toHaveBeenNthCalledWith(2, tenantId, userId, "duplicate-1", expect.objectContaining({
                name: "Child",
                parentId: "dup-root"
            }));
            expect(addItemSpy).toHaveBeenCalledWith(tenantId, userId, "duplicate-1", expect.objectContaining({
                name: "Service",
                category: "Root > Child"
            }));
            expect(findByIdSpy).toHaveBeenCalledTimes(2);
            expect(result).toBe(duplicatedFinal);
        });
    });
});

//# sourceMappingURL=pricelist.service.spec.js.map