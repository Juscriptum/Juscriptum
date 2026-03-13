import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { TrustProviderType } from "./UserIdentity.entity";

export const SIGNATURE_VERIFICATION_STATUSES = [
  "pending",
  "verified",
  "failed",
  "revoked",
] as const;
export type SignatureVerificationStatus =
  (typeof SIGNATURE_VERIFICATION_STATUSES)[number];

@Entity("document_signatures")
@Index("idx_document_signatures_tenant_id", ["tenantId"])
@Index("idx_document_signatures_document_id", ["documentId"])
@Index("idx_document_signatures_user_id", ["userId"])
@Index("idx_document_signatures_verification_status", ["verificationStatus"])
export class DocumentSignature {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId: string;

  @Column({ name: "document_id", type: "uuid" })
  documentId: string;

  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @Column({ type: "varchar", length: 32 })
  provider: TrustProviderType;

  @Column({
    name: "verification_status",
    type: "varchar",
    length: 32,
    default: "pending",
  })
  verificationStatus: SignatureVerificationStatus;

  @Column({ name: "signature_hash", type: "varchar", length: 255 })
  signatureHash: string;

  @Column({
    name: "signature_algorithm",
    type: "varchar",
    length: 64,
    nullable: true,
  })
  signatureAlgorithm: string | null;

  @Column({
    name: "signed_payload_hash",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  signedPayloadHash: string | null;

  @Column({
    name: "certificate_serial_number",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  certificateSerialNumber: string | null;

  @Column({
    name: "certificate_issuer",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  certificateIssuer: string | null;

  @Column({ name: "verified_at", type: "datetime", nullable: true })
  verifiedAt: Date | null;

  @Column({ name: "last_checked_at", type: "datetime", nullable: true })
  lastCheckedAt: Date | null;

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

  @Column({ name: "signature_time", type: "datetime", nullable: true })
  signatureTime: Date | null;

  @Column({ type: "json", nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt: Date;
}
