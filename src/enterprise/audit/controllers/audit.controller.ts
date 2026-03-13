import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
  Request,
  Response,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { WormAuditService } from "../services/worm-audit.service";
import { JwtAuthGuard } from "../../../auth/guards";
import { AuditActionType } from "../interfaces/worm-audit.interface";

@ApiTags("Audit Logs")
@ApiBearerAuth()
@Controller("v1/audit")
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: WormAuditService) {}

  @Get()
  @ApiOperation({ summary: "Get audit logs" })
  @ApiQuery({ name: "userId", required: false })
  @ApiQuery({ name: "action", required: false })
  @ApiQuery({ name: "entityType", required: false })
  @ApiQuery({ name: "entityId", required: false })
  @ApiQuery({ name: "startDate", required: false })
  @ApiQuery({ name: "endDate", required: false })
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "limit", required: false, example: 100 })
  async getLogs(
    @Request() req: any,
    @Query("userId") userId?: string,
    @Query("action") action?: AuditActionType,
    @Query("entityType") entityType?: string,
    @Query("entityId") entityId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.auditService.getLogs(req.user.tenant_id, {
      userId,
      action,
      entityType,
      entityId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page || 1,
      limit: limit || 100,
    });
  }

  @Get("verify")
  @ApiOperation({ summary: "Verify audit chain integrity" })
  async verifyChain(@Request() req: any) {
    return this.auditService.verifyChainIntegrity(req.user.tenant_id);
  }

  @Get("export")
  @ApiOperation({ summary: "Export audit logs (for compliance)" })
  @ApiQuery({ name: "format", required: false, enum: ["json", "csv"] })
  @ApiQuery({ name: "startDate", required: false })
  @ApiQuery({ name: "endDate", required: false })
  async exportLogs(
    @Request() req: any,
    @Response() res: any,
    @Query("format") format: "json" | "csv" = "json",
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    const data = await this.auditService.exportLogs(
      req.user.tenant_id,
      format,
      {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
    );

    const filename = `audit-export-${new Date().toISOString().split("T")[0]}.${format}`;
    const contentType = format === "json" ? "application/json" : "text/csv";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(data);
  }

  @Get("retention")
  @ApiOperation({ summary: "Get audit retention period" })
  async getRetention(@Request() req: any) {
    const days = await this.auditService.getRetentionPeriod(req.user.tenant_id);
    return {
      retentionDays: days,
      retentionYears: (days / 365).toFixed(1),
    };
  }
}
