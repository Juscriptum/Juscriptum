import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNumber, IsDate, IsArray } from "class-validator";

/**
 * DTO for individual stat card
 */
export class StatCardDto {
  @ApiProperty({ description: "Stat label" })
  @IsString()
  label: string;

  @ApiProperty({ description: "Stat value" })
  @IsNumber()
  value: number;

  @ApiProperty({ description: "Change from previous period (percentage)" })
  @IsNumber()
  change: number;

  @ApiProperty({ description: "Trend direction" })
  @IsString()
  trend: "up" | "down" | "neutral";

  @ApiProperty({ description: "Icon identifier" })
  @IsString()
  icon: string;
}

/**
 * DTO for recent case item
 */
export class RecentCaseDto {
  @ApiProperty({ description: "Case ID" })
  @IsString()
  id: string;

  @ApiProperty({ description: "Case number" })
  @IsString()
  caseNumber: string;

  @ApiProperty({ description: "Case title" })
  @IsString()
  title: string;

  @ApiProperty({ description: "Client name" })
  @IsString()
  clientName: string;

  @ApiProperty({ description: "Case status" })
  @IsString()
  status: string;

  @ApiProperty({ description: "Case priority" })
  @IsString()
  priority: string;

  @ApiProperty({ description: "Next hearing date" })
  @IsDate()
  nextHearingDate: Date;
}

/**
 * DTO for upcoming event item
 */
export class UpcomingEventDto {
  @ApiProperty({ description: "Event ID" })
  @IsString()
  id: string;

  @ApiProperty({ description: "Event title" })
  @IsString()
  title: string;

  @ApiProperty({ description: "Event type" })
  @IsString()
  type: string;

  @ApiProperty({ description: "Event date and time" })
  @IsDate()
  eventDate: Date;

  @ApiProperty({ description: "Event location" })
  @IsString()
  location: string;

  @ApiProperty({ description: "Related case number" })
  @IsString()
  caseNumber: string;
}

/**
 * DTO for activity feed item
 */
export class ActivityFeedDto {
  @ApiProperty({ description: "Activity ID" })
  @IsString()
  id: string;

  @ApiProperty({ description: "User who performed the action" })
  @IsString()
  userName: string;

  @ApiProperty({ description: "Action performed" })
  @IsString()
  action: string;

  @ApiProperty({ description: "Entity type" })
  @IsString()
  entityType: string;

  @ApiProperty({ description: "Entity description" })
  @IsString()
  entityDescription: string;

  @ApiProperty({ description: "Timestamp" })
  @IsDate()
  timestamp: Date;
}

/**
 * DTO for task item
 */
export class TaskDto {
  @ApiProperty({ description: "Task ID" })
  @IsString()
  id: string;

  @ApiProperty({ description: "Task title" })
  @IsString()
  title: string;

  @ApiProperty({ description: "Task type" })
  @IsString()
  type: "deadline" | "hearing" | "document" | "payment";

  @ApiProperty({ description: "Due date" })
  @IsDate()
  dueDate: Date;

  @ApiProperty({ description: "Related case number" })
  @IsString()
  caseNumber: string;

  @ApiProperty({ description: "Priority" })
  @IsString()
  priority: string;
}

/**
 * DTO for revenue data point
 */
export class RevenueDataPointDto {
  @ApiProperty({ description: "Date" })
  @IsDate()
  date: Date;

  @ApiProperty({ description: "Amount" })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: "Paid amount" })
  @IsNumber()
  paidAmount: number;
}

/**
 * Complete dashboard statistics response
 */
export class DashboardStatsResponseDto {
  @ApiProperty({ description: "Statistics cards" })
  @IsArray()
  stats: StatCardDto[];

  @ApiProperty({ description: "Recent cases" })
  @IsArray()
  recentCases: RecentCaseDto[];

  @ApiProperty({ description: "Upcoming events" })
  @IsArray()
  upcomingEvents: UpcomingEventDto[];

  @ApiProperty({ description: "Recent activity" })
  @IsArray()
  activityFeed: ActivityFeedDto[];

  @ApiProperty({ description: "Pending tasks" })
  @IsArray()
  pendingTasks: TaskDto[];

  @ApiProperty({ description: "Revenue data for chart" })
  @IsArray()
  revenueData: RevenueDataPointDto[];
}
