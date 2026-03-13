import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import {
  SubscriptionPlan,
  SubscriptionStatus,
  SubscriptionProvider,
} from "./enums/subscription.enum";
import { Organization } from "./Organization.entity";

@Entity("subscriptions")
@Index("idx_subscriptions_tenant_id", ["tenantId"])
@Index("idx_subscriptions_external_id", ["externalId"])
@Index("idx_subscriptions_status", ["status"])
@Index("idx_subscriptions_plan", ["plan"])
export class Subscription {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId: string;

  // Provider info
  @Column({
    type: "varchar",
  })
  provider: SubscriptionProvider;

  @Column({ name: "external_id", type: "varchar", length: 255, nullable: true })
  externalId: string;

  @Column({
    name: "subscription_external_id",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  subscriptionExternalId: string;

  // Plan info
  @Column({
    type: "varchar",
  })
  plan: SubscriptionPlan;

  @Column({
    type: "varchar",
  })
  status: SubscriptionStatus;

  // Trial
  @Column({ name: "trial_start_at", type: "datetime", nullable: true })
  trialStartAt: Date;

  @Column({ name: "trial_end_at", type: "datetime", nullable: true })
  trialEndAt: Date;

  // Billing
  @Column({ name: "current_period_start_at", type: "datetime", nullable: true })
  currentPeriodStartAt: Date;

  @Column({ name: "current_period_end_at", type: "datetime", nullable: true })
  currentPeriodEndAt: Date;

  @Column({ name: "cancel_at_period_end", type: "boolean", default: false })
  cancelAtPeriodEnd: boolean;

  @Column({ name: "canceled_at", type: "datetime", nullable: true })
  canceledAt: Date | null;

  // Amounts (in cents)
  @Column({ name: "amount_cents", type: "int", nullable: true })
  amountCents: number;

  @Column({ type: "varchar", length: 3, default: "UAH" })
  currency: string;

  // Webhooks
  @Column({
    name: "latest_webhook_event_id",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  latestWebhookEventId: string;

  @Column({ name: "last_synced_at", type: "datetime", nullable: true })
  lastSyncedAt: Date;

  // Metadata
  @Column({ type: "json" })
  metadata: Record<string, any>;

  // Timestamps
  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Organization, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  organization: Organization;
}
