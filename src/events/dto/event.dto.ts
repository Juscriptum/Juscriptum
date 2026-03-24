import {
  IsEnum,
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
  Min,
  Max,
  IsInt,
} from "class-validator";
import { Type } from "class-transformer";
import {
  EventType,
  EventReminderUnit,
  EventRecurrencePattern,
  EventStatus,
} from "../../database/entities/Event.entity";

/**
 * Create Event DTO
 */
export class CreateEventDto {
  @IsOptional()
  @IsString()
  caseId?: string;

  @IsEnum(["hearing", "deadline", "meeting", "court_sitting", "other"])
  type: EventType;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  eventDate: string;

  @IsOptional()
  @IsString()
  eventTime?: string;

  @IsOptional()
  @Type(() => Number)
  durationMinutes?: number;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @IsOptional()
  @Type(() => Number)
  reminderDaysBefore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  reminderValue?: number;

  @IsOptional()
  @IsString()
  reminderUnit?: EventReminderUnit;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  courtRoom?: string;

  @IsOptional()
  @IsString()
  judgeName?: string;

  @IsOptional()
  @IsString()
  responsibleContact?: string;

  @IsOptional()
  participants?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsString()
  recurrencePattern?: EventRecurrencePattern;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  recurrenceInterval?: number;

  @IsOptional()
  @IsDateString()
  recurrenceEndDate?: string;
}

/**
 * Update Event DTO
 */
export class UpdateEventDto {
  @IsOptional()
  @IsEnum(["hearing", "deadline", "meeting", "court_sitting", "other"])
  type?: EventType;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @IsOptional()
  @IsString()
  eventTime?: string;

  @IsOptional()
  @Type(() => Number)
  durationMinutes?: number;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @IsOptional()
  @Type(() => Number)
  reminderDaysBefore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  reminderValue?: number;

  @IsOptional()
  @IsString()
  reminderUnit?: EventReminderUnit;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  courtRoom?: string;

  @IsOptional()
  @IsString()
  judgeName?: string;

  @IsOptional()
  @IsString()
  responsibleContact?: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsString()
  recurrencePattern?: EventRecurrencePattern;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  recurrenceInterval?: number;

  @IsOptional()
  @IsDateString()
  recurrenceEndDate?: string;

  @IsOptional()
  @IsEnum([
    "scheduled",
    "in_progress",
    "completed",
    "cancelled",
    "rescheduled",
    "archived",
  ])
  status?: EventStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * Event Filters DTO
 */
export class EventFiltersDto {
  @IsOptional()
  @IsString()
  caseId?: string;

  @IsOptional()
  @IsEnum(["hearing", "deadline", "meeting", "court_sitting", "other"])
  type?: EventType;

  @IsOptional()
  @IsEnum([
    "scheduled",
    "in_progress",
    "completed",
    "cancelled",
    "rescheduled",
    "archived",
  ])
  status?: EventStatus;

  @IsOptional()
  @IsDateString()
  eventDateFrom?: string;

  @IsOptional()
  @IsDateString()
  eventDateTo?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: "ASC" | "DESC";
}
