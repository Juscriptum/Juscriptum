"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PricelistService", {
    enumerable: true,
    get: function() {
        return PricelistService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _Pricelistentity = require("../../database/entities/Pricelist.entity");
const _PricelistCategoryentity = require("../../database/entities/PricelistCategory.entity");
const _PricelistItementity = require("../../database/entities/PricelistItem.entity");
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
let PricelistService = class PricelistService {
    async findAll(tenantId, filters = {}) {
        const query = this.pricelistRepository.createQueryBuilder("pricelist").where("pricelist.tenantId = :tenantId AND pricelist.deletedAt IS NULL", {
            tenantId
        });
        if (filters.type) {
            query.andWhere("pricelist.type = :type", {
                type: filters.type
            });
        }
        if (filters.status) {
            query.andWhere("pricelist.status = :status", {
                status: filters.status
            });
        }
        if (filters.isDefault !== undefined) {
            query.andWhere("pricelist.isDefault = :isDefault", {
                isDefault: filters.isDefault
            });
        }
        if (filters.search) {
            query.andWhere("pricelist.name ILIKE :search", {
                search: `%${filters.search}%`
            });
        }
        query.orderBy("pricelist.createdAt", "DESC");
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;
        query.skip(skip).take(limit);
        query.leftJoinAndSelect("pricelist.items", "items");
        query.leftJoinAndSelect("pricelist.categories", "categories");
        const [data, total] = await query.getManyAndCount();
        return {
            data,
            total,
            page,
            limit
        };
    }
    async findById(tenantId, id) {
        const pricelist = await this.pricelistRepository.findOne({
            where: {
                id,
                tenantId,
                deletedAt: (0, _typeorm1.IsNull)()
            },
            relations: [
                "items",
                "categories"
            ],
            order: {
                categories: {
                    displayOrder: "ASC"
                },
                items: {
                    displayOrder: "ASC"
                }
            }
        });
        if (!pricelist) {
            throw new _common.NotFoundException("Прайс-лист не знайдено");
        }
        return pricelist;
    }
    async create(tenantId, userId, dto) {
        const pricelist = this.pricelistRepository.create({
            tenantId,
            ...dto,
            metadata: dto.metadata ?? {},
            createdBy: userId,
            updatedBy: userId
        });
        return this.pricelistRepository.save(pricelist);
    }
    async update(tenantId, id, userId, dto) {
        const pricelist = await this.findById(tenantId, id);
        Object.assign(pricelist, dto, {
            metadata: dto.metadata ?? pricelist.metadata ?? {},
            updatedBy: userId
        });
        return this.pricelistRepository.save(pricelist);
    }
    async delete(tenantId, id, userId) {
        await this.findById(tenantId, id);
        await this.pricelistRepository.update({
            id,
            tenantId
        }, {
            deletedAt: new Date(),
            updatedBy: userId,
            status: "archived"
        });
    }
    async addCategory(tenantId, userId, pricelistId, dto) {
        await this.findById(tenantId, pricelistId);
        if (dto.parentId) {
            await this.getCategoryById(tenantId, dto.parentId);
        }
        const category = this.pricelistCategoryRepository.create({
            tenantId,
            pricelistId,
            parentId: dto.parentId ?? null,
            name: dto.name,
            displayOrder: dto.displayOrder ?? 0,
            metadata: dto.metadata ?? {},
            createdBy: userId,
            updatedBy: userId
        });
        return this.pricelistCategoryRepository.save(category);
    }
    async updateCategory(tenantId, id, userId, dto) {
        const category = await this.getCategoryById(tenantId, id);
        if (dto.parentId) {
            await this.getCategoryById(tenantId, dto.parentId);
        }
        Object.assign(category, dto, {
            parentId: dto.parentId === undefined ? category.parentId : dto.parentId ?? null,
            metadata: dto.metadata ?? category.metadata ?? {},
            updatedBy: userId
        });
        return this.pricelistCategoryRepository.save(category);
    }
    async deleteCategory(tenantId, id, userId) {
        await this.getCategoryById(tenantId, id);
        const categories = await this.pricelistCategoryRepository.find({
            where: {
                tenantId,
                deletedAt: (0, _typeorm1.IsNull)()
            },
            order: {
                displayOrder: "ASC"
            }
        });
        const idsToDelete = new Set();
        const collectChildren = (parentId)=>{
            idsToDelete.add(parentId);
            categories.filter((category)=>category.parentId === parentId).forEach((category)=>collectChildren(category.id));
        };
        collectChildren(id);
        for (const categoryId of idsToDelete){
            await this.pricelistCategoryRepository.update({
                id: categoryId,
                tenantId
            }, {
                deletedAt: new Date(),
                updatedBy: userId
            });
        }
    }
    async addItem(tenantId, userId, pricelistId, dto) {
        const item = this.pricelistItemRepository.create({
            tenantId,
            pricelistId,
            ...dto,
            currency: dto.currency ?? "UAH",
            isActive: dto.isActive ?? true,
            displayOrder: dto.displayOrder ?? 0,
            metadata: dto.metadata ?? {},
            createdBy: userId,
            updatedBy: userId
        });
        return this.pricelistItemRepository.save(item);
    }
    async updateItem(tenantId, id, userId, dto) {
        const item = await this.pricelistItemRepository.findOne({
            where: {
                id,
                tenantId,
                deletedAt: (0, _typeorm1.IsNull)()
            }
        });
        if (!item) {
            throw new _common.NotFoundException("Позицію прайс-листа не знайдено");
        }
        Object.assign(item, dto, {
            metadata: dto.metadata ?? item.metadata ?? {},
            updatedBy: userId
        });
        return this.pricelistItemRepository.save(item);
    }
    async deleteItem(tenantId, id, _userId) {
        await this.pricelistItemRepository.delete({
            id,
            tenantId
        });
    }
    async getItemsByCategory(tenantId, category) {
        return this.pricelistItemRepository.createQueryBuilder("item").innerJoin("item.pricelist", "pricelist").where("pricelist.tenantId = :tenantId AND " + "item.category = :category AND " + "item.isActive = :isActive AND " + "pricelist.status = :status AND " + "pricelist.deletedAt IS NULL AND " + "item.deletedAt IS NULL", {
            tenantId,
            category,
            isActive: true,
            status: "active"
        }).orderBy("item.displayOrder", "ASC").getMany();
    }
    async getDefaultPricelist(tenantId) {
        return this.pricelistRepository.findOne({
            where: {
                tenantId,
                isDefault: true,
                status: "active",
                deletedAt: (0, _typeorm1.IsNull)()
            },
            relations: [
                "items",
                "categories"
            ]
        });
    }
    async getCategoryById(tenantId, id) {
        const category = await this.pricelistCategoryRepository.findOne({
            where: {
                id,
                tenantId,
                deletedAt: (0, _typeorm1.IsNull)()
            }
        });
        if (!category) {
            throw new _common.NotFoundException("Категорію прайс-листа не знайдено");
        }
        return category;
    }
    async duplicatePricelist(tenantId, userId, id) {
        const original = await this.findById(tenantId, id);
        const duplicated = await this.create(tenantId, userId, {
            name: `${original.name} (Копія)`,
            description: original.description,
            type: original.type,
            status: "active",
            isDefault: false,
            roundingRule: original.roundingRule,
            roundingPrecision: original.roundingPrecision,
            vatRate: original.vatRate,
            vatIncluded: original.vatIncluded,
            discountEnabled: original.discountEnabled,
            discountType: original.discountType || undefined,
            discountValue: original.discountValue,
            metadata: original.metadata
        });
        const categoryIdMap = new Map();
        const categories = [
            ...original.categories || []
        ].sort((left, right)=>left.displayOrder - right.displayOrder);
        for (const category of categories){
            const duplicatedCategory = await this.addCategory(tenantId, userId, duplicated.id, {
                name: category.name,
                parentId: category.parentId ? categoryIdMap.get(category.parentId) : undefined,
                displayOrder: category.displayOrder,
                metadata: category.metadata
            });
            categoryIdMap.set(category.id, duplicatedCategory.id);
        }
        for (const item of original.items){
            await this.addItem(tenantId, userId, duplicated.id, {
                name: item.name,
                code: item.code,
                category: item.category,
                unitType: item.unitType,
                basePrice: item.basePrice,
                description: item.description,
                defaultDuration: item.defaultDuration,
                unit: item.unit,
                minQuantity: item.minQuantity,
                currency: item.currency,
                isActive: item.isActive,
                displayOrder: item.displayOrder,
                metadata: item.metadata
            });
        }
        return this.findById(tenantId, duplicated.id);
    }
    constructor(pricelistRepository, pricelistCategoryRepository, pricelistItemRepository){
        this.pricelistRepository = pricelistRepository;
        this.pricelistCategoryRepository = pricelistCategoryRepository;
        this.pricelistItemRepository = pricelistItemRepository;
    }
};
PricelistService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_Pricelistentity.Pricelist)),
    _ts_param(1, (0, _typeorm.InjectRepository)(_PricelistCategoryentity.PricelistCategory)),
    _ts_param(2, (0, _typeorm.InjectRepository)(_PricelistItementity.PricelistItem)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository
    ])
], PricelistService);

//# sourceMappingURL=pricelist.service.js.map