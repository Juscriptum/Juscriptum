import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, Repository, IsNull } from "typeorm";
import { Client } from "../../database/entities/Client.entity";
import { Case } from "../../database/entities/Case.entity";
import { ClientNumberRelease } from "../../database/entities/ClientNumberRelease.entity";
import { Organization } from "../../database/entities/Organization.entity";
import {
  CreateClientDto,
  UpdateClientDto,
  ClientFiltersDto,
  DeleteClientDto,
} from "../dto/client.dto";
import {
  validateEdrpou,
  validateTaxNumber,
  detectSqlInjection,
} from "../../common/utils/validation.util";
import { JwtPayload } from "../../auth/interfaces/jwt.interface";
import {
  assertCanAccessRecord,
  assertCanAssignToUser,
  assertSameTenant,
  buildScopedQueryCondition,
} from "../../common/security/access-control";
import { getSubscriptionLimits } from "../../common/security/subscription-limits";
import {
  computeEmailBlindIndex,
  computeIdentifierBlindIndex,
  computePhoneBlindIndex,
  detectSearchablePiiKind,
} from "../../common/security/pii-protection";

/**
 * Client Service
 */
@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Case)
    private readonly caseRepository: Repository<Case>,
    @InjectRepository(ClientNumberRelease)
    private readonly clientNumberReleaseRepository: Repository<ClientNumberRelease>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  /**
   * Get all clients with filters
   */
  async findAll(
    tenantId: string,
    filters: ClientFiltersDto = {},
    actor?: JwtPayload,
  ): Promise<{ data: Client[]; total: number; page: number; limit: number }> {
    if (actor) {
      assertSameTenant(actor, tenantId);
    }

    const query = this.clientRepository
      .createQueryBuilder("client")
      .where("client.tenantId = :tenantId AND client.deletedAt IS NULL", {
        tenantId,
      });

    const scopeCondition = buildScopedQueryCondition("client", actor, [
      "client.assignedUserId",
    ]);

    if (scopeCondition) {
      query.andWhere(scopeCondition.clause, scopeCondition.parameters);
    }

    // Search (name, email, phone)
    if (filters.search) {
      // Check for SQL injection
      if (detectSqlInjection(filters.search)) {
        throw new ForbiddenException("Invalid search query");
      }

      const searchablePiiKind = detectSearchablePiiKind(filters.search);

      query.andWhere(
        new Brackets((searchQuery) => {
          searchQuery
            .where("client.firstName ILIKE :search", {
              search: `%${filters.search}%`,
            })
            .orWhere("client.lastName ILIKE :search", {
              search: `%${filters.search}%`,
            })
            .orWhere("client.patronymic ILIKE :search", {
              search: `%${filters.search}%`,
            })
            .orWhere(
              "CONCAT_WS(' ', client.lastName, client.firstName, client.patronymic) ILIKE :search",
              {
                search: `%${filters.search}%`,
              },
            )
            .orWhere("client.companyName ILIKE :search", {
              search: `%${filters.search}%`,
            })
            .orWhere(
              "CAST(client.metadata->>'client_number' AS TEXT) ILIKE :search",
              {
                search: `%${filters.search}%`,
              },
            );

          if (searchablePiiKind === "email") {
            searchQuery.orWhere("client.emailBlindIndex = :emailBlindIndex", {
              emailBlindIndex: computeEmailBlindIndex(
                filters.search,
                "client_email",
              ),
            });
          }

          if (searchablePiiKind === "phone") {
            searchQuery.orWhere("client.phoneBlindIndex = :phoneBlindIndex", {
              phoneBlindIndex: computePhoneBlindIndex(filters.search),
            });
          }

          if (searchablePiiKind === "identifier") {
            searchQuery
              .orWhere("client.edrpouBlindIndex = :edrpouBlindIndex", {
                edrpouBlindIndex: computeIdentifierBlindIndex(
                  filters.search,
                  "client_edrpou",
                ),
              })
              .orWhere("client.innBlindIndex = :innBlindIndex", {
                innBlindIndex: computeIdentifierBlindIndex(
                  filters.search,
                  "client_inn",
                ),
              });
          }
        }),
      );
    }

    // Filter by type
    if (filters.type) {
      query.andWhere("client.type = :type", { type: filters.type });
    }

    // Filter by status
    if (filters.status) {
      query.andWhere("client.status = :status", { status: filters.status });
    }

    // Filter by assigned user
    if (filters.assignedUserId) {
      query.andWhere("client.assignedUserId = :assignedUserId", {
        assignedUserId: filters.assignedUserId,
      });
    }

    // Filter by city
    if (filters.city) {
      query.andWhere("client.city = :city", { city: filters.city });
    }

    // Filter by region
    if (filters.region) {
      query.andWhere("client.region = :region", { region: filters.region });
    }

    // Filter by date range
    if (filters.createdAtFrom) {
      query.andWhere("client.createdAt >= :createdAtFrom", {
        createdAtFrom: new Date(filters.createdAtFrom),
      });
    }

    if (filters.createdAtTo) {
      query.andWhere("client.createdAt <= :createdAtTo", {
        createdAtTo: new Date(filters.createdAtTo),
      });
    }

    // Sorting
    const sortBy = filters.sortBy || "createdAt";
    const sortOrder = filters.sortOrder || "DESC";
    query.orderBy(`client.${sortBy}`, sortOrder);

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    query.skip(skip).take(limit);

    // Include relations
    query.leftJoinAndSelect("client.assignedUser", "assignedUser");

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Get client by ID
   */
  async findById(
    tenantId: string,
    id: string,
    actor?: JwtPayload,
  ): Promise<Client> {
    if (actor) {
      assertSameTenant(actor, tenantId);
    }

    const client = await this.clientRepository.findOne({
      where: {
        id,
        tenantId,
        deletedAt: IsNull(),
      },
      relations: ["assignedUser", "cases"],
    });

    if (!client) {
      throw new NotFoundException("Клієнта не знайдено");
    }

    if (actor) {
      assertCanAccessRecord(actor, client);
    }

    return client;
  }

  /**
   * Create new client
   */
  async create(
    tenantId: string,
    userId: string,
    dto: CreateClientDto,
    actor?: JwtPayload,
  ): Promise<Client> {
    if (actor) {
      assertSameTenant(actor, tenantId);
      assertCanAssignToUser(actor, dto.assignedUserId);
    }

    // Validate EDRPOU if provided
    if (dto.edrpou && !validateEdrpou(dto.edrpou)) {
      throw new ForbiddenException("Невірний формат ЄДРПОУ");
    }

    // Validate INN if provided
    if (dto.inn && !validateTaxNumber(dto.inn)) {
      throw new ForbiddenException("Невірний формат ІПН");
    }

    await this.ensureClientQuotaAvailable(tenantId, actor);

    return this.clientRepository.manager.transaction(async (manager) => {
      const clientRepository = manager.getRepository(Client);
      const clientNumberReleaseRepository =
        manager.getRepository(ClientNumberRelease);
      const clientNumber = await this.reserveNextClientNumber(
        tenantId,
        clientRepository,
        clientNumberReleaseRepository,
      );
      const { createdAt, ...clientPayload } = dto;

      const client = clientRepository.create({
        tenantId,
        ...clientPayload,
        metadata: this.withClientNumber(clientPayload.metadata, clientNumber),
        accessScope: clientPayload.accessScope || "assigned",
        createdAt: createdAt ? new Date(createdAt) : undefined,
        createdBy: userId,
        updatedBy: userId,
      });

      return clientRepository.save(client);
    });
  }

  /**
   * Update existing client
   */
  async update(
    tenantId: string,
    id: string,
    userId: string,
    dto: UpdateClientDto,
    actor?: JwtPayload,
  ): Promise<Client> {
    const client = await this.findById(tenantId, id, actor);

    if (actor && dto.assignedUserId) {
      assertCanAssignToUser(actor, dto.assignedUserId);
    }

    // Validate EDRPOU if provided
    if (dto.edrpou && !validateEdrpou(dto.edrpou)) {
      throw new ForbiddenException("Невірний формат ЄДРПОУ");
    }

    // Validate INN if provided
    if (dto.inn && !validateTaxNumber(dto.inn)) {
      throw new ForbiddenException("Невірний формат ІПН");
    }

    const existingClientNumber = this.getClientNumberString(client.metadata);
    Object.assign(client, dto, {
      metadata:
        dto.metadata !== undefined
          ? this.withClientNumber(dto.metadata, existingClientNumber)
          : client.metadata,
      updatedBy: userId,
    });

    if (dto.status === "archived" && client.status === "archived") {
      return this.clientRepository.manager.transaction(async (manager) => {
        const clientRepository = manager.getRepository(Client);
        const caseRepository = manager.getRepository(Case);

        const savedClient = await clientRepository.save(client);

        await caseRepository.update(
          {
            tenantId,
            clientId: id,
            deletedAt: IsNull(),
          },
          {
            status: "archived",
            updatedBy: userId,
          },
        );

        return savedClient;
      });
    }

    return this.clientRepository.save(client);
  }

  async getNextClientNumber(
    tenantId: string,
    actor?: JwtPayload,
  ): Promise<{ clientNumber: string }> {
    if (actor) {
      assertSameTenant(actor, tenantId);
    }

    const clientNumber = await this.peekNextClientNumber(tenantId);
    return { clientNumber };
  }

  /**
   * Delete client (soft delete)
   */
  async delete(
    tenantId: string,
    id: string,
    userId: string,
    dto: DeleteClientDto = {},
    actor?: JwtPayload,
  ): Promise<void> {
    const client = await this.findById(tenantId, id, actor);
    const clientNumberValue = this.getClientNumberValue(client.metadata);

    await this.clientRepository.manager.transaction(async (manager) => {
      const clientRepository = manager.getRepository(Client);
      const caseRepository = manager.getRepository(Case);
      const clientNumberReleaseRepository =
        manager.getRepository(ClientNumberRelease);
      const deletedAt = new Date();

      if (dto.releaseClientNumber && clientNumberValue !== null) {
        const existingRelease = await clientNumberReleaseRepository.findOne({
          where: {
            tenantId,
            clientNumber: clientNumberValue,
          },
        });

        if (!existingRelease) {
          await clientNumberReleaseRepository.save(
            clientNumberReleaseRepository.create({
              tenantId,
              clientNumber: clientNumberValue,
              releasedFromClientId: client.id,
            }),
          );
        }
      }

      await clientRepository.update(
        { id, tenantId },
        {
          deletedAt,
          updatedBy: userId,
        },
      );

      await caseRepository.update(
        {
          tenantId,
          clientId: id,
          deletedAt: IsNull(),
        },
        {
          deletedAt,
          updatedBy: userId,
        },
      );
    });
  }

  /**
   * Restore deleted client
   */
  async restore(
    tenantId: string,
    id: string,
    userId: string,
    actor?: JwtPayload,
  ): Promise<Client> {
    if (actor) {
      assertSameTenant(actor, tenantId);
    }

    const client = await this.findDeletedById(tenantId, id, actor);
    const clientNumberValue = this.getClientNumberValue(client.metadata);
    await this.ensureClientQuotaAvailable(tenantId, actor);

    await this.clientRepository.manager.transaction(async (manager) => {
      const clientRepository = manager.getRepository(Client);
      const clientNumberReleaseRepository =
        manager.getRepository(ClientNumberRelease);

      if (clientNumberValue !== null) {
        const releasedNumber = await clientNumberReleaseRepository.findOne({
          where: {
            tenantId,
            clientNumber: clientNumberValue,
          },
        });

        if (releasedNumber) {
          await clientNumberReleaseRepository.remove(releasedNumber);
        } else {
          const activeClients = await clientRepository
            .createQueryBuilder("client")
            .where("client.tenantId = :tenantId AND client.deletedAt IS NULL", {
              tenantId,
            })
            .getMany();

          const conflict = activeClients.some(
            (activeClient) =>
              activeClient.id !== id &&
              this.getClientNumberValue(activeClient.metadata) ===
                clientNumberValue,
          );

          if (conflict) {
            throw new ConflictException(
              `Номер клієнта ${this.formatClientNumber(clientNumberValue)} вже перевикористано. Відновлення неможливе без ручного вирішення конфлікту.`,
            );
          }
        }
      }

      await clientRepository.update(
        { id, tenantId },
        {
          deletedAt: null as any,
          updatedBy: userId,
        },
      );
    });

    return this.findById(tenantId, id, actor);
  }

  /**
   * Bulk import clients
   */
  async bulkImport(
    tenantId: string,
    userId: string,
    dtos: CreateClientDto[],
    actor?: JwtPayload,
  ): Promise<{ success: number; failed: number; errors: any[] }> {
    await this.ensureClientQuotaAvailable(tenantId, actor, dtos.length);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const dto of dtos) {
      try {
        await this.create(tenantId, userId, dto, actor);
        results.success++;
      } catch (error: unknown) {
        results.failed++;
        results.errors.push({
          client: dto,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  }

  /**
   * Get client statistics
   */
  async getStatistics(
    tenantId: string,
    actor?: JwtPayload,
  ): Promise<{
    total: number;
    active: number;
    inactive: number;
    archived: number;
    individuals: number;
    legalEntities: number;
  }> {
    if (actor) {
      assertSameTenant(actor, tenantId);
    }

    const scopeCondition = buildScopedQueryCondition("client", actor, [
      "client.assignedUserId",
    ]);
    const [total] = await this.clientRepository
      .createQueryBuilder("client")
      .select("COUNT(*)")
      .where("client.tenantId = :tenantId AND client.deletedAt IS NULL", {
        tenantId,
      })
      .andWhere(
        scopeCondition?.clause || "1=1",
        scopeCondition?.parameters || {},
      )
      .getRawMany();

    const [active] = await this.clientRepository
      .createQueryBuilder("client")
      .select("COUNT(*)")
      .where(
        "client.tenantId = :tenantId AND client.status = :status AND client.deletedAt IS NULL",
        {
          tenantId,
          status: "active",
        },
      )
      .andWhere(
        scopeCondition?.clause || "1=1",
        scopeCondition?.parameters || {},
      )
      .getRawMany();

    const [inactive] = await this.clientRepository
      .createQueryBuilder("client")
      .select("COUNT(*)")
      .where(
        "client.tenantId = :tenantId AND client.status = :status AND client.deletedAt IS NULL",
        {
          tenantId,
          status: "inactive",
        },
      )
      .andWhere(
        scopeCondition?.clause || "1=1",
        scopeCondition?.parameters || {},
      )
      .getRawMany();

    const [archived] = await this.clientRepository
      .createQueryBuilder("client")
      .select("COUNT(*)")
      .where(
        "client.tenantId = :tenantId AND client.status = :status AND client.deletedAt IS NULL",
        {
          tenantId,
          status: "archived",
        },
      )
      .andWhere(
        scopeCondition?.clause || "1=1",
        scopeCondition?.parameters || {},
      )
      .getRawMany();

    const [individuals] = await this.clientRepository
      .createQueryBuilder("client")
      .select("COUNT(*)")
      .where(
        "client.tenantId = :tenantId AND client.type = :type AND client.deletedAt IS NULL",
        {
          tenantId,
          type: "individual",
        },
      )
      .andWhere(
        scopeCondition?.clause || "1=1",
        scopeCondition?.parameters || {},
      )
      .getRawMany();

    const [legalEntities] = await this.clientRepository
      .createQueryBuilder("client")
      .select("COUNT(*)")
      .where(
        "client.tenantId = :tenantId AND client.type = :type AND client.deletedAt IS NULL",
        {
          tenantId,
          type: "legal_entity",
        },
      )
      .andWhere(
        scopeCondition?.clause || "1=1",
        scopeCondition?.parameters || {},
      )
      .getRawMany();

    return {
      total: parseInt(total.count),
      active: parseInt(active.count),
      inactive: parseInt(inactive.count),
      archived: parseInt(archived.count),
      individuals: parseInt(individuals.count),
      legalEntities: parseInt(legalEntities.count),
    };
  }

  private async findDeletedById(
    tenantId: string,
    id: string,
    actor?: JwtPayload,
  ): Promise<Client> {
    if (actor) {
      assertSameTenant(actor, tenantId);
    }

    const client = await this.clientRepository.findOne({
      where: {
        id,
        tenantId,
      },
      withDeleted: true,
      relations: ["assignedUser", "cases"],
    });

    if (!client || !client.deletedAt) {
      throw new NotFoundException("Видаленого клієнта не знайдено");
    }

    if (actor) {
      assertCanAccessRecord(actor, client);
    }

    return client;
  }

  private async peekNextClientNumber(tenantId: string): Promise<string> {
    const releasedNumber = await this.clientNumberReleaseRepository.findOne({
      where: { tenantId },
      order: { clientNumber: "ASC" },
    });

    if (releasedNumber) {
      return this.formatClientNumber(releasedNumber.clientNumber);
    }

    const maxNumber = await this.getMaxClientNumber(
      tenantId,
      this.clientRepository,
    );
    return this.formatClientNumber(maxNumber + 1);
  }

  private async reserveNextClientNumber(
    tenantId: string,
    clientRepository: Repository<Client>,
    clientNumberReleaseRepository: Repository<ClientNumberRelease>,
  ): Promise<string> {
    const releasedNumber = await clientNumberReleaseRepository.findOne({
      where: { tenantId },
      order: { clientNumber: "ASC" },
    });

    if (releasedNumber) {
      await clientNumberReleaseRepository.remove(releasedNumber);
      return this.formatClientNumber(releasedNumber.clientNumber);
    }

    const maxNumber = await this.getMaxClientNumber(tenantId, clientRepository);
    return this.formatClientNumber(maxNumber + 1);
  }

  private async getMaxClientNumber(
    tenantId: string,
    clientRepository: Repository<Client>,
  ): Promise<number> {
    const clients = await clientRepository
      .createQueryBuilder("client")
      .withDeleted()
      .where("client.tenantId = :tenantId", { tenantId })
      .getMany();

    return clients.reduce((maxValue, client) => {
      const numericValue = this.getClientNumberValue(client.metadata);
      return numericValue !== null && numericValue > maxValue
        ? numericValue
        : maxValue;
    }, 0);
  }

  private getClientNumberString(
    metadata?: Record<string, any> | null,
  ): string | undefined {
    const rawValue = metadata?.client_number;

    if (typeof rawValue !== "string") {
      return undefined;
    }

    const trimmedValue = rawValue.trim();
    return trimmedValue.length > 0 ? trimmedValue : undefined;
  }

  private getClientNumberValue(
    metadata?: Record<string, any> | null,
  ): number | null {
    const clientNumber = this.getClientNumberString(metadata);

    if (!clientNumber || !/^\d+$/.test(clientNumber)) {
      return null;
    }

    return Number.parseInt(clientNumber, 10);
  }

  private formatClientNumber(value: number): string {
    return String(value).padStart(3, "0");
  }

  private withClientNumber(
    metadata: Record<string, any> | undefined,
    clientNumber: string | undefined,
  ): Record<string, any> {
    return {
      ...(metadata || {}),
      ...(clientNumber ? { client_number: clientNumber } : {}),
    };
  }

  private async ensureClientQuotaAvailable(
    tenantId: string,
    actor?: JwtPayload,
    requestedSlots: number = 1,
  ): Promise<void> {
    const plan = await this.resolveSubscriptionPlan(tenantId, actor);
    const limits = getSubscriptionLimits(plan);

    if (limits.maxClients === null) {
      return;
    }

    const activeClients = await this.clientRepository.count({
      where: {
        tenantId,
        deletedAt: IsNull(),
      },
    });

    if (activeClients + requestedSlots > limits.maxClients) {
      throw new ForbiddenException(
        `Тариф ${plan} дозволяє максимум ${limits.maxClients} клієнт(ів). Потрібно оновити підписку.`,
      );
    }
  }

  private async resolveSubscriptionPlan(
    tenantId: string,
    actor?: JwtPayload,
  ): Promise<string> {
    if (actor?.subscription_plan) {
      return actor.subscription_plan;
    }

    const organization = await this.organizationRepository.findOne({
      where: { id: tenantId },
      select: ["subscriptionPlan"],
    });

    return organization?.subscriptionPlan ?? "basic";
  }
}
