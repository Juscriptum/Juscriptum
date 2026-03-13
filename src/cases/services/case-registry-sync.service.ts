import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Not, Repository } from "typeorm";
import { shouldRunScheduledTasks } from "../../common/runtime/scheduled-tasks";
import { Case } from "../../database/entities/Case.entity";
import { Event } from "../../database/entities/Event.entity";
import {
  CourtDateSearchResult,
  CourtRegistryService,
} from "../../clients/services/court-registry.service";

const AUTO_SYNC_SOURCE = "court_dates";

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

  private async upsertCourtEvent(
    caseEntity: Case,
    match: CourtDateSearchResult,
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

    const existingEvent =
      existingEvents.find(
        (event) => event.participants?.syncSource === AUTO_SYNC_SOURCE,
      ) ?? null;
    const parsedDate = this.parseCourtDate(match.date);

    if (!parsedDate) {
      this.logger.warn(
        `Skipping court event sync for case ${caseEntity.id}: invalid date "${match.date}"`,
      );
      return;
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
      await this.eventRepository.save(existingEvent);
      return;
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

    await this.eventRepository.save(createdEvent);
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

  private buildEventDescription(match: CourtDateSearchResult): string {
    return [
      "Автоматично створено з файлу `court_dates`.",
      `Опис справи: ${match.caseDescription || "не вказано"}`,
      `Учасники: ${match.caseInvolved || "не вказано"}`,
    ].join("\n");
  }
}
