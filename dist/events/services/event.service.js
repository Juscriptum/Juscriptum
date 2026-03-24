"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "EventService", {
    enumerable: true,
    get: function() {
        return EventService;
    }
});
const _common = require("@nestjs/common");
const _schedule = require("@nestjs/schedule");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _Evententity = require("../../database/entities/Event.entity");
const _Userentity = require("../../database/entities/User.entity");
const _validationutil = require("../../common/utils/validation.util");
const _notificationservice = require("../../notifications/services/notification.service");
const _notificationtypesenum = require("../../database/entities/enums/notification-types.enum");
const _scheduledtasks = require("../../common/runtime/scheduled-tasks");
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
let EventService = class EventService {
    /**
   * Get all events with filters
   */ async findAll(tenantId, filters = {}) {
        const query = this.eventRepository.createQueryBuilder("event").where("event.tenantId = :tenantId AND event.deletedAt IS NULL", {
            tenantId
        });
        // Filter by case
        if (filters.caseId) {
            query.andWhere("event.caseId = :caseId", {
                caseId: filters.caseId
            });
        }
        // Filter by type
        if (filters.type) {
            query.andWhere("event.type = :type", {
                type: filters.type
            });
        }
        // Filter by status
        if (filters.status) {
            query.andWhere("event.status = :status", {
                status: filters.status
            });
        } else {
            query.andWhere("event.status != :archivedStatus", {
                archivedStatus: "archived"
            });
        }
        // Filter by date range
        if (filters.eventDateFrom && filters.eventDateTo) {
            query.andWhere("event.eventDate BETWEEN :eventDateFrom AND :eventDateTo", {
                eventDateFrom: new Date(filters.eventDateFrom),
                eventDateTo: new Date(filters.eventDateTo)
            });
        } else if (filters.eventDateFrom) {
            query.andWhere("event.eventDate >= :eventDateFrom", {
                eventDateFrom: new Date(filters.eventDateFrom)
            });
        } else if (filters.eventDateTo) {
            query.andWhere("event.eventDate <= :eventDateTo", {
                eventDateTo: new Date(filters.eventDateTo)
            });
        }
        // Search
        if (filters.search) {
            if ((0, _validationutil.detectSqlInjection)(filters.search)) {
                throw new _common.ForbiddenException("Invalid search query");
            }
            query.andWhere("(event.title ILIKE :search OR " + "event.description ILIKE :search OR " + "event.location ILIKE :search)", {
                search: `%${filters.search}%`
            });
        }
        // Sorting
        const sortBy = filters.sortBy || "eventDate";
        const sortOrder = filters.sortOrder || "ASC";
        query.orderBy(`event.${sortBy}`, sortOrder);
        // Pagination
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;
        query.skip(skip).take(limit);
        // Include relations
        query.leftJoinAndSelect("event.case", "case");
        query.leftJoinAndSelect("event.createdByUser", "createdByUser");
        const [data, total] = await query.getManyAndCount();
        return {
            data,
            total,
            page,
            limit
        };
    }
    /**
   * Get event by ID
   */ async findById(tenantId, id) {
        const event = await this.eventRepository.findOne({
            where: {
                id,
                tenantId,
                deletedAt: (0, _typeorm1.IsNull)()
            },
            relations: [
                "case",
                "createdByUser"
            ]
        });
        if (!event) {
            throw new _common.NotFoundException("Подію не знайдено");
        }
        return event;
    }
    /**
   * Create new event
   */ async create(tenantId, userId, dto) {
        const event = this.eventRepository.create({
            tenantId,
            ...dto,
            endDate: dto.endDate ? new Date(dto.endDate) : undefined,
            recurrenceEndDate: dto.recurrenceEndDate ? new Date(dto.recurrenceEndDate) : undefined,
            status: "scheduled",
            reminderSent: false,
            reminderValue: dto.reminderValue ?? dto.reminderDaysBefore ?? 1,
            reminderUnit: dto.reminderUnit || "days",
            reminderDaysBefore: this.toLegacyReminderDays(dto.reminderValue ?? dto.reminderDaysBefore, dto.reminderUnit),
            isRecurring: Boolean(dto.isRecurring),
            recurrencePattern: dto.isRecurring ? dto.recurrencePattern || "weekly" : null,
            recurrenceInterval: dto.isRecurring ? Math.max(1, dto.recurrenceInterval || 1) : null,
            createdBy: userId,
            updatedBy: userId
        });
        const savedEvent = await this.eventRepository.save(event);
        // Reminder delivery is handled by the scheduled reminder processor.
        await this.scheduleReminders(savedEvent);
        return savedEvent;
    }
    /**
   * Update event
   */ async update(tenantId, id, userId, dto) {
        const event = await this.findById(tenantId, id);
        Object.assign(event, dto);
        if (dto.endDate !== undefined) {
            event.endDate = dto.endDate ? new Date(dto.endDate) : null;
        }
        if (dto.recurrenceEndDate !== undefined) {
            event.recurrenceEndDate = dto.recurrenceEndDate ? new Date(dto.recurrenceEndDate) : null;
        }
        if (dto.reminderValue !== undefined || dto.reminderDaysBefore !== undefined) {
            const reminderValue = dto.reminderValue ?? dto.reminderDaysBefore ?? event.reminderValue;
            const reminderUnit = dto.reminderUnit || event.reminderUnit || "days";
            event.reminderValue = reminderValue;
            event.reminderUnit = reminderUnit;
            event.reminderDaysBefore = this.toLegacyReminderDays(reminderValue, reminderUnit);
        } else if (dto.reminderUnit !== undefined) {
            event.reminderUnit = dto.reminderUnit;
            event.reminderDaysBefore = this.toLegacyReminderDays(event.reminderValue, dto.reminderUnit);
        }
        if (dto.isRecurring !== undefined) {
            event.isRecurring = dto.isRecurring;
            if (!dto.isRecurring) {
                event.recurrencePattern = null;
                event.recurrenceInterval = null;
                event.recurrenceEndDate = null;
            }
        }
        if (dto.recurrencePattern !== undefined) {
            event.recurrencePattern = dto.recurrencePattern;
        }
        if (dto.recurrenceInterval !== undefined) {
            event.recurrenceInterval = Math.max(1, dto.recurrenceInterval);
        }
        event.updatedBy = userId;
        if (dto.eventDate || dto.reminderDaysBefore !== undefined || dto.reminderValue !== undefined || dto.reminderUnit !== undefined || dto.status) {
            event.reminderSent = false;
        }
        return this.eventRepository.save(event);
    }
    /**
   * Delete event (soft delete)
   */ async delete(tenantId, id, userId) {
        const event = await this.findById(tenantId, id);
        await this.eventRepository.update({
            id,
            tenantId
        }, {
            deletedAt: new Date(),
            updatedBy: userId
        });
    }
    /**
   * Get upcoming events
   */ async getUpcoming(tenantId, days = 30) {
        const now = new Date();
        const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        return this.eventRepository.find({
            where: {
                tenantId,
                eventDate: (0, _typeorm1.Between)(now, futureDate),
                status: (0, _typeorm1.In)([
                    "scheduled",
                    "in_progress"
                ]),
                deletedAt: (0, _typeorm1.IsNull)()
            },
            order: {
                eventDate: "ASC",
                eventTime: "ASC"
            },
            relations: [
                "case"
            ]
        });
    }
    /**
   * Get calendar events (for integration)
   */ async getCalendarEvents(tenantId, startDate, endDate) {
        const normalizedStart = new Date(startDate);
        normalizedStart.setHours(0, 0, 0, 0);
        const normalizedEnd = new Date(endDate);
        normalizedEnd.setHours(23, 59, 59, 999);
        return this.eventRepository.createQueryBuilder("event").leftJoinAndSelect("event.case", "case").where("event.tenantId = :tenantId", {
            tenantId
        }).andWhere("event.deletedAt IS NULL").andWhere("event.status != :archivedStatus", {
            archivedStatus: "archived"
        }).andWhere("event.eventDate <= :normalizedEnd", {
            normalizedEnd
        }).andWhere(`(
          (event.endDate IS NOT NULL AND event.endDate >= :normalizedStart)
          OR (event.endDate IS NULL AND event.eventDate >= :normalizedStart)
          OR event.recurrencePattern IS NOT NULL
        )`, {
            normalizedStart
        }).orderBy("event.eventDate", "ASC").addOrderBy("event.eventTime", "ASC").getMany();
    }
    /**
   * Deliver event reminders that have entered their notification window
   */ async processDueReminders() {
        if (!(0, _scheduledtasks.shouldRunScheduledTasks)()) {
            return;
        }
        const now = new Date();
        const events = await this.eventRepository.find({
            where: {
                reminderSent: false,
                status: (0, _typeorm1.In)([
                    "scheduled",
                    "in_progress"
                ]),
                eventDate: (0, _typeorm1.MoreThanOrEqual)(now),
                deletedAt: (0, _typeorm1.IsNull)()
            },
            order: {
                eventDate: "ASC"
            },
            take: 100
        });
        for (const event of events){
            const reminderAt = this.getEventStartDateTime(event);
            this.applyReminderOffset(reminderAt, event.reminderValue ?? event.reminderDaysBefore ?? 0, event.reminderUnit || "days");
            if (reminderAt > now) {
                continue;
            }
            await this.deliverReminder(event);
        }
    }
    /**
   * Schedule reminders
   */ async scheduleReminders(event) {
        event.reminderSent = false;
    }
    getEventStartDateTime(event) {
        const result = new Date(event.eventDate);
        const [hours = "09", minutes = "00"] = (event.eventTime || "09:00").split(":");
        result.setHours(Number(hours), Number(minutes), 0, 0);
        return result;
    }
    toLegacyReminderDays(reminderValue, reminderUnit) {
        if (reminderValue === undefined || reminderValue === null) {
            return 1;
        }
        switch(reminderUnit){
            case "minutes":
            case "hours":
                return 0;
            case "weeks":
                return reminderValue * 7;
            case "days":
            default:
                return reminderValue;
        }
    }
    applyReminderOffset(reminderAt, reminderValue, reminderUnit) {
        switch(reminderUnit){
            case "minutes":
                reminderAt.setMinutes(reminderAt.getMinutes() - reminderValue);
                return;
            case "hours":
                reminderAt.setHours(reminderAt.getHours() - reminderValue);
                return;
            case "weeks":
                reminderAt.setDate(reminderAt.getDate() - reminderValue * 7);
                return;
            case "days":
            default:
                reminderAt.setDate(reminderAt.getDate() - reminderValue);
        }
    }
    /**
   * Get event statistics
   */ async getStatistics(tenantId) {
        const now = new Date();
        const [total] = await this.eventRepository.createQueryBuilder("event").select("COUNT(*)").where("event.tenantId = :tenantId AND event.deletedAt IS NULL", {
            tenantId
        }).andWhere("event.status != :archivedStatus", {
            archivedStatus: "archived"
        }).getRawMany();
        const [upcoming] = await this.eventRepository.createQueryBuilder("event").select("COUNT(*)").where("event.tenantId = :tenantId AND event.eventDate >= :now AND event.status IN (:statuses) AND event.deletedAt IS NULL", {
            tenantId,
            now,
            statuses: [
                "scheduled",
                "in_progress"
            ]
        }).getRawMany();
        const [overdue] = await this.eventRepository.createQueryBuilder("event").select("COUNT(*)").where("event.tenantId = :tenantId AND event.eventDate < :now AND event.status = :status AND event.deletedAt IS NULL", {
            tenantId,
            now,
            status: "scheduled"
        }).getRawMany();
        const byType = await this.eventRepository.createQueryBuilder("event").select("event.type", "COUNT(*) as count").where("event.tenantId = :tenantId AND event.deletedAt IS NULL", {
            tenantId
        }).andWhere("event.status != :archivedStatus", {
            archivedStatus: "archived"
        }).groupBy("event.type").getRawMany();
        const byStatus = await this.eventRepository.createQueryBuilder("event").select("event.status", "COUNT(*) as count").where("event.tenantId = :tenantId AND event.deletedAt IS NULL", {
            tenantId
        }).andWhere("event.status != :archivedStatus", {
            archivedStatus: "archived"
        }).groupBy("event.status").getRawMany();
        return {
            total: parseInt(total[0].count),
            upcoming: parseInt(upcoming[0].count),
            overdue: parseInt(overdue[0].count),
            byType: byType.reduce((acc, row)=>{
                acc[row.type] = parseInt(row.count);
                return acc;
            }, {}),
            byStatus: byStatus.reduce((acc, row)=>{
                acc[row.status] = parseInt(row.count);
                return acc;
            }, {})
        };
    }
    async deliverReminder(event) {
        if (!event.createdBy) {
            return;
        }
        const recipient = await this.userRepository.findOne({
            where: {
                id: event.createdBy,
                tenantId: event.tenantId,
                deletedAt: (0, _typeorm1.IsNull)()
            }
        });
        if (!recipient) {
            return;
        }
        await this.notificationService.create(event.tenantId, recipient.id, {
            type: _notificationtypesenum.NotificationType.EVENT_REMINDER,
            title: `Нагадування: ${event.title}`,
            body: `Подія "${event.title}" запланована на ${this.getEventStartDateTime(event).toISOString()}.`,
            channel: recipient.email ? _notificationtypesenum.NotificationChannel.EMAIL : _notificationtypesenum.NotificationChannel.IN_APP,
            priority: _notificationtypesenum.NotificationPriority.HIGH,
            userEmail: recipient.email || undefined,
            data: {
                eventId: event.id,
                eventType: event.type,
                caseId: event.caseId,
                reminderDaysBefore: event.reminderDaysBefore,
                reminderValue: event.reminderValue,
                reminderUnit: event.reminderUnit
            }
        });
        event.reminderSent = true;
        await this.eventRepository.save(event);
    }
    constructor(eventRepository, userRepository, notificationService){
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }
};
_ts_decorate([
    (0, _schedule.Cron)(_schedule.CronExpression.EVERY_MINUTE),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], EventService.prototype, "processDueReminders", null);
EventService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_Evententity.Event)),
    _ts_param(1, (0, _typeorm.InjectRepository)(_Userentity.User)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _notificationservice.NotificationService === "undefined" ? Object : _notificationservice.NotificationService
    ])
], EventService);

//# sourceMappingURL=event.service.js.map