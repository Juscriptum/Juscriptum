import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import { Pricelist } from "../../database/entities/Pricelist.entity";
import { PricelistCategory } from "../../database/entities/PricelistCategory.entity";
import { PricelistItem } from "../../database/entities/PricelistItem.entity";
import {
  CreatePricelistCategoryDto,
  CreatePricelistDto,
  CreatePricelistItemDto,
  PricelistFiltersDto,
  UpdatePricelistCategoryDto,
  UpdatePricelistDto,
  UpdatePricelistItemDto,
} from "../dto/pricelist.dto";

@Injectable()
export class PricelistService {
  constructor(
    @InjectRepository(Pricelist)
    private readonly pricelistRepository: Repository<Pricelist>,
    @InjectRepository(PricelistCategory)
    private readonly pricelistCategoryRepository: Repository<PricelistCategory>,
    @InjectRepository(PricelistItem)
    private readonly pricelistItemRepository: Repository<PricelistItem>,
  ) {}

  async findAll(
    tenantId: string,
    filters: PricelistFiltersDto = {},
  ): Promise<{
    data: Pricelist[];
    total: number;
    page: number;
    limit: number;
  }> {
    const query = this.pricelistRepository
      .createQueryBuilder("pricelist")
      .where("pricelist.tenantId = :tenantId AND pricelist.deletedAt IS NULL", {
        tenantId,
      });

    if (filters.type) {
      query.andWhere("pricelist.type = :type", { type: filters.type });
    }

    if (filters.status) {
      query.andWhere("pricelist.status = :status", { status: filters.status });
    }

    if (filters.isDefault !== undefined) {
      query.andWhere("pricelist.isDefault = :isDefault", {
        isDefault: filters.isDefault,
      });
    }

    if (filters.search) {
      query.andWhere("pricelist.name ILIKE :search", {
        search: `%${filters.search}%`,
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
      limit,
    };
  }

  async findById(tenantId: string, id: string): Promise<Pricelist> {
    const pricelist = await this.pricelistRepository.findOne({
      where: {
        id,
        tenantId,
        deletedAt: IsNull(),
      },
      relations: ["items", "categories"],
      order: {
        categories: {
          displayOrder: "ASC",
        },
        items: {
          displayOrder: "ASC",
        },
      },
    });

    if (!pricelist) {
      throw new NotFoundException("Прайс-лист не знайдено");
    }

    return pricelist;
  }

  async create(
    tenantId: string,
    userId: string,
    dto: CreatePricelistDto,
  ): Promise<Pricelist> {
    const pricelist = this.pricelistRepository.create({
      tenantId,
      ...dto,
      metadata: dto.metadata ?? {},
      createdBy: userId,
      updatedBy: userId,
    });

    return this.pricelistRepository.save(pricelist);
  }

  async update(
    tenantId: string,
    id: string,
    userId: string,
    dto: UpdatePricelistDto,
  ): Promise<Pricelist> {
    const pricelist = await this.findById(tenantId, id);

    Object.assign(pricelist, dto, {
      metadata: dto.metadata ?? pricelist.metadata ?? {},
      updatedBy: userId,
    });

    return this.pricelistRepository.save(pricelist);
  }

  async delete(tenantId: string, id: string, userId: string): Promise<void> {
    await this.findById(tenantId, id);

    await this.pricelistRepository.update(
      { id, tenantId },
      {
        deletedAt: new Date(),
        updatedBy: userId,
        status: "archived",
      },
    );
  }

  async addCategory(
    tenantId: string,
    userId: string,
    pricelistId: string,
    dto: CreatePricelistCategoryDto,
  ): Promise<PricelistCategory> {
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
      updatedBy: userId,
    });

    return this.pricelistCategoryRepository.save(category);
  }

  async updateCategory(
    tenantId: string,
    id: string,
    userId: string,
    dto: UpdatePricelistCategoryDto,
  ): Promise<PricelistCategory> {
    const category = await this.getCategoryById(tenantId, id);

    if (dto.parentId) {
      await this.getCategoryById(tenantId, dto.parentId);
    }

    Object.assign(category, dto, {
      parentId:
        dto.parentId === undefined ? category.parentId : (dto.parentId ?? null),
      metadata: dto.metadata ?? category.metadata ?? {},
      updatedBy: userId,
    });

    return this.pricelistCategoryRepository.save(category);
  }

  async deleteCategory(
    tenantId: string,
    id: string,
    userId: string,
  ): Promise<void> {
    await this.getCategoryById(tenantId, id);

    const categories = await this.pricelistCategoryRepository.find({
      where: {
        tenantId,
        deletedAt: IsNull(),
      },
      order: {
        displayOrder: "ASC",
      },
    });

    const idsToDelete = new Set<string>();

    const collectChildren = (parentId: string) => {
      idsToDelete.add(parentId);
      categories
        .filter((category) => category.parentId === parentId)
        .forEach((category) => collectChildren(category.id));
    };

    collectChildren(id);

    for (const categoryId of idsToDelete) {
      await this.pricelistCategoryRepository.update(
        { id: categoryId, tenantId },
        {
          deletedAt: new Date(),
          updatedBy: userId,
        },
      );
    }
  }

  async addItem(
    tenantId: string,
    userId: string,
    pricelistId: string,
    dto: CreatePricelistItemDto,
  ): Promise<PricelistItem> {
    const item = this.pricelistItemRepository.create({
      tenantId,
      pricelistId,
      ...dto,
      currency: dto.currency ?? "UAH",
      isActive: dto.isActive ?? true,
      displayOrder: dto.displayOrder ?? 0,
      metadata: dto.metadata ?? {},
      createdBy: userId,
      updatedBy: userId,
    });

    return this.pricelistItemRepository.save(item);
  }

  async updateItem(
    tenantId: string,
    id: string,
    userId: string,
    dto: UpdatePricelistItemDto,
  ): Promise<PricelistItem> {
    const item = await this.pricelistItemRepository.findOne({
      where: {
        id,
        tenantId,
        deletedAt: IsNull(),
      },
    });

    if (!item) {
      throw new NotFoundException("Позицію прайс-листа не знайдено");
    }

    Object.assign(item, dto, {
      metadata: dto.metadata ?? item.metadata ?? {},
      updatedBy: userId,
    });

    return this.pricelistItemRepository.save(item);
  }

  async deleteItem(
    tenantId: string,
    id: string,
    _userId: string,
  ): Promise<void> {
    await this.pricelistItemRepository.delete({
      id,
      tenantId,
    });
  }

  async getItemsByCategory(
    tenantId: string,
    category: string,
  ): Promise<PricelistItem[]> {
    return this.pricelistItemRepository
      .createQueryBuilder("item")
      .innerJoin("item.pricelist", "pricelist")
      .where(
        "pricelist.tenantId = :tenantId AND " +
          "item.category = :category AND " +
          "item.isActive = :isActive AND " +
          "pricelist.status = :status AND " +
          "pricelist.deletedAt IS NULL AND " +
          "item.deletedAt IS NULL",
        { tenantId, category, isActive: true, status: "active" },
      )
      .orderBy("item.displayOrder", "ASC")
      .getMany();
  }

  async getDefaultPricelist(tenantId: string): Promise<Pricelist | null> {
    return this.pricelistRepository.findOne({
      where: {
        tenantId,
        isDefault: true,
        status: "active",
        deletedAt: IsNull(),
      },
      relations: ["items", "categories"],
    });
  }

  async getCategoryById(
    tenantId: string,
    id: string,
  ): Promise<PricelistCategory> {
    const category = await this.pricelistCategoryRepository.findOne({
      where: {
        id,
        tenantId,
        deletedAt: IsNull(),
      },
    });

    if (!category) {
      throw new NotFoundException("Категорію прайс-листа не знайдено");
    }

    return category;
  }

  async duplicatePricelist(
    tenantId: string,
    userId: string,
    id: string,
  ): Promise<Pricelist> {
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
      metadata: original.metadata,
    });

    const categoryIdMap = new Map<string, string>();
    const categories = [...(original.categories || [])].sort(
      (left, right) => left.displayOrder - right.displayOrder,
    );

    for (const category of categories) {
      const duplicatedCategory = await this.addCategory(
        tenantId,
        userId,
        duplicated.id,
        {
          name: category.name,
          parentId: category.parentId
            ? categoryIdMap.get(category.parentId)
            : undefined,
          displayOrder: category.displayOrder,
          metadata: category.metadata,
        },
      );
      categoryIdMap.set(category.id, duplicatedCategory.id);
    }

    for (const item of original.items) {
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
        metadata: item.metadata,
      });
    }

    return this.findById(tenantId, duplicated.id);
  }
}
