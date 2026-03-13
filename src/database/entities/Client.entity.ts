import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  BeforeUpdate,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { UserRole } from "./enums/subscription.enum";
import type { Case } from "./Case.entity";
import type { User } from "./User.entity";
import { DataAccessScope } from "../../common/security/access-control";
import {
  computeEmailBlindIndex,
  computeIdentifierBlindIndex,
  computePhoneBlindIndex,
  createEncryptedStringTransformer,
} from "../../common/security/pii-protection";

const encryptedStringTransformer = createEncryptedStringTransformer();

/**
 * Client Types
 * - individual: Фізична особа (Private individual)
 * - fop: Фізична особа-підприємець (Sole Proprietor)
 * - legal_entity: Юридична особа (Legal Entity)
 */
export type ClientType = "individual" | "fop" | "legal_entity";

export type ClientStatus = "active" | "inactive" | "blocked" | "archived";

/**
 * Client Entity
 * Represents individual or legal entity clients
 */
@Entity("clients")
@Index("idx_clients_tenant_id", ["tenantId"])
@Index("idx_clients_status", ["status"])
@Index("idx_clients_type", ["type"])
@Index("idx_clients_name", ["firstName", "lastName"])
@Index("idx_clients_email_blind_index", ["emailBlindIndex"])
@Index("idx_clients_phone_blind_index", ["phoneBlindIndex"])
@Index("idx_clients_edrpou_blind_index", ["edrpouBlindIndex"])
@Index("idx_clients_inn_blind_index", ["innBlindIndex"])
export class Client {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId: string;

  // Client Type
  @Column({
    type: "varchar",
  })
  type: ClientType;

  // Personal Information
  @Column({ type: "varchar", length: 100, nullable: true })
  firstName: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  lastName: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  patronymic: string;

  // Legal Entity / FOP Information (if type === 'legal_entity' or 'fop')
  @Column({
    name: "company_name",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  companyName: string;

  @Column({
    name: "edrpou",
    type: "text",
    nullable: true,
    transformer: encryptedStringTransformer,
  })
  edrpou: string;

  @Column({
    name: "edrpou_blind_index",
    type: "varchar",
    length: 64,
    nullable: true,
  })
  edrpouBlindIndex: string | null;

  @Column({
    name: "inn",
    type: "text",
    nullable: true,
    transformer: encryptedStringTransformer,
  })
  inn: string;

  @Column({
    name: "inn_blind_index",
    type: "varchar",
    length: 64,
    nullable: true,
  })
  innBlindIndex: string | null;

  // Contact Information
  @Column({
    type: "text",
    nullable: true,
    transformer: encryptedStringTransformer,
  })
  email: string;

  @Column({
    name: "email_blind_index",
    type: "varchar",
    length: 64,
    nullable: true,
  })
  emailBlindIndex: string | null;

  @Column({
    type: "text",
    nullable: true,
    transformer: encryptedStringTransformer,
  })
  phone: string;

  @Column({
    name: "phone_blind_index",
    type: "varchar",
    length: 64,
    nullable: true,
  })
  phoneBlindIndex: string | null;

  @Column({
    type: "text",
    nullable: true,
    transformer: encryptedStringTransformer,
  })
  secondaryPhone: string;

  // Address
  @Column({
    type: "text",
    nullable: true,
    transformer: encryptedStringTransformer,
  })
  address: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  city: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  region: string;

  @Column({
    name: "postal_code",
    type: "text",
    nullable: true,
    transformer: encryptedStringTransformer,
  })
  postalCode: string;

  @Column({ type: "varchar", length: 2, default: "UA" })
  country: string;

  // Client Status
  @Column({
    type: "varchar",
    default: "active",
  })
  status: ClientStatus;

  @Column({ type: "varchar", length: 20, nullable: true })
  source: string; // Where did the client come from?

  @Column({ name: "assigned_user_id", type: "uuid", nullable: true })
  assignedUserId: string;

  @Column({ name: "access_scope", type: "varchar", default: "assigned" })
  accessScope: DataAccessScope;

  // Additional Information
  @Column({
    name: "passport_number",
    type: "text",
    nullable: true,
    transformer: encryptedStringTransformer,
  })
  passportNumber: string;

  @Column({ name: "passport_date", type: "date", nullable: true })
  passportDate: Date;

  @Column({
    type: "text",
    nullable: true,
    transformer: encryptedStringTransformer,
  })
  notes: string;

  // Metadata for flexible fields
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
  @JoinColumn({ name: "assigned_user_id" })
  assignedUser: User;

  @OneToMany(
    () => require("./Case.entity").Case,
    (caseEntity: Case) => caseEntity.client,
  )
  cases: Case[];

  @BeforeInsert()
  @BeforeUpdate()
  syncBlindIndexes(): void {
    this.emailBlindIndex =
      computeEmailBlindIndex(this.email, "client_email") ?? null;
    this.phoneBlindIndex = computePhoneBlindIndex(this.phone) ?? null;
    this.edrpouBlindIndex =
      computeIdentifierBlindIndex(this.edrpou, "client_edrpou") ?? null;
    this.innBlindIndex =
      computeIdentifierBlindIndex(this.inn, "client_inn") ?? null;
  }
}
