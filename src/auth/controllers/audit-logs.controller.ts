import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard, RbacGuard, SubscriptionGuard } from "../guards";
import { RequirePlan, Roles } from "../decorators/access-control.decorators";
import {
  SubscriptionPlan,
  UserRole,
} from "../../database/entities/enums/subscription.enum";
import { AuditService } from "../services/audit.service";
import type { Request } from "express";

@ApiTags("Audit Logs")
@ApiBearerAuth()
@Controller("audit-logs")
@UseGuards(JwtAuthGuard, RbacGuard, SubscriptionGuard)
@Roles(UserRole.ORGANIZATION_OWNER, UserRole.ORGANIZATION_ADMIN)
@RequirePlan(SubscriptionPlan.PROFESSIONAL)
export class AuditLogsController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: "List tenant audit logs" })
  @ApiQuery({ name: "userId", required: false })
  @ApiQuery({ name: "action", required: false })
  @ApiQuery({ name: "entityType", required: false })
  @ApiQuery({ name: "entityId", required: false })
  @ApiQuery({ name: "startDate", required: false })
  @ApiQuery({ name: "endDate", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  async getLogs(
    @Req() req: Request,
    @Query("userId") userId?: string,
    @Query("action") action?: string,
    @Query("entityType") entityType?: string,
    @Query("entityId") entityId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const currentPage = Number(page || 1);
    const pageLimit = Number(limit || 50);
    const result = await this.auditService.getTenantAuditLogs(
      (req as any).user?.tenant_id,
      {
        userId,
        action,
        entityType,
        entityId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        page: Number.isFinite(currentPage) ? currentPage : 1,
        limit: Number.isFinite(pageLimit) ? pageLimit : 50,
      },
    );

    return {
      ...result,
      page: Number.isFinite(currentPage) ? currentPage : 1,
      limit: Number.isFinite(pageLimit) ? pageLimit : 50,
    };
  }
}
