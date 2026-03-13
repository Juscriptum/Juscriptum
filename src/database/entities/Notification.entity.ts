import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./User.entity";
import { Organization } from "./Organization.entity";
import {
  NotificationType,
  NotificationStatus,
  NotificationPriority,
  NotificationChannel,
} from "./enums/notification-types.enum";

/**
 * Notification Entity
 */
@Entity("notifications")
@Index("idx_notifications_tenant_id", ["tenantId"])
@Index("idx_notifications_user_id", ["userId"])
@Index("idx_notifications_status", ["status"])
@Index("idx_notifications_type", ["type"])
@Index("idx_notifications_created_at", ["createdAt"])
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId: string;

  // User Reference
  @Column({ name: "user_id", type: "uuid", nullable: true })
  userId: string | null;

  @Column({ name: "device_id", type: "uuid", nullable: true })
  deviceId: string | null;

  @Column({ name: "platform", type: "varchar", length: 50, nullable: true })
  platform: string | null; // 'web' | 'mobile' | 'in_app' | 'desktop'

  @Column({ name: "user_email", type: "varchar", length: 255, nullable: true })
  userEmail: string | null;

  @Column({ name: "user_phone", type: "varchar", length: 20, nullable: true })
  userPhone: string | null;

  // Notification Details
  @Column({
    type: "varchar",
    length: 100,
  })
  type: NotificationType;

  @Column({
    type: "varchar",
    length: 50,
  })
  status: NotificationStatus;

  @Column({
    type: "varchar",
    length: 20,
    default: NotificationPriority.NORMAL,
  })
  priority: NotificationPriority;

  @Column({ type: "varchar", length: 20, default: NotificationChannel.EMAIL })
  channel: NotificationChannel;

  @Column({ type: "varchar", length: 500 })
  title: string;

  @Column({ type: "text" })
  body: string;

  @Column({ type: "text", nullable: true })
  data: Record<string, any> | null;

  // Template Reference (for email)
  @Column({ name: "template_id", type: "uuid", nullable: true })
  templateId: string | null;

  // Email-specific
  @Column({ name: "from_email", type: "varchar", length: 255, nullable: true })
  fromEmail: string | null;

  // SMS-specific
  @Column({ name: "to_phone", type: "varchar", length: 20, nullable: true })
  toPhone: string | null;

  // Tracking
  @Column({
    name: "device_token",
    type: "varchar",
    length: 500,
    nullable: true,
  })
  deviceToken: string | null;

  @Column({ name: "read_at", type: "datetime", nullable: true })
  readAt: Date | null;

  @Column({ name: "delivered_at", type: "datetime", nullable: true })
  deliveredAt: Date | null;

  @Column({ name: "opened_at", type: "datetime", nullable: true })
  openedAt: Date | null;

  @Column({ name: "clicked_at", type: "datetime", nullable: true })
  clickedAt: Date | null;

  @Column({ name: "failed_at", type: "datetime", nullable: true })
  failedAt: Date | null;

  @Column({ name: "error_message", type: "text", nullable: true })
  errorMessage: string | null;

  // Soft Delete
  @DeleteDateColumn({ name: "deleted_at", type: "datetime" })
  deletedAt: Date | null;

  // Timestamps
  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt: Date;

  @Column({ name: "created_by", type: "uuid", nullable: true })
  createdBy: string | null;

  @Column({ name: "updated_by", type: "uuid", nullable: true })
  updatedBy: string | null;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "tenant_id" })
  organization: Organization;
}
