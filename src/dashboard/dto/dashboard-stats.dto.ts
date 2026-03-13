import { IsOptional, IsNumber, IsDateString } from "class-validator";

/**
 * DTO for dashboard statistics query parameters
 */
export class GetDashboardStatsDto {
  @IsOptional()
  @IsNumber()
  days?: number = 30; // Default to last 30 days

  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @IsOptional()
  @IsDateString()
  endDate?: Date;
}
