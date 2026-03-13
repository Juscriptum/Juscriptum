import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User.entity";
import { Organization } from "./Organization.entity";

@Entity("refresh_tokens")
@Index("idx_refresh_tokens_user_id", ["userId"])
@Index("idx_refresh_tokens_tenant_id", ["tenantId"])
@Index("idx_refresh_tokens_token", ["token"])
@Index("idx_refresh_tokens_expires_at", ["expiresAt"])
export class RefreshToken {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId: string;

  @Column({ type: "text" })
  token: string;

  @Column({ name: "device_info", type: "json" })
  deviceInfo: Record<string, any>;

  @Column({ name: "ip_address", type: "varchar", length: 45, nullable: true })
  ipAddress: string;

  @Column({ name: "user_agent", type: "text", nullable: true })
  userAgent: string;

  @Column({ name: "expires_at", type: "datetime" })
  expiresAt: Date;

  @Column({ name: "revoked_at", type: "datetime", nullable: true })
  revokedAt: Date;

  @Column({ name: "replaced_by", type: "uuid", nullable: true })
  replacedBy: string;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Organization, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  organization: Organization;
}
