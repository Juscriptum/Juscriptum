import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export const DOCUMENT_PROCESSING_STATUSES = [
  "uploaded",
  "analyzing",
  "preprocessing",
  "geometry_corrected",
  "enhanced",
  "pdf_assembled",
  "ocr_processing",
  "completed",
  "failed",
] as const;

export type DocumentProcessingStatus =
  (typeof DOCUMENT_PROCESSING_STATUSES)[number];

@Entity("document_processing_jobs")
@Index("idx_document_processing_jobs_tenant_id", ["tenantId"])
@Index("idx_document_processing_jobs_document_id", ["documentId"])
@Index("idx_document_processing_jobs_status", ["status"])
export class DocumentProcessingJob {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId: string;

  @Column({ name: "document_id", type: "uuid" })
  documentId: string;

  @Column({ name: "source_document_id", type: "uuid", nullable: true })
  sourceDocumentId: string | null;

  @Column({ type: "varchar", length: 32, default: "uploaded" })
  status: DocumentProcessingStatus;

  @Column({ name: "ocr_enabled", type: "boolean", default: true })
  ocrEnabled: boolean;

  @Column({ name: "ocr_language", type: "varchar", length: 64, nullable: true })
  ocrLanguage: string | null;

  @Column({
    name: "processing_mode",
    type: "varchar",
    length: 32,
    nullable: true,
  })
  processingMode: string | null;

  @Column({
    name: "target_page_format",
    type: "varchar",
    length: 32,
    nullable: true,
  })
  targetPageFormat: string | null;

  @Column({ name: "page_count", type: "int", default: 0 })
  pageCount: number;

  @Column({ name: "processed_page_count", type: "int", default: 0 })
  processedPageCount: number;

  @Column({ type: "json", nullable: true })
  metadata: Record<string, any> | null;

  @Column({ name: "last_error", type: "text", nullable: true })
  lastError: string | null;

  @Column({ name: "completed_at", type: "datetime", nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt: Date;
}
