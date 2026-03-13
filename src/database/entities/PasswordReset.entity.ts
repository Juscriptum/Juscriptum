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

@Entity("password_resets")
@Index("idx_password_resets_user_id", ["userId"])
@Index("idx_password_resets_tenant_id", ["tenantId"])
@Index("idx_password_resets_token", ["token"])
export class PasswordReset {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId: string;

  @Column({ type: "varchar", length: 255 })
  token: string;

  @Column({ name: "used_at", type: "datetime", nullable: true })
  usedAt: Date;

  @Column({ name: "expires_at", type: "datetime" })
  expiresAt: Date;

  @Column({ name: "ip_address", type: "varchar", length: 45, nullable: true })
  ipAddress: string;

  @Column({ name: "user_agent", type: "text", nullable: true })
  userAgent: string;

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
