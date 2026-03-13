import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  BeforeUpdate,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from "typeorm";
import {
  SubscriptionPlan,
  SubscriptionStatus,
} from "./enums/subscription.enum";
import {
  computeEmailBlindIndex,
  createEncryptedStringTransformer,
} from "../../common/security/pii-protection";

const encryptedStringTransformer = createEncryptedStringTransformer();

@Entity("organizations")
@Index("idx_organizations_name", ["name"])
@Index("idx_organizations_email_blind_index", ["emailBlindIndex"])
export class Organization {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({
    type: "varchar",
    default: "sole_proprietor",
  })
  legalForm:
    | "sole_proprietor"
    | "llc"
    | "joint_stock"
    | "partnership"
    | "other";

  @Column({ type: "varchar", length: 10, nullable: true })
  edrpou: string;

  @Column({
    name: "tax_number",
    type: "text",
    nullable: true,
    transformer: encryptedStringTransformer,
  })
  taxNumber: string;

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

  @Column({ type: "varchar", length: 2, default: "UA" })
  country: string;

  @Column({
    type: "text",
    nullable: true,
    transformer: encryptedStringTransformer,
  })
  phone: string;

  @Column({ type: "text", transformer: encryptedStringTransformer })
  email: string;

  @Column({
    name: "email_blind_index",
    type: "varchar",
    length: 64,
    nullable: true,
  })
  emailBlindIndex: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  website: string;

  // Subscription fields
  @Column({
    type: "varchar",
    default: SubscriptionPlan.BASIC,
  })
  subscriptionPlan: SubscriptionPlan;

  @Column({
    type: "varchar",
    default: SubscriptionStatus.TRIALING,
  })
  subscriptionStatus: SubscriptionStatus;

  @Column({ type: "datetime", nullable: true })
  trialEndAt: Date;

  @Column({ type: "datetime", nullable: true })
  currentPeriodEndAt: Date;

  @Column({ type: "int", default: 1 })
  maxUsers: number;

  // Configuration
  @Column({ type: "varchar", length: 255, nullable: true })
  customDomain: string;

  @Column({ type: "boolean", default: false })
  mfaRequired: boolean;

  @Column({ type: "boolean", default: false })
  ssoEnabled: boolean;

  @Column({ type: "int", default: 90 })
  auditRetentionDays: number;

  // Status
  @Column({
    type: "varchar",
    default: "provisioning",
  })
  status: "provisioning" | "active" | "suspended" | "deleted";

  // Metadata
  @Column({ type: "json" })
  settings: Record<string, any>;

  @Column({ type: "json" })
  metadata: Record<string, any>;

  // Timestamps
  @CreateDateColumn({ type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ type: "datetime" })
  updatedAt: Date;

  @DeleteDateColumn({ type: "datetime" })
  deletedAt: Date;

  // Relations removed temporarily to test startup

  @BeforeInsert()
  @BeforeUpdate()
  syncBlindIndexes(): void {
    this.emailBlindIndex =
      computeEmailBlindIndex(this.email, "organization_email") ?? null;
  }
}
