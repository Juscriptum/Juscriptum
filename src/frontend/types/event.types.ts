export type CalendarEventType =
  | "hearing"
  | "deadline"
  | "meeting"
  | "court_sitting"
  | "other";

export type CalendarEventStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "rescheduled";

export type EventReminderUnit = "minutes" | "hours" | "days" | "weeks";
export type EventRecurrencePattern = "daily" | "weekly" | "monthly" | "yearly";

export interface EventCaseSummary {
  id: string;
  caseNumber: string;
  title?: string;
}

export interface EventParticipantMap {
  [key: string]: unknown;
}

export interface Event {
  id: string;
  tenantId: string;
  caseId?: string | null;
  type: CalendarEventType;
  title: string;
  description?: string | null;
  eventDate: string;
  eventTime?: string | null;
  durationMinutes?: number | null;
  endDate?: string | null;
  endTime?: string | null;
  isAllDay?: boolean | null;
  location?: string | null;
  courtRoom?: string | null;
  judgeName?: string | null;
  responsibleContact?: string | null;
  participants?: EventParticipantMap | null;
  reminderSent: boolean;
  reminderDaysBefore: number;
  reminderValue?: number | null;
  reminderUnit?: EventReminderUnit | null;
  isRecurring?: boolean | null;
  recurrencePattern?: EventRecurrencePattern | null;
  recurrenceInterval?: number | null;
  recurrenceEndDate?: string | null;
  status: CalendarEventStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  case?: EventCaseSummary | null;
}

export interface EventFilters {
  startDate?: string;
  endDate?: string;
}

export interface CreateEventDto {
  caseId?: string;
  type: CalendarEventType;
  title: string;
  description?: string;
  eventDate: string;
  eventTime?: string;
  durationMinutes?: number;
  endDate?: string;
  endTime?: string;
  isAllDay?: boolean;
  location?: string;
  courtRoom?: string;
  judgeName?: string;
  responsibleContact?: string;
  participants?: Record<string, unknown>;
  reminderDaysBefore?: number;
  reminderValue?: number;
  reminderUnit?: EventReminderUnit;
  isRecurring?: boolean;
  recurrencePattern?: EventRecurrencePattern;
  recurrenceInterval?: number;
  recurrenceEndDate?: string;
}
