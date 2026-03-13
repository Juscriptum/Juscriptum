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
  Res,
  Req,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from "@nestjs/swagger";
import { CalculationService } from "../services/calculation.service";
import {
  CreateCalculationDto,
  UpdateCalculationDto,
  CalculationFiltersDto,
  GeneratePdfDto,
  ApproveCalculationDto,
  RejectCalculationDto,
} from "../dto/calculation.dto";
import { JwtAuthGuard } from "../../auth/guards";
import { TenantGuard, RbacGuard } from "../../auth/guards";
import { Audit } from "../../auth/services/audit.service";
import { Roles } from "../../auth/decorators/access-control.decorators";
import { UserRole } from "../../database/entities/enums/subscription.enum";

/**
 * Calculations Controller
 */
@ApiTags("Calculations")
@Controller("calculations")
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class CalculationsController {
  constructor(private readonly calculationService: CalculationService) {}

  private static readonly EDITOR_ROLES = [
    UserRole.ORGANIZATION_OWNER,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.LAWYER,
    UserRole.ACCOUNTANT,
  ] as const;

  @Get()
  @ApiOperation({ summary: "Get all calculations" })
  @ApiResponse({ status: 200, description: "Calculations retrieved" })
  async findAll(
    @Query() filters: CalculationFiltersDto,
    @Req() req: any,
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const tenantId = req.user?.tenant_id;
    return this.calculationService.findAll(tenantId, filters);
  }

  @Get("statistics")
  @ApiOperation({ summary: "Get calculation statistics" })
  @ApiResponse({ status: 200, description: "Statistics retrieved" })
  async getStatistics(@Req() req: any): Promise<any> {
    const tenantId = req.user?.tenant_id;
    return this.calculationService.getStatistics(tenantId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get calculation by ID" })
  @ApiResponse({ status: 200, description: "Calculation retrieved" })
  async findById(@Param("id") id: string, @Req() req: any): Promise<any> {
    const tenantId = req.user?.tenant_id;
    return this.calculationService.findById(tenantId, id);
  }

  @Post()
  @UseGuards(RbacGuard)
  @Roles(...CalculationsController.EDITOR_ROLES)
  @ApiOperation({ summary: "Create new calculation" })
  @ApiResponse({ status: 201, description: "Calculation created" })
  @Audit("create")
  async create(
    @Body() dto: CreateCalculationDto,
    @Req() req: any,
  ): Promise<any> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.calculationService.create(tenantId, userId, dto);
  }

  @Put(":id")
  @UseGuards(RbacGuard)
  @Roles(...CalculationsController.EDITOR_ROLES)
  @ApiOperation({ summary: "Update calculation" })
  @ApiResponse({ status: 200, description: "Calculation updated" })
  @Audit("update")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateCalculationDto,
    @Req() req: any,
  ): Promise<any> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.calculationService.update(tenantId, id, userId, dto);
  }

  @Delete(":id")
  @UseGuards(RbacGuard)
  @Roles(...CalculationsController.EDITOR_ROLES)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete calculation" })
  @ApiResponse({ status: 204, description: "Calculation deleted" })
  @Audit("delete")
  async delete(@Param("id") id: string, @Req() req: any): Promise<void> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.calculationService.delete(tenantId, id, userId);
  }

  @Post(":id/send-for-approval")
  @UseGuards(RbacGuard)
  @Roles(...CalculationsController.EDITOR_ROLES)
  @ApiOperation({ summary: "Send calculation for approval" })
  @ApiResponse({ status: 200, description: "Calculation sent for approval" })
  @Audit("update")
  async sendForApproval(
    @Param("id") id: string,
    @Req() req: any,
  ): Promise<any> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.calculationService.sendForApproval(tenantId, id, userId);
  }

  @Post(":id/approve")
  @UseGuards(RbacGuard)
  @Roles(...CalculationsController.EDITOR_ROLES)
  @ApiOperation({ summary: "Approve calculation" })
  @ApiResponse({ status: 200, description: "Calculation approved" })
  @Audit("update")
  async approve(
    @Param("id") id: string,
    @Body() dto: ApproveCalculationDto,
    @Req() req: any,
  ): Promise<any> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.calculationService.approve(tenantId, id, userId, dto);
  }

  @Post(":id/reject")
  @UseGuards(RbacGuard)
  @Roles(...CalculationsController.EDITOR_ROLES)
  @ApiOperation({ summary: "Reject calculation" })
  @ApiResponse({ status: 200, description: "Calculation rejected" })
  @Audit("update")
  async reject(
    @Param("id") id: string,
    @Body() dto: RejectCalculationDto,
    @Req() req: any,
  ): Promise<any> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.calculationService.reject(tenantId, id, userId, dto);
  }

  @Post(":id/pdf")
  @UseGuards(RbacGuard)
  @Roles(...CalculationsController.EDITOR_ROLES)
  @ApiOperation({ summary: "Generate calculation PDF" })
  @ApiResponse({ status: 200, description: "PDF generated" })
  @Audit("update")
  async generatePdf(
    @Param("id") id: string,
    @Body() dto: GeneratePdfDto,
    @Req() req: any,
  ): Promise<{ pdfUrl: string; pdfGeneratedAt: Date }> {
    const tenantId = req.user?.tenant_id;
    return this.calculationService.generatePdf(tenantId, id, dto);
  }

  @Get(":id/export/excel")
  @ApiOperation({ summary: "Export calculation to Excel" })
  @ApiResponse({
    status: 200,
    description: "Excel exported",
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  async exportToExcel(
    @Param("id") id: string,
    @Req() req: any,
    @Res() res: any,
  ): Promise<void> {
    const tenantId = req.user?.tenant_id;
    const excelBuffer = await this.calculationService.exportToExcel(
      tenantId,
      id,
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=calculation-${id}.xlsx`,
    );

    res.send(excelBuffer);
  }

  @Get(":id/export/pdf")
  @ApiOperation({ summary: "Export calculation to PDF" })
  @ApiResponse({
    status: 200,
    description: "PDF exported",
    type: "application/pdf",
  })
  async exportToPdf(
    @Param("id") id: string,
    @Req() req: any,
    @Res() res: any,
  ): Promise<void> {
    const tenantId = req.user?.tenant_id;
    const { pdfUrl } = await this.calculationService.generatePdf(tenantId, id, {
      calculationId: id,
    });

    // Redirect to PDF URL or serve file
    res.redirect(pdfUrl);
  }
}
