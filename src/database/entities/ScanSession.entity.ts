import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import type { Case } from "./Case.entity";
import type { Document } from "./Document.entity";
import type { User } from "./User.entity";

export type ScanSessionStatus =
  | "created"
  | "opened"
  | "capturing"
  | "uploading"
  | "uploaded"
  | "preprocessing"
  | "assembling_pdf"
  | "ocr_processing"
  | "indexing"
  | "completed"
  | "failed"
  | "expired"
  | "cancelled";

export type ScanDocumentFormat = "A4" | "Original";
export type ScanDestinationScope = "root" | "personal" | "client";

@Entity("scan_sessions")
@Index("idx_scan_sessions_tenant_case", ["tenantId", "caseId"])
@Index("idx_scan_sessions_created_by", ["createdByUserId"])
@Index("idx_scan_sessions_status", ["status"])
export class ScanSession {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId: string;

  @Column({ name: "case_id", type: "uuid", nullable: true })
  caseId: string | null;

  @Column({ name: "client_id", type: "uuid", nullable: true })
  clientId: string | null;

  @Column({ name: "created_by_user_id", type: "uuid" })
  createdByUserId: string;

  @Column({ name: "token_hash", type: "varchar", length: 128 })
  tokenHash: string;

  @Column({ type: "varchar", length: 32, default: "created" })
  status: ScanSessionStatus;

  @Column({ name: "mobile_url", type: "text" })
  mobileUrl: string;

  @Column({ name: "desktop_url", type: "text", nullable: true })
  desktopUrl: string | null;

  @Column({ name: "expires_at", type: "datetime" })
  expiresAt: Date;

  @Column({ name: "started_at", type: "datetime", nullable: true })
  startedAt: Date | null;

  @Column({ name: "completed_at", type: "datetime", nullable: true })
  completedAt: Date | null;

  @Column({ name: "pages_count", type: "int", default: 0 })
  pagesCount: number;

  @Column({ name: "uploaded_pages", type: "int", default: 0 })
  uploadedPages: number;

  @Column({ name: "processed_pages", type: "int", default: 0 })
  processedPages: number;

  @Column({ name: "total_bytes", type: "bigint", default: 0 })
  totalBytes: number;

  @Column({ name: "final_document_id", type: "uuid", nullable: true })
  finalDocumentId: string | null;

  @Column({
    name: "document_format",
    type: "varchar",
    length: 24,
    default: "A4",
  })
  documentFormat: ScanDocumentFormat;

  @Column({
    name: "destination_scope",
    type: "varchar",
    length: 24,
    default: "root",
  })
  destinationScope: ScanDestinationScope;

  @Column({
    name: "ocr_status",
    type: "varchar",
    length: 32,
    default: "pending",
  })
  ocrStatus: "pending" | "not_configured" | "completed" | "failed";

  @Column({ name: "last_error", type: "text", nullable: true })
  lastError: string | null;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt: Date;

  @ManyToOne(() => require("./Case.entity").Case, { nullable: true })
  @JoinColumn({ name: "case_id" })
  case?: Case | null;

  @ManyToOne(() => require("./User.entity").User, { nullable: false })
  @JoinColumn({ name: "created_by_user_id" })
  createdByUser?: User;

  @ManyToOne(() => require("./Document.entity").Document, { nullable: true })
  @JoinColumn({ name: "final_document_id" })
  finalDocument?: Document | null;
}
