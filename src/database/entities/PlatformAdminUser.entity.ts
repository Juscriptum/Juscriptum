import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import {
  computePlatformAdminEmailBlindIndex,
  createEncryptedStringTransformer,
} from "../../common/security/pii-protection";
import {
  PlatformAdminRole,
  PlatformAdminStatus,
} from "./enums/platform-admin.enum";

const encryptedStringTransformer = createEncryptedStringTransformer();

@Entity("platform_admin_users")
@Index("idx_platform_admin_users_email_blind_index", ["emailBlindIndex"], {
  unique: true,
})
@Index("idx_platform_admin_users_status", ["status"])
@Index("idx_platform_admin_users_role", ["role"])
export class PlatformAdminUser {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "first_name", type: "varchar", length: 100 })
  firstName: string;

  @Column({ name: "last_name", type: "varchar", length: 100 })
  lastName: string;

  @Column({ type: "text", transformer: encryptedStringTransformer })
  email: string;

  @Column({
    name: "email_blind_index",
    type: "varchar",
    length: 64,
  })
  emailBlindIndex: string;

  @Column({ name: "password_hash", type: "varchar", length: 255 })
  passwordHash: string;

  @Column({ type: "varchar", length: 255 })
  salt: string;

  @Column({
    name: "role",
    type: "varchar",
    default: PlatformAdminRole.PLATFORM_OWNER,
  })
  role: PlatformAdminRole;

  @Column({
    name: "status",
    type: "varchar",
    default: PlatformAdminStatus.ACTIVE,
  })
  status: PlatformAdminStatus;

  @Column({ name: "permissions", type: "json", nullable: true })
  permissions: string[] | null;

  @Column({
    name: "mfa_secret",
    type: "text",
    nullable: true,
    transformer: encryptedStringTransformer,
  })
  mfaSecret: string | null;

  @Column({ name: "mfa_enabled", type: "boolean", default: false })
  mfaEnabled: boolean;

  @Column({ name: "mfa_backup_codes", type: "json", nullable: true })
  mfaBackupCodes: string[] | null;

  @Column({ name: "last_login_at", type: "datetime", nullable: true })
  lastLoginAt: Date | null;

  @Column({
    name: "last_login_ip",
    type: "varchar",
    length: 45,
    nullable: true,
  })
  lastLoginIp: string | null;

  @Column({ name: "failed_login_attempts", type: "int", default: 0 })
  failedLoginAttempts: number;

  @Column({ name: "locked_until", type: "datetime", nullable: true })
  lockedUntil: Date | null;

  @Column({ name: "last_password_change_at", type: "datetime", nullable: true })
  lastPasswordChangeAt: Date | null;

  @Column({ name: "session_invalid_before", type: "datetime", nullable: true })
  sessionInvalidBefore: Date | null;

  @Column({ name: "metadata", type: "json", nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  syncBlindIndexes(): void {
    this.emailBlindIndex =
      computePlatformAdminEmailBlindIndex(this.email) || "";
  }
}
