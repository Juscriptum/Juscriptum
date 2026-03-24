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

@Entity("platform_admin_revoked_access_tokens")
@Index("idx_platform_admin_revoked_access_tokens_jti", ["jti"], {
  unique: true,
})
@Index("idx_platform_admin_revoked_access_tokens_user_id", [
  "platformAdminUserId",
])
@Index("idx_platform_admin_revoked_access_tokens_expires_at", ["expiresAt"])
export class PlatformAdminRevokedAccessToken {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  jti: string;

  @Column({ name: "platform_admin_user_id", type: "uuid" })
  platformAdminUserId: string;

  @Column({ name: "expires_at", type: "datetime" })
  expiresAt: Date;

  @Column({ type: "varchar", length: 100, nullable: true })
  reason: string | null;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt: Date;

  @ManyToOne(() => PlatformAdminUser, { onDelete: "CASCADE" })
  @JoinColumn({ name: "platform_admin_user_id" })
  platformAdminUser: PlatformAdminUser;
}
