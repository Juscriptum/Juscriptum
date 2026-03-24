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
import type { User } from "./User.entity";

/**
 * Event Types
 */
export type EventType =
  | "hearing"
  | "deadline"
  | "meeting"
  | "court_sitting"
  | "other";

export type EventReminderUnit = "minutes" | "hours" | "days" | "weeks";
export type EventRecurrencePattern = "daily" | "weekly" | "monthly" | "yearly";
export type EventStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "rescheduled"
  | "archived";

/**
 * Event Entity
 */
@Entity("events")
@Index("idx_events_tenant_id", ["tenantId"])
@Index("idx_events_case_id", ["caseId"])
@Index("idx_events_type", ["type"])
@Index("idx_events_date", ["eventDate"])
export class Event {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId: string;

  // Case Reference
  @Column({ name: "case_id", type: "uuid", nullable: true })
  caseId: string;

  // Event Details
  @Column({
    type: "varchar",
  })
  type: EventType;

  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ name: "event_date", type: "datetime" })
  eventDate: Date;

  @Column({ name: "event_time", type: "time", nullable: true })
  eventTime: string;

  @Column({ name: "duration_minutes", type: "int", nullable: true })
  durationMinutes: number;

  @Column({ name: "end_date", type: "datetime", nullable: true })
  endDate: Date | null;

  @Column({ name: "end_time", type: "time", nullable: true })
  endTime: string | null;

  @Column({ name: "is_all_day", type: "boolean", default: false })
  isAllDay: boolean;

  // Location
  @Column({ type: "text", nullable: true })
  location: string;

  @Column({ name: "court_room", type: "varchar", length: 100, nullable: true })
  courtRoom: string;

  // Participants
  @Column({ name: "judge_name", type: "varchar", length: 100, nullable: true })
  judgeName: string;

  @Column({ name: "responsible_contact", type: "text", nullable: true })
  responsibleContact: string | null;

  @Column({ name: "participants", type: "json", nullable: true })
  participants: Record<string, any>;

  // Reminders
  @Column({ name: "reminder_sent", type: "boolean", default: false })
  reminderSent: boolean;

  @Column({ name: "reminder_days_before", type: "int", default: 1 })
  reminderDaysBefore: number;

  @Column({ name: "reminder_value", type: "int", default: 1 })
  reminderValue: number;

  @Column({
    name: "reminder_unit",
    type: "varchar",
    length: 16,
    default: "days",
  })
  reminderUnit: EventReminderUnit;

  @Column({ name: "is_recurring", type: "boolean", default: false })
  isRecurring: boolean;

  @Column({
    name: "recurrence_pattern",
    type: "varchar",
    length: 16,
    nullable: true,
  })
  recurrencePattern: EventRecurrencePattern | null;

  @Column({ name: "recurrence_interval", type: "int", nullable: true })
  recurrenceInterval: number | null;

  @Column({ name: "recurrence_end_date", type: "datetime", nullable: true })
  recurrenceEndDate: Date | null;

  // Status
  @Column({
    type: "varchar",
    default: "scheduled",
  })
  status: EventStatus;

  @Column({ type: "text", nullable: true })
  notes: string;

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
  @ManyToOne(() => require("./Case.entity").Case)
  @JoinColumn({ name: "case_id" })
  case: Case;

  @ManyToOne(() => require("./User.entity").User, { nullable: true })
  @JoinColumn({ name: "created_by" })
  createdByUser: User;
}
