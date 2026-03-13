import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { In, IsNull, Repository } from "typeorm";
import { Notification } from "../../database/entities/Notification.entity";
import {
  NotificationType,
  NotificationStatus,
  NotificationPriority,
  NotificationChannel,
  NotificationPlatform,
} from "../../database/entities/enums/notification-types.enum";
import { shouldRunScheduledTasks } from "../../common/runtime/scheduled-tasks";

/**
 * Notification Service
 * Handles all notification operations
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  /**
   * Create notification
   */
  async create(
    tenantId: string,
    userId: string | null,
    dto: {
      type: NotificationType;
      title: string;
      body: string;
      data?: Record<string, unknown>;
      platform?: NotificationPlatform;
      priority?: NotificationPriority;
      channel?: NotificationChannel;
      userEmail?: string;
      userPhone?: string;
    },
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      tenantId,
      userId: userId ?? null,
      type: dto.type,
      title: dto.title,
      body: dto.body,
      status: NotificationStatus.PENDING,
      priority: dto.priority || NotificationPriority.NORMAL,
      channel: dto.channel || NotificationChannel.IN_APP,
      platform: dto.platform || NotificationPlatform.WEB,
      data: dto.data || {},
      userEmail: dto.userEmail,
      userPhone: dto.userPhone,
    });

    const savedNotification =
      await this.notificationRepository.save(notification);

    // Queue notification for asynchronous delivery processing.
    await this.queueNotification(savedNotification);

    return savedNotification;
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    tenantId: string,
    userId: string,
    filters: {
      type?: NotificationType;
      status?: NotificationStatus;
      platform?: NotificationPlatform;
      limit?: number;
      page?: number;
    } = {},
  ): Promise<{
    data: Notification[];
    total: number;
    page: number;
    limit: number;
  }> {
    const query = this.notificationRepository
      .createQueryBuilder("notification")
      .where(
        "notification.tenantId = :tenantId AND notification.deletedAt IS NULL",
        { tenantId },
      )
      .andWhere("notification.userId = :userId", { userId });

    if (filters.type) {
      query.andWhere("notification.type = :type", { type: filters.type });
    }

    if (filters.status) {
      query.andWhere("notification.status = :status", {
        status: filters.status,
      });
    }

    if (filters.platform) {
      query.andWhere("notification.platform = :platform", {
        platform: filters.platform,
      });
    }

    query.orderBy("notification.createdAt", "DESC");

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    query.skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();

    return { data, total, page, limit };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(
    tenantId: string,
    userId: string,
    notificationId: string,
  ): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, tenantId, deletedAt: IsNull() },
    });

    if (!notification) {
      throw new NotFoundException("Notification not found");
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException(
        "You can only mark your own notifications as read",
      );
    }

    notification.readAt = new Date();
    notification.status = NotificationStatus.READ;
    await this.notificationRepository.save(notification);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(
    tenantId: string,
    userId: string,
    _filters: {
      type?: NotificationType;
      platform?: NotificationPlatform;
      beforeDate?: string;
      afterDate?: string;
      limit?: number;
    } = {},
  ): Promise<number> {
    const result = await this.notificationRepository.update(
      { tenantId, userId, readAt: IsNull(), deletedAt: IsNull() },
      { readAt: new Date(), status: NotificationStatus.READ },
    );

    return result.affected || 0;
  }

  /**
   * Delete notification
   */
  async delete(
    tenantId: string,
    userId: string,
    notificationId: string,
  ): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, tenantId },
    });

    if (!notification) {
      throw new NotFoundException("Notification not found");
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException(
        "You can only delete your own notifications",
      );
    }

    notification.deletedAt = new Date();
    await this.notificationRepository.save(notification);
  }

  /**
   * Delete all notifications
   */
  async deleteAll(tenantId: string, userId: string): Promise<number> {
    const result = await this.notificationRepository.update(
      { tenantId, userId, deletedAt: IsNull() },
      { deletedAt: new Date() },
    );

    return result.affected || 0;
  }

  /**
   * Get notification preferences
   */
  async getPreferences(
    _tenantId: string,
    _userId: string,
  ): Promise<{
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    emailDigestEnabled: boolean;
    smsDigestEnabled: boolean;
    pushDigestEnabled: boolean;
    desktopEnabled: boolean;
    mobileEnabled: boolean;
    inAppEnabled: boolean;
  }> {
    return {
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      emailDigestEnabled: true,
      smsDigestEnabled: true,
      pushDigestEnabled: true,
      desktopEnabled: true,
      mobileEnabled: true,
      inAppEnabled: true,
    };
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    _tenantId: string,
    _userId: string,
    _preferences: Record<string, boolean>,
  ): Promise<void> {
    // TODO: Implement when User entity has preferences field
    this.logger.log("Notification preferences update not yet implemented");
  }

  /**
   * Get unread count
   */
  async getUnreadCount(tenantId: string, userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { tenantId, userId, readAt: IsNull(), deletedAt: IsNull() },
    });
  }

  /**
   * Process queued notifications
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processQueuedNotifications(): Promise<void> {
    if (!shouldRunScheduledTasks()) {
      return;
    }

    const notifications = await this.notificationRepository.find({
      where: {
        status: In([NotificationStatus.PENDING, NotificationStatus.QUEUED]),
        deletedAt: IsNull(),
      },
      order: {
        createdAt: "ASC",
      },
      take: 100,
    });

    for (const notification of notifications) {
      await this.deliverNotification(notification);
    }
  }

  /**
   * Queue notification for delivery
   */
  private async queueNotification(notification: Notification): Promise<void> {
    notification.status = NotificationStatus.QUEUED;
    notification.data = {
      ...(notification.data || {}),
      queuedAt: new Date().toISOString(),
    };

    await this.notificationRepository.save(notification);
    this.logger.debug(`Queued notification ${notification.id} for delivery`);
  }

  /**
   * Mark notification as delivered
   */
  async markAsDelivered(
    tenantId: string,
    notificationId: string,
    userId: string,
    dto?: {
      platform?: NotificationPlatform;
      deviceInfo?: Record<string, unknown>;
      ipAddress?: string;
      userAgent?: string;
    },
  ): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, tenantId, deletedAt: IsNull() },
    });

    if (!notification) {
      throw new NotFoundException("Notification not found");
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException(
        "You can only mark your own notifications as delivered",
      );
    }

    notification.deliveredAt = new Date();
    notification.status = NotificationStatus.DELIVERED;

    if (dto?.platform) {
      notification.platform = dto.platform;
    }

    if (dto?.deviceInfo) {
      notification.data = {
        ...(notification.data || {}),
        deviceInfo: dto.deviceInfo,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
      };
    }

    await this.notificationRepository.save(notification);
  }

  /**
   * Mark notification as failed
   */
  async markAsFailed(
    tenantId: string,
    notificationId: string,
    userId: string,
    error: {
      errorCode: string;
      errorMessage: string;
      platform?: NotificationPlatform | "push" | "in_app";
    },
  ): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, tenantId, deletedAt: IsNull() },
    });

    if (!notification) {
      throw new NotFoundException("Notification not found");
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException(
        "You can only mark your own notifications as failed",
      );
    }

    notification.status = NotificationStatus.FAILED;
    notification.errorMessage = error.errorMessage;
    notification.failedAt = new Date();
    notification.data = {
      ...(notification.data || {}),
      errorCode: error.errorCode,
    };

    if (error.platform) {
      notification.platform = error.platform as NotificationPlatform;
    }

    await this.notificationRepository.save(notification);
  }

  /**
   * Get notification statistics
   */
  async getStatistics(tenantId: string): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    byPlatform: Record<string, number>;
    unreadCount: number;
  }> {
    const notifications = await this.notificationRepository.find({
      where: { tenantId, deletedAt: IsNull() },
    });

    const stats = {
      total: notifications.length,
      byType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      byPlatform: {} as Record<string, number>,
      unreadCount: 0,
    };

    for (const n of notifications) {
      // By type
      stats.byType[n.type] = (stats.byType[n.type] || 0) + 1;

      // By status
      const status = n.status || NotificationStatus.PENDING;
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

  private async deliverNotification(notification: Notification): Promise<void> {
    try {
      switch (notification.channel) {
        case NotificationChannel.EMAIL:
          if (!notification.userEmail) {
            await this.failNotification(
              notification,
              "Recipient email is missing",
            );
            return;
          }

          notification.status = NotificationStatus.DELIVERED;
          notification.deliveredAt = new Date();
          notification.fromEmail =
            notification.fromEmail ||
            process.env.EMAIL_FROM ||
            "noreply@laworganizer.ua";
          break;
        case NotificationChannel.SMS:
          if (!notification.userPhone) {
            await this.failNotification(
              notification,
              "Recipient phone is missing",
            );
            return;
          }

          notification.status = NotificationStatus.DELIVERED;
          notification.deliveredAt = new Date();
          notification.toPhone = notification.userPhone;
          break;
        case NotificationChannel.PUSH:
          if (!notification.deviceToken) {
            await this.failNotification(
              notification,
              "Push device token is missing",
            );
            return;
          }

          notification.status = NotificationStatus.DELIVERED;
          notification.deliveredAt = new Date();
          break;
        case NotificationChannel.IN_APP:
        default:
          notification.status = NotificationStatus.DELIVERED;
          notification.deliveredAt = new Date();
          break;
      }

      notification.errorMessage = null;
      notification.failedAt = null;
      notification.data = {
        ...(notification.data || {}),
        delivery: {
          channel: notification.channel,
          deliveredAt: notification.deliveredAt.toISOString(),
        },
      };

      await this.notificationRepository.save(notification);
    } catch (error: unknown) {
      await this.failNotification(
        notification,
        error instanceof Error ? error.message : "Unknown delivery failure",
      );
    }
  }

  private async failNotification(
    notification: Notification,
    errorMessage: string,
  ): Promise<void> {
    notification.status = NotificationStatus.FAILED;
    notification.failedAt = new Date();
    notification.errorMessage = errorMessage;
    notification.data = {
      ...(notification.data || {}),
      delivery: {
        channel: notification.channel,
        failedAt: notification.failedAt.toISOString(),
      },
    };

    await this.notificationRepository.save(notification);
    this.logger.warn(
      `Notification ${notification.id} delivery failed: ${errorMessage}`,
    );
  }
}
