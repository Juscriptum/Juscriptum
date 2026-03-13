import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { CaseService } from "../services/case.service";
import { CreateCaseDto, UpdateCaseDto, CaseFiltersDto } from "../dto/case.dto";
import { JwtAuthGuard } from "../../auth/guards";
import { TenantGuard, RbacGuard } from "../../auth/guards";
import { Audit } from "../../auth/services/audit.service";
import { Roles } from "../../auth/decorators/access-control.decorators";
import { UserRole } from "../../database/entities/enums/subscription.enum";
import {
  CourtRegistrySearchResult,
  CourtRegistryService,
} from "../../clients/services/court-registry.service";

/**
 * Cases Controller
 */
@ApiTags("Cases")
@Controller("cases")
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class CasesController {
  constructor(
    private readonly caseService: CaseService,
    private readonly courtRegistryService: CourtRegistryService,
  ) {}

  @Get()
  @ApiOperation({ summary: "Get all cases" })
  @ApiResponse({ status: 200, description: "Cases retrieved" })
  async findAll(
    @Query() filters: CaseFiltersDto,
    @Req() req: any,
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const tenantId = req.user?.tenant_id;
    return this.caseService.findAll(tenantId, filters, req.user);
  }

  @Get("statistics")
  @ApiOperation({ summary: "Get case statistics" })
  @ApiResponse({ status: 200, description: "Statistics retrieved" })
  async getStatistics(@Req() req: any): Promise<any> {
    const tenantId = req.user?.tenant_id;
    return this.caseService.getStatistics(tenantId, req.user);
  }

  @Get("upcoming-deadlines")
  @ApiOperation({ summary: "Get upcoming deadlines" })
  @ApiResponse({ status: 200, description: "Upcoming deadlines retrieved" })
  async getUpcomingDeadlines(
    @Query("days") days?: string,
    @Req() req?: any,
  ): Promise<any[]> {
    const tenantId = req.user?.tenant_id;
    return this.caseService.getUpcomingDeadlines(
      tenantId,
      days ? parseInt(days) : 30,
      req.user,
    );
  }

  @Get("next-number")
  @ApiOperation({ summary: "Preview next case number for selected client" })
  @ApiQuery({ name: "clientId", required: true, type: String })
  @ApiResponse({ status: 200, description: "Next case number retrieved" })
  async getNextCaseNumber(
    @Query("clientId") clientId: string,
    @Req() req: any,
  ): Promise<{ caseNumber: string }> {
    const tenantId = req.user?.tenant_id;
    return this.caseService.getNextCaseNumber(tenantId, clientId, req.user);
  }

  @Get("registry-search")
  @ApiOperation({
    summary: "Search court and enforcement registries for cases",
  })
  @ApiQuery({ name: "query", required: true, type: String })
  @ApiQuery({ name: "dateFrom", required: false, type: String })
  @ApiQuery({ name: "dateTo", required: false, type: String })
  @ApiResponse({ status: 200, description: "Registry search results returned" })
  async searchRegistries(
    @Query("query") query: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
  ): Promise<CourtRegistrySearchResult[]> {
    return this.courtRegistryService.searchInCaseRegistries({
      query,
      dateFrom,
      dateTo,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get case by ID" })
  @ApiResponse({ status: 200, description: "Case retrieved" })
  async findById(@Param("id") id: string, @Req() req: any): Promise<any> {
    const tenantId = req.user?.tenant_id;
    return this.caseService.findById(tenantId, id, req.user);
  }

  @Get(":id/timeline")
  @ApiOperation({ summary: "Get case timeline" })
  @ApiResponse({ status: 200, description: "Timeline retrieved" })
  async getTimeline(@Param("id") id: string, @Req() req: any): Promise<any> {
    const tenantId = req.user?.tenant_id;
    return this.caseService.getTimeline(tenantId, id, req.user);
  }

  @Post()
  @UseGuards(RbacGuard)
  @Roles(
    UserRole.ORGANIZATION_OWNER,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.LAWYER,
  )
  @ApiOperation({ summary: "Create new case" })
  @ApiResponse({ status: 201, description: "Case created" })
  @Audit("create")
  async create(@Body() dto: CreateCaseDto, @Req() req: any): Promise<any> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.caseService.create(tenantId, userId, dto, req.user);
  }

  @Put(":id")
  @UseGuards(RbacGuard)
  @Roles(
    UserRole.ORGANIZATION_OWNER,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.LAWYER,
  )
  @ApiOperation({ summary: "Update case" })
  @ApiResponse({ status: 200, description: "Case updated" })
  @Audit("update")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateCaseDto,
    @Req() req: any,
  ): Promise<any> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.caseService.update(tenantId, id, userId, dto, req.user);
  }

  @Put(":id/status")
  @UseGuards(RbacGuard)
  @Roles(
    UserRole.ORGANIZATION_OWNER,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.LAWYER,
  )
  @ApiOperation({ summary: "Change case status" })
  @ApiResponse({ status: 200, description: "Status changed" })
  @Audit("update")
  async changeStatus(
    @Param("id") id: string,
    @Body("status")
    status: "draft" | "active" | "on_hold" | "closed" | "archived",
    @Req() req: any,
  ): Promise<any> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.caseService.changeStatus(
      tenantId,
      id,
      userId,
      status,
      req.user,
    );
  }

  @Post(":id/restore")
  @UseGuards(RbacGuard)
  @Roles(
    UserRole.ORGANIZATION_OWNER,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.LAWYER,
  )
  @ApiOperation({ summary: "Restore deleted case" })
  @ApiResponse({ status: 200, description: "Case restored" })
  async restore(@Param("id") id: string, @Req() req: any): Promise<any> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.caseService.restore(tenantId, id, userId, req.user);
  }

  @Delete(":id")
  @UseGuards(RbacGuard)
  @Roles(
    UserRole.ORGANIZATION_OWNER,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.LAWYER,
  )
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete case" })
  @ApiResponse({ status: 204, description: "Case deleted" })
  @Audit("delete")
  async delete(@Param("id") id: string, @Req() req: any): Promise<void> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.caseService.delete(tenantId, id, userId, req.user);
  }
}
