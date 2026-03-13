import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";
import { Calculation } from "../../database/entities/Calculation.entity";
import { CalculationItem } from "../../database/entities/CalculationItem.entity";
import { Case } from "../../database/entities/Case.entity";
import { Client } from "../../database/entities/Client.entity";
import { PricelistItem } from "../../database/entities/PricelistItem.entity";
import {
  CreateCalculationDto,
  UpdateCalculationDto,
  CalculationFiltersDto,
  GeneratePdfDto,
  ApproveCalculationDto,
  RejectCalculationDto,
} from "../dto/calculation.dto";

/**
 * Calculation Service
 */
@Injectable()
export class CalculationService {
  constructor(
    @InjectRepository(Calculation)
    private readonly calculationRepository: Repository<Calculation>,
    @InjectRepository(CalculationItem)
    private readonly calculationItemRepository: Repository<CalculationItem>,
    @InjectRepository(PricelistItem)
    private readonly pricelistItemRepository: Repository<PricelistItem>,
    @InjectRepository(Case)
    private readonly caseRepository: Repository<Case>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  private async prepareCalculationItems(
    tenantId: string,
    itemsDto: CreateCalculationDto["items"],
  ): Promise<{
    items: Array<Partial<CalculationItem>>;
    subtotal: number;
    discountAmount: number;
    vatAmount: number;
    totalAmount: number;
  }> {
    let subtotal = 0;
    const items: Array<Partial<CalculationItem>> = [];

    for (const itemDto of itemsDto) {
      let unitPrice = itemDto.unitPrice;
      let lineTotal = 0;
      let unitType = itemDto.unitType || "piecewise";
      let quantity = itemDto.quantity || 1;
      let duration = itemDto.duration || 60;

      if (itemDto.pricelistItemId) {
        const pricelistItem = await this.pricelistItemRepository.findOne({
          where: {
            id: itemDto.pricelistItemId,
            tenantId,
            deletedAt: IsNull(),
          },
        });

        if (pricelistItem) {
          unitPrice = unitPrice ?? pricelistItem.basePrice;
          unitType = itemDto.unitType || pricelistItem.unitType || "piecewise";
          quantity = itemDto.quantity || pricelistItem.minQuantity || 1;
          duration = itemDto.duration || pricelistItem.defaultDuration || 60;

          if (!itemDto.description) {
            itemDto.description = pricelistItem.name;
          }
        }
      }

      unitPrice = unitPrice ?? 0;

      if (unitType === "hourly") {
        lineTotal = (unitPrice * duration) / 60;
      } else {
        lineTotal = unitPrice * quantity;
      }

      lineTotal = parseFloat(lineTotal.toFixed(2));
      subtotal += lineTotal;

      items.push({
        description: itemDto.description,
        pricelistItemId: itemDto.pricelistItemId,
        code: itemDto.code,
        unitType,
        quantity: unitType === "hourly" ? undefined : quantity,
        duration: unitType === "hourly" ? duration : undefined,
        unitPrice,
        lineTotal,
        vatRate: 0,
        vatAmount: 0,
      });
    }

    const discountAmount = 0;
    const vatAmount = 0;
    const totalAmount = subtotal;

    return {
      items,
      subtotal: parseFloat(subtotal.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      vatAmount: parseFloat(vatAmount.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
    };
  }

  /**
   * Get all calculations
   */
  async findAll(
    tenantId: string,
    filters: CalculationFiltersDto = {},
  ): Promise<{
    data: Calculation[];
    total: number;
    page: number;
    limit: number;
  }> {
    const query = this.calculationRepository
      .createQueryBuilder("calculation")
      .where(
        "calculation.tenantId = :tenantId AND calculation.deletedAt IS NULL",
        { tenantId },
      );

    // Filter by case
    if (filters.caseId) {
      query.andWhere("calculation.caseId = :caseId", {
        caseId: filters.caseId,
      });
    }

    // Filter by status
    if (filters.status) {
      query.andWhere("calculation.status = :status", {
        status: filters.status,
      });
    }

    // Filter by date range
    if (filters.calculationDateFrom && filters.calculationDateTo) {
      query.andWhere(
        "calculation.calculationDate BETWEEN :calculationDateFrom AND :calculationDateTo",
        {
          calculationDateFrom: new Date(filters.calculationDateFrom),
          calculationDateTo: new Date(filters.calculationDateTo),
        },
      );
    } else if (filters.calculationDateFrom) {
      query.andWhere("calculation.calculationDate >= :calculationDateFrom", {
        calculationDateFrom: new Date(filters.calculationDateFrom),
      });
    } else if (filters.calculationDateTo) {
      query.andWhere("calculation.calculationDate <= :calculationDateTo", {
        calculationDateTo: new Date(filters.calculationDateTo),
      });
    }

    // Search
    if (filters.search) {
      query.andWhere(
        "(calculation.name ILIKE :search OR " +
          "calculation.description ILIKE :search)",
        { search: `%${filters.search}%` },
      );
    }

    // Sorting
    const sortBy = filters.sortBy || "calculationDate";
    const sortOrder = filters.sortOrder || "DESC";
    query.orderBy(`calculation.${sortBy}`, sortOrder);

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    query.skip(skip).take(limit);

    // Include relations
    query.leftJoinAndSelect("calculation.case", "case");
    query.leftJoinAndSelect("calculation.items", "items");

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Get calculation by ID
   */
  async findById(tenantId: string, id: string): Promise<Calculation> {
    const calculation = await this.calculationRepository.findOne({
      where: {
        id,
        tenantId,
        deletedAt: IsNull(),
      },
      relations: ["items", "case", "approvedBy"],
    });

    if (!calculation) {
      throw new NotFoundException("Розрахунок не знайдено");
    }

    return calculation;
  }

  /**
   * Create calculation
   */
  async create(
    tenantId: string,
    userId: string,
    dto: CreateCalculationDto,
  ): Promise<Calculation> {
    // Generate calculation number
    const calculationNumber = await this.generateCalculationNumber(
      tenantId,
      dto,
    );

    const { items, subtotal, discountAmount, vatAmount, totalAmount } =
      await this.prepareCalculationItems(tenantId, dto.items);

    const calculation = this.calculationRepository.create({
      tenantId,
      caseId: dto.caseId,
      number: calculationNumber,
      name: dto.name,
      calculationDate: new Date(dto.calculationDate),
      dueDate: dto.dueDate
        ? new Date(dto.dueDate)
        : new Date(dto.calculationDate),
      description: dto.description,
      subtotal: parseFloat(subtotal.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      vatAmount: parseFloat(vatAmount.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      currency: "UAH",
      status: "draft",
      pricelistId: dto.pricelistId,
      internalNotes: dto.internalNotes,
      metadata: dto.metadata || {},
      createdBy: userId,
      updatedBy: userId,
    });

    const savedCalculation = await this.calculationRepository.save(calculation);

    // Save items
    for (const item of items) {
      await this.calculationItemRepository.save({
        ...item,
        calculationId: savedCalculation.id,
      });
    }

    return savedCalculation;
  }

  /**
   * Update calculation
   */
  async update(
    tenantId: string,
    id: string,
    userId: string,
    dto: UpdateCalculationDto,
  ): Promise<Calculation> {
    const calculation = await this.findById(tenantId, id);
    const hasItemUpdates = Array.isArray(dto.items);

    if (dto.caseId !== undefined) {
      calculation.caseId = dto.caseId;
    }

    if (dto.name !== undefined) {
      calculation.name = dto.name;
    }

    if (dto.calculationDate !== undefined) {
      calculation.calculationDate = new Date(dto.calculationDate);
    }

    if (dto.dueDate !== undefined) {
      calculation.dueDate = dto.dueDate
        ? new Date(dto.dueDate)
        : dto.calculationDate
          ? new Date(dto.calculationDate)
          : calculation.calculationDate;
    }

    if (dto.description !== undefined) {
      calculation.description = dto.description;
    }

    if (dto.pricelistId !== undefined) {
      calculation.pricelistId = dto.pricelistId;
    }

    if (dto.internalNotes !== undefined) {
      calculation.internalNotes = dto.internalNotes;
    }

    if (dto.status !== undefined) {
      calculation.status = dto.status;
    }

    if (dto.clientNotes !== undefined) {
      calculation.clientNotes = dto.clientNotes;
    }

    if (dto.metadata !== undefined) {
      calculation.metadata = dto.metadata;
    }

    if (hasItemUpdates && dto.items) {
      const prepared = await this.prepareCalculationItems(tenantId, dto.items);
      calculation.subtotal = prepared.subtotal;
      calculation.discountAmount = prepared.discountAmount;
      calculation.vatAmount = prepared.vatAmount;
      calculation.totalAmount = prepared.totalAmount;

      await this.calculationItemRepository.delete({
        calculationId: calculation.id,
      });

      for (const [index, item] of prepared.items.entries()) {
        await this.calculationItemRepository.save({
          ...item,
          calculationId: calculation.id,
          displayOrder: index,
        });
      }
    }

    calculation.updatedBy = userId;
    await this.calculationRepository.save(calculation);

    return this.findById(tenantId, id);
  }

  /**
   * Delete calculation (soft delete)
   */
  async delete(tenantId: string, id: string, userId: string): Promise<void> {
    const calculation = await this.findById(tenantId, id);

    await this.calculationRepository.update(
      { id, tenantId },
      {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    );
  }

  /**
   * Send for approval
   */
  async sendForApproval(
    tenantId: string,
    id: string,
    userId: string,
  ): Promise<Calculation> {
    const calculation = await this.findById(tenantId, id);

    if (calculation.status !== "draft") {
      throw new BadRequestException(
        "Тільки чернети можна відправити на затвердження",
      );
    }

    calculation.status = "pending_approval";
    calculation.updatedBy = userId;

    // TODO: Send notification to owner
    await this.calculationRepository.save(calculation);

    return calculation;
  }

  /**
   * Approve calculation
   */
  async approve(
    tenantId: string,
    id: string,
    userId: string,
    dto: ApproveCalculationDto,
  ): Promise<Calculation> {
    const calculation = await this.findById(tenantId, id);

    if (calculation.status !== "pending_approval") {
      throw new BadRequestException("Розрахунок не очікує затвердження");
    }

    calculation.status = "approved";
    calculation.approvedById = userId;
    calculation.updatedBy = userId;

    return this.calculationRepository.save(calculation);
  }

  /**
   * Reject calculation
   */
  async reject(
    tenantId: string,
    id: string,
    userId: string,
    dto: RejectCalculationDto,
  ): Promise<Calculation> {
    const calculation = await this.findById(tenantId, id);

    if (calculation.status !== "pending_approval") {
      throw new BadRequestException("Розрахунок не очікує затвердження");
    }

    calculation.status = "rejected";
    calculation.updatedBy = userId;

    // Add rejection reason to notes
    calculation.internalNotes = `[REJECTED] ${dto.reason}`;

    return this.calculationRepository.save(calculation);
  }

  /**
   * Generate PDF
   */
  async generatePdf(
    tenantId: string,
    id: string,
    dto: GeneratePdfDto,
  ): Promise<{ pdfUrl: string; pdfGeneratedAt: Date }> {
    const calculation = await this.findById(tenantId, id);

    // TODO: Generate PDF using template service
    const pdfUrl = `https://cdn.laworganizer.ua/calculations/${id}.pdf`;
    const pdfGeneratedAt = new Date();

    calculation.pdfUrl = pdfUrl;
    calculation.pdfGeneratedAt = pdfGeneratedAt;
    calculation.updatedBy = dto.userId ?? "system";

    await this.calculationRepository.save(calculation);

    return { pdfUrl, pdfGeneratedAt };
  }

  /**
   * Export calculation
   */
  async exportToExcel(tenantId: string, id: string): Promise<Buffer> {
    const calculation = await this.findById(tenantId, id);

    // TODO: Generate Excel export
    const excelData = Buffer.from("Excel data");

    return excelData;
  }

  /**
   * Get calculation statistics
   */
  async getStatistics(tenantId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    totalAmount: number;
    paidAmount: number;
    outstandingAmount: number;
  }> {
    const [total] = await this.calculationRepository
      .createQueryBuilder("calculation")
      .select("COUNT(*)")
      .where(
        "calculation.tenantId = :tenantId AND calculation.deletedAt IS NULL",
        { tenantId },
      )
      .getRawMany();

    const [byStatus] = await this.calculationRepository
      .createQueryBuilder("calculation")
      .select("calculation.status", "COUNT(*) as count")
      .where(
        "calculation.tenantId = :tenantId AND calculation.deletedAt IS NULL",
        { tenantId },
      )
      .groupBy("calculation.status")
      .getRawMany();

    const [totalAmount] = await this.calculationRepository
      .createQueryBuilder("calculation")
      .select("SUM(calculation.totalAmount)")
      .where(
        "calculation.tenantId = :tenantId AND calculation.deletedAt IS NULL",
        { tenantId },
      )
      .getRawMany();

    const [paidAmount] = await this.calculationRepository
      .createQueryBuilder("calculation")
      .select("SUM(calculation.paidAmount)")
      .where(
        "calculation.tenantId = :tenantId AND calculation.deletedAt IS NULL",
        { tenantId },
      )
      .getRawMany();

    const outstandingAmount =
      (totalAmount[0].sum || 0) - (paidAmount[0].sum || 0);

    return {
      total: parseInt(total[0].count),
      totalAmount: totalAmount[0].sum || 0,
      paidAmount: paidAmount[0].sum || 0,
      outstandingAmount,
      byStatus: byStatus.reduce(
        (
          acc: Record<string, number>,
          row: { status: string; count: string },
        ) => {
          acc[row.status] = parseInt(row.count);
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }

  /**
   * Generate calculation number
   */
  private async generateCalculationNumber(
    tenantId: string,
    dto: CreateCalculationDto,
  ): Promise<string> {
    const { caseId, caseSequence, clientNumber, operationSuffix } =
      await this.resolveNumberContext(tenantId, dto);
    const nextSequence = await this.getNextCalculationSequence(
      tenantId,
      caseId,
      clientNumber,
      caseSequence,
    );

    return `${clientNumber}/${caseSequence}/${String(nextSequence).padStart(2, "0")}-${operationSuffix}`;
  }

  private async resolveNumberContext(
    tenantId: string,
    dto: CreateCalculationDto,
  ): Promise<{
    caseId: string | null;
    caseSequence: string;
    clientNumber: string;
    operationSuffix: "П" | "В";
  }> {
    const operationType = this.resolveOperationType(dto);
    const metadataClientId =
      typeof dto.metadata?.clientId === "string"
        ? dto.metadata.clientId.trim()
        : "";

    if (dto.caseId) {
      const caseEntity = await this.caseRepository.findOne({
        where: {
          id: dto.caseId,
          tenantId,
          deletedAt: IsNull(),
        },
      });

      if (!caseEntity) {
        throw new NotFoundException(
          "Справу для формування номера розрахунку не знайдено",
        );
      }

      if (metadataClientId && caseEntity.clientId !== metadataClientId) {
        throw new BadRequestException(
          "Клієнт розрахунку не відповідає вибраній справі",
        );
      }

      const client = await this.clientRepository.findOne({
        where: {
          id: caseEntity.clientId,
          tenantId,
        },
        withDeleted: true,
      });

      if (!client) {
        throw new NotFoundException(
          "Клієнта справи для формування номера розрахунку не знайдено",
        );
      }

      const clientNumber = this.getClientNumber(client.metadata);
      return {
        caseId: caseEntity.id,
        caseSequence: this.getCaseSequence(caseEntity.caseNumber, clientNumber),
        clientNumber,
        operationSuffix: operationType === "income" ? "П" : "В",
      };
    }

    if (metadataClientId) {
      const client = await this.clientRepository.findOne({
        where: {
          id: metadataClientId,
          tenantId,
          deletedAt: IsNull(),
        },
      });

      if (!client) {
        throw new NotFoundException(
          "Клієнта для формування номера розрахунку не знайдено",
        );
      }

      return {
        caseId: null,
        caseSequence: "000",
        clientNumber: this.getClientNumber(client.metadata),
        operationSuffix: operationType === "income" ? "П" : "В",
      };
    }

    return {
      caseId: null,
      caseSequence: "000",
      clientNumber: "000",
      operationSuffix: operationType === "income" ? "П" : "В",
    };
  }

  private resolveOperationType(
    dto: CreateCalculationDto,
  ): "income" | "expense" {
    const metadataOperationType = dto.metadata?.operationType;

    if (
      metadataOperationType === "income" ||
      metadataOperationType === "expense"
    ) {
      return metadataOperationType;
    }

    return dto.pricelistId ? "income" : "expense";
  }

  private async getNextCalculationSequence(
    tenantId: string,
    caseId: string | null,
    clientNumber: string,
    caseSequence: string,
  ): Promise<number> {
    const query = this.calculationRepository
      .createQueryBuilder("calculation")
      .withDeleted()
      .where("calculation.tenantId = :tenantId", { tenantId });

    if (caseId) {
      query.andWhere("calculation.caseId = :caseId", { caseId });
    } else {
      query.andWhere("calculation.caseId IS NULL");
    }

    const calculations = await query.getMany();
    const maxSequence = calculations.reduce((maxValue, calculation) => {
      const sequence = this.parseCalculationSequence(
        calculation.number,
        clientNumber,
        caseSequence,
      );
      return sequence > maxValue ? sequence : maxValue;
    }, 0);

    return maxSequence + 1;
  }

  private getClientNumber(metadata?: Record<string, any> | null): string {
    const rawValue = metadata?.client_number;

    if (typeof rawValue !== "string" || !/^\d+$/.test(rawValue.trim())) {
      throw new NotFoundException(
        "У клієнта відсутній внутрішній номер для формування номера розрахунку",
      );
    }

    return rawValue.trim();
  }

  private getCaseSequence(
    caseNumber: string | undefined,
    clientNumber: string,
  ): string {
    if (!caseNumber) {
      throw new BadRequestException(
        "У справі відсутній внутрішній номер для формування номера розрахунку",
      );
    }

    const [caseClientNumber, sequencePart] = caseNumber.split("/");

    if (
      caseClientNumber !== clientNumber ||
      !sequencePart ||
      !/^\d+$/.test(sequencePart)
    ) {
      throw new BadRequestException(
        "Неможливо сформувати номер розрахунку через некоректний внутрішній номер справи",
      );
    }

    return sequencePart;
  }

  private parseCalculationSequence(
    calculationNumber: string | undefined,
    clientNumber: string,
    caseSequence: string,
  ): number {
    if (!calculationNumber) {
      return 0;
    }

    const [numberClient, numberCase, sequenceWithSuffix] =
      calculationNumber.split("/");

    if (
      numberClient !== clientNumber ||
      numberCase !== caseSequence ||
      !sequenceWithSuffix
    ) {
      return 0;
    }

    const match = sequenceWithSuffix.match(/^(\d+)-[ПВ]$/);
    return match ? Number.parseInt(match[1], 10) : 0;
  }
}
