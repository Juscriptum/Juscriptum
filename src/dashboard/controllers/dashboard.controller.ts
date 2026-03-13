import { Controller, Get, Query, UseGuards, Req } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { DashboardService } from "../services/dashboard.service";
import { GetDashboardStatsDto } from "../dto/dashboard-stats.dto";
import { DashboardStatsResponseDto } from "../dto/dashboard-response.dto";
import { JwtAuthGuard, TenantGuard } from "../../auth/guards";

/**
 * Dashboard Controller
 * Provides endpoints for dashboard statistics and widgets
 */
@ApiTags("Dashboard")
@Controller("dashboard")
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("stats")
  @ApiOperation({ summary: "Get dashboard statistics" })
  @ApiResponse({
    status: 200,
    description: "Dashboard statistics retrieved successfully",
    type: DashboardStatsResponseDto,
  })
  @ApiQuery({
    name: "days",
    required: false,
    type: Number,
    description: "Number of days to look back (default: 30)",
  })
  @ApiQuery({
    name: "startDate",
    required: false,
    type: Date,
    description: "Custom start date",
  })
  @ApiQuery({
    name: "endDate",
    required: false,
    type: Date,
    description: "Custom end date",
  })
  async getStats(
    @Query() query: GetDashboardStatsDto,
    @Req() req: any,
  ): Promise<DashboardStatsResponseDto> {
    const tenantId = req.user?.tenant_id;
    return this.dashboardService.getDashboardStats(tenantId, query);
  }
}
