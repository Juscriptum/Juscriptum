"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ClientService", {
    enumerable: true,
    get: function() {
        return ClientService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _Cliententity = require("../../database/entities/Client.entity");
const _Caseentity = require("../../database/entities/Case.entity");
const _Evententity = require("../../database/entities/Event.entity");
const _ClientNumberReleaseentity = require("../../database/entities/ClientNumberRelease.entity");
const _Organizationentity = require("../../database/entities/Organization.entity");
const _validationutil = require("../../common/utils/validation.util");
const _accesscontrol = require("../../common/security/access-control");
const _subscriptionlimits = require("../../common/security/subscription-limits");
const _piiprotection = require("../../common/security/pii-protection");
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
let ClientService = class ClientService {
    /**
   * Get all clients with filters
   */ async findAll(tenantId, filters = {}, actor) {
        if (actor) {
            (0, _accesscontrol.assertSameTenant)(actor, tenantId);
        }
        const query = this.clientRepository.createQueryBuilder("client").where("client.tenantId = :tenantId AND client.deletedAt IS NULL", {
            tenantId
        });
        const scopeCondition = (0, _accesscontrol.buildScopedQueryCondition)("client", actor, [
            "client.assignedUserId"
        ]);
        if (scopeCondition) {
            query.andWhere(scopeCondition.clause, scopeCondition.parameters);
        }
        // Search (name, email, phone)
        if (filters.search) {
            // Check for SQL injection
            if ((0, _validationutil.detectSqlInjection)(filters.search)) {
                throw new _common.ForbiddenException("Invalid search query");
            }
            const searchablePiiKind = (0, _piiprotection.detectSearchablePiiKind)(filters.search);
            query.andWhere(new _typeorm1.Brackets((searchQuery)=>{
                searchQuery.where("client.firstName ILIKE :search", {
                    search: `%${filters.search}%`
                }).orWhere("client.lastName ILIKE :search", {
                    search: `%${filters.search}%`
                }).orWhere("client.patronymic ILIKE :search", {
                    search: `%${filters.search}%`
                }).orWhere("CONCAT_WS(' ', client.lastName, client.firstName, client.patronymic) ILIKE :search", {
                    search: `%${filters.search}%`
                }).orWhere("client.companyName ILIKE :search", {
                    search: `%${filters.search}%`
                }).orWhere("CAST(client.metadata->>'client_number' AS TEXT) ILIKE :search", {
                    search: `%${filters.search}%`
                });
                if (searchablePiiKind === "email") {
                    searchQuery.orWhere("client.emailBlindIndex = :emailBlindIndex", {
                        emailBlindIndex: (0, _piiprotection.computeEmailBlindIndex)(filters.search, "client_email")
                    });
                }
                if (searchablePiiKind === "phone") {
                    searchQuery.orWhere("client.phoneBlindIndex = :phoneBlindIndex", {
                        phoneBlindIndex: (0, _piiprotection.computePhoneBlindIndex)(filters.search)
                    });
                }
                if (searchablePiiKind === "identifier") {
                    searchQuery.orWhere("client.edrpouBlindIndex = :edrpouBlindIndex", {
                        edrpouBlindIndex: (0, _piiprotection.computeIdentifierBlindIndex)(filters.search, "client_edrpou")
                    }).orWhere("client.innBlindIndex = :innBlindIndex", {
                        innBlindIndex: (0, _piiprotection.computeIdentifierBlindIndex)(filters.search, "client_inn")
                    });
                }
            }));
        }
        // Filter by type
        if (filters.type) {
            query.andWhere("client.type = :type", {
                type: filters.type
            });
        }
        // Filter by status
        if (filters.status) {
            query.andWhere("client.status = :status", {
                status: filters.status
            });
        }
        // Filter by assigned user
        if (filters.assignedUserId) {
            query.andWhere("client.assignedUserId = :assignedUserId", {
                assignedUserId: filters.assignedUserId
            });
        }
        // Filter by city
        if (filters.city) {
            query.andWhere("client.city = :city", {
                city: filters.city
            });
        }
        // Filter by region
        if (filters.region) {
            query.andWhere("client.region = :region", {
                region: filters.region
            });
        }
        // Filter by date range
        if (filters.createdAtFrom) {
            query.andWhere("client.createdAt >= :createdAtFrom", {
                createdAtFrom: new Date(filters.createdAtFrom)
            });
        }
        if (filters.createdAtTo) {
            query.andWhere("client.createdAt <= :createdAtTo", {
                createdAtTo: new Date(filters.createdAtTo)
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
            limit
        };
    }
    /**
   * Get client by ID
   */ async findById(tenantId, id, actor) {
        if (actor) {
            (0, _accesscontrol.assertSameTenant)(actor, tenantId);
        }
        const client = await this.clientRepository.findOne({
            where: {
                id,
                tenantId,
                deletedAt: (0, _typeorm1.IsNull)()
            },
            relations: [
                "assignedUser",
                "cases"
            ]
        });
        if (!client) {
            throw new _common.NotFoundException("Клієнта не знайдено");
        }
        if (actor) {
            (0, _accesscontrol.assertCanAccessRecord)(actor, client);
        }
        return client;
    }
    /**
   * Create new client
   */ async create(tenantId, userId, dto, actor) {
        if (actor) {
            (0, _accesscontrol.assertSameTenant)(actor, tenantId);
            (0, _accesscontrol.assertCanAssignToUser)(actor, dto.assignedUserId);
        }
        // Validate EDRPOU if provided
        if (dto.edrpou && !(0, _validationutil.validateEdrpou)(dto.edrpou)) {
            throw new _common.ForbiddenException("Невірний формат ЄДРПОУ");
        }
        // Validate INN if provided
        if (dto.inn && !(0, _validationutil.validateTaxNumber)(dto.inn)) {
            throw new _common.ForbiddenException("Невірний формат ІПН");
        }
        await this.ensureClientQuotaAvailable(tenantId, actor);
        return this.clientRepository.manager.transaction(async (manager)=>{
            const clientRepository = manager.getRepository(_Cliententity.Client);
            const clientNumberReleaseRepository = manager.getRepository(_ClientNumberReleaseentity.ClientNumberRelease);
            const clientNumber = await this.reserveNextClientNumber(tenantId, clientRepository, clientNumberReleaseRepository);
            const { createdAt, ...clientPayload } = dto;
            const client = clientRepository.create({
                tenantId,
                ...clientPayload,
                metadata: this.withClientNumber(clientPayload.metadata, clientNumber),
                accessScope: clientPayload.accessScope || "assigned",
                createdAt: createdAt ? new Date(createdAt) : undefined,
                createdBy: userId,
                updatedBy: userId
            });
            return clientRepository.save(client);
        });
    }
    /**
   * Update existing client
   */ async update(tenantId, id, userId, dto, actor) {
        const client = await this.findById(tenantId, id, actor);
        if (actor && dto.assignedUserId) {
            (0, _accesscontrol.assertCanAssignToUser)(actor, dto.assignedUserId);
        }
        // Validate EDRPOU if provided
        if (dto.edrpou && !(0, _validationutil.validateEdrpou)(dto.edrpou)) {
            throw new _common.ForbiddenException("Невірний формат ЄДРПОУ");
        }
        // Validate INN if provided
        if (dto.inn && !(0, _validationutil.validateTaxNumber)(dto.inn)) {
            throw new _common.ForbiddenException("Невірний формат ІПН");
        }
        const existingClientNumber = this.getClientNumberString(client.metadata);
        Object.assign(client, dto, {
            metadata: dto.metadata !== undefined ? this.withClientNumber(dto.metadata, existingClientNumber) : client.metadata,
            updatedBy: userId
        });
        if (dto.status === "archived" && client.status === "archived") {
            return this.clientRepository.manager.transaction(async (manager)=>{
                const clientRepository = manager.getRepository(_Cliententity.Client);
                const caseRepository = manager.getRepository(_Caseentity.Case);
                const eventRepository = manager.getRepository(_Evententity.Event);
                const relatedCaseIds = await this.getActiveClientCaseIds(caseRepository, tenantId, id);
                const savedClient = await clientRepository.save(client);
                await caseRepository.update({
                    tenantId,
                    clientId: id,
                    deletedAt: (0, _typeorm1.IsNull)()
                }, {
                    status: "archived",
                    updatedBy: userId
                });
                if (relatedCaseIds.length > 0) {
                    await eventRepository.update({
                        tenantId,
                        caseId: (0, _typeorm1.In)(relatedCaseIds),
                        deletedAt: (0, _typeorm1.IsNull)()
                    }, {
                        status: "archived",
                        updatedBy: userId
                    });
                }
                return savedClient;
            });
        }
        return this.clientRepository.save(client);
    }
    async getNextClientNumber(tenantId, actor) {
        if (actor) {
            (0, _accesscontrol.assertSameTenant)(actor, tenantId);
        }
        const clientNumber = await this.peekNextClientNumber(tenantId);
        return {
            clientNumber
        };
    }
    /**
   * Delete client (soft delete)
   */ async delete(tenantId, id, userId, dto = {}, actor) {
        const client = await this.findById(tenantId, id, actor);
        const clientNumberValue = this.getClientNumberValue(client.metadata);
        await this.clientRepository.manager.transaction(async (manager)=>{
            const clientRepository = manager.getRepository(_Cliententity.Client);
            const caseRepository = manager.getRepository(_Caseentity.Case);
            const eventRepository = manager.getRepository(_Evententity.Event);
            const clientNumberReleaseRepository = manager.getRepository(_ClientNumberReleaseentity.ClientNumberRelease);
            const deletedAt = new Date();
            const relatedCaseIds = await this.getActiveClientCaseIds(caseRepository, tenantId, id);
            if (dto.releaseClientNumber && clientNumberValue !== null) {
                const existingRelease = await clientNumberReleaseRepository.findOne({
                    where: {
                        tenantId,
                        clientNumber: clientNumberValue
                    }
                });
                if (!existingRelease) {
                    await clientNumberReleaseRepository.save(clientNumberReleaseRepository.create({
                        tenantId,
                        clientNumber: clientNumberValue,
                        releasedFromClientId: client.id
                    }));
                }
            }
            await clientRepository.update({
                id,
                tenantId
            }, {
                deletedAt,
                updatedBy: userId
            });
            await caseRepository.update({
                tenantId,
                clientId: id,
                deletedAt: (0, _typeorm1.IsNull)()
            }, {
                deletedAt,
                updatedBy: userId
            });
            if (relatedCaseIds.length > 0) {
                await eventRepository.update({
                    tenantId,
                    caseId: (0, _typeorm1.In)(relatedCaseIds),
                    deletedAt: (0, _typeorm1.IsNull)()
                }, {
                    deletedAt,
                    updatedBy: userId
                });
            }
        });
    }
    /**
   * Restore deleted client
   */ async restore(tenantId, id, userId, actor) {
        if (actor) {
            (0, _accesscontrol.assertSameTenant)(actor, tenantId);
        }
        const client = await this.findDeletedById(tenantId, id, actor);
        const clientNumberValue = this.getClientNumberValue(client.metadata);
        await this.ensureClientQuotaAvailable(tenantId, actor);
        await this.clientRepository.manager.transaction(async (manager)=>{
            const clientRepository = manager.getRepository(_Cliententity.Client);
            const clientNumberReleaseRepository = manager.getRepository(_ClientNumberReleaseentity.ClientNumberRelease);
            if (clientNumberValue !== null) {
                const releasedNumber = await clientNumberReleaseRepository.findOne({
                    where: {
                        tenantId,
                        clientNumber: clientNumberValue
                    }
                });
                if (releasedNumber) {
                    await clientNumberReleaseRepository.remove(releasedNumber);
                } else {
                    const activeClients = await clientRepository.createQueryBuilder("client").where("client.tenantId = :tenantId AND client.deletedAt IS NULL", {
                        tenantId
                    }).getMany();
                    const conflict = activeClients.some((activeClient)=>activeClient.id !== id && this.getClientNumberValue(activeClient.metadata) === clientNumberValue);
                    if (conflict) {
                        throw new _common.ConflictException(`Номер клієнта ${this.formatClientNumber(clientNumberValue)} вже перевикористано. Відновлення неможливе без ручного вирішення конфлікту.`);
                    }
                }
            }
            await clientRepository.update({
                id,
                tenantId
            }, {
                deletedAt: null,
                updatedBy: userId
            });
        });
        return this.findById(tenantId, id, actor);
    }
    /**
   * Bulk import clients
   */ async bulkImport(tenantId, userId, dtos, actor) {
        await this.ensureClientQuotaAvailable(tenantId, actor, dtos.length);
        const results = {
            success: 0,
            failed: 0,
            errors: []
        };
        for (const dto of dtos){
            try {
                await this.create(tenantId, userId, dto, actor);
                results.success++;
            } catch (error) {
                results.failed++;
                results.errors.push({
                    client: dto,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
        return results;
    }
    /**
   * Get client statistics
   */ async getStatistics(tenantId, actor) {
        if (actor) {
            (0, _accesscontrol.assertSameTenant)(actor, tenantId);
        }
        const scopeCondition = (0, _accesscontrol.buildScopedQueryCondition)("client", actor, [
            "client.assignedUserId"
        ]);
        const [total] = await this.clientRepository.createQueryBuilder("client").select("COUNT(*)").where("client.tenantId = :tenantId AND client.deletedAt IS NULL", {
            tenantId
        }).andWhere(scopeCondition?.clause || "1=1", scopeCondition?.parameters || {}).getRawMany();
        const [active] = await this.clientRepository.createQueryBuilder("client").select("COUNT(*)").where("client.tenantId = :tenantId AND client.status = :status AND client.deletedAt IS NULL", {
            tenantId,
            status: "active"
        }).andWhere(scopeCondition?.clause || "1=1", scopeCondition?.parameters || {}).getRawMany();
        const [inactive] = await this.clientRepository.createQueryBuilder("client").select("COUNT(*)").where("client.tenantId = :tenantId AND client.status = :status AND client.deletedAt IS NULL", {
            tenantId,
            status: "inactive"
        }).andWhere(scopeCondition?.clause || "1=1", scopeCondition?.parameters || {}).getRawMany();
        const [archived] = await this.clientRepository.createQueryBuilder("client").select("COUNT(*)").where("client.tenantId = :tenantId AND client.status = :status AND client.deletedAt IS NULL", {
            tenantId,
            status: "archived"
        }).andWhere(scopeCondition?.clause || "1=1", scopeCondition?.parameters || {}).getRawMany();
        const [individuals] = await this.clientRepository.createQueryBuilder("client").select("COUNT(*)").where("client.tenantId = :tenantId AND client.type = :type AND client.deletedAt IS NULL", {
            tenantId,
            type: "individual"
        }).andWhere(scopeCondition?.clause || "1=1", scopeCondition?.parameters || {}).getRawMany();
        const [legalEntities] = await this.clientRepository.createQueryBuilder("client").select("COUNT(*)").where("client.tenantId = :tenantId AND client.type = :type AND client.deletedAt IS NULL", {
            tenantId,
            type: "legal_entity"
        }).andWhere(scopeCondition?.clause || "1=1", scopeCondition?.parameters || {}).getRawMany();
        return {
            total: parseInt(total.count),
            active: parseInt(active.count),
            inactive: parseInt(inactive.count),
            archived: parseInt(archived.count),
            individuals: parseInt(individuals.count),
            legalEntities: parseInt(legalEntities.count)
        };
    }
    async findDeletedById(tenantId, id, actor) {
        if (actor) {
            (0, _accesscontrol.assertSameTenant)(actor, tenantId);
        }
        const client = await this.clientRepository.findOne({
            where: {
                id,
                tenantId
            },
            withDeleted: true,
            relations: [
                "assignedUser",
                "cases"
            ]
        });
        if (!client || !client.deletedAt) {
            throw new _common.NotFoundException("Видаленого клієнта не знайдено");
        }
        if (actor) {
            (0, _accesscontrol.assertCanAccessRecord)(actor, client);
        }
        return client;
    }
    async peekNextClientNumber(tenantId) {
        const releasedNumber = await this.clientNumberReleaseRepository.findOne({
            where: {
                tenantId
            },
            order: {
                clientNumber: "ASC"
            }
        });
        if (releasedNumber) {
            return this.formatClientNumber(releasedNumber.clientNumber);
        }
        const maxNumber = await this.getMaxClientNumber(tenantId, this.clientRepository);
        return this.formatClientNumber(maxNumber + 1);
    }
    async reserveNextClientNumber(tenantId, clientRepository, clientNumberReleaseRepository) {
        const releasedNumber = await clientNumberReleaseRepository.findOne({
            where: {
                tenantId
            },
            order: {
                clientNumber: "ASC"
            }
        });
        if (releasedNumber) {
            await clientNumberReleaseRepository.remove(releasedNumber);
            return this.formatClientNumber(releasedNumber.clientNumber);
        }
        const maxNumber = await this.getMaxClientNumber(tenantId, clientRepository);
        return this.formatClientNumber(maxNumber + 1);
    }
    async getMaxClientNumber(tenantId, clientRepository) {
        const clients = await clientRepository.createQueryBuilder("client").withDeleted().where("client.tenantId = :tenantId", {
            tenantId
        }).getMany();
        return clients.reduce((maxValue, client)=>{
            const numericValue = this.getClientNumberValue(client.metadata);
            return numericValue !== null && numericValue > maxValue ? numericValue : maxValue;
        }, 0);
    }
    async getActiveClientCaseIds(caseRepository, tenantId, clientId) {
        const relatedCases = await caseRepository.find({
            where: {
                tenantId,
                clientId,
                deletedAt: (0, _typeorm1.IsNull)()
            },
            select: [
                "id"
            ]
        });
        return relatedCases.map((caseItem)=>caseItem.id);
    }
    getClientNumberString(metadata) {
        const rawValue = metadata?.client_number;
        if (typeof rawValue !== "string") {
            return undefined;
        }
        const trimmedValue = rawValue.trim();
        return trimmedValue.length > 0 ? trimmedValue : undefined;
    }
    getClientNumberValue(metadata) {
        const clientNumber = this.getClientNumberString(metadata);
        if (!clientNumber || !/^\d+$/.test(clientNumber)) {
            return null;
        }
        return Number.parseInt(clientNumber, 10);
    }
    formatClientNumber(value) {
        return String(value).padStart(3, "0");
    }
    withClientNumber(metadata, clientNumber) {
        return {
            ...metadata || {},
            ...clientNumber ? {
                client_number: clientNumber
            } : {}
        };
    }
    async ensureClientQuotaAvailable(tenantId, actor, requestedSlots = 1) {
        const plan = await this.resolveSubscriptionPlan(tenantId, actor);
        const limits = (0, _subscriptionlimits.getSubscriptionLimits)(plan);
        if (limits.maxClients === null) {
            return;
        }
        const activeClients = await this.clientRepository.count({
            where: {
                tenantId,
                deletedAt: (0, _typeorm1.IsNull)()
            }
        });
        if (activeClients + requestedSlots > limits.maxClients) {
            throw new _common.ForbiddenException(`Тариф ${plan} дозволяє максимум ${limits.maxClients} клієнт(ів). Потрібно оновити підписку.`);
        }
    }
    async resolveSubscriptionPlan(tenantId, actor) {
        if (actor?.subscription_plan) {
            return actor.subscription_plan;
        }
        const organization = await this.organizationRepository.findOne({
            where: {
                id: tenantId
            },
            select: [
                "subscriptionPlan"
            ]
        });
        return organization?.subscriptionPlan ?? "basic";
    }
    constructor(clientRepository, caseRepository, eventRepository, clientNumberReleaseRepository, organizationRepository){
        this.clientRepository = clientRepository;
        this.caseRepository = caseRepository;
        this.eventRepository = eventRepository;
        this.clientNumberReleaseRepository = clientNumberReleaseRepository;
        this.organizationRepository = organizationRepository;
    }
};
ClientService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_Cliententity.Client)),
    _ts_param(1, (0, _typeorm.InjectRepository)(_Caseentity.Case)),
    _ts_param(2, (0, _typeorm.InjectRepository)(_Evententity.Event)),
    _ts_param(3, (0, _typeorm.InjectRepository)(_ClientNumberReleaseentity.ClientNumberRelease)),
    _ts_param(4, (0, _typeorm.InjectRepository)(_Organizationentity.Organization)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository
    ])
], ClientService);

//# sourceMappingURL=client.service.js.map