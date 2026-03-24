import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { PlatformAdminUser } from "./PlatformAdminUser.entity";

@Entity("platform_admin_refresh_tokens")
@Index("idx_platform_admin_refresh_tokens_user_id", ["platformAdminUserId"])
@Index("idx_platform_admin_refresh_tokens_token", ["token"], { unique: true })
@Index("idx_platform_admin_refresh_tokens_expires_at", ["expiresAt"])
export class PlatformAdminRefreshToken {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "platform_admin_user_id", type: "uuid" })
  platformAdminUserId: string;

  @Column({ type: "text" })
  token: string;

  @Column({ name: "device_info", type: "json" })
  deviceInfo: Record<string, unknown>;

  @Column({ name: "ip_address", type: "varchar", length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: "user_agent", type: "text", nullable: true })
  userAgent: string | null;

  @Column({ name: "expires_at", type: "datetime" })
  expiresAt: Date;

  @Column({ name: "revoked_at", type: "datetime", nullable: true })
  revokedAt: Date | null;

  @Column({ name: "replaced_by", type: "uuid", nullable: true })
  replacedBy: string | null;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt: Date;

  @ManyToOne(() => PlatformAdminUser, { onDelete: "CASCADE" })
  @JoinColumn({ name: "platform_admin_user_id" })
  platformAdminUser: PlatformAdminUser;
}
