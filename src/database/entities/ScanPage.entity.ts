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
import type { ScanSession } from "./ScanSession.entity";

export type ScanPageStatus =
  | "created"
  | "uploading"
  | "uploaded"
  | "cropping"
  | "normalized"
  | "processed"
  | "failed"
  | "deleted";

@Entity("scan_pages")
@Index("idx_scan_pages_session_page", ["scanSessionId", "pageNumber"])
@Index("idx_scan_pages_status", ["status"])
export class ScanPage {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "scan_session_id", type: "uuid" })
  scanSessionId: string;

  @Column({ name: "page_number", type: "int" })
  pageNumber: number;

  @Column({ type: "varchar", length: 32, default: "created" })
  status: ScanPageStatus;

  @Column({ name: "original_file_path", type: "text", nullable: true })
  originalFilePath: string | null;

  @Column({ name: "processed_file_path", type: "text", nullable: true })
  processedFilePath: string | null;

  @Column({ name: "thumbnail_path", type: "text", nullable: true })
  thumbnailPath: string | null;

  @Column({ name: "file_size", type: "bigint", default: 0 })
  fileSize: number;

  @Column({ type: "int", nullable: true })
  width: number | null;

  @Column({ type: "int", nullable: true })
  height: number | null;

  @Column({ type: "int", default: 0 })
  rotation: number;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt: Date;

  @ManyToOne(() => require("./ScanSession.entity").ScanSession, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "scan_session_id" })
  scanSession?: ScanSession;
}
