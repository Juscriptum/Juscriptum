import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from "typeorm";
import { Case } from "./Case.entity";
import { User } from "./User.entity";
import { CalculationItem } from "./CalculationItem.entity";

/**
 * Calculation Status
 */
export type CalculationStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "paid";

/**
 * Calculation Entity
 * Represents a billing calculation for a case
 */
@Entity("calculations")
@Index("idx_calculations_tenant_id", ["tenantId"])
@Index("idx_calculations_case_id", ["caseId"])
@Index("idx_calculations_status", ["status"])
@Index("idx_calculations_date", ["calculationDate"])
export class Calculation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId: string;

  // Case Reference
  @Column({ name: "case_id", type: "uuid", nullable: true })
  caseId: string;

  // Calculation Details
  @Column({ type: "varchar", length: 50 })
  number: string; // Invoice/Calculation number

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ name: "calculation_date", type: "date" })
  calculationDate: Date;

  @Column({ name: "due_date", type: "date", nullable: true })
  dueDate: Date;

  @Column({ name: "paid_date", type: "date", nullable: true })
  paidDate: Date;

  // PDF Generation
  @Column({ name: "pdf_url", type: "varchar", length: 500, nullable: true })
  pdfUrl: string;

  @Column({ name: "pdf_generated_at", type: "datetime", nullable: true })
  pdfGeneratedAt: Date;

  // Amounts
  @Column({
    name: "subtotal",
    type: "decimal",
    precision: 14,
    scale: 2,
    nullable: true,
  })
  subtotal: number;

  @Column({
    name: "discount_amount",
    type: "decimal",
    precision: 14,
    scale: 2,
    default: 0,
  })
  discountAmount: number;

  @Column({
    name: "vat_amount",
    type: "decimal",
    precision: 14,
    scale: 2,
    default: 0,
  })
  vatAmount: number;

  @Column({
    name: "total_amount",
    type: "decimal",
    precision: 14,
    scale: 2,
    nullable: true,
  })
  totalAmount: number;

  @Column({
    name: "paid_amount",
    type: "decimal",
    precision: 14,
    scale: 2,
    default: 0,
  })
  paidAmount: number;

  @Column({ name: "currency", type: "varchar", length: 3, default: "UAH" })
  currency: string;

  // Status
  @Column({
    type: "varchar",
    default: "draft",
  })
  status: CalculationStatus;

  // Pricelist Reference
  @Column({ name: "pricelist_id", type: "uuid", nullable: true })
  pricelistId: string;

  // Notes
  @Column({ type: "text", nullable: true })
  internalNotes: string;

  @Column({ type: "text", nullable: true })
  clientNotes: string;

  // Metadata
  @Column({ type: "json" })
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

  @Column({ name: "approved_by", type: "uuid", nullable: true })
  approvedById: string;

  // Relations
  @ManyToOne(() => Case)
  @JoinColumn({ name: "case_id" })
  case: Case;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "approved_by" })
  approvedBy: User;

  @OneToMany(() => CalculationItem, (item) => item.calculation)
  items: CalculationItem[];
}
