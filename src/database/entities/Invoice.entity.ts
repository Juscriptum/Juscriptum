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
import { User } from "./User.entity";

/**
 * Invoice Types
 */
export type InvoiceStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "paid"
  | "partial"
  | "overdue"
  | "cancelled";
export type PaymentMethod = "cash" | "card" | "bank_transfer" | "wayforpay";

/**
 * Invoice Entity
 */
@Entity("invoices")
@Index("idx_invoices_tenant_id", ["tenantId"])
@Index("idx_invoices_client_id", ["clientId"])
@Index("idx_invoices_status", ["status"])
@Index("idx_invoices_invoice_date", ["invoiceDate"])
export class Invoice {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId: string;

  // Client Reference
  @Column({ name: "client_id", type: "uuid", nullable: true })
  clientId: string;

  // Calculation Reference (optional link to calculation)
  @Column({ name: "calculation_id", type: "uuid", nullable: true })
  calculationId: string;

  // Invoice Details
  @Column({ type: "varchar", length: 50 })
  invoiceNumber: string;

  @Column({ name: "invoice_date", type: "date" })
  invoiceDate: Date;

  @Column({ name: "due_date", type: "date", nullable: true })
  dueDate: Date;

  @Column({ type: "text", nullable: true })
  description: string;

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
    nullable: true,
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
  status: InvoiceStatus;

  @Column({ type: "varchar", nullable: true })
  paymentMethod: PaymentMethod;

  @Column({
    name: "payment_reference",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  paymentReference: string;

  @Column({ name: "paid_at", type: "datetime", nullable: true })
  paidAt: Date;

  // PDF
  @Column({ name: "pdf_url", type: "text", nullable: true })
  pdfUrl: string;

  @Column({ name: "pdf_generated_at", type: "datetime", nullable: true })
  pdfGeneratedAt: Date;

  // Notes
  @Column({ type: "text", nullable: true })
  internalNotes: string;

  @Column({ type: "text", nullable: true })
  clientNotes: string;

  // Metadata (stores line items as JSON for flexibility)
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

  // Relations
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "created_by" })
  createdByUser: User;
}
