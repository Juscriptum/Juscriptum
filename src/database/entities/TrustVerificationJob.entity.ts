import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { TrustProviderType } from "./UserIdentity.entity";

export const TRUST_VERIFICATION_SUBJECT_TYPES = [
  "user_identity",
  "document_signature",
] as const;
export type TrustVerificationSubjectType =
  (typeof TRUST_VERIFICATION_SUBJECT_TYPES)[number];

export const TRUST_VERIFICATION_JOB_KINDS = [
  "verify",
  "recheck",
  "callback",
] as const;
export type TrustVerificationJobKind =
  (typeof TRUST_VERIFICATION_JOB_KINDS)[number];

export const TRUST_VERIFICATION_JOB_STATUSES = [
  "queued",
  "processing",
  "completed",
  "retrying",
  "failed",
] as const;
export type TrustVerificationJobStatus =
  (typeof TRUST_VERIFICATION_JOB_STATUSES)[number];

@Entity("trust_verification_jobs")
@Index("idx_trust_verification_jobs_tenant_id", ["tenantId"])
@Index("idx_trust_verification_jobs_subject", ["subjectType", "subjectId"])
@Index("idx_trust_verification_jobs_status_next_attempt", [
  "status",
  "nextAttemptAt",
])
@Index("idx_trust_verification_jobs_provider", ["provider"])
export class TrustVerificationJob {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId: string;

  @Column({ name: "subject_type", type: "varchar", length: 64 })
  subjectType: TrustVerificationSubjectType;

  @Column({ name: "subject_id", type: "uuid" })
  subjectId: string;

  @Column({ type: "varchar", length: 32 })
  provider: TrustProviderType;

  @Column({ name: "job_kind", type: "varchar", length: 32 })
  jobKind: TrustVerificationJobKind;

  @Column({ type: "varchar", length: 32, default: "queued" })
  status: TrustVerificationJobStatus;

  @Column({ name: "attempt_count", type: "int", default: 0 })
  attemptCount: number;

  @Column({ name: "max_attempts", type: "int", default: 3 })
  maxAttempts: number;

  @Column({ name: "next_attempt_at", type: "datetime" })
  nextAttemptAt: Date;

  @Column({ name: "last_error", type: "text", nullable: true })
  lastError: string | null;

  @Column({ type: "json", nullable: true })
  payload: Record<string, any> | null;

  @Column({ type: "json", nullable: true })
  result: Record<string, any> | null;

  @Column({ name: "completed_at", type: "datetime", nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt: Date;
}
