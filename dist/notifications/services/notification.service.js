"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "NotificationService", {
    enumerable: true,
    get: function() {
        return NotificationService;
    }
});
const _common = require("@nestjs/common");
const _schedule = require("@nestjs/schedule");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _Notificationentity = require("../../database/entities/Notification.entity");
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
let NotificationService = class NotificationService {
    /**
   * Create notification
   */ async create(tenantId, userId, dto) {
        const notification = this.notificationRepository.create({
            tenantId,
            userId: userId ?? null,
            type: dto.type,
            title: dto.title,
            body: dto.body,
            status: _notificationtypesenum.NotificationStatus.PENDING,
            priority: dto.priority || _notificationtypesenum.NotificationPriority.NORMAL,
            channel: dto.channel || _notificationtypesenum.NotificationChannel.IN_APP,
            platform: dto.platform || _notificationtypesenum.NotificationPlatform.WEB,
            data: dto.data || {},
            userEmail: dto.userEmail,
            userPhone: dto.userPhone
        });
        const savedNotification = await this.notificationRepository.save(notification);
        // Queue notification for asynchronous delivery processing.
        await this.queueNotification(savedNotification);
        return savedNotification;
    }
    /**
   * Get user notifications
   */ async getUserNotifications(tenantId, userId, filters = {}) {
        const query = this.notificationRepository.createQueryBuilder("notification").where("notification.tenantId = :tenantId AND notification.deletedAt IS NULL", {
            tenantId
        }).andWhere("notification.userId = :userId", {
            userId
        });
        if (filters.type) {
            query.andWhere("notification.type = :type", {
                type: filters.type
            });
        }
        if (filters.status) {
            query.andWhere("notification.status = :status", {
                status: filters.status
            });
        }
        if (filters.platform) {
            query.andWhere("notification.platform = :platform", {
                platform: filters.platform
            });
        }
        query.orderBy("notification.createdAt", "DESC");
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;
        query.skip(skip).take(limit);
        const [data, total] = await query.getManyAndCount();
        return {
            data,
            total,
            page,
            limit
        };
    }
    /**
   * Mark notification as read
   */ async markAsRead(tenantId, userId, notificationId) {
        const notification = await this.notificationRepository.findOne({
            where: {
                id: notificationId,
                tenantId,
                deletedAt: (0, _typeorm1.IsNull)()
            }
        });
        if (!notification) {
            throw new _common.NotFoundException("Notification not found");
        }
        if (notification.userId !== userId) {
            throw new _common.ForbiddenException("You can only mark your own notifications as read");
        }
        notification.readAt = new Date();
        notification.status = _notificationtypesenum.NotificationStatus.READ;
        await this.notificationRepository.save(notification);
    }
    /**
   * Mark all notifications as read
   */ async markAllAsRead(tenantId, userId, _filters = {}) {
        const result = await this.notificationRepository.update({
            tenantId,
            userId,
            readAt: (0, _typeorm1.IsNull)(),
            deletedAt: (0, _typeorm1.IsNull)()
        }, {
            readAt: new Date(),
            status: _notificationtypesenum.NotificationStatus.READ
        });
        return result.affected || 0;
    }
    /**
   * Delete notification
   */ async delete(tenantId, userId, notificationId) {
        const notification = await this.notificationRepository.findOne({
            where: {
                id: notificationId,
                tenantId
            }
        });
        if (!notification) {
            throw new _common.NotFoundException("Notification not found");
        }
        if (notification.userId !== userId) {
            throw new _common.ForbiddenException("You can only delete your own notifications");
        }
        notification.deletedAt = new Date();
        await this.notificationRepository.save(notification);
    }
    /**
   * Delete all notifications
   */ async deleteAll(tenantId, userId) {
        const result = await this.notificationRepository.update({
            tenantId,
            userId,
            deletedAt: (0, _typeorm1.IsNull)()
        }, {
            deletedAt: new Date()
        });
        return result.affected || 0;
    }
    /**
   * Get notification preferences
   */ async getPreferences(_tenantId, _userId) {
        return {
            emailEnabled: true,
            smsEnabled: false,
            pushEnabled: true,
            emailDigestEnabled: true,
            smsDigestEnabled: true,
            pushDigestEnabled: true,
            desktopEnabled: true,
            mobileEnabled: true,
            inAppEnabled: true
        };
    }
    /**
   * Update notification preferences
   */ async updatePreferences(_tenantId, _userId, _preferences) {
        // TODO: Implement when User entity has preferences field
        this.logger.log("Notification preferences update not yet implemented");
    }
    /**
   * Get unread count
   */ async getUnreadCount(tenantId, userId) {
        return this.notificationRepository.count({
            where: {
                tenantId,
                userId,
                readAt: (0, _typeorm1.IsNull)(),
                deletedAt: (0, _typeorm1.IsNull)()
            }
        });
    }
    /**
   * Process queued notifications
   */ async processQueuedNotifications() {
        if (!(0, _scheduledtasks.shouldRunScheduledTasks)()) {
            return;
        }
        const notifications = await this.notificationRepository.find({
            where: {
                status: (0, _typeorm1.In)([
                    _notificationtypesenum.NotificationStatus.PENDING,
                    _notificationtypesenum.NotificationStatus.QUEUED
                ]),
                deletedAt: (0, _typeorm1.IsNull)()
            },
            order: {
                createdAt: "ASC"
            },
            take: 100
        });
        for (const notification of notifications){
            await this.deliverNotification(notification);
        }
    }
    /**
   * Queue notification for delivery
   */ async queueNotification(notification) {
        notification.status = _notificationtypesenum.NotificationStatus.QUEUED;
        notification.data = {
            ...notification.data || {},
            queuedAt: new Date().toISOString()
        };
        await this.notificationRepository.save(notification);
        this.logger.debug(`Queued notification ${notification.id} for delivery`);
    }
    /**
   * Mark notification as delivered
   */ async markAsDelivered(tenantId, notificationId, userId, dto) {
        const notification = await this.notificationRepository.findOne({
            where: {
                id: notificationId,
                tenantId,
                deletedAt: (0, _typeorm1.IsNull)()
            }
        });
        if (!notification) {
            throw new _common.NotFoundException("Notification not found");
        }
        if (notification.userId !== userId) {
            throw new _common.ForbiddenException("You can only mark your own notifications as delivered");
        }
        notification.deliveredAt = new Date();
        notification.status = _notificationtypesenum.NotificationStatus.DELIVERED;
        if (dto?.platform) {
            notification.platform = dto.platform;
        }
        if (dto?.deviceInfo) {
            notification.data = {
                ...notification.data || {},
                deviceInfo: dto.deviceInfo,
                ipAddress: dto.ipAddress,
                userAgent: dto.userAgent
            };
        }
        await this.notificationRepository.save(notification);
    }
    /**
   * Mark notification as failed
   */ async markAsFailed(tenantId, notificationId, userId, error) {
        const notification = await this.notificationRepository.findOne({
            where: {
                id: notificationId,
                tenantId,
                deletedAt: (0, _typeorm1.IsNull)()
            }
        });
        if (!notification) {
            throw new _common.NotFoundException("Notification not found");
        }
        if (notification.userId !== userId) {
            throw new _common.ForbiddenException("You can only mark your own notifications as failed");
        }
        notification.status = _notificationtypesenum.NotificationStatus.FAILED;
        notification.errorMessage = error.errorMessage;
        notification.failedAt = new Date();
        notification.data = {
            ...notification.data || {},
            errorCode: error.errorCode
        };
        if (error.platform) {
            notification.platform = error.platform;
        }
        await this.notificationRepository.save(notification);
    }
    /**
   * Get notification statistics
   */ async getStatistics(tenantId) {
        const notifications = await this.notificationRepository.find({
            where: {
                tenantId,
                deletedAt: (0, _typeorm1.IsNull)()
            }
        });
        const stats = {
            total: notifications.length,
            byType: {},
            byStatus: {},
            byPlatform: {},
            unreadCount: 0
        };
        for (const n of notifications){
            // By type
            stats.byType[n.type] = (stats.byType[n.type] || 0) + 1;
            // By status
            const status = n.status || _notificationtypesenum.NotificationStatus.PENDING;
            stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
            // By platform
            if (n.platform) {
                stats.byPlatform[n.platform] = (stats.byPlatform[n.platform] || 0) + 1;
            }
            // Unread count
            if (!n.readAt) {
                stats.unreadCount++;
            }
        }
        return stats;
    }
    async deliverNotification(notification) {
        try {
            switch(notification.channel){
                case _notificationtypesenum.NotificationChannel.EMAIL:
                    if (!notification.userEmail) {
                        await this.failNotification(notification, "Recipient email is missing");
                        return;
                    }
                    notification.status = _notificationtypesenum.NotificationStatus.DELIVERED;
                    notification.deliveredAt = new Date();
                    notification.fromEmail = notification.fromEmail || process.env.EMAIL_FROM || "noreply@laworganizer.ua";
                    break;
                case _notificationtypesenum.NotificationChannel.SMS:
                    if (!notification.userPhone) {
                        await this.failNotification(notification, "Recipient phone is missing");
                        return;
                    }
                    notification.status = _notificationtypesenum.NotificationStatus.DELIVERED;
                    notification.deliveredAt = new Date();
                    notification.toPhone = notification.userPhone;
                    break;
                case _notificationtypesenum.NotificationChannel.PUSH:
                    if (!notification.deviceToken) {
                        await this.failNotification(notification, "Push device token is missing");
                        return;
                    }
                    notification.status = _notificationtypesenum.NotificationStatus.DELIVERED;
                    notification.deliveredAt = new Date();
                    break;
                case _notificationtypesenum.NotificationChannel.IN_APP:
                default:
                    notification.status = _notificationtypesenum.NotificationStatus.DELIVERED;
                    notification.deliveredAt = new Date();
                    break;
            }
            notification.errorMessage = null;
            notification.failedAt = null;
            notification.data = {
                ...notification.data || {},
                delivery: {
                    channel: notification.channel,
                    deliveredAt: notification.deliveredAt.toISOString()
                }
            };
            await this.notificationRepository.save(notification);
        } catch (error) {
            await this.failNotification(notification, error instanceof Error ? error.message : "Unknown delivery failure");
        }
    }
    async failNotification(notification, errorMessage) {
        notification.status = _notificationtypesenum.NotificationStatus.FAILED;
        notification.failedAt = new Date();
        notification.errorMessage = errorMessage;
        notification.data = {
            ...notification.data || {},
            delivery: {
                channel: notification.channel,
                failedAt: notification.failedAt.toISOString()
            }
        };
        await this.notificationRepository.save(notification);
        this.logger.warn(`Notification ${notification.id} delivery failed: ${errorMessage}`);
    }
    constructor(notificationRepository){
        this.notificationRepository = notificationRepository;
        this.logger = new _common.Logger(NotificationService.name);
    }
};
_ts_decorate([
    (0, _schedule.Cron)(_schedule.CronExpression.EVERY_MINUTE),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], NotificationService.prototype, "processQueuedNotifications", null);
NotificationService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_Notificationentity.Notification)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository
    ])
], NotificationService);

//# sourceMappingURL=notification.service.js.map