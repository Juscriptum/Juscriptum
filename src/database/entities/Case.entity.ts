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
import { CaseStatus, CasePriority } from "./enums/case.enum";
import type { Client } from "./Client.entity";
import type { User } from "./User.entity";
import type { Document } from "./Document.entity";
import type { Event } from "./Event.entity";
import { DataAccessScope } from "../../common/security/access-control";

/**
 * Case Entity
 * Represents legal cases/sporadenia
 */
@Entity("cases")
@Index("idx_cases_tenant_id", ["tenantId"])
@Index("idx_cases_client_id", ["clientId"])
@Index("idx_cases_status", ["status"])
@Index("idx_cases_priority", ["priority"])
@Index("idx_cases_case_number", ["caseNumber"])
@Index("idx_cases_created_at", ["createdAt"])
export class Case {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId: string;

  // Case Identification
  @Column({ name: "case_number", type: "varchar", length: 50 })
  caseNumber: string;

  @Column({
    name: "registry_case_number",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  registryCaseNumber: string | null;

  // Case Type
  @Column({
    type: "varchar",
  })
  caseType:
    | "judicial_case"
    | "criminal_proceeding"
    | "enforcement_proceeding"
    | "contract_work"
    | "consultation_case"
    | "corporate_case"
    | "registration_case"
    | "administrative_appeal"
    | "mediation_negotiation"
    | "compliance_audit";

  // Assigned Lawyer
  @Column({ name: "assigned_lawyer_id", type: "uuid" })
  assignedLawyerId: string;

  @Column({ name: "access_scope", type: "varchar", default: "assigned" })
  accessScope: DataAccessScope;

  // Client
  @Column({ name: "client_id", type: "uuid" })
  clientId: string;

  // Case Details
  @Column({ type: "text", nullable: true })
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({
    type: "varchar",
  })
  priority: "low" | "medium" | "high" | "urgent";

  @Column({
    type: "varchar",
  })
  status: "draft" | "active" | "on_hold" | "closed" | "archived";

  // Dates
  @Column({ name: "start_date", type: "date", nullable: true })
  startDate: Date;

  @Column({ name: "end_date", type: "date", nullable: true })
  endDate: Date;

  @Column({ name: "next_hearing_date", type: "date", nullable: true })
  nextHearingDate: Date;

  @Column({ name: "deadline_date", type: "date", nullable: true })
  deadlineDate: Date;

  // Financial
  @Column({
    name: "estimated_amount",
    type: "decimal",
    precision: 12,
    scale: 2,
    nullable: true,
  })
  estimatedAmount: number;

  @Column({
    name: "paid_amount",
    type: "decimal",
    precision: 12,
    scale: 2,
    nullable: true,
    default: 0,
  })
  paidAmount: number;
  @Column({ name: "court_name", type: "varchar", length: 255, nullable: true })
  courtName: string;

  @Column({ name: "court_address", type: "text", nullable: true })
  courtAddress: string;

  @Column({ name: "judge_name", type: "varchar", length: 100, nullable: true })
  judgeName: string;

  @Column({
    name: "proceeding_stage",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  proceedingStage: string;

  // Parties (Ukrainian legal terminology)
  @Column({
    name: "plaintiff_name",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  plaintiffName: string;

  @Column({
    name: "defendant_name",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  defendantName: string;

  @Column({ name: "third_parties", type: "text", nullable: true })
  thirdParties: string;

  // Financial
  @Column({
    name: "claim_amount",
    type: "decimal",
    precision: 12,
    scale: 2,
    nullable: true,
  })
  claimAmount: number;

  @Column({
    name: "court_fee",
    type: "decimal",
    precision: 12,
    scale: 2,
    nullable: true,
  })
  courtFee: number;

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

  // Relations
  @ManyToOne(() => require("./User.entity").User)
  @JoinColumn({ name: "assigned_lawyer_id" })
  assignedLawyer: User;

  @ManyToOne(() => require("./Client.entity").Client)
  @JoinColumn({ name: "client_id" })
  client: Client;

  @OneToMany(
    () => require("./Document.entity").Document,
    (document: Document) => document.case,
  )
  documents: Document[];

  @OneToMany(
    () => require("./Event.entity").Event,
    (event: Event) => event.case,
  )
  events: Event[];
}
