import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import type { Case } from "./Case.entity";
import type { User } from "./User.entity";
import { DataAccessScope } from "../../common/security/access-control";
import { MalwareScanStatus } from "./FileScanRecord.entity";

/**
 * Document Types
 */
export type DocumentType =
  | "contract"
  | "agreement"
  | "court_order"
  | "evidence"
  | "invoice"
  | "other";

export type DocumentStatus =
  | "draft"
  | "uploading"
  | "signed"
  | "rejected"
  | "archived";

/**
 * Document Entity
 */
@Entity("documents")
@Index("idx_documents_tenant_id", ["tenantId"])
@Index("idx_documents_case_id", ["caseId"])
@Index("idx_documents_type", ["type"])
@Index("idx_documents_status", ["status"])
@Index("idx_documents_uploaded_by", ["uploadedBy"])
@Index("idx_documents_malware_scan_status", ["malwareScanStatus"])
export class Document {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId: string;

  // Case Reference
  @Column({ name: "case_id", type: "uuid", nullable: true })
  caseId: string;

  // Client Reference (optional, if not tied to case)
  @Column({ name: "client_id", type: "uuid", nullable: true })
  clientId: string;

  // Document Details
  @Column({ name: "file_name", type: "varchar", length: 500 })
  fileName: string;

  @Column({ name: "original_name", type: "varchar", length: 500 })
  originalName: string;

  @Column({
    type: "varchar",
  })
  type: DocumentType;

  @Column({ name: "mime_type", type: "varchar", length: 100, nullable: true })
  mimeType: string;

  @Column({ name: "file_size", type: "bigint", nullable: true })
  fileSize: number;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({
    type: "varchar",
    default: "uploading",
  })
  status: DocumentStatus;

  // File Storage
  @Column({ name: "storage_path", type: "text", nullable: true })
  storagePath: string;

  @Column({ name: "cdn_url", type: "text", nullable: true })
  cdnUrl: string;

  @Column({ name: "signed_url", type: "text", nullable: true })
  signedUrl: string;

  @Column({
    name: "malware_scan_status",
    type: "varchar",
    length: 32,
    default: "pending",
  })
  malwareScanStatus: MalwareScanStatus;

  @Column({ name: "malware_scanned_at", type: "datetime", nullable: true })
  malwareScannedAt: Date | null;

  @Column({
    name: "malware_scanner",
    type: "varchar",
    length: 64,
    nullable: true,
  })
  malwareScanner: string | null;

  @Column({
    name: "malware_signature",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  malwareSignature: string | null;

  @Column({ name: "malware_scan_error", type: "text", nullable: true })
  malwareScanError: string | null;

  // Digital Signature
  @Column({
    name: "signature_hash",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  signatureHash: string;

  @Column({
    name: "signature_algorithm",
    type: "varchar",
    length: 50,
    nullable: true,
  })
  signatureAlgorithm: string;

  @Column({ name: "signed_at", type: "datetime", nullable: true })
  signedAt: Date;

  @Column({ name: "signed_by", type: "uuid", nullable: true })
  signedBy: string;

  // Upload Info
  @Column({ name: "uploaded_by", type: "uuid" })
  uploadedBy: string;

  @Column({ name: "uploaded_at", type: "datetime" })
  uploadedAt: Date;

  @Column({ name: "upload_ip", type: "varchar", length: 45, nullable: true })
  uploadIp: string;

  // Versioning
  @Column({ name: "version", type: "int", default: 1 })
  version: number;

  @Column({ name: "parent_document_id", type: "uuid", nullable: true })
  parentDocumentId: string;

  @Column({ name: "access_scope", type: "varchar", default: "assigned" })
  accessScope: DataAccessScope;

  // Access Control
  @Column({ type: "varchar", default: "internal" })
  accessLevel: "public" | "internal" | "confidential";

  // Metadata
  @Column({ type: "json", nullable: true })
  metadata: Record<string, any>;

  // Soft Delete
  @DeleteDateColumn({ name: "deleted_at", type: "datetime" })
  deletedAt: Date;

  // Timestamps
  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt: Date;

  @Column({ name: "created_by", type: "uuid", nullable: true })
  createdBy: string;

  @Column({ name: "updated_by", type: "uuid", nullable: true })
  updatedBy: string;

  // Relations (using lazy imports to avoid circular dependency)
  @ManyToOne(() => require("./Case.entity").Case, { nullable: true })
  @JoinColumn({ name: "case_id" })
  case: Case;

  @ManyToOne(() => require("./User.entity").User, { nullable: true })
  @JoinColumn({ name: "signed_by" })
  signedByUser: User;

  @ManyToOne(() => require("./User.entity").User)
  @JoinColumn({ name: "uploaded_by" })
  uploadedByUser: User;
}
