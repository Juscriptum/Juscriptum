import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("revoked_access_tokens")
@Index("idx_revoked_access_tokens_jti", ["jti"], { unique: true })
@Index("idx_revoked_access_tokens_user_id", ["userId"])
@Index("idx_revoked_access_tokens_tenant_id", ["tenantId"])
@Index("idx_revoked_access_tokens_expires_at", ["expiresAt"])
export class RevokedAccessToken {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  jti: string;

  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId: string;

  @Column({ name: "expires_at", type: "datetime" })
  expiresAt: Date;

  @Column({ type: "varchar", length: 100, nullable: true })
  reason: string;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt: Date;
}
