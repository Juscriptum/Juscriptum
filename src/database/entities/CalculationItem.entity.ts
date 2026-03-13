import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import type { Calculation } from "./Calculation.entity";

/**
 * CalculationItem Entity
 * Line item in a calculation
 */
@Entity("calculation_items")
export class CalculationItem {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "calculation_id", type: "uuid" })
  calculationId: string;

  // Item Details
  @Column({ type: "varchar", length: 255 })
  description: string;

  @Column({ name: "pricelist_item_id", type: "uuid", nullable: true })
  pricelistItemId: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  code: string;

  @Column({ name: "unit_type", type: "varchar", length: 20, nullable: true })
  unitType: "hourly" | "piecewise" | "fixed";

  // Quantity
  @Column({ type: "decimal", precision: 12, scale: 2, nullable: true })
  quantity: number;

  @Column({ type: "int", nullable: true })
  duration: number; // in minutes

  // Pricing
  @Column({ name: "unit_price", type: "decimal", precision: 12, scale: 2 })
  unitPrice: number;

  @Column({ name: "line_total", type: "decimal", precision: 14, scale: 2 })
  lineTotal: number;

  @Column({
    name: "vat_rate",
    type: "decimal",
    precision: 5,
    scale: 4,
    nullable: true,
  })
  vatRate: number;

  @Column({
    name: "vat_amount",
    type: "decimal",
    precision: 12,
    scale: 2,
    default: 0,
  })
  vatAmount: number;

  @Column({
    name: "discount_amount",
    type: "decimal",
    precision: 12,
    scale: 2,
    default: 0,
  })
  discountAmount: number;

  // Display Order
  @Column({ name: "display_order", type: "int", default: 0 })
  displayOrder: number;

  // Timestamps
  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt: Date;

  // Relations
  @ManyToOne("Calculation", "items")
  @JoinColumn({ name: "calculation_id" })
  calculation: Calculation;
}
