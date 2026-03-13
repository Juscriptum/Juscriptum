import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

/**
 * Error information stored in outbox
 */
export interface OutboxError {
  message: string;
  stack?: string;
  timestamp: string;
}

/**
 * Outbox Table
 * Stores events that need to be published reliably
 */
@Entity("outbox")
@Index("idx_outbox_processed")
export class Outbox {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 100 })
  eventType: string;

  @Column({ type: "json" })
  payload: Record<string, any>;

  @Column({ type: "boolean", default: false })
  processed: boolean;

  @Column({ type: "int", default: 0 })
  retryCount: number;

  @Column({ type: "json", nullable: true })
  lastError: OutboxError;

  @Column({ type: "datetime", nullable: true })
  processedAt: Date;

  @Column({ type: "datetime", default: () => "NOW()" })
  createdAt: Date;
}
