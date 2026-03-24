"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CaseRegistrySyncService", {
    enumerable: true,
    get: function() {
        return CaseRegistrySyncService;
    }
});
const _common = require("@nestjs/common");
const _schedule = require("@nestjs/schedule");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _scheduledtasks = require("../../common/runtime/scheduled-tasks");
const _Caseentity = require("../../database/entities/Case.entity");
const _Evententity = require("../../database/entities/Event.entity");
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
const AUTO_SYNC_SOURCE = "court_dates";
let CaseRegistrySyncService = class CaseRegistrySyncService {
    async handleCaseLifecycleChange(caseEntity, userId) {
        if (!this.isCourtEventSyncEligible(caseEntity)) {
            await this.clearAutoCourtEventsForCase(caseEntity, userId);
            return;
        }
        const match = await this.courtRegistryService.findCourtDateByCaseNumber(caseEntity.registryCaseNumber || "");
        if (!match) {
            return;
        }
        await this.upsertCourtEvent(caseEntity, match, userId);
    }
    async getRegistryHearingSuggestion(caseEntity) {
        if (!this.isCourtSuggestionEligible(caseEntity)) {
            return null;
        }
        const resolvedMatch = await this.resolveCourtDateMatch(caseEntity);
        if (!resolvedMatch) {
            return null;
        }
        const eventAlreadyExists = await this.hasLinkedCourtEvent(caseEntity, resolvedMatch.match);
        return {
            caseId: caseEntity.id,
            caseNumber: caseEntity.caseNumber,
            registryCaseNumber: caseEntity.registryCaseNumber || null,
            date: resolvedMatch.match.date,
            courtName: resolvedMatch.match.courtName,
            courtRoom: resolvedMatch.match.courtRoom,
            judges: resolvedMatch.match.judges,
            caseInvolved: resolvedMatch.match.caseInvolved,
            caseDescription: resolvedMatch.match.caseDescription,
            matchedBy: resolvedMatch.matchedBy,
            eventAlreadyExists
        };
    }
    async createSuggestedCourtEvent(caseEntity, userId) {
        if (!this.isCourtSuggestionEligible(caseEntity)) {
            throw new Error("Для цієї справи пошук засідання в реєстрі недоступний.");
        }
        const resolvedMatch = await this.resolveCourtDateMatch(caseEntity);
        if (!resolvedMatch) {
            throw new Error("Не знайдено найближчого засідання у `court_dates`.");
        }
        return this.upsertCourtEvent(caseEntity, resolvedMatch.match, userId);
    }
    async syncDailyCourtEvents() {
        if (!(0, _scheduledtasks.shouldRunScheduledTasks)()) {
            return;
        }
        const cases = await this.caseRepository.find({
            where: {
                deletedAt: (0, _typeorm1.IsNull)(),
                caseType: "judicial_case",
                registryCaseNumber: (0, _typeorm1.Not)((0, _typeorm1.IsNull)())
            }
        });
        const caseNumbers = cases.map((caseEntity)=>caseEntity.registryCaseNumber || "").filter(Boolean);
        if (caseNumbers.length === 0) {
            return;
        }
        const matches = await this.courtRegistryService.findCourtDatesByCaseNumbers(caseNumbers);
        for (const caseEntity of cases){
            const match = matches.get((caseEntity.registryCaseNumber || "").trim().replace(/\s+/g, "").replace(/[‐‑‒–—―]/g, "-").toLocaleLowerCase("uk-UA"));
            if (!match) {
                continue;
            }
            try {
                await this.upsertCourtEvent(caseEntity, match, caseEntity.updatedBy || caseEntity.createdBy || caseEntity.assignedLawyerId);
            } catch (error) {
                this.logger.warn(`Failed to sync court event for case ${caseEntity.id}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }
    isCourtEventSyncEligible(caseEntity) {
        return caseEntity.caseType === "judicial_case" && Boolean((caseEntity.registryCaseNumber || "").trim()) && !caseEntity.deletedAt;
    }
    isCourtSuggestionEligible(caseEntity) {
        return caseEntity.caseType === "judicial_case" && !caseEntity.deletedAt && (Boolean((caseEntity.registryCaseNumber || "").trim()) || this.buildParticipantQueries(caseEntity).length > 0);
    }
    async resolveCourtDateMatch(caseEntity) {
        const candidateSearches = [];
        const seenSearches = new Set();
        const addCandidate = (options, matchedBy)=>{
            const key = JSON.stringify({
                query: options.query || "",
                caseNumber: options.caseNumber || ""
            });
            if (seenSearches.has(key)) {
                return;
            }
            seenSearches.add(key);
            candidateSearches.push({
                options,
                matchedBy
            });
        };
        if ((caseEntity.registryCaseNumber || "").trim()) {
            addCandidate({
                caseNumber: caseEntity.registryCaseNumber || "",
                onlyUpcoming: true,
                limit: 5
            }, [
                "case_number"
            ]);
        }
        for (const query of this.buildParticipantQueries(caseEntity)){
            addCandidate({
                query,
                caseNumber: caseEntity.registryCaseNumber || undefined,
                onlyUpcoming: true,
                limit: 5
            }, caseEntity.registryCaseNumber ? [
                "case_number",
                "participant_name"
            ] : [
                "participant_name"
            ]);
        }
        let bestMatch = null;
        for (const candidate of candidateSearches){
            const matches = await this.courtRegistryService.searchCourtDates(candidate.options);
            const nearestMatch = matches.find((match)=>this.parseCourtDate(match.date));
            if (!nearestMatch) {
                continue;
            }
            if (!bestMatch || this.isCourtDateEarlier(nearestMatch.date, bestMatch.match.date)) {
                bestMatch = {
                    match: nearestMatch,
                    matchedBy: candidate.matchedBy
                };
            }
        }
        return bestMatch;
    }
    buildParticipantQueries(caseEntity) {
        const values = [
            this.getClientDisplayName(caseEntity.client || null),
            caseEntity.plaintiffName || "",
            caseEntity.defendantName || "",
            caseEntity.thirdParties || ""
        ];
        return Array.from(new Set(values.map((value)=>value.trim()).filter((value)=>value.length >= 5)));
    }
    getClientDisplayName(client) {
        if (!client) {
            return "";
        }
        const personalName = `${client.lastName || ""} ${client.firstName || ""} ${client.patronymic || ""}`.trim();
        if (client.type !== "legal_entity" && personalName) {
            return personalName;
        }
        return client.companyName || "";
    }
    async upsertCourtEvent(caseEntity, match, userId) {
        const existingEvents = await this.eventRepository.find({
            where: {
                tenantId: caseEntity.tenantId,
                caseId: caseEntity.id,
                type: "court_sitting",
                deletedAt: (0, _typeorm1.IsNull)()
            }
        });
        const existingEvent = existingEvents.find((event)=>event.participants?.syncSource === AUTO_SYNC_SOURCE) ?? null;
        const parsedDate = this.parseCourtDate(match.date);
        if (!parsedDate) {
            this.logger.warn(`Skipping court event sync for case ${caseEntity.id}: invalid date "${match.date}"`);
            throw new Error(`Invalid court date "${match.date}"`);
        }
        const [eventDate, eventTime] = parsedDate;
        const eventPayload = {
            tenantId: caseEntity.tenantId,
            caseId: caseEntity.id,
            type: "court_sitting",
            title: `Судове засідання у справі ${match.caseNumber}`,
            description: this.buildEventDescription(match),
            eventDate,
            eventTime,
            isAllDay: false,
            location: match.courtName || null,
            courtRoom: match.courtRoom || null,
            responsibleContact: match.judges || null,
            participants: {
                syncSource: AUTO_SYNC_SOURCE,
                registryCaseNumber: match.caseNumber,
                caseInvolved: match.caseInvolved,
                caseDescription: match.caseDescription,
                syncedAt: new Date().toISOString()
            },
            status: "scheduled",
            reminderSent: false,
            reminderValue: existingEvent?.reminderValue ?? 1,
            reminderUnit: existingEvent?.reminderUnit ?? "days",
            reminderDaysBefore: existingEvent?.reminderDaysBefore ?? 1,
            isRecurring: false,
            recurrencePattern: null,
            recurrenceInterval: null,
            recurrenceEndDate: null,
            updatedBy: userId || existingEvent?.updatedBy || caseEntity.updatedBy || null
        };
        if (existingEvent) {
            Object.assign(existingEvent, eventPayload);
            return this.eventRepository.save(existingEvent);
        }
        const createdEvent = this.eventRepository.create({
            ...eventPayload,
            createdBy: userId || caseEntity.updatedBy || caseEntity.createdBy || caseEntity.assignedLawyerId || null
        });
        return this.eventRepository.save(createdEvent);
    }
    async hasLinkedCourtEvent(caseEntity, match) {
        const parsedDate = this.parseCourtDate(match.date);
        if (!parsedDate) {
            return false;
        }
        const [eventDate, eventTime] = parsedDate;
        const expectedTimestamp = eventDate.getTime();
        const normalizedCaseNumber = this.normalizeCaseNumber(match.caseNumber);
        const existingEvents = await this.eventRepository.find({
            where: {
                tenantId: caseEntity.tenantId,
                caseId: caseEntity.id,
                type: "court_sitting",
                deletedAt: (0, _typeorm1.IsNull)()
            }
        });
        return existingEvents.some((event)=>{
            const sameTime = event.eventDate instanceof Date && event.eventDate.getTime() === expectedTimestamp && (event.eventTime || "") === eventTime;
            const normalizedEventCaseNumber = this.normalizeCaseNumber(event.participants?.registryCaseNumber || event.participants?.caseNumber || "");
            return sameTime && normalizedEventCaseNumber === normalizedCaseNumber;
        });
    }
    async clearAutoCourtEventsForCase(caseEntity, userId) {
        const existingEvents = await this.eventRepository.find({
            where: {
                tenantId: caseEntity.tenantId,
                caseId: caseEntity.id,
                type: "court_sitting",
                deletedAt: (0, _typeorm1.IsNull)()
            }
        });
        const autoEvents = existingEvents.filter((event)=>event.participants?.syncSource === AUTO_SYNC_SOURCE);
        if (autoEvents.length === 0) {
            return;
        }
        await Promise.all(autoEvents.map((event)=>this.eventRepository.update({
                id: event.id,
                tenantId: caseEntity.tenantId
            }, {
                deletedAt: new Date(),
                updatedBy: userId || caseEntity.updatedBy || caseEntity.createdBy || event.updatedBy || undefined
            })));
    }
    parseCourtDate(value) {
        const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})$/);
        if (!match) {
            return null;
        }
        const [, day, month, year, hours, minutes] = match;
        const eventDate = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes), 0, 0);
        return [
            eventDate,
            `${hours}:${minutes}`
        ];
    }
    isCourtDateEarlier(left, right) {
        const leftDate = this.parseCourtDate(left)?.[0];
        const rightDate = this.parseCourtDate(right)?.[0];
        if (!leftDate) {
            return false;
        }
        if (!rightDate) {
            return true;
        }
        return leftDate.getTime() < rightDate.getTime();
    }
    normalizeCaseNumber(value) {
        return value.trim().replace(/\s+/g, "").replace(/[‐‑‒–—―]/g, "-").toLocaleLowerCase("uk-UA");
    }
    buildEventDescription(match) {
        return [
            `Опис справи: ${match.caseDescription || "не вказано"}`,
            `Учасники: ${match.caseInvolved || "не вказано"}`
        ].join("\n");
    }
    constructor(caseRepository, eventRepository, courtRegistryService){
        this.caseRepository = caseRepository;
        this.eventRepository = eventRepository;
        this.courtRegistryService = courtRegistryService;
        this.logger = new _common.Logger(CaseRegistrySyncService.name);
    }
};
_ts_decorate([
    (0, _schedule.Cron)("0 0 10 * * *", {
        timeZone: "Etc/GMT-1"
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], CaseRegistrySyncService.prototype, "syncDailyCourtEvents", null);
CaseRegistrySyncService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_Caseentity.Case)),
    _ts_param(1, (0, _typeorm.InjectRepository)(_Evententity.Event)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _courtregistryservice.CourtRegistryService === "undefined" ? Object : _courtregistryservice.CourtRegistryService
    ])
], CaseRegistrySyncService);

//# sourceMappingURL=case-registry-sync.service.js.map