import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export const MALWARE_SCAN_STATUSES = [
  "pending",
  "clean",
  "infected",
  "failed",
] as const;
export type MalwareScanStatus = (typeof MALWARE_SCAN_STATUSES)[number];

@Entity("file_scan_records")
@Index("idx_file_scan_records_tenant_id", ["tenantId"])
@Index("idx_file_scan_records_storage_path", ["storagePath"], { unique: true })
@Index("idx_file_scan_records_status_next_attempt", ["status", "nextAttemptAt"])
export class FileScanRecord {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId: string;

  @Column({ name: "storage_path", type: "text" })
  storagePath: string;

  @Column({ name: "file_name", type: "varchar", length: 500 })
  fileName: string;

  @Column({ name: "mime_type", type: "varchar", length: 100, nullable: true })
  mimeType: string | null;

  @Column({ type: "varchar", length: 32, default: "pending" })
  status: MalwareScanStatus;

  @Column({
    name: "scanner_engine",
    type: "varchar",
    length: 64,
    nullable: true,
  })
  scannerEngine: string | null;

  @Column({
    name: "malware_signature",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  malwareSignature: string | null;

  @Column({ name: "scan_error", type: "text", nullable: true })
  scanError: string | null;

  @Column({ name: "scan_attempts", type: "int", default: 0 })
  scanAttempts: number;

  @Column({ name: "max_attempts", type: "int", default: 3 })
  maxAttempts: number;

  @Column({ name: "next_attempt_at", type: "datetime" })
  nextAttemptAt: Date;

  @Column({ name: "scanned_at", type: "datetime", nullable: true })
  scannedAt: Date | null;

  @Column({ name: "document_id", type: "uuid", nullable: true })
  documentId: string | null;

  @Column({ type: "json", nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt: Date;
}
