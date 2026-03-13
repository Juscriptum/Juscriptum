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
import { OnboardingStep } from "./enums/subscription.enum";
import { User } from "./User.entity";
import { Organization } from "./Organization.entity";

@Entity("onboarding_progress")
@Index("idx_onboarding_progress_tenant_id", ["tenantId"])
@Index("idx_onboarding_progress_user_id", ["userId"])
@Index("idx_onboarding_progress_step", ["step"])
@Index("idx_onboarding_progress_completed", ["completed"])
export class OnboardingProgress {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId: string;

  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @Column({
    type: "varchar",
  })
  step: OnboardingStep;

  @Column({ type: "boolean", default: false })
  completed: boolean;

  @Column({ name: "completed_at", type: "datetime", nullable: true })
  completedAt: Date;

  @Column({ type: "int", default: 0 })
  percentage: number;

  @Column({ type: "json" })
  data: Record<string, any>;

  // Timestamps
  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Organization, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  organization: Organization;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;
}
