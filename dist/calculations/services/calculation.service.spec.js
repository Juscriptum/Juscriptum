"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _common = require("@nestjs/common");
const _testing = require("@nestjs/testing");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _calculationservice = require("./calculation.service");
const _Calculationentity = require("../../database/entities/Calculation.entity");
const _CalculationItementity = require("../../database/entities/CalculationItem.entity");
const _PricelistItementity = require("../../database/entities/PricelistItem.entity");
const _Caseentity = require("../../database/entities/Case.entity");
const _Cliententity = require("../../database/entities/Client.entity");
describe("CalculationService", ()=>{
    let service;
    let calculationRepository;
    let calculationItemRepository;
    let pricelistItemRepository;
    let caseRepository;
    let clientRepository;
    const tenantId = "tenant-1";
    const userId = "user-1";
    const calculationQueryBuilder = {
        withDeleted: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn()
    };
    beforeEach(async ()=>{
        const module = await _testing.Test.createTestingModule({
            providers: [
                _calculationservice.CalculationService,
                {
                    provide: (0, _typeorm.getRepositoryToken)(_Calculationentity.Calculation),
                    useValue: {
                        createQueryBuilder: jest.fn().mockReturnValue(calculationQueryBuilder),
                        create: jest.fn(),
                        save: jest.fn(),
                        findOne: jest.fn(),
                        update: jest.fn()
                    }
                },
                {
                    provide: (0, _typeorm.getRepositoryToken)(_CalculationItementity.CalculationItem),
                    useValue: {
                        save: jest.fn()
                    }
                },
                {
                    provide: (0, _typeorm.getRepositoryToken)(_PricelistItementity.PricelistItem),
                    useValue: {
                        findOne: jest.fn()
                    }
                },
                {
                    provide: (0, _typeorm.getRepositoryToken)(_Caseentity.Case),
                    useValue: {
                        findOne: jest.fn()
                    }
                },
                {
                    provide: (0, _typeorm.getRepositoryToken)(_Cliententity.Client),
                    useValue: {
                        findOne: jest.fn()
                    }
                }
            ]
        }).compile();
        service = module.get(_calculationservice.CalculationService);
        calculationRepository = module.get((0, _typeorm.getRepositoryToken)(_Calculationentity.Calculation));
        calculationItemRepository = module.get((0, _typeorm.getRepositoryToken)(_CalculationItementity.CalculationItem));
        pricelistItemRepository = module.get((0, _typeorm.getRepositoryToken)(_PricelistItementity.PricelistItem));
        caseRepository = module.get((0, _typeorm.getRepositoryToken)(_Caseentity.Case));
        clientRepository = module.get((0, _typeorm.getRepositoryToken)(_Cliententity.Client));
        calculationQueryBuilder.withDeleted.mockReturnThis();
        calculationQueryBuilder.where.mockReturnThis();
        calculationQueryBuilder.andWhere.mockReturnThis();
        calculationQueryBuilder.getMany.mockResolvedValue([]);
        calculationRepository.create.mockImplementation((value)=>value);
        calculationRepository.save.mockImplementation(async (value)=>({
                id: "calculation-1",
                ...value
            }));
        calculationItemRepository.save.mockResolvedValue({});
        pricelistItemRepository.findOne.mockResolvedValue(null);
        caseRepository.findOne.mockResolvedValue(null);
        clientRepository.findOne.mockResolvedValue(null);
    });
    afterEach(()=>{
        jest.clearAllMocks();
    });
    it("should generate case-based calculation numbers with shared sequential index and income suffix", async ()=>{
        caseRepository.findOne.mockResolvedValue({
            id: "case-1",
            tenantId,
            clientId: "client-1",
            caseNumber: "007/002"
        });
        clientRepository.findOne.mockResolvedValue({
            id: "client-1",
            tenantId,
            metadata: {
                client_number: "007"
            }
        });
        calculationQueryBuilder.getMany.mockResolvedValue([
            {
                number: "007/002/01-П"
            },
            {
                number: "007/002/02-В"
            },
            {
                number: "CALC-2026-03-0001"
            }
        ]);
        const created = await service.create(tenantId, userId, {
            caseId: "case-1",
            name: "Прибуткова операція",
            calculationDate: "2026-03-11",
            items: [
                {
                    description: "Послуга",
                    quantity: 1,
                    unitPrice: 1000
                }
            ],
            metadata: {
                clientId: "client-1",
                operationType: "income"
            }
        });
        expect(caseRepository.findOne).toHaveBeenCalledWith({
            where: {
                id: "case-1",
                tenantId,
                deletedAt: (0, _typeorm1.IsNull)()
            }
        });
        expect(calculationQueryBuilder.andWhere).toHaveBeenCalledWith("calculation.caseId = :caseId", {
            caseId: "case-1"
        });
        expect(calculationRepository.create).toHaveBeenCalledWith(expect.objectContaining({
            number: "007/002/03-П"
        }));
        expect(created.number).toBe("007/002/03-П");
    });
    it("should generate client-only numbers with 000 case sequence and expense suffix", async ()=>{
        clientRepository.findOne.mockResolvedValue({
            id: "client-1",
            tenantId,
            metadata: {
                client_number: "007"
            }
        });
        calculationQueryBuilder.getMany.mockResolvedValue([
            {
                number: "007/000/01-П"
            },
            {
                number: "008/000/04-В"
            },
            {
                number: "000/000/02-В"
            }
        ]);
        const created = await service.create(tenantId, userId, {
            name: "Видаткова операція",
            calculationDate: "2026-03-11",
            items: [
                {
                    description: "Оренда",
                    quantity: 1,
                    unitPrice: 500
                }
            ],
            metadata: {
                clientId: "client-1",
                operationType: "expense"
            }
        });
        expect(calculationQueryBuilder.andWhere).toHaveBeenCalledWith("calculation.caseId IS NULL");
        expect(calculationRepository.create).toHaveBeenCalledWith(expect.objectContaining({
            number: "007/000/02-В"
        }));
        expect(created.number).toBe("007/000/02-В");
    });
    it("should keep self-accounting flow by falling back to 000/000 bucket", async ()=>{
        calculationQueryBuilder.getMany.mockResolvedValue([
            {
                number: "000/000/01-П"
            },
            {
                number: "007/000/03-В"
            }
        ]);
        const created = await service.create(tenantId, userId, {
            name: "Видаткова операція",
            calculationDate: "2026-03-11",
            items: [
                {
                    description: "Канцелярія",
                    quantity: 1,
                    unitPrice: 250
                }
            ],
            metadata: {
                subjectType: "self",
                operationType: "expense"
            }
        });
        expect(calculationRepository.create).toHaveBeenCalledWith(expect.objectContaining({
            number: "000/000/02-В"
        }));
        expect(created.number).toBe("000/000/02-В");
    });
    it("should reject creation when selected client does not match selected case", async ()=>{
        caseRepository.findOne.mockResolvedValue({
            id: "case-1",
            tenantId,
            clientId: "client-1",
            caseNumber: "007/002"
        });
        await expect(service.create(tenantId, userId, {
            caseId: "case-1",
            name: "Прибуткова операція",
            calculationDate: "2026-03-11",
            items: [
                {
                    description: "Послуга",
                    quantity: 1,
                    unitPrice: 1000
                }
            ],
            metadata: {
                clientId: "client-2",
                operationType: "income"
            }
        })).rejects.toThrow(_common.BadRequestException);
    });
});

//# sourceMappingURL=calculation.service.spec.js.map