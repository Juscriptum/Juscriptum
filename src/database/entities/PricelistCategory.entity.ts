import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import type { Pricelist } from "./Pricelist.entity";

@Entity("pricelist_categories")
@Index("idx_pricelist_categories_tenant_id", ["tenantId"])
@Index("idx_pricelist_categories_pricelist_id", ["pricelistId"])
@Index("idx_pricelist_categories_parent_id", ["parentId"])
export class PricelistCategory {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId: string;

  @Column({ name: "pricelist_id", type: "uuid" })
  pricelistId: string;

  @Column({ name: "parent_id", type: "uuid", nullable: true })
  parentId: string | null;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ name: "display_order", type: "int", default: 0 })
  displayOrder: number;

  @Column({ type: "json" })
  metadata: Record<string, any>;

  @DeleteDateColumn({ name: "deleted_at", type: "datetime" })
  deletedAt: Date;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt: Date;

  @Column({ name: "created_by", type: "uuid", nullable: true })
  createdBy: string;

  @Column({ name: "updated_by", type: "uuid", nullable: true })
  updatedBy: string;

  @ManyToOne("Pricelist", "categories", { onDelete: "CASCADE" })
  @JoinColumn({ name: "pricelist_id" })
  pricelist: Pricelist;

  @ManyToOne("PricelistCategory", "children", { nullable: true })
  @JoinColumn({ name: "parent_id" })
  parent: PricelistCategory | null;

  @OneToMany("PricelistCategory", "parent")
  children: PricelistCategory[];
}
