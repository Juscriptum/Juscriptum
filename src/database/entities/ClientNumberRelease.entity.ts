import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity("client_number_releases")
@Index("idx_client_number_releases_tenant_id", ["tenantId"])
@Index(
  "idx_client_number_releases_tenant_number",
  ["tenantId", "clientNumber"],
  {
    unique: true,
  },
)
export class ClientNumberRelease {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId: string;

  @Column({ name: "client_number", type: "integer" })
  clientNumber: number;

  @Column({ name: "released_from_client_id", type: "uuid", nullable: true })
  releasedFromClientId?: string | null;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt: Date;
}
