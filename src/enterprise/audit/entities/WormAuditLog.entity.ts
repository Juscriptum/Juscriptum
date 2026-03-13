import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Organization } from "../../../database/entities/Organization.entity";
import { User } from "../../../database/entities/User.entity";
import { AuditActionType } from "../interfaces/worm-audit.interface";

@Entity("worm_audit_logs")
@Index("idx_worm_audit_tenant_id", ["tenantId"])
@Index("idx_worm_audit_user_id", ["userId"])
@Index("idx_worm_audit_action", ["action"])
@Index("idx_worm_audit_entity", ["entityType", "entityId"])
@Index("idx_worm_audit_timestamp", ["timestamp"])
@Index("idx_worm_audit_tenant_timestamp", ["tenantId", "timestamp"])
export class WormAuditLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId: string;

  @Column({ name: "user_id", type: "uuid", nullable: true })
  userId: string;

  @Column({
    type: "simple-enum",
    enum: [
      "create",
      "update",
      "delete",
      "login",
      "logout",
      "login_failed",
      "permission_change",
      "role_change",
      "password_change",
      "mfa_enabled",
      "mfa_disabled",
      "export",
      "download",
      "share",
      "api_key_create",
      "api_key_revoke",
      "settings_change",
      "subscription_change",
      "user_invite",
      "user_remove",
    ] as AuditActionType[],
  })
  action: AuditActionType;

  @Column({ name: "entity_type", type: "varchar", length: 100 })
  entityType: string;

  @Column({ name: "entity_id", type: "uuid", nullable: true })
  entityId: string;

  @Column({ name: "old_values", type: "json", nullable: true })
  oldValues: Record<string, any>;

  @Column({ name: "new_values", type: "json", nullable: true })
  newValues: Record<string, any>;

  @Column({ name: "changed_fields", type: "json", nullable: true })
  changedFields: string[];

  // Request context
  @Column({ name: "ip_address", type: "varchar", length: 45, nullable: true })
  ipAddress: string;

  @Column({ name: "user_agent", type: "text", nullable: true })
  userAgent: string;

  @Column({ name: "request_id", type: "varchar", length: 100, nullable: true })
  requestId: string;

  @Column({ name: "session_id", type: "varchar", length: 100, nullable: true })
  sessionId: string;

  @Column({ type: "json" })
  metadata: Record<string, any>;

  @Column({ type: "datetime" })
  timestamp: Date;

  // Integrity protection
  @Column({ type: "varchar", length: 128 })
  hash: string;

  @Column({
    name: "previous_hash",
    type: "varchar",
    length: 128,
    nullable: true,
  })
  previousHash: string;

  @Column({ name: "chain_index", type: "bigint" })
  chainIndex: number;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Organization, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  organization: Organization;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;
}
