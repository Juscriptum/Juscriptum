import { Controller, Get, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { PlatformAdminJwtAuthGuard } from "../guards";
import { PlatformAdminReadService } from "../services/platform-admin-read.service";
import { PlatformAdminDashboardSummaryDto } from "../dto/platform-admin-read-model.dto";

@ApiTags("Platform Admin Dashboard")
@ApiBearerAuth()
@Controller("platform-admin/dashboard")
@UseGuards(PlatformAdminJwtAuthGuard)
export class PlatformAdminDashboardController {
  constructor(
    private readonly platformAdminReadService: PlatformAdminReadService,
  ) {}

  @Get("summary")
  @ApiOperation({
    summary:
      "Return safe platform-wide KPIs and alerts for the owner back office",
  })
  @ApiResponse({
    status: 200,
    description: "Platform-admin dashboard summary retrieved",
    type: PlatformAdminDashboardSummaryDto,
  })
  async getSummary(): Promise<PlatformAdminDashboardSummaryDto> {
    return this.platformAdminReadService.getDashboardSummary();
  }
}
