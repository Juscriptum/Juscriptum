import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  BeforeUpdate,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { UserRole, UserStatus } from "./enums/subscription.enum";
import { Organization } from "./Organization.entity";
import {
  computeEmailBlindIndex,
  createEncryptedStringTransformer,
} from "../../common/security/pii-protection";

const encryptedStringTransformer = createEncryptedStringTransformer();

@Entity("users")
@Index("idx_users_tenant_id", ["tenantId"])
@Index("idx_users_email", ["email"])
@Index("idx_users_email_blind_index", ["emailBlindIndex"])
@Index("idx_users_role", ["role"])
@Index("idx_users_status", ["status"])
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId: string;

  // Profile
  @Column({ type: "varchar", length: 100 })
  firstName: string;

  @Column({ type: "varchar", length: 100 })
  lastName: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  patronymic: string;

  @Column({ type: "text", transformer: encryptedStringTransformer })
  email: string;

  @Column({
    name: "email_blind_index",
    type: "varchar",
    length: 64,
    nullable: true,
  })
  emailBlindIndex: string | null;

  @Column({
    type: "text",
    nullable: true,
    transformer: encryptedStringTransformer,
  })
  phone: string;

  // Auth
  @Column({ name: "password_hash", type: "varchar", length: 255 })
  passwordHash: string;

  @Column({ type: "varchar", length: 255 })
  salt: string;

  @Column({
    name: "mfa_secret",
    type: "text",
    nullable: true,
    transformer: encryptedStringTransformer,
  })
  mfaSecret: string;

  @Column({ name: "mfa_enabled", type: "boolean", default: false })
  mfaEnabled: boolean;

  @Column({ name: "mfa_backup_codes", type: "json", nullable: true })
  mfaBackupCodes: string[];

  // Role & Permissions
  @Column({
    type: "varchar",
  })
  role: UserRole;

  @Column({
    type: "varchar",
    default: UserStatus.PENDING,
  })
  status: UserStatus;

  // Additional info
  @Column({ type: "varchar", length: 100, nullable: true })
  position: string;

  @Column({ name: "avatar_url", type: "text", nullable: true })
  avatarUrl: string;

  @Column({
    name: "bar_number",
    type: "text",
    nullable: true,
    transformer: encryptedStringTransformer,
  })
  barNumber: string;

  @Column({ type: "json", nullable: true })
  specialties: string[];

  @Column({ type: "json", nullable: true })
  languages: string[];

  // Email verification
  @Column({ name: "email_verified", type: "boolean", default: false })
  emailVerified: boolean;

  @Column({ name: "email_verified_at", type: "datetime", nullable: true })
  emailVerifiedAt: Date;

  @Column({
    name: "email_verification_token",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  emailVerificationToken: string;

  // Password reset
  @Column({
    name: "password_reset_token",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  passwordResetToken: string;

  @Column({
    name: "password_reset_expires_at",
    type: "datetime",
    nullable: true,
  })
  passwordResetExpiresAt: Date;

  @Column({ name: "last_password_change_at", type: "datetime", nullable: true })
  lastPasswordChangeAt: Date;

  @Column({ name: "session_invalid_before", type: "datetime", nullable: true })
  sessionInvalidBefore: Date;

  // Login tracking
  @Column({ name: "last_login_at", type: "datetime", nullable: true })
  lastLoginAt: Date;

  @Column({
    name: "last_login_ip",
    type: "varchar",
    length: 45,
    nullable: true,
  })
  lastLoginIp: string;

  @Column({ name: "failed_login_attempts", type: "int", default: 0 })
  failedLoginAttempts: number;

  @Column({ name: "locked_until", type: "datetime", nullable: true })
  lockedUntil: Date;

  // Metadata
  @Column({ type: "json", nullable: true })
  preferences: Record<string, any>;

  @Column({ type: "json", nullable: true })
  metadata: Record<string, any>;

  // Timestamps
  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "datetime" })
  deletedAt: Date;

  @Column({ name: "created_by", type: "uuid", nullable: true })
  createdBy: string;

  @Column({ name: "updated_by", type: "uuid", nullable: true })
  updatedBy: string;

  // Relations
  @ManyToOne(() => Organization)
  @JoinColumn({ name: "tenant_id" })
  organization: Organization;

  @BeforeInsert()
  @BeforeUpdate()
  syncBlindIndexes(): void {
    this.emailBlindIndex =
      computeEmailBlindIndex(this.email, "user_email") ?? null;
  }
}
