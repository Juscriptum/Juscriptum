import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { UserRole, InvitationStatus } from "./enums/subscription.enum";
import { User } from "./User.entity";
import { Organization } from "./Organization.entity";

@Entity("invitations")
@Index("idx_invitations_tenant_id", ["tenantId"])
@Index("idx_invitations_email", ["email"])
@Index("idx_invitations_token", ["token"])
@Index("idx_invitations_status", ["status"])
@Index("idx_invitations_expires_at", ["expiresAt"])
export class Invitation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId: string;

  @Column({ name: "invited_by", type: "uuid" })
  invitedBy: string;

  @Column({ type: "varchar", length: 255 })
  email: string;

  @Column({
    type: "varchar",
  })
  role: UserRole;

  @Column({ type: "varchar", length: 255 })
  token: string;

  @Column({
    type: "varchar",
    default: InvitationStatus.PENDING,
  })
  status: InvitationStatus;

  @Column({ type: "text", nullable: true })
  message: string;

  @Column({ name: "expires_at", type: "datetime" })
  expiresAt: Date;

  @Column({ name: "accepted_at", type: "datetime", nullable: true })
  acceptedAt: Date;

  @Column({ name: "revoked_at", type: "datetime", nullable: true })
  revokedAt: Date;

  @Column({ name: "accepted_by", type: "uuid", nullable: true })
  acceptedBy: string;

  // Metadata
  @Column({ type: "json" })
  metadata: Record<string, any>;

  // Timestamps
  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "datetime" })
  deletedAt: Date | null;

  // Relations
  @ManyToOne(() => Organization, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  organization: Organization;

  @ManyToOne(() => User)
  @JoinColumn({ name: "invited_by" })
  inviter: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: "accepted_by" })
  acceptedUser: User;
}
