import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { ClientService } from "../services/client.service";
import {
  CourtRegistrySearchResult,
  CourtRegistryService,
} from "../services/court-registry.service";
import {
  CreateClientDto,
  UpdateClientDto,
  ClientFiltersDto,
  BulkImportClientsDto,
  DeleteClientDto,
} from "../dto/client.dto";
import { JwtAuthGuard } from "../../auth/guards";
import { TenantGuard, RbacGuard, SubscriptionGuard } from "../../auth/guards";
import {
  RequirePlan,
  Roles,
} from "../../auth/decorators/access-control.decorators";
import {
  SubscriptionPlan,
  UserRole,
} from "../../database/entities/enums/subscription.enum";

/**
 * Clients Controller
 */
@ApiTags("Clients")
@Controller("clients")
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class ClientsController {
  constructor(
    private readonly clientService: ClientService,
    private readonly courtRegistryService: CourtRegistryService,
  ) {}

  @Get()
  @ApiOperation({ summary: "Get all clients" })
  @ApiResponse({ status: 200, description: "Clients retrieved" })
  async findAll(
    @Query() filters: ClientFiltersDto,
    @Req() req: any,
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const tenantId = req.user?.tenant_id;
    return this.clientService.findAll(tenantId, filters, req.user);
  }

  @Get("statistics")
  @ApiOperation({ summary: "Get client statistics" })
  @ApiResponse({ status: 200, description: "Statistics retrieved" })
  async getStatistics(@Req() req: any): Promise<any> {
    const tenantId = req.user?.tenant_id;
    return this.clientService.getStatistics(tenantId, req.user);
  }

  @Get("next-number")
  @ApiOperation({ summary: "Preview next available client number" })
  @ApiResponse({ status: 200, description: "Next client number retrieved" })
  async getNextClientNumber(
    @Req() req: any,
  ): Promise<{ clientNumber: string }> {
    const tenantId = req.user?.tenant_id;
    return this.clientService.getNextClientNumber(tenantId, req.user);
  }

  @Get("court-registry/search")
  @ApiOperation({
    summary: "Search court and enforcement registry CSV files by participant",
  })
  @ApiQuery({ name: "query", required: false, type: String })
  @ApiQuery({ name: "dateFrom", required: false, type: String })
  @ApiQuery({ name: "dateTo", required: false, type: String })
  @ApiQuery({ name: "source", required: false, type: String })
  @ApiQuery({ name: "caseNumber", required: false, type: String })
  @ApiQuery({ name: "institutionName", required: false, type: String })
  @ApiQuery({ name: "role", required: false, type: String })
  @ApiQuery({ name: "status", required: false, type: String })
  @ApiQuery({ name: "judge", required: false, type: String })
  @ApiQuery({ name: "proceedingNumber", required: false, type: String })
  @ApiQuery({ name: "proceedingType", required: false, type: String })
  @ApiResponse({ status: 200, description: "Registry search results returned" })
  async searchCourtRegistry(
    @Query("query") query?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
    @Query("source") source?: "court_registry" | "asvp",
    @Query("caseNumber") caseNumber?: string,
    @Query("institutionName") institutionName?: string,
    @Query("role") role?: string,
    @Query("status") status?: string,
    @Query("judge") judge?: string,
    @Query("proceedingNumber") proceedingNumber?: string,
    @Query("proceedingType") proceedingType?: string,
  ): Promise<CourtRegistrySearchResult[]> {
    return this.courtRegistryService.searchInCaseRegistries({
      query,
      dateFrom,
      dateTo,
      source,
      caseNumber,
      institutionName,
      role,
      status,
      judge,
      proceedingNumber,
      proceedingType,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get client by ID" })
  @ApiResponse({ status: 200, description: "Client retrieved" })
  async findById(@Param("id") id: string, @Req() req: any): Promise<any> {
    const tenantId = req.user?.tenant_id;
    return this.clientService.findById(tenantId, id, req.user);
  }

  @Post()
  @UseGuards(RbacGuard)
  @Roles(
    UserRole.ORGANIZATION_OWNER,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.LAWYER,
  )
  @ApiOperation({ summary: "Create new client" })
  @ApiResponse({ status: 201, description: "Client created" })
  async create(@Body() dto: CreateClientDto, @Req() req: any): Promise<any> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.clientService.create(tenantId, userId, dto, req.user);
  }

  @Post("import")
  @UseGuards(RbacGuard, SubscriptionGuard)
  @Roles(
    UserRole.ORGANIZATION_OWNER,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.LAWYER,
  )
  @RequirePlan(SubscriptionPlan.PROFESSIONAL)
  @ApiOperation({ summary: "Bulk import clients" })
  @ApiResponse({ status: 201, description: "Clients imported" })
  async bulkImport(
    @Body() dto: BulkImportClientsDto,
    @Req() req: any,
  ): Promise<{ success: number; failed: number; errors: any[] }> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.clientService.bulkImport(
      tenantId,
      userId,
      dto.clients,
      req.user,
    );
  }

  @Put(":id")
  @UseGuards(RbacGuard)
  @Roles(
    UserRole.ORGANIZATION_OWNER,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.LAWYER,
  )
  @ApiOperation({ summary: "Update client" })
  @ApiResponse({ status: 200, description: "Client updated" })
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateClientDto,
    @Req() req: any,
  ): Promise<any> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.clientService.update(tenantId, id, userId, dto, req.user);
  }

  @Patch(":id")
  @UseGuards(RbacGuard)
  @Roles(
    UserRole.ORGANIZATION_OWNER,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.LAWYER,
  )
  @ApiOperation({ summary: "Patch client (partial update)" })
  @ApiResponse({ status: 200, description: "Client patched" })
  async patch(
    @Param("id") id: string,
    @Body() dto: Partial<UpdateClientDto>,
    @Req() req: any,
  ): Promise<any> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.clientService.update(
      tenantId,
      id,
      userId,
      dto as UpdateClientDto,
      req.user,
    );
  }

  @Delete(":id")
  @UseGuards(RbacGuard)
  @Roles(
    UserRole.ORGANIZATION_OWNER,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.LAWYER,
  )
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete client" })
  @ApiResponse({ status: 204, description: "Client deleted" })
  async delete(
    @Param("id") id: string,
    @Body() dto: DeleteClientDto,
    @Req() req: any,
  ): Promise<void> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.clientService.delete(tenantId, id, userId, dto, req.user);
  }

  @Post(":id/restore")
  @UseGuards(RbacGuard)
  @Roles(
    UserRole.ORGANIZATION_OWNER,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.LAWYER,
  )
  @ApiOperation({ summary: "Restore deleted client" })
  @ApiResponse({ status: 200, description: "Client restored" })
  async restore(@Param("id") id: string, @Req() req: any): Promise<any> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.clientService.restore(tenantId, id, userId, req.user);
  }
}
