import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
} from "typeorm";
import { PricelistItem } from "./PricelistItem.entity";
import { PricelistCategory } from "./PricelistCategory.entity";

/**
 * Pricelist Types
 */
export type PricelistType =
  | "general"
  | "consultation"
  | "court"
  | "document"
  | "other";

export type PricelistStatus = "active" | "inactive" | "archived";

/**
 * Pricelist Entity
 */
@Entity("pricelists")
@Index("idx_pricelists_tenant_id", ["tenantId"])
@Index("idx_pricelists_type", ["type"])
@Index("idx_pricelists_status", ["status"])
export class Pricelist {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId: string;

  // Basic Info
  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({
    type: "varchar",
  })
  type: PricelistType;

  // Settings
  @Column({
    type: "varchar",
    default: "active",
  })
  status: PricelistStatus;

  @Column({ name: "is_default", type: "boolean", default: false })
  isDefault: boolean;

  // Rounding
  @Column({ type: "varchar", default: "none" })
  roundingRule: "up" | "down" | "none";

  @Column({ name: "rounding_precision", type: "int", default: 2 })
  roundingPrecision: number;

  // VAT
  @Column({
    name: "vat_rate",
    type: "decimal",
    precision: 5,
    scale: 4,
    nullable: true,
  })
  vatRate: number;

  @Column({ name: "vat_included", type: "boolean", default: true })
  vatIncluded: boolean;

  // Discount
  @Column({ name: "discount_enabled", type: "boolean", default: false })
  discountEnabled: boolean;

  @Column({ type: "varchar", nullable: true })
  discountType: "percentage" | "fixed" | null;

  @Column({
    name: "discount_value",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  discountValue: number;

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
  @OneToMany(() => PricelistItem, (item) => item.pricelist)
  items: PricelistItem[];

  @OneToMany(() => PricelistCategory, (category) => category.pricelist)
  categories: PricelistCategory[];
}
