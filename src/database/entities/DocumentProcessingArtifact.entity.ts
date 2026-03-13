import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export const DOCUMENT_PROCESSING_ARTIFACT_KINDS = [
  "original_pdf",
  "processed_pdf",
  "searchable_pdf",
  "page_preview",
  "original_page_image",
  "processed_page_image",
  "ocr_text_per_page",
  "full_ocr_text",
  "processing_metadata",
] as const;

export type DocumentProcessingArtifactKind =
  (typeof DOCUMENT_PROCESSING_ARTIFACT_KINDS)[number];

export const PAGE_PROCESSING_STATUSES = [
  "pending",
  "analyzed",
  "cropped",
  "corrected",
  "enhanced",
  "ocr_done",
  "failed",
] as const;

export type PageProcessingStatus = (typeof PAGE_PROCESSING_STATUSES)[number];

@Entity("document_processing_artifacts")
@Index("idx_document_processing_artifacts_tenant_id", ["tenantId"])
@Index("idx_document_processing_artifacts_job_kind", [
  "processingJobId",
  "artifactKind",
])
@Index("idx_document_processing_artifacts_document_page", [
  "documentId",
  "pageNumber",
])
export class DocumentProcessingArtifact {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId: string;

  @Column({ name: "document_id", type: "uuid" })
  documentId: string;

  @Column({ name: "processing_job_id", type: "uuid" })
  processingJobId: string;

  @Column({ name: "artifact_kind", type: "varchar", length: 48 })
  artifactKind: DocumentProcessingArtifactKind;

  @Column({ name: "page_number", type: "int", nullable: true })
  pageNumber: number | null;

  @Column({ name: "storage_path", type: "text", nullable: true })
  storagePath: string | null;

  @Column({ name: "mime_type", type: "varchar", length: 128, nullable: true })
  mimeType: string | null;

  @Column({ name: "text_content", type: "text", nullable: true })
  textContent: string | null;

  @Column({ name: "ocr_confidence", type: "float", nullable: true })
  ocrConfidence: number | null;

  @Column({ name: "page_status", type: "varchar", length: 32, nullable: true })
  pageStatus: PageProcessingStatus | null;

  @Column({ type: "json", nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt: Date;
}
