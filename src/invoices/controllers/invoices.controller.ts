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
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { InvoiceService } from "../services/invoice.service";
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  InvoiceFiltersDto,
  GenerateInvoicePdfDto,
  RecordPaymentDto,
} from "../dto/invoice.dto";
import { JwtAuthGuard } from "../../auth/guards";
import { TenantGuard, RbacGuard } from "../../auth/guards";
import { Audit } from "../../auth/services/audit.service";
import { Roles } from "../../auth/decorators/access-control.decorators";
import { UserRole } from "../../database/entities/enums/subscription.enum";

/**
 * Invoices Controller
 */
@ApiTags("Invoices")
@Controller("invoices")
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class InvoicesController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get()
  @ApiOperation({ summary: "Get all invoices" })
  @ApiResponse({ status: 200, description: "Invoices retrieved" })
  async findAll(
    @Query() filters: InvoiceFiltersDto,
    @Req() req: any,
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const tenantId = req.user?.tenant_id;
    return this.invoiceService.findAll(tenantId, filters);
  }

  @Get("statistics")
  @ApiOperation({ summary: "Get invoice statistics" })
  @ApiResponse({ status: 200, description: "Statistics retrieved" })
  async getStatistics(@Req() req: any): Promise<any> {
    const tenantId = req.user?.tenant_id;
    return this.invoiceService.getStatistics(tenantId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get invoice by ID" })
  @ApiResponse({ status: 200, description: "Invoice retrieved" })
  async findById(@Param("id") id: string, @Req() req: any): Promise<any> {
    const tenantId = req.user?.tenant_id;
    return this.invoiceService.findById(tenantId, id);
  }

  @Post()
  @UseGuards(RbacGuard)
  @Roles(
    UserRole.ORGANIZATION_OWNER,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.ACCOUNTANT,
  )
  @ApiOperation({ summary: "Create new invoice" })
  @ApiResponse({ status: 201, description: "Invoice created" })
  @Audit("create")
  async create(@Body() dto: CreateInvoiceDto, @Req() req: any): Promise<any> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.invoiceService.create(tenantId, userId, dto);
  }

  @Put(":id")
  @UseGuards(RbacGuard)
  @Roles(
    UserRole.ORGANIZATION_OWNER,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.ACCOUNTANT,
  )
  @ApiOperation({ summary: "Update invoice" })
  @ApiResponse({ status: 200, description: "Invoice updated" })
  @Audit("update")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateInvoiceDto,
    @Req() req: any,
  ): Promise<any> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.invoiceService.update(tenantId, id, userId, dto);
  }

  @Post(":id/send")
  @UseGuards(RbacGuard)
  @Roles(
    UserRole.ORGANIZATION_OWNER,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.ACCOUNTANT,
  )
  @ApiOperation({ summary: "Send invoice to client" })
  @ApiResponse({ status: 200, description: "Invoice sent" })
  @Audit("update")
  async send(@Param("id") id: string, @Req() req: any): Promise<any> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.invoiceService.send(tenantId, id, userId);
  }

  @Post(":id/pdf")
  @UseGuards(RbacGuard)
  @Roles(
    UserRole.ORGANIZATION_OWNER,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.ACCOUNTANT,
  )
  @ApiOperation({ summary: "Generate invoice PDF" })
  @ApiResponse({ status: 200, description: "PDF generated" })
  @Audit("update")
  async generatePdf(
    @Param("id") id: string,
    @Body() dto: GenerateInvoicePdfDto,
    @Req() req: any,
  ): Promise<{ pdfUrl: string; pdfGeneratedAt: Date }> {
    const tenantId = req.user?.tenant_id;
    return this.invoiceService.generatePdf(tenantId, id, dto);
  }

  @Post(":id/payment")
  @UseGuards(RbacGuard)
  @Roles(
    UserRole.ORGANIZATION_OWNER,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.ACCOUNTANT,
  )
  @ApiOperation({ summary: "Record payment" })
  @ApiResponse({ status: 200, description: "Payment recorded" })
  @Audit("update")
  async recordPayment(
    @Param("id") id: string,
    @Body() dto: RecordPaymentDto,
    @Req() req: any,
  ): Promise<any> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.invoiceService.recordPayment(tenantId, id, userId, dto);
  }

  @Delete(":id")
  @UseGuards(RbacGuard)
  @Roles(
    UserRole.ORGANIZATION_OWNER,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.ACCOUNTANT,
  )
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete invoice" })
  @ApiResponse({ status: 204, description: "Invoice deleted" })
  @Audit("delete")
  async delete(@Param("id") id: string, @Req() req: any): Promise<void> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.invoiceService.delete(tenantId, id, userId);
  }
}
