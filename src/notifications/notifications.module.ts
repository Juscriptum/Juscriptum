import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NotificationService } from "./services/notification.service";
import { Notification } from "../database/entities/Notification.entity";

/**
 * Notifications Module
 *
 * Provides notification functionality supporting:
 * - Email notifications
 * - In-app notifications
 * - SMS notifications (optional)
 * - Notification preferences
 */
@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationsModule {}
