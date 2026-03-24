import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Not, Repository } from "typeorm";
import { shouldRunScheduledTasks } from "../../common/runtime/scheduled-tasks";
import { Case } from "../../database/entities/Case.entity";
import { Client } from "../../database/entities/Client.entity";
import { Event } from "../../database/entities/Event.entity";
import {
  CourtDateSearchResult,
  CourtDateSearchOptions,
  CourtRegistryService,
} from "../../clients/services/court-registry.service";

const AUTO_SYNC_SOURCE = "court_dates";

export interface RegistryHearingSuggestion {
  caseId: string;
  caseNumber: string;
  registryCaseNumber: string | null;
  date: string;
  courtName: string;
  courtRoom: string;
  judges: string;
  caseInvolved: string;
  caseDescription: string;
  matchedBy: string[];
  eventAlreadyExists: boolean;
}

@Injectable()
export class CaseRegistrySyncService {
  private readonly logger = new Logger(CaseRegistrySyncService.name);

  constructor(
    @InjectRepository(Case)
    private readonly caseRepository: Repository<Case>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    private readonly courtRegistryService: CourtRegistryService,
  ) {}

  async handleCaseLifecycleChange(
    caseEntity: Case,
    userId?: string,
  ): Promise<void> {
    if (!this.isCourtEventSyncEligible(caseEntity)) {
      await this.clearAutoCourtEventsForCase(caseEntity, userId);
      return;
    }

    const match = await this.courtRegistryService.findCourtDateByCaseNumber(
      caseEntity.registryCaseNumber || "",
    );

    if (!match) {
      return;
    }

    await this.upsertCourtEvent(caseEntity, match, userId);
  }

  async getRegistryHearingSuggestion(
    caseEntity: Case & { client?: Client | null },
  ): Promise<RegistryHearingSuggestion | null> {
    if (!this.isCourtSuggestionEligible(caseEntity)) {
      return null;
    }

    const resolvedMatch = await this.resolveCourtDateMatch(caseEntity);

    if (!resolvedMatch) {
      return null;
    }

    const eventAlreadyExists = await this.hasLinkedCourtEvent(
      caseEntity,
      resolvedMatch.match,
    );

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
      eventAlreadyExists,
    };
  }

  async createSuggestedCourtEvent(
    caseEntity: Case & { client?: Client | null },
    userId?: string,
  ): Promise<Event> {
    if (!this.isCourtSuggestionEligible(caseEntity)) {
      throw new Error("Для цієї справи пошук засідання в реєстрі недоступний.");
    }

    const resolvedMatch = await this.resolveCourtDateMatch(caseEntity);

    if (!resolvedMatch) {
      throw new Error("Не знайдено найближчого засідання у `court_dates`.");
    }

    return this.upsertCourtEvent(caseEntity, resolvedMatch.match, userId);
  }

  @Cron("0 0 10 * * *", { timeZone: "Etc/GMT-1" })
  async syncDailyCourtEvents(): Promise<void> {
    if (!shouldRunScheduledTasks()) {
      return;
    }

    const cases = await this.caseRepository.find({
      where: {
        deletedAt: IsNull(),
        caseType: "judicial_case",
        registryCaseNumber: Not(IsNull()),
      },
    });

    const caseNumbers = cases
      .map((caseEntity) => caseEntity.registryCaseNumber || "")
      .filter(Boolean);

    if (caseNumbers.length === 0) {
      return;
    }

    const matches =
      await this.courtRegistryService.findCourtDatesByCaseNumbers(caseNumbers);

    for (const caseEntity of cases) {
      const match = matches.get(
        (caseEntity.registryCaseNumber || "")
          .trim()
          .replace(/\s+/g, "")
          .replace(/[‐‑‒–—―]/g, "-")
          .toLocaleLowerCase("uk-UA"),
      );

      if (!match) {
        continue;
      }

      try {
        await this.upsertCourtEvent(
          caseEntity,
          match,
          caseEntity.updatedBy ||
            caseEntity.createdBy ||
            caseEntity.assignedLawyerId,
        );
      } catch (error) {
        this.logger.warn(
          `Failed to sync court event for case ${caseEntity.id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }

  private isCourtEventSyncEligible(caseEntity: Case): boolean {
    return (
      caseEntity.caseType === "judicial_case" &&
      Boolean((caseEntity.registryCaseNumber || "").trim()) &&
      !caseEntity.deletedAt
    );
  }

  private isCourtSuggestionEligible(
    caseEntity: Case & { client?: Client | null },
  ): boolean {
    return (
      caseEntity.caseType === "judicial_case" &&
      !caseEntity.deletedAt &&
      (Boolean((caseEntity.registryCaseNumber || "").trim()) ||
        this.buildParticipantQueries(caseEntity).length > 0)
    );
  }

  private async resolveCourtDateMatch(
    caseEntity: Case & { client?: Client | null },
  ): Promise<{ match: CourtDateSearchResult; matchedBy: string[] } | null> {
    const candidateSearches: Array<{
      options: CourtDateSearchOptions;
      matchedBy: string[];
    }> = [];
    const seenSearches = new Set<string>();

    const addCandidate = (
      options: CourtDateSearchOptions,
      matchedBy: string[],
    ) => {
      const key = JSON.stringify({
        query: options.query || "",
        caseNumber: options.caseNumber || "",
      });

      if (seenSearches.has(key)) {
        return;
      }

      seenSearches.add(key);
      candidateSearches.push({ options, matchedBy });
    };

    if ((caseEntity.registryCaseNumber || "").trim()) {
      addCandidate(
        {
          caseNumber: caseEntity.registryCaseNumber || "",
          onlyUpcoming: true,
          limit: 5,
        },
        ["case_number"],
      );
    }

    for (const query of this.buildParticipantQueries(caseEntity)) {
      addCandidate(
        {
          query,
          caseNumber: caseEntity.registryCaseNumber || undefined,
          onlyUpcoming: true,
          limit: 5,
        },
        caseEntity.registryCaseNumber
          ? ["case_number", "participant_name"]
          : ["participant_name"],
      );
    }

    let bestMatch: {
      match: CourtDateSearchResult;
      matchedBy: string[];
    } | null = null;

    for (const candidate of candidateSearches) {
      const matches = await this.courtRegistryService.searchCourtDates(
        candidate.options,
      );
      const nearestMatch = matches.find((match) =>
        this.parseCourtDate(match.date),
      );

      if (!nearestMatch) {
        continue;
      }

      if (
        !bestMatch ||
        this.isCourtDateEarlier(nearestMatch.date, bestMatch.match.date)
      ) {
        bestMatch = {
          match: nearestMatch,
          matchedBy: candidate.matchedBy,
        };
      }
    }

    return bestMatch;
  }

  private buildParticipantQueries(
    caseEntity: Case & { client?: Client | null },
  ): string[] {
    const values = [
      this.getClientDisplayName(caseEntity.client || null),
      caseEntity.plaintiffName || "",
      caseEntity.defendantName || "",
      caseEntity.thirdParties || "",
    ];

    return Array.from(
      new Set(
        values
          .map((value) => value.trim())
          .filter((value) => value.length >= 5),
      ),
    );
  }

  private getClientDisplayName(client: Client | null): string {
    if (!client) {
      return "";
    }

    const personalName =
      `${client.lastName || ""} ${client.firstName || ""} ${client.patronymic || ""}`.trim();

    if (client.type !== "legal_entity" && personalName) {
      return personalName;
    }

    return client.companyName || "";
  }

  private async upsertCourtEvent(
    caseEntity: Case,
    match: CourtDateSearchResult,
    userId?: string,
  ): Promise<Event> {
    const existingEvents = await this.eventRepository.find({
      where: {
        tenantId: caseEntity.tenantId,
        caseId: caseEntity.id,
        type: "court_sitting",
        deletedAt: IsNull(),
      },
    });

    const existingEvent =
      existingEvents.find(
        (event) => event.participants?.syncSource === AUTO_SYNC_SOURCE,
      ) ?? null;
    const parsedDate = this.parseCourtDate(match.date);

    if (!parsedDate) {
      this.logger.warn(
        `Skipping court event sync for case ${caseEntity.id}: invalid date "${match.date}"`,
      );
      throw new Error(`Invalid court date "${match.date}"`);
    }

    const [eventDate, eventTime] = parsedDate;
    const eventPayload = {
      tenantId: caseEntity.tenantId,
      caseId: caseEntity.id,
      type: "court_sitting" as const,
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
        syncedAt: new Date().toISOString(),
      },
      status: "scheduled" as const,
      reminderSent: false,
      reminderValue: existingEvent?.reminderValue ?? 1,
      reminderUnit: existingEvent?.reminderUnit ?? "days",
      reminderDaysBefore: existingEvent?.reminderDaysBefore ?? 1,
      isRecurring: false,
      recurrencePattern: null,
      recurrenceInterval: null,
      recurrenceEndDate: null,
      updatedBy:
        userId || existingEvent?.updatedBy || caseEntity.updatedBy || null,
    };

    if (existingEvent) {
      Object.assign(existingEvent, eventPayload);
      return this.eventRepository.save(existingEvent);
    }

    const createdEvent = this.eventRepository.create({
      ...eventPayload,
      createdBy:
        userId ||
        caseEntity.updatedBy ||
        caseEntity.createdBy ||
        caseEntity.assignedLawyerId ||
        null,
    } as Partial<Event>);

    return this.eventRepository.save(createdEvent);
  }

  private async hasLinkedCourtEvent(
    caseEntity: Case,
    match: CourtDateSearchResult,
  ): Promise<boolean> {
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
        deletedAt: IsNull(),
      },
    });

    return existingEvents.some((event) => {
      const sameTime =
        event.eventDate instanceof Date &&
        event.eventDate.getTime() === expectedTimestamp &&
        (event.eventTime || "") === eventTime;
      const normalizedEventCaseNumber = this.normalizeCaseNumber(
        event.participants?.registryCaseNumber ||
          event.participants?.caseNumber ||
          "",
      );

      return sameTime && normalizedEventCaseNumber === normalizedCaseNumber;
    });
  }

  private async clearAutoCourtEventsForCase(
    caseEntity: Case,
    userId?: string,
  ): Promise<void> {
    const existingEvents = await this.eventRepository.find({
      where: {
        tenantId: caseEntity.tenantId,
        caseId: caseEntity.id,
        type: "court_sitting",
        deletedAt: IsNull(),
      },
    });

    const autoEvents = existingEvents.filter(
      (event) => event.participants?.syncSource === AUTO_SYNC_SOURCE,
    );

    if (autoEvents.length === 0) {
      return;
    }

    await Promise.all(
      autoEvents.map((event) =>
        this.eventRepository.update(
          { id: event.id, tenantId: caseEntity.tenantId },
          {
            deletedAt: new Date(),
            updatedBy:
              userId ||
              caseEntity.updatedBy ||
              caseEntity.createdBy ||
              event.updatedBy ||
              undefined,
          },
        ),
      ),
    );
  }

  private parseCourtDate(value: string): [Date, string] | null {
    const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})$/);

    if (!match) {
      return null;
    }

    const [, day, month, year, hours, minutes] = match;
    const eventDate = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes),
      0,
      0,
    );

    return [eventDate, `${hours}:${minutes}`];
  }

  private isCourtDateEarlier(left: string, right: string): boolean {
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

  private normalizeCaseNumber(value: string): string {
    return value
      .trim()
      .replace(/\s+/g, "")
      .replace(/[‐‑‒–—―]/g, "-")
      .toLocaleLowerCase("uk-UA");
  }

  private buildEventDescription(match: CourtDateSearchResult): string {
    return [
      `Опис справи: ${match.caseDescription || "не вказано"}`,
      `Учасники: ${match.caseInvolved || "не вказано"}`,
    ].join("\n");
  }
}
