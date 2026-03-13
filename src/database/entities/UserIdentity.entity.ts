import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

export const TRUST_PROVIDER_TYPES = [
  "acsk",
  "diia",
  "bankid_nbu",
  "manual",
] as const;
export type TrustProviderType = (typeof TRUST_PROVIDER_TYPES)[number];

export const TRUST_VERIFICATION_STATUSES = [
  "pending",
  "verified",
  "rejected",
  "revoked",
] as const;
export type TrustVerificationStatus =
  (typeof TRUST_VERIFICATION_STATUSES)[number];

@Entity("user_identities")
@Index("idx_user_identities_tenant_id", ["tenantId"])
@Index("idx_user_identities_user_id", ["userId"])
@Index("idx_user_identities_provider", ["provider"])
@Index("idx_user_identities_status", ["status"])
export class UserIdentity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId: string;

  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @Column({ type: "varchar", length: 32 })
  provider: TrustProviderType;

  @Column({ type: "varchar", length: 32, default: "pending" })
  status: TrustVerificationStatus;

  @Column({ name: "external_subject_id", type: "varchar", length: 255 })
  externalSubjectId: string;

  @Column({
    name: "display_name",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  displayName: string;

  @Column({
    name: "certificate_serial_number",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  certificateSerialNumber: string;

  @Column({
    name: "certificate_issuer",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  certificateIssuer: string;

  @Column({ name: "tax_id_hash", type: "varchar", length: 255, nullable: true })
  taxIdHash: string;

  @Column({
    name: "assurance_level",
    type: "varchar",
    length: 64,
    nullable: true,
  })
  assuranceLevel: string;

  @Column({ name: "verified_at", type: "datetime", nullable: true })
  verifiedAt: Date;

  @Column({ name: "last_checked_at", type: "datetime", nullable: true })
  lastCheckedAt: Date;

  @Column({ name: "verification_attempts", type: "int", default: 0 })
  verificationAttempts: number;

  @Column({ name: "next_check_at", type: "datetime", nullable: true })
  nextCheckAt: Date | null;

  @Column({ name: "last_error", type: "text", nullable: true })
  lastError: string | null;

  @Column({
    name: "external_verification_id",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  externalVerificationId: string | null;

  @Column({ type: "json", nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt: Date;
}
