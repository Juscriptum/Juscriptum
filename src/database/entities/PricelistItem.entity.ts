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
import type { Pricelist } from "./Pricelist.entity";

/**
 * PricelistItem Entity
 * Represents a service/item in a pricelist
 */
@Entity("pricelist_items")
@Index("idx_pricelist_items_tenant_id", ["tenantId"])
@Index("idx_pricelist_items_pricelist_id", ["pricelistId"])
@Index("idx_pricelist_items_category", ["category"])
export class PricelistItem {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId: string;

  @Column({ name: "pricelist_id", type: "uuid" })
  pricelistId: string;

  // Item Details
  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "varchar", length: 50 })
  code: string; // Service code (e.g., 'CONSULT_1H', 'DOC_PREP')

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "varchar", length: 100 })
  category: string; // e.g., 'Consultation', 'Document Prep', 'Court Hearing'

  // Pricing
  @Column({ type: "varchar", default: "fixed" })
  unitType: "hourly" | "fixed" | "piecewise";

  @Column({ name: "base_price", type: "decimal", precision: 12, scale: 2 })
  basePrice: number;

  @Column({ name: "currency", type: "varchar", length: 3, default: "UAH" })
  currency: string;

  // Duration (for hourly services)
  @Column({ name: "default_duration", type: "int", nullable: true })
  defaultDuration: number; // in minutes

  // Unit (for piecewise services)
  @Column({ type: "varchar", length: 50, nullable: true })
  unit: string; // e.g., 'page', 'hour', 'document'

  // Minimum Quantity
  @Column({ name: "min_quantity", type: "int", nullable: true })
  minQuantity: number;

  // Active
  @Column({ type: "boolean", default: true })
  isActive: boolean;

  // Display Order
  @Column({ name: "display_order", type: "int", default: 0 })
  displayOrder: number;

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

  // Relations
  @ManyToOne("Pricelist", "items")
  @JoinColumn({ name: "pricelist_id" })
  pricelist: Pricelist;
}
