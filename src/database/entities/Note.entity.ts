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
import type { Case } from "./Case.entity";
import type { Client } from "./Client.entity";
import type { User } from "./User.entity";
import { DataAccessScope } from "../../common/security/access-control";

@Entity("notes")
@Index("idx_notes_tenant_id", ["tenantId"])
@Index("idx_notes_case_id", ["caseId"])
@Index("idx_notes_client_id", ["clientId"])
@Index("idx_notes_user_id", ["userId"])
@Index("idx_notes_assigned_user_id", ["assignedUserId"])
@Index("idx_notes_updated_at", ["updatedAt"])
export class Note {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId: string;

  @Column({ type: "varchar", length: 255, default: "" })
  title: string;

  @Column({ type: "text", default: "" })
  content: string;

  @Column({ type: "boolean", default: false })
  pinned: boolean;

  @Column({ type: "json", nullable: true })
  tags: string[] | null;

  @Column({ name: "access_scope", type: "varchar", default: "assigned" })
  accessScope: DataAccessScope;

  @Column({ name: "assigned_user_id", type: "uuid", nullable: true })
  assignedUserId: string | null;

  @Column({ name: "client_id", type: "uuid", nullable: true })
  clientId: string | null;

  @Column({ name: "case_id", type: "uuid", nullable: true })
  caseId: string | null;

  @Column({ name: "user_id", type: "uuid", nullable: true })
  userId: string | null;

  @Column({ type: "json", nullable: true })
  metadata: Record<string, any> | null;

  @DeleteDateColumn({ name: "deleted_at", type: "datetime" })
  deletedAt: Date | null;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt: Date;

  @Column({ name: "created_by", type: "uuid", nullable: true })
  createdBy: string | null;

  @Column({ name: "updated_by", type: "uuid", nullable: true })
  updatedBy: string | null;

  @ManyToOne(() => require("./Client.entity").Client, { nullable: true })
  @JoinColumn({ name: "client_id" })
  client: Client | null;

  @ManyToOne(() => require("./Case.entity").Case, { nullable: true })
  @JoinColumn({ name: "case_id" })
  case: Case | null;

  @ManyToOne(() => require("./User.entity").User, { nullable: true })
  @JoinColumn({ name: "user_id" })
  user: User | null;

  @ManyToOne(() => require("./User.entity").User, { nullable: true })
  @JoinColumn({ name: "assigned_user_id" })
  assignedUser: User | null;

  @ManyToOne(() => require("./User.entity").User, { nullable: true })
  @JoinColumn({ name: "created_by" })
  createdByUser: User | null;
}
