"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DashboardService", {
    enumerable: true,
    get: function() {
        return DashboardService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _Caseentity = require("../../database/entities/Case.entity");
const _Cliententity = require("../../database/entities/Client.entity");
const _Evententity = require("../../database/entities/Event.entity");
const _AuditLogentity = require("../../database/entities/AuditLog.entity");
const _Invoiceentity = require("../../database/entities/Invoice.entity");
const _subscriptionenum = require("../../database/entities/enums/subscription.enum");
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
let DashboardService = class DashboardService {
    /**
   * Get dashboard statistics for a tenant
   */ async getDashboardStats(tenantId, query) {
        const { days = 30, startDate, endDate } = query;
        // Calculate date range
        const now = new Date();
        const start = startDate ? new Date(startDate) : new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : now;
        // Get previous period for comparison
        const daysInMillis = end.getTime() - start.getTime();
        const previousStart = new Date(start.getTime() - daysInMillis);
        const previousEnd = new Date(end.getTime() - daysInMillis);
        // Fetch data in parallel
        const [totalClients, activeCases, totalCases, totalRevenue, previousTotalRevenue, recentCases, upcomingEvents, activityFeed, invoicesByDate] = await Promise.all([
            // Total clients
            this.clientRepository.count({
                where: {
                    tenantId,
                    status: "active",
                    deletedAt: null
                }
            }),
            // Active cases
            this.caseRepository.count({
                where: {
                    tenantId,
                    status: "active",
                    deletedAt: null
                }
            }),
            // Total cases
            this.caseRepository.count({
                where: {
                    tenantId,
                    deletedAt: null
                }
            }),
            // Total revenue in current period
            this.invoiceRepository.createQueryBuilder("invoice").select("COALESCE(SUM(invoice.totalAmount), 0)", "total").where("invoice.tenantId = :tenantId", {
                tenantId
            }).andWhere("invoice.status IN (:...statuses)", {
                statuses: [
                    "paid",
                    "sent",
                    "viewed"
                ]
            }).andWhere("invoice.deletedAt IS NULL").andWhere("invoice.invoiceDate BETWEEN :start AND :end", {
                start: start.toISOString().split("T")[0],
                end: end.toISOString().split("T")[0]
            }).getRawOne(),
            // Previous period revenue for comparison
            this.invoiceRepository.createQueryBuilder("invoice").select("COALESCE(SUM(invoice.totalAmount), 0)", "total").where("invoice.tenantId = :tenantId", {
                tenantId
            }).andWhere("invoice.status IN (:...statuses)", {
                statuses: [
                    "paid",
                    "sent",
                    "viewed"
                ]
            }).andWhere("invoice.deletedAt IS NULL").andWhere("invoice.invoiceDate BETWEEN :start AND :end", {
                start: previousStart.toISOString().split("T")[0],
                end: previousEnd.toISOString().split("T")[0]
            }).getRawOne(),
            // Recent cases
            this.caseRepository.find({
                where: {
                    tenantId,
                    deletedAt: null
                },
                order: {
                    createdAt: "DESC"
                },
                take: 5,
                relations: [
                    "client"
                ]
            }),
            // Upcoming events
            this.eventRepository.find({
                where: {
                    tenantId,
                    eventDate: (0, _typeorm1.MoreThan)(new Date()),
                    status: "scheduled",
                    deletedAt: null
                },
                order: {
                    eventDate: "ASC"
                },
                take: 5,
                relations: [
                    "case"
                ]
            }),
            // Activity feed
            this.auditLogRepository.find({
                where: {
                    tenantId,
                    createdAt: (0, _typeorm1.Between)(start, end)
                },
                order: {
                    createdAt: "DESC"
                },
                take: 10,
                relations: [
                    "user"
                ]
            }),
            // Revenue data for chart (daily aggregation)
            this.invoiceRepository.createQueryBuilder("invoice").select("invoice.invoiceDate", "date").addSelect("COALESCE(SUM(invoice.totalAmount), 0)", "amount").addSelect("COALESCE(SUM(invoice.paidAmount), 0)", "paidAmount").where("invoice.tenantId = :tenantId", {
                tenantId
            }).andWhere("invoice.deletedAt IS NULL").andWhere("invoice.invoiceDate BETWEEN :start AND :end", {
                start: start.toISOString().split("T")[0],
                end: end.toISOString().split("T")[0]
            }).groupBy("invoice.invoiceDate").orderBy("invoice.invoiceDate", "ASC").getRawMany()
        ]);
        // Calculate pending tasks
        const pendingTasks = await this.getPendingTasks(tenantId, now);
        // Calculate revenue change percentage
        const currentRevenue = parseFloat(totalRevenue.total) || 0;
        const previousRevenue = parseFloat(previousTotalRevenue.total) || 0;
        const revenueChange = previousRevenue > 0 ? (currentRevenue - previousRevenue) / previousRevenue * 100 : currentRevenue > 0 ? 100 : 0;
        // Build stat cards
        const stats = [
            {
                label: "Всього клієнтів",
                value: totalClients,
                change: 0,
                trend: "neutral",
                icon: "users"
            },
            {
                label: "Активні справи",
                value: activeCases,
                change: 0,
                trend: "neutral",
                icon: "briefcase"
            },
            {
                label: "Всього справ",
                value: totalCases,
                change: 0,
                trend: "neutral",
                icon: "folder"
            },
            {
                label: "Дохід",
                value: currentRevenue,
                change: revenueChange,
                trend: revenueChange > 0 ? "up" : revenueChange < 0 ? "down" : "neutral",
                icon: "dollar-sign"
            }
        ];
        // Build recent cases DTOs
        const recentCasesDtos = recentCases.map((c)=>({
                id: c.id,
                caseNumber: c.caseNumber,
                title: c.title || "Без назви",
                clientName: this.formatClientName(c.client),
                status: this.translateCaseStatus(c.status),
                priority: this.translatePriority(c.priority),
                nextHearingDate: c.nextHearingDate || c.startDate
            }));
        // Build upcoming events DTOs
        const upcomingEventsDtos = upcomingEvents.map((e)=>({
                id: e.id,
                title: e.title,
                type: this.translateEventType(e.type),
                eventDate: e.eventDate,
                location: e.location || e.courtRoom || "Не вказано",
                caseNumber: e.case ? e.case.caseNumber : "Немає"
            }));
        // Build activity feed DTOs
        const activityFeedDtos = activityFeed.map((a)=>({
                id: a.id,
                userName: a.user ? `${a.user.firstName} ${a.user.lastName}` : "Система",
                action: this.translateAuditAction(a.action),
                entityType: this.translateEntityType(a.entityType),
                entityDescription: this.getEntityDescription(a),
                timestamp: a.createdAt
            }));
        // Build revenue data DTOs
        const revenueDataDtos = invoicesByDate.map((d)=>({
                date: new Date(d.date),
                amount: parseFloat(d.amount),
                paidAmount: parseFloat(d.paidAmount)
            }));
        return {
            stats,
            recentCases: recentCasesDtos,
            upcomingEvents: upcomingEventsDtos,
            activityFeed: activityFeedDtos,
            pendingTasks,
            revenueData: revenueDataDtos
        };
    }
    /**
   * Get pending tasks (deadlines, hearings, etc.)
   */ async getPendingTasks(tenantId, now) {
        const tasks = [];
        // Get cases with upcoming deadlines (next 7 days)
        const deadlineCases = await this.caseRepository.find({
            where: {
                tenantId,
                deadlineDate: (0, _typeorm1.MoreThan)(now),
                status: "active",
                deletedAt: null
            },
            relations: [
                "client"
            ],
            take: 10
        });
        deadlineCases.forEach((c)=>{
            if (c.deadlineDate) {
                tasks.push({
                    id: `case-deadline-${c.id}`,
                    title: `Дедлайн: ${c.title || c.caseNumber}`,
                    type: "deadline",
                    dueDate: c.deadlineDate,
                    caseNumber: c.caseNumber,
                    priority: this.translatePriority(c.priority)
                });
            }
        });
        // Get upcoming hearings (next 7 days)
        const hearingEvents = await this.eventRepository.find({
            where: {
                tenantId,
                type: "hearing",
                eventDate: (0, _typeorm1.Between)(now, new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)),
                status: "scheduled",
                deletedAt: null
            },
            relations: [
                "case",
                "case.client"
            ],
            take: 10
        });
        hearingEvents.forEach((e)=>{
            tasks.push({
                id: `event-${e.id}`,
                title: `Судове засідання: ${e.title}`,
                type: "hearing",
                dueDate: e.eventDate,
                caseNumber: e.case ? e.case.caseNumber : "Немає",
                priority: "high"
            });
        });
        // Sort by due date
        tasks.sort((a, b)=>a.dueDate.getTime() - b.dueDate.getTime());
        return tasks.slice(0, 10);
    }
    /**
   * Format client name
   */ formatClientName(client) {
        if (!client) return "Невідомий клієнт";
        if (client.type === "legal_entity") {
            return client.companyName || "Юридична особа";
        }
        return `${client.firstName || ""} ${client.lastName || ""}`.trim() || "Фізична особа";
    }
    /**
   * Translate case status to Ukrainian
   */ translateCaseStatus(status) {
        const statusMap = {
            draft: "Чернетка",
            active: "Активна",
            on_hold: "Призупинена",
            closed: "Закрита",
            archived: "Архівна"
        };
        return statusMap[status] || status;
    }
    /**
   * Translate priority to Ukrainian
   */ translatePriority(priority) {
        const priorityMap = {
            low: "Низький",
            medium: "Середній",
            high: "Високий",
            urgent: "Терміновий"
        };
        return priorityMap[priority] || priority;
    }
    /**
   * Translate event type to Ukrainian
   */ translateEventType(type) {
        const typeMap = {
            hearing: "Судове засідання",
            deadline: "Дедлайн",
            meeting: "Зустріч",
            court_sitting: "Судове слухання",
            other: "Інше"
        };
        return typeMap[type] || type;
    }
    /**
   * Translate audit action to Ukrainian
   */ translateAuditAction(action) {
        const actionMap = {
            [_subscriptionenum.AuditAction.CREATE]: "Створено",
            [_subscriptionenum.AuditAction.UPDATE]: "Оновлено",
            [_subscriptionenum.AuditAction.DELETE]: "Видалено",
            [_subscriptionenum.AuditAction.LOGIN]: "Увійшов",
            [_subscriptionenum.AuditAction.LOGOUT]: "Вийшов",
            [_subscriptionenum.AuditAction.PERMISSION_CHANGE]: "Змінено права"
        };
        return actionMap[action] || action;
    }
    /**
   * Translate entity type to Ukrainian
   */ translateEntityType(entityType) {
        const typeMap = {
            case: "справу",
            client: "клієнта",
            document: "документ",
            event: "подію",
            invoice: "рахунок",
            user: "користувача",
            organization: "організацію"
        };
        return typeMap[entityType] || entityType;
    }
    /**
   * Get entity description from audit log
   */ getEntityDescription(auditLog) {
        if (auditLog.entityType === "case" && auditLog.newValues?.caseNumber) {
            return `справа №${auditLog.newValues.caseNumber}`;
        }
        if (auditLog.entityType === "client" && auditLog.newValues) {
            const firstName = auditLog.newValues.firstName || "";
            const lastName = auditLog.newValues.lastName || "";
            const companyName = auditLog.newValues.companyName || "";
            return companyName || `${firstName} ${lastName}`.trim() || auditLog.entityId || "";
        }
        return auditLog.entityId || auditLog.entityType;
    }
    constructor(caseRepository, clientRepository, eventRepository, auditLogRepository, invoiceRepository){
        this.caseRepository = caseRepository;
        this.clientRepository = clientRepository;
        this.eventRepository = eventRepository;
        this.auditLogRepository = auditLogRepository;
        this.invoiceRepository = invoiceRepository;
    }
};
DashboardService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_Caseentity.Case)),
    _ts_param(1, (0, _typeorm.InjectRepository)(_Cliententity.Client)),
    _ts_param(2, (0, _typeorm.InjectRepository)(_Evententity.Event)),
    _ts_param(3, (0, _typeorm.InjectRepository)(_AuditLogentity.AuditLog)),
    _ts_param(4, (0, _typeorm.InjectRepository)(_Invoiceentity.Invoice)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository
    ])
], DashboardService);

//# sourceMappingURL=dashboard.service.js.map