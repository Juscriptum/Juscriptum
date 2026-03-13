import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, MoreThan } from "typeorm";
import { Case } from "../../database/entities/Case.entity";
import { Client } from "../../database/entities/Client.entity";
import { Event } from "../../database/entities/Event.entity";
import { AuditLog } from "../../database/entities/AuditLog.entity";
import { Invoice } from "../../database/entities/Invoice.entity";
import { AuditAction } from "../../database/entities/enums/subscription.enum";
import {
  StatCardDto,
  RecentCaseDto,
  UpcomingEventDto,
  ActivityFeedDto,
  TaskDto,
  RevenueDataPointDto,
} from "../dto/dashboard-response.dto";
import { GetDashboardStatsDto } from "../dto/dashboard-stats.dto";

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
  ) {}

  /**
   * Get dashboard statistics for a tenant
   */
  async getDashboardStats(
    tenantId: string,
    query: GetDashboardStatsDto,
  ): Promise<{
    stats: StatCardDto[];
    recentCases: RecentCaseDto[];
    upcomingEvents: UpcomingEventDto[];
    activityFeed: ActivityFeedDto[];
    pendingTasks: TaskDto[];
    revenueData: RevenueDataPointDto[];
  }> {
    const { days = 30, startDate, endDate } = query;

    // Calculate date range
    const now = new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : now;

    // Get previous period for comparison
    const daysInMillis = end.getTime() - start.getTime();
    const previousStart = new Date(start.getTime() - daysInMillis);
    const previousEnd = new Date(end.getTime() - daysInMillis);

    // Fetch data in parallel
    const [
      totalClients,
      activeCases,
      totalCases,
      totalRevenue,
      previousTotalRevenue,
      recentCases,
      upcomingEvents,
      activityFeed,
      invoicesByDate,
    ] = await Promise.all([
      // Total clients
      this.clientRepository.count({
        where: { tenantId, status: "active", deletedAt: null as any },
      }),
      // Active cases
      this.caseRepository.count({
        where: { tenantId, status: "active", deletedAt: null as any },
      }),
      // Total cases
      this.caseRepository.count({
        where: { tenantId, deletedAt: null as any },
      }),
      // Total revenue in current period
      this.invoiceRepository
        .createQueryBuilder("invoice")
        .select("COALESCE(SUM(invoice.totalAmount), 0)", "total")
        .where("invoice.tenantId = :tenantId", { tenantId })
        .andWhere("invoice.status IN (:...statuses)", {
          statuses: ["paid", "sent", "viewed"],
        })
        .andWhere("invoice.deletedAt IS NULL")
        .andWhere("invoice.invoiceDate BETWEEN :start AND :end", {
          start: start.toISOString().split("T")[0],
          end: end.toISOString().split("T")[0],
        })
        .getRawOne(),
      // Previous period revenue for comparison
      this.invoiceRepository
        .createQueryBuilder("invoice")
        .select("COALESCE(SUM(invoice.totalAmount), 0)", "total")
        .where("invoice.tenantId = :tenantId", { tenantId })
        .andWhere("invoice.status IN (:...statuses)", {
          statuses: ["paid", "sent", "viewed"],
        })
        .andWhere("invoice.deletedAt IS NULL")
        .andWhere("invoice.invoiceDate BETWEEN :start AND :end", {
          start: previousStart.toISOString().split("T")[0],
          end: previousEnd.toISOString().split("T")[0],
        })
        .getRawOne(),
      // Recent cases
      this.caseRepository.find({
        where: { tenantId, deletedAt: null as any },
        order: { createdAt: "DESC" },
        take: 5,
        relations: ["client"],
      }),
      // Upcoming events
      this.eventRepository.find({
        where: {
          tenantId,
          eventDate: MoreThan(new Date()),
          status: "scheduled",
          deletedAt: null as any,
        },
        order: { eventDate: "ASC" },
        take: 5,
        relations: ["case"],
      }),
      // Activity feed
      this.auditLogRepository.find({
        where: { tenantId, createdAt: Between(start, end) },
        order: { createdAt: "DESC" },
        take: 10,
        relations: ["user"],
      }),
      // Revenue data for chart (daily aggregation)
      this.invoiceRepository
        .createQueryBuilder("invoice")
        .select("invoice.invoiceDate", "date")
        .addSelect("COALESCE(SUM(invoice.totalAmount), 0)", "amount")
        .addSelect("COALESCE(SUM(invoice.paidAmount), 0)", "paidAmount")
        .where("invoice.tenantId = :tenantId", { tenantId })
        .andWhere("invoice.deletedAt IS NULL")
        .andWhere("invoice.invoiceDate BETWEEN :start AND :end", {
          start: start.toISOString().split("T")[0],
          end: end.toISOString().split("T")[0],
        })
        .groupBy("invoice.invoiceDate")
        .orderBy("invoice.invoiceDate", "ASC")
        .getRawMany(),
    ]);

    // Calculate pending tasks
    const pendingTasks = await this.getPendingTasks(tenantId, now);

    // Calculate revenue change percentage
    const currentRevenue = parseFloat(totalRevenue.total) || 0;
    const previousRevenue = parseFloat(previousTotalRevenue.total) || 0;
    const revenueChange =
      previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : currentRevenue > 0
          ? 100
          : 0;

    // Build stat cards
    const stats: StatCardDto[] = [
      {
        label: "Всього клієнтів",
        value: totalClients,
        change: 0, // Could calculate based on client creation date
        trend: "neutral",
        icon: "users",
      },
      {
        label: "Активні справи",
        value: activeCases,
        change: 0,
        trend: "neutral",
        icon: "briefcase",
      },
      {
        label: "Всього справ",
        value: totalCases,
        change: 0,
        trend: "neutral",
        icon: "folder",
      },
      {
        label: "Дохід",
        value: currentRevenue,
        change: revenueChange,
        trend:
          revenueChange > 0 ? "up" : revenueChange < 0 ? "down" : "neutral",
        icon: "dollar-sign",
      },
    ];

    // Build recent cases DTOs
    const recentCasesDtos: RecentCaseDto[] = recentCases.map((c) => ({
      id: c.id,
      caseNumber: c.caseNumber,
      title: c.title || "Без назви",
      clientName: this.formatClientName(c.client),
      status: this.translateCaseStatus(c.status),
      priority: this.translatePriority(c.priority),
      nextHearingDate: c.nextHearingDate || c.startDate,
    }));

    // Build upcoming events DTOs
    const upcomingEventsDtos: UpcomingEventDto[] = upcomingEvents.map((e) => ({
      id: e.id,
      title: e.title,
      type: this.translateEventType(e.type),
      eventDate: e.eventDate,
      location: e.location || e.courtRoom || "Не вказано",
      caseNumber: e.case ? e.case.caseNumber : "Немає",
    }));

    // Build activity feed DTOs
    const activityFeedDtos: ActivityFeedDto[] = activityFeed.map((a) => ({
      id: a.id,
      userName: a.user ? `${a.user.firstName} ${a.user.lastName}` : "Система",
      action: this.translateAuditAction(a.action),
      entityType: this.translateEntityType(a.entityType),
      entityDescription: this.getEntityDescription(a),
      timestamp: a.createdAt,
    }));

    // Build revenue data DTOs
    const revenueDataDtos: RevenueDataPointDto[] = invoicesByDate.map((d) => ({
      date: new Date(d.date),
      amount: parseFloat(d.amount),
      paidAmount: parseFloat(d.paidAmount),
    }));

    return {
      stats,
      recentCases: recentCasesDtos,
      upcomingEvents: upcomingEventsDtos,
      activityFeed: activityFeedDtos,
      pendingTasks,
      revenueData: revenueDataDtos,
    };
  }

  /**
   * Get pending tasks (deadlines, hearings, etc.)
   */
  private async getPendingTasks(
    tenantId: string,
    now: Date,
  ): Promise<TaskDto[]> {
    const tasks: TaskDto[] = [];

    // Get cases with upcoming deadlines (next 7 days)
    const deadlineCases = await this.caseRepository.find({
      where: {
        tenantId,
        deadlineDate: MoreThan(now),
        status: "active",
        deletedAt: null as any,
      },
      relations: ["client"],
      take: 10,
    });

    deadlineCases.forEach((c) => {
      if (c.deadlineDate) {
        tasks.push({
          id: `case-deadline-${c.id}`,
          title: `Дедлайн: ${c.title || c.caseNumber}`,
          type: "deadline",
          dueDate: c.deadlineDate,
          caseNumber: c.caseNumber,
          priority: this.translatePriority(c.priority),
        });
      }
    });

    // Get upcoming hearings (next 7 days)
    const hearingEvents = await this.eventRepository.find({
      where: {
        tenantId,
        type: "hearing",
        eventDate: Between(
          now,
          new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        ),
        status: "scheduled",
        deletedAt: null as any,
      },
      relations: ["case", "case.client"],
      take: 10,
    });

    hearingEvents.forEach((e) => {
      tasks.push({
        id: `event-${e.id}`,
        title: `Судове засідання: ${e.title}`,
        type: "hearing",
        dueDate: e.eventDate,
        caseNumber: e.case ? e.case.caseNumber : "Немає",
        priority: "high",
      });
    });

    // Sort by due date
    tasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    return tasks.slice(0, 10);
  }

  /**
   * Format client name
   */
  private formatClientName(client: Client | null): string {
    if (!client) return "Невідомий клієнт";

    if (client.type === "legal_entity") {
      return client.companyName || "Юридична особа";
    }

    return (
      `${client.firstName || ""} ${client.lastName || ""}`.trim() ||
      "Фізична особа"
    );
  }

  /**
   * Translate case status to Ukrainian
   */
  private translateCaseStatus(status: string): string {
    const statusMap: Record<string, string> = {
      draft: "Чернетка",
      active: "Активна",
      on_hold: "Призупинена",
      closed: "Закрита",
      archived: "Архівна",
    };
    return statusMap[status] || status;
  }

  /**
   * Translate priority to Ukrainian
   */
  private translatePriority(priority: string): string {
    const priorityMap: Record<string, string> = {
      low: "Низький",
      medium: "Середній",
      high: "Високий",
      urgent: "Терміновий",
    };
    return priorityMap[priority] || priority;
  }

  /**
   * Translate event type to Ukrainian
   */
  private translateEventType(type: string): string {
    const typeMap: Record<string, string> = {
      hearing: "Судове засідання",
      deadline: "Дедлайн",
      meeting: "Зустріч",
      court_sitting: "Судове слухання",
      other: "Інше",
    };
    return typeMap[type] || type;
  }

  /**
   * Translate audit action to Ukrainian
   */
  private translateAuditAction(action: AuditAction): string {
    const actionMap: Record<string, string> = {
      [AuditAction.CREATE]: "Створено",
      [AuditAction.UPDATE]: "Оновлено",
      [AuditAction.DELETE]: "Видалено",
      [AuditAction.LOGIN]: "Увійшов",
      [AuditAction.LOGOUT]: "Вийшов",
      [AuditAction.PERMISSION_CHANGE]: "Змінено права",
    };
    return actionMap[action] || action;
  }

  /**
   * Translate entity type to Ukrainian
   */
  private translateEntityType(entityType: string): string {
    const typeMap: Record<string, string> = {
      case: "справу",
      client: "клієнта",
      document: "документ",
      event: "подію",
      invoice: "рахунок",
      user: "користувача",
      organization: "організацію",
    };
    return typeMap[entityType] || entityType;
  }

  /**
   * Get entity description from audit log
   */
  private getEntityDescription(auditLog: AuditLog): string {
    if (auditLog.entityType === "case" && auditLog.newValues?.caseNumber) {
      return `справа №${auditLog.newValues.caseNumber}`;
    }
    if (auditLog.entityType === "client" && auditLog.newValues) {
      const firstName = auditLog.newValues.firstName || "";
      const lastName = auditLog.newValues.lastName || "";
      const companyName = auditLog.newValues.companyName || "";
      return (
        companyName ||
        `${firstName} ${lastName}`.trim() ||
        auditLog.entityId ||
        ""
      );
    }
    return auditLog.entityId || auditLog.entityType;
  }
}
