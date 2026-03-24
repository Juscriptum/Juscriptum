"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CaseService", {
    enumerable: true,
    get: function() {
        return CaseService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _Caseentity = require("../../database/entities/Case.entity");
const _Cliententity = require("../../database/entities/Client.entity");
const _Organizationentity = require("../../database/entities/Organization.entity");
const _Evententity = require("../../database/entities/Event.entity");
const _validationutil = require("../../common/utils/validation.util");
const _accesscontrol = require("../../common/security/access-control");
const _subscriptionlimits = require("../../common/security/subscription-limits");
const _caseregistrysyncservice = require("./case-registry-sync.service");
const _courtregistryservice = require("../../clients/services/court-registry.service");
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
let CaseService = class CaseService {
    async getNextCaseNumber(tenantId, clientId, actor) {
        if (actor) {
            (0, _accesscontrol.assertSameTenant)(actor, tenantId);
        }
        const client = await this.getClientOrThrow(tenantId, clientId);
        const caseNumber = await this.peekNextCaseNumber(tenantId, clientId, client.metadata);
        return {
            caseNumber
        };
    }
    /**
   * Get all cases with filters
   */ async findAll(tenantId, filters = {}, actor) {
        if (actor) {
            (0, _accesscontrol.assertSameTenant)(actor, tenantId);
        }
        const query = this.caseRepository.createQueryBuilder("case").where("case.tenantId = :tenantId AND case.deletedAt IS NULL", {
            tenantId
        });
        const scopeCondition = (0, _accesscontrol.buildScopedQueryCondition)("case", actor, [
            "case.assignedLawyerId"
        ]);
        if (scopeCondition) {
            query.andWhere(scopeCondition.clause, scopeCondition.parameters);
        }
        // Filter by client
        if (filters.clientId) {
            query.andWhere("case.clientId = :clientId", {
                clientId: filters.clientId
            });
        }
        // Filter by assigned lawyer
        if (filters.assignedLawyerId) {
            query.andWhere("case.assignedLawyerId = :assignedLawyerId", {
                assignedLawyerId: filters.assignedLawyerId
            });
        }
        // Filter by case type
        if (filters.caseType) {
            query.andWhere("case.caseType = :caseType", {
                caseType: filters.caseType
            });
        }
        // Filter by priority
        if (filters.priority) {
            query.andWhere("case.priority = :priority", {
                priority: filters.priority
            });
        }
        // Filter by status
        if (filters.status) {
            query.andWhere("case.status = :status", {
                status: filters.status
            });
        }
        // Filter by start date range
        if (filters.startDateFrom && filters.startDateTo) {
            query.andWhere("case.startDate BETWEEN :startDateFrom AND :startDateTo", {
                startDateFrom: new Date(filters.startDateFrom),
                startDateTo: new Date(filters.startDateTo)
            });
        } else if (filters.startDateFrom) {
            query.andWhere("case.startDate >= :startDateFrom", {
                startDateFrom: new Date(filters.startDateFrom)
            });
        } else if (filters.startDateTo) {
            query.andWhere("case.startDate <= :startDateTo", {
                startDateTo: new Date(filters.startDateTo)
            });
        }
        // Filter by deadline range
        if (filters.deadlineFrom && filters.deadlineTo) {
            query.andWhere("case.deadlineDate BETWEEN :deadlineFrom AND :deadlineTo", {
                deadlineFrom: new Date(filters.deadlineFrom),
                deadlineTo: new Date(filters.deadlineTo)
            });
        } else if (filters.deadlineFrom) {
            query.andWhere("case.deadlineDate >= :deadlineFrom", {
                deadlineFrom: new Date(filters.deadlineFrom)
            });
        } else if (filters.deadlineTo) {
            query.andWhere("case.deadlineDate <= :deadlineTo", {
                deadlineTo: new Date(filters.deadlineTo)
            });
        }
        // Search
        if (filters.search) {
            if ((0, _validationutil.detectSqlInjection)(filters.search)) {
                throw new _common.ForbiddenException("Invalid search query");
            }
            query.andWhere("(LOWER(case.caseNumber) LIKE LOWER(:search) OR " + "LOWER(case.registryCaseNumber) LIKE LOWER(:search) OR " + "LOWER(case.title) LIKE LOWER(:search) OR " + "LOWER(case.description) LIKE LOWER(:search) OR " + "LOWER(case.courtName) LIKE LOWER(:search) OR " + "LOWER(case.judgeName) LIKE LOWER(:search) OR " + "LOWER(case.plaintiffName) LIKE LOWER(:search) OR " + "LOWER(case.defendantName) LIKE LOWER(:search) OR " + "LOWER(case.thirdParties) LIKE LOWER(:search) OR " + "LOWER(client.companyName) LIKE LOWER(:search) OR " + "LOWER(CONCAT_WS(' ', client.lastName, client.firstName, client.patronymic)) LIKE LOWER(:search))", {
                search: `%${filters.search}%`
            });
        }
        // Sorting
        const sortBy = filters.sortBy || "createdAt";
        const sortOrder = filters.sortOrder || "DESC";
        query.orderBy(`case.${sortBy}`, sortOrder);
        // Pagination
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;
        query.skip(skip).take(limit);
        // Include relations
        query.leftJoinAndSelect("case.client", "client");
        query.leftJoinAndSelect("case.assignedLawyer", "assignedLawyer");
        const [data, total] = await query.getManyAndCount();
        return {
            data,
            total,
            page,
            limit
        };
    }
    /**
   * Get case by ID
   */ async findById(tenantId, id, actor) {
        if (actor) {
            (0, _accesscontrol.assertSameTenant)(actor, tenantId);
        }
        const caseEntity = await this.caseRepository.findOne({
            where: {
                id,
                tenantId,
                deletedAt: (0, _typeorm1.IsNull)()
            },
            relations: [
                "client",
                "assignedLawyer",
                "documents",
                "events"
            ]
        });
        if (!caseEntity) {
            throw new _common.NotFoundException("Справу не знайдено");
        }
        if (actor) {
            (0, _accesscontrol.assertCanAccessRecord)(actor, caseEntity);
        }
        return caseEntity;
    }
    /**
   * Get case events in reverse chronological order.
   */ async getTimeline(tenantId, id, actor) {
        const caseEntity = await this.findById(tenantId, id, actor);
        // Keep the case events feed focused on events/stages only.
        const events = caseEntity.events || [];
        const registryStage = await this.getLatestRegistryStage(caseEntity, events);
        const timeline = [
            ...events.map((e)=>({
                    type: "event",
                    date: e.eventDate,
                    data: e
                })),
            ...registryStage ? [
                registryStage
            ] : []
        ].sort((a, b)=>new Date(b.date).getTime() - new Date(a.date).getTime());
        return timeline;
    }
    async getLatestRegistryStage(caseEntity, events) {
        const registryCaseNumber = (caseEntity.registryCaseNumber || "").trim();
        if (!registryCaseNumber) {
            return null;
        }
        try {
            const results = await this.courtRegistryService.searchInCourtRegistry({
                caseNumber: registryCaseNumber
            });
            const latestStage = this.selectLatestRegistryStage(results);
            if (!latestStage) {
                return null;
            }
            if (this.isRegistryStageDuplicatedByCourtDate(latestStage, events)) {
                return null;
            }
            return {
                type: "registry_stage",
                date: this.toTimelineDate(latestStage.stageDate),
                data: {
                    source: "court_registry",
                    title: latestStage.stageName || "Стадія розгляду",
                    description: [
                        `Дата: ${latestStage.stageDate || "не вказано"}`,
                        latestStage.courtName ? `Суд: ${latestStage.courtName}` : ""
                    ].filter(Boolean).join("\n"),
                    stageDate: latestStage.stageDate || "",
                    stageName: latestStage.stageName || "",
                    caseNumber: latestStage.caseNumber || "",
                    courtName: latestStage.courtName || ""
                }
            };
        } catch (error) {
            this.logger.warn(`Failed to extend case timeline with court registry stage for ${caseEntity.id}: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }
    selectLatestRegistryStage(results) {
        const uniqueResults = Array.from(new Map(results.filter((result)=>result.source === "court_registry" && ((result.stageDate || "").trim() || (result.stageName || "").trim())).map((result)=>[
                [
                    this.normalizeCaseNumber(result.caseNumber || ""),
                    this.normalizeMeaningfulText(result.stageDate || ""),
                    this.normalizeMeaningfulText(result.stageName || "")
                ].join("::"),
                result
            ])).values());
        if (uniqueResults.length === 0) {
            return null;
        }
        return uniqueResults.sort((left, right)=>{
            const rightTimestamp = this.parseRegistryDateValue(right.stageDate);
            const leftTimestamp = this.parseRegistryDateValue(left.stageDate);
            if (rightTimestamp !== leftTimestamp) {
                return rightTimestamp - leftTimestamp;
            }
            return (right.stageName || "").localeCompare(left.stageName || "", "uk-UA");
        })[0];
    }
    isRegistryStageDuplicatedByCourtDate(stage, events) {
        return events.some((event)=>{
            if (event.type !== "court_sitting") {
                return false;
            }
            if (event.participants?.syncSource !== "court_dates") {
                return false;
            }
            const eventTimestamp = this.getEventTimestamp(event);
            const stageTimestamp = this.getRegistryStageMeaningTimestamp(stage);
            if (eventTimestamp && stageTimestamp && eventTimestamp === stageTimestamp && this.stageNameContainsDate(stage.stageName || "", eventTimestamp)) {
                return true;
            }
            return this.normalizeMeaningfulText(event.title || "") === this.normalizeMeaningfulText(stage.stageName || "");
        });
    }
    getEventTimestamp(event) {
        const dateValue = typeof event.eventDate === "string" ? event.eventDate : event.eventDate instanceof Date ? event.eventDate.toISOString() : "";
        const baseDate = new Date(dateValue);
        if (Number.isNaN(baseDate.getTime())) {
            return null;
        }
        const [hours = "00", minutes = "00"] = String(event.eventTime || "00:00").split(":").slice(0, 2);
        const timestamp = Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate(), Number(hours), Number(minutes), 0, 0);
        return Number.isNaN(timestamp) ? null : timestamp;
    }
    stageNameContainsDate(value, timestamp) {
        const date = new Date(timestamp);
        const formattedDate = `${String(date.getUTCDate()).padStart(2, "0")}.${String(date.getUTCMonth() + 1).padStart(2, "0")}.${date.getUTCFullYear()}`;
        const formattedDateTime = `${formattedDate} ${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
        const normalizedValue = this.normalizeMeaningfulText(value);
        return normalizedValue.includes(this.normalizeMeaningfulText(formattedDate)) || normalizedValue.includes(this.normalizeMeaningfulText(formattedDateTime));
    }
    getRegistryStageMeaningTimestamp(stage) {
        const stageNameTimestamp = this.extractEmbeddedRegistryDateValue(stage.stageName || "");
        if (Number.isFinite(stageNameTimestamp)) {
            return stageNameTimestamp;
        }
        return this.parseRegistryDateValue(stage.stageDate);
    }
    toTimelineDate(value) {
        const timestamp = this.parseRegistryDateValue(value);
        return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : new Date(0).toISOString();
    }
    parseRegistryDateValue(value) {
        const match = (value || "").trim().match(/^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
        if (!match) {
            return Number.NEGATIVE_INFINITY;
        }
        return Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1]), Number(match[4] || "0"), Number(match[5] || "0"), Number(match[6] || "0"), 0);
    }
    extractEmbeddedRegistryDateValue(value) {
        const match = value.match(/(\d{2}\.\d{2}\.\d{4}(?:\s+\d{2}:\d{2}(?::\d{2})?)?)/);
        if (!match) {
            return Number.NEGATIVE_INFINITY;
        }
        return this.parseRegistryDateValue(match[1]);
    }
    normalizeMeaningfulText(value) {
        return value.toLocaleLowerCase("uk-UA").replace(/[‐‑‒–—―]/g, "-").replace(/[.,;:!?()"'`«»]/g, " ").replace(/\s+/g, " ").trim();
    }
    normalizeCaseNumber(value) {
        return value.trim().replace(/\s+/g, "").replace(/[‐‑‒–—―]/g, "-").toLocaleLowerCase("uk-UA");
    }
    /**
   * Create new case
   */ async create(tenantId, userId, dto, actor) {
        if (actor) {
            (0, _accesscontrol.assertSameTenant)(actor, tenantId);
            (0, _accesscontrol.assertCanAssignToUser)(actor, dto.assignedLawyerId);
        }
        await this.ensureCaseQuotaAvailable(tenantId, actor);
        const savedCase = await this.caseRepository.manager.transaction(async (manager)=>{
            const caseRepository = manager.getRepository(_Caseentity.Case);
            const clientRepository = manager.getRepository(_Cliententity.Client);
            const client = await clientRepository.findOne({
                where: {
                    id: dto.clientId,
                    tenantId,
                    deletedAt: (0, _typeorm1.IsNull)()
                }
            });
            if (!client) {
                throw new _common.NotFoundException("Клієнта не знайдено");
            }
            const generatedCaseNumber = await this.reserveNextCaseNumber(tenantId, dto.clientId, client.metadata, caseRepository);
            const caseEntity = caseRepository.create({
                tenantId,
                caseNumber: generatedCaseNumber,
                registryCaseNumber: dto.registryCaseNumber,
                caseType: dto.caseType,
                clientId: dto.clientId,
                assignedLawyerId: dto.assignedLawyerId,
                title: dto.title,
                description: dto.description,
                priority: dto.priority,
                courtName: dto.courtName,
                courtAddress: dto.courtAddress,
                judgeName: dto.judgeName,
                proceedingStage: dto.proceedingStage,
                plaintiffName: dto.plaintiffName,
                defendantName: dto.defendantName,
                thirdParties: dto.thirdParties,
                internalNotes: dto.internalNotes,
                clientNotes: dto.clientNotes,
                status: "draft",
                startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
                endDate: dto.endDate ? new Date(dto.endDate) : undefined,
                deadlineDate: dto.deadlineDate ? new Date(dto.deadlineDate) : undefined,
                estimatedAmount: dto.estimatedAmount ?? undefined,
                courtFee: dto.courtFee ?? undefined,
                paidAmount: 0,
                accessScope: dto.accessScope || "assigned",
                metadata: dto.metadata || {},
                createdBy: userId,
                updatedBy: userId
            });
            return caseRepository.save(caseEntity);
        });
        await this.syncRegistryArtifacts(savedCase, userId);
        return savedCase;
    }
    /**
   * Update case
   */ async update(tenantId, id, userId, dto, actor) {
        const caseEntity = await this.findById(tenantId, id, actor);
        if (actor && dto.assignedLawyerId) {
            (0, _accesscontrol.assertCanAssignToUser)(actor, dto.assignedLawyerId);
        }
        // Update scalar fields
        if (dto.caseType) caseEntity.caseType = dto.caseType;
        if (dto.assignedLawyerId) caseEntity.assignedLawyerId = dto.assignedLawyerId;
        if (dto.registryCaseNumber !== undefined) caseEntity.registryCaseNumber = dto.registryCaseNumber || null;
        if (dto.title) caseEntity.title = dto.title;
        if (dto.description) caseEntity.description = dto.description;
        if (dto.priority) caseEntity.priority = dto.priority;
        if (dto.courtName) caseEntity.courtName = dto.courtName;
        if (dto.courtAddress) caseEntity.courtAddress = dto.courtAddress;
        if (dto.judgeName) caseEntity.judgeName = dto.judgeName;
        if (dto.proceedingStage) caseEntity.proceedingStage = dto.proceedingStage;
        if (dto.plaintiffName) caseEntity.plaintiffName = dto.plaintiffName;
        if (dto.defendantName) caseEntity.defendantName = dto.defendantName;
        if (dto.thirdParties) caseEntity.thirdParties = dto.thirdParties;
        if (dto.internalNotes) caseEntity.internalNotes = dto.internalNotes;
        if (dto.clientNotes) caseEntity.clientNotes = dto.clientNotes;
        if (dto.metadata) caseEntity.metadata = dto.metadata;
        if (dto.estimatedAmount !== undefined) caseEntity.estimatedAmount = dto.estimatedAmount;
        if (dto.courtFee !== undefined) caseEntity.courtFee = dto.courtFee;
        if (dto.paidAmount !== undefined) caseEntity.paidAmount = dto.paidAmount;
        if (dto.accessScope) caseEntity.accessScope = dto.accessScope;
        if (dto.status) caseEntity.status = dto.status;
        // Handle date fields
        if (dto.startDate) {
            caseEntity.startDate = new Date(dto.startDate);
        }
        if (dto.endDate) {
            caseEntity.endDate = new Date(dto.endDate);
        }
        if (dto.nextHearingDate) {
            caseEntity.nextHearingDate = new Date(dto.nextHearingDate);
        }
        if (dto.deadlineDate) {
            caseEntity.deadlineDate = new Date(dto.deadlineDate);
        }
        caseEntity.updatedBy = userId;
        const savedCase = caseEntity.status === "archived" ? await this.caseRepository.manager.transaction(async (manager)=>{
            const caseRepository = manager.getRepository(_Caseentity.Case);
            const eventRepository = manager.getRepository(_Evententity.Event);
            const archivedCase = await caseRepository.save(caseEntity);
            await eventRepository.update({
                tenantId,
                caseId: id,
                deletedAt: (0, _typeorm1.IsNull)()
            }, {
                status: "archived",
                updatedBy: userId
            });
            return archivedCase;
        }) : await this.caseRepository.save(caseEntity);
        await this.syncRegistryArtifacts(savedCase, userId);
        return savedCase;
    }
    async getRegistryHearingSuggestion(tenantId, id, actor) {
        const caseEntity = await this.caseRepository.findOne({
            where: {
                id,
                tenantId,
                deletedAt: (0, _typeorm1.IsNull)()
            },
            relations: [
                "client"
            ]
        });
        if (!caseEntity) {
            throw new _common.NotFoundException("Справу не знайдено");
        }
        if (actor) {
            (0, _accesscontrol.assertCanAccessRecord)(actor, caseEntity);
        }
        return this.caseRegistrySyncService.getRegistryHearingSuggestion(caseEntity);
    }
    async createRegistryHearingEvent(tenantId, id, userId, actor) {
        const caseEntity = await this.caseRepository.findOne({
            where: {
                id,
                tenantId,
                deletedAt: (0, _typeorm1.IsNull)()
            },
            relations: [
                "client"
            ]
        });
        if (!caseEntity) {
            throw new _common.NotFoundException("Справу не знайдено");
        }
        if (actor) {
            (0, _accesscontrol.assertCanAccessRecord)(actor, caseEntity);
        }
        return this.caseRegistrySyncService.createSuggestedCourtEvent(caseEntity, userId);
    }
    async getRegistryHearingNotifications(tenantId, userId, actor) {
        if (actor) {
            (0, _accesscontrol.assertSameTenant)(actor, tenantId);
        }
        const cases = await this.caseRepository.find({
            where: {
                tenantId,
                assignedLawyerId: userId,
                deletedAt: (0, _typeorm1.IsNull)(),
                caseType: "judicial_case"
            },
            relations: [
                "client"
            ],
            order: {
                updatedAt: "DESC"
            },
            take: 25
        });
        const suggestions = await Promise.all(cases.map((caseEntity)=>this.caseRegistrySyncService.getRegistryHearingSuggestion(caseEntity)));
        return suggestions.filter((suggestion)=>suggestion && !suggestion.eventAlreadyExists);
    }
    async syncRegistryArtifacts(caseEntity, userId) {
        try {
            await this.caseRegistrySyncService.handleCaseLifecycleChange(caseEntity, userId);
        } catch (error) {
            this.logger.warn(`Case ${caseEntity.id} saved but registry sync failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async getClientOrThrow(tenantId, clientId) {
        const client = await this.clientRepository.findOne({
            where: {
                id: clientId,
                tenantId,
                deletedAt: (0, _typeorm1.IsNull)()
            }
        });
        if (!client) {
            throw new _common.NotFoundException("Клієнта не знайдено");
        }
        return client;
    }
    async peekNextCaseNumber(tenantId, clientId, clientMetadata) {
        const maxSequence = await this.getMaxClientCaseSequence(tenantId, clientId, this.caseRepository, clientMetadata);
        return this.formatCaseNumber(clientMetadata, maxSequence + 1);
    }
    async reserveNextCaseNumber(tenantId, clientId, clientMetadata, caseRepository) {
        const maxSequence = await this.getMaxClientCaseSequence(tenantId, clientId, caseRepository, clientMetadata);
        return this.formatCaseNumber(clientMetadata, maxSequence + 1);
    }
    async getMaxClientCaseSequence(tenantId, clientId, caseRepository, clientMetadata) {
        const clientNumber = this.getClientNumber(clientMetadata);
        const cases = await caseRepository.createQueryBuilder("case").withDeleted().where("case.tenantId = :tenantId AND case.clientId = :clientId", {
            tenantId,
            clientId
        }).getMany();
        return cases.reduce((maxSequence, caseItem)=>{
            const sequence = this.parseCaseSequence(caseItem.caseNumber, clientNumber);
            return sequence > maxSequence ? sequence : maxSequence;
        }, 0);
    }
    getClientNumber(metadata) {
        const rawValue = metadata?.client_number;
        if (typeof rawValue !== "string" || !/^\d+$/.test(rawValue.trim())) {
            throw new _common.NotFoundException("У клієнта відсутній внутрішній номер для формування номера справи");
        }
        return rawValue.trim();
    }
    parseCaseSequence(caseNumber, clientNumber) {
        if (!caseNumber) {
            return 0;
        }
        const [caseClientNumber, sequencePart] = caseNumber.split("/");
        if (caseClientNumber !== clientNumber || !sequencePart) {
            return 0;
        }
        return /^\d+$/.test(sequencePart) ? Number.parseInt(sequencePart, 10) : 0;
    }
    formatCaseNumber(clientMetadata, sequence) {
        return `${this.getClientNumber(clientMetadata)}/${String(sequence).padStart(3, "0")}`;
    }
    async ensureCaseQuotaAvailable(tenantId, actor, requestedSlots = 1) {
        const plan = await this.resolveSubscriptionPlan(tenantId, actor);
        const limits = (0, _subscriptionlimits.getSubscriptionLimits)(plan);
        if (limits.maxCases === null) {
            return;
        }
        const activeCases = await this.caseRepository.count({
            where: {
                tenantId,
                deletedAt: (0, _typeorm1.IsNull)()
            }
        });
        if (activeCases + requestedSlots > limits.maxCases) {
            throw new _common.ForbiddenException(`Тариф ${plan} дозволяє максимум ${limits.maxCases} справ(и). Потрібно оновити підписку.`);
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
    /**
   * Delete case (soft delete)
   */ async delete(tenantId, id, userId, actor) {
        await this.findById(tenantId, id, actor);
        const deletedAt = new Date();
        await this.caseRepository.manager.transaction(async (manager)=>{
            const caseRepository = manager.getRepository(_Caseentity.Case);
            const eventRepository = manager.getRepository(_Evententity.Event);
            await caseRepository.update({
                id,
                tenantId
            }, {
                deletedAt,
                updatedBy: userId
            });
            await eventRepository.update({
                tenantId,
                caseId: id,
                deletedAt: (0, _typeorm1.IsNull)()
            }, {
                deletedAt,
                updatedBy: userId
            });
        });
    }
    /**
   * Restore deleted case
   */ async restore(tenantId, id, userId, actor) {
        if (actor) {
            (0, _accesscontrol.assertSameTenant)(actor, tenantId);
        }
        await this.ensureCaseQuotaAvailable(tenantId, actor);
        await this.caseRepository.update({
            id,
            tenantId
        }, {
            deletedAt: undefined,
            updatedBy: userId
        });
        return this.findById(tenantId, id, actor);
    }
    /**
   * Change case status
   */ async changeStatus(tenantId, id, userId, status, actor) {
        const caseEntity = await this.findById(tenantId, id, actor);
        caseEntity.status = status;
        caseEntity.updatedBy = userId;
        if (status === "closed") {
            caseEntity.endDate = new Date();
        }
        if (status !== "archived") {
            return this.caseRepository.save(caseEntity);
        }
        return this.caseRepository.manager.transaction(async (manager)=>{
            const caseRepository = manager.getRepository(_Caseentity.Case);
            const eventRepository = manager.getRepository(_Evententity.Event);
            const archivedCase = await caseRepository.save(caseEntity);
            await eventRepository.update({
                tenantId,
                caseId: id,
                deletedAt: (0, _typeorm1.IsNull)()
            }, {
                status: "archived",
                updatedBy: userId
            });
            return archivedCase;
        });
    }
    /**
   * Get upcoming deadlines
   */ async getUpcomingDeadlines(tenantId, days = 30, actor) {
        if (actor) {
            (0, _accesscontrol.assertSameTenant)(actor, tenantId);
        }
        const now = new Date();
        const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        const query = this.caseRepository.createQueryBuilder("case").where("case.tenantId = :tenantId AND case.deadlineDate BETWEEN :now AND :futureDate AND case.status = :status AND case.deletedAt IS NULL", {
            tenantId,
            now,
            futureDate,
            status: "active"
        }).leftJoinAndSelect("case.client", "client").leftJoinAndSelect("case.assignedLawyer", "assignedLawyer").orderBy("case.deadlineDate", "ASC");
        const scopeCondition = (0, _accesscontrol.buildScopedQueryCondition)("case", actor, [
            "case.assignedLawyerId"
        ]);
        if (scopeCondition) {
            query.andWhere(scopeCondition.clause, scopeCondition.parameters);
        }
        return query.getMany();
    }
    /**
   * Get cases statistics
   */ async getStatistics(tenantId, actor) {
        if (actor) {
            (0, _accesscontrol.assertSameTenant)(actor, tenantId);
        }
        const scopeCondition = (0, _accesscontrol.buildScopedQueryCondition)("case", actor, [
            "case.assignedLawyerId"
        ]);
        const totalQuery = this.caseRepository.createQueryBuilder("case").select("COUNT(*)", "count").where("case.tenantId = :tenantId AND case.deletedAt IS NULL", {
            tenantId
        });
        const byStatusQuery = this.caseRepository.createQueryBuilder("case").select("case.status", "status").addSelect("COUNT(*)", "count").where("case.tenantId = :tenantId AND case.deletedAt IS NULL", {
            tenantId
        }).groupBy("case.status");
        const byTypeQuery = this.caseRepository.createQueryBuilder("case").select("case.caseType", "caseType").addSelect("COUNT(*)", "count").where("case.tenantId = :tenantId AND case.deletedAt IS NULL", {
            tenantId
        }).groupBy("case.caseType");
        const byPriorityQuery = this.caseRepository.createQueryBuilder("case").select("case.priority", "priority").addSelect("COUNT(*)", "count").where("case.tenantId = :tenantId AND case.deletedAt IS NULL", {
            tenantId
        }).groupBy("case.priority");
        const activeCasesQuery = this.caseRepository.createQueryBuilder("case").select("COUNT(*)", "count").where("case.tenantId = :tenantId AND case.status = :status AND case.deletedAt IS NULL", {
            tenantId,
            status: "active"
        });
        const now = new Date();
        const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const upcomingDeadlinesQuery = this.caseRepository.createQueryBuilder("case").select("COUNT(*)", "count").where("case.tenantId = :tenantId AND case.deadlineDate BETWEEN :now AND :futureDate AND case.deletedAt IS NULL", {
            tenantId,
            now,
            futureDate
        });
        for (const query of [
            totalQuery,
            byStatusQuery,
            byTypeQuery,
            byPriorityQuery,
            activeCasesQuery,
            upcomingDeadlinesQuery
        ]){
            if (scopeCondition) {
                query.andWhere(scopeCondition.clause, scopeCondition.parameters);
            }
        }
        const [totalResult, byStatusResult, byTypeResult, byPriorityResult, activeCasesResult, upcomingDeadlinesResult] = await Promise.all([
            totalQuery.getRawOne(),
            byStatusQuery.getRawMany(),
            byTypeQuery.getRawMany(),
            byPriorityQuery.getRawMany(),
            activeCasesQuery.getRawOne(),
            upcomingDeadlinesQuery.getRawOne()
        ]);
        return {
            total: parseInt(totalResult?.count || "0"),
            byStatus: byStatusResult.reduce((acc, row)=>{
                acc[row.status] = parseInt(row.count);
                return acc;
            }, {}),
            byType: byTypeResult.reduce((acc, row)=>{
                acc[row.caseType] = parseInt(row.count);
                return acc;
            }, {}),
            byPriority: byPriorityResult.reduce((acc, row)=>{
                acc[row.priority] = parseInt(row.count);
                return acc;
            }, {}),
            activeCases: parseInt(activeCasesResult?.count || "0"),
            upcomingDeadlines: parseInt(upcomingDeadlinesResult?.count || "0")
        };
    }
    constructor(caseRepository, clientRepository, organizationRepository, eventRepository, caseRegistrySyncService, courtRegistryService){
        this.caseRepository = caseRepository;
        this.clientRepository = clientRepository;
        this.organizationRepository = organizationRepository;
        this.eventRepository = eventRepository;
        this.caseRegistrySyncService = caseRegistrySyncService;
        this.courtRegistryService = courtRegistryService;
        this.logger = new _common.Logger(CaseService.name);
    }
};
CaseService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_Caseentity.Case)),
    _ts_param(1, (0, _typeorm.InjectRepository)(_Cliententity.Client)),
    _ts_param(2, (0, _typeorm.InjectRepository)(_Organizationentity.Organization)),
    _ts_param(3, (0, _typeorm.InjectRepository)(_Evententity.Event)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _caseregistrysyncservice.CaseRegistrySyncService === "undefined" ? Object : _caseregistrysyncservice.CaseRegistrySyncService,
        typeof _courtregistryservice.CourtRegistryService === "undefined" ? Object : _courtregistryservice.CourtRegistryService
    ])
], CaseService);

//# sourceMappingURL=case.service.js.map