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
import { Organization } from "../../../database/entities/Organization.entity";
import { DnsRecord } from "../interfaces/custom-domain.interface";

@Entity("custom_domains")
@Index("idx_custom_domains_tenant_id", ["tenantId"])
@Index("idx_custom_domains_domain", ["domain"], { unique: true })
export class CustomDomain {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId: string;

  @Column({ type: "varchar", length: 255, unique: true })
  domain: string;

  @Column({ name: "is_verified", type: "boolean", default: false })
  isVerified: boolean;

  @Column({ name: "is_primary", type: "boolean", default: false })
  isPrimary: boolean;

  @Column({ name: "ssl_enabled", type: "boolean", default: false })
  sslEnabled: boolean;

  @Column({ name: "ssl_certificate", type: "text", nullable: true })
  sslCertificate: string;

  @Column({ name: "ssl_private_key", type: "text", nullable: true })
  sslPrivateKey: string;

  @Column({ name: "ssl_expires_at", type: "datetime", nullable: true })
  sslExpiresAt: Date;

  @Column({ name: "dns_records", type: "json", default: [] })
  dnsRecords: DnsRecord[];

  @Column({
    name: "verification_token",
    type: "varchar",
    length: 64,
    nullable: true,
  })
  verificationToken: string;

  @Column({ name: "verified_at", type: "datetime", nullable: true })
  verifiedAt: Date;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt: Date;

  @ManyToOne(() => Organization, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  organization: Organization;
}
