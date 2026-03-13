import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { AuditAction } from "./enums/subscription.enum";
import { User } from "./User.entity";
import { Organization } from "./Organization.entity";

@Entity("audit_logs")
@Index("idx_audit_logs_tenant_id", ["tenantId"])
@Index("idx_audit_logs_user_id", ["userId"])
@Index("idx_audit_logs_action", ["action"])
@Index("idx_audit_logs_entity_type", ["entityType"])
@Index("idx_audit_logs_entity_id", ["entityId"])
@Index("idx_audit_logs_created_at", ["createdAt"])
@Index("idx_audit_logs_tenant_created", ["tenantId", "createdAt"])
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId: string;

  @Column({ name: "user_id", type: "uuid", nullable: true })
  userId: string;

  @Column({
    type: "varchar",
  })
  action: AuditAction;

  @Column({ name: "entity_type", type: "varchar", length: 100 })
  entityType: string;

  @Column({ name: "entity_id", type: "uuid", nullable: true })
  entityId: string;

  // Change tracking
  @Column({ name: "old_values", type: "json", nullable: true })
  oldValues: Record<string, any>;

  @Column({ name: "new_values", type: "json", nullable: true })
  newValues: Record<string, any>;

  @Column({ name: "changed_fields", type: "json", nullable: true })
  changedFields: string[];

  // Request info
  @Column({ name: "ip_address", type: "varchar", length: 45, nullable: true })
  ipAddress: string;

  @Column({ name: "user_agent", type: "text", nullable: true })
  userAgent: string;

  @Column({ name: "request_id", type: "varchar", length: 100, nullable: true })
  requestId: string;

  // Metadata
  @Column({ type: "json" })
  metadata: Record<string, any>;

  // Timestamps
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
