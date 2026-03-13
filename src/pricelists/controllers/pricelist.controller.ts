import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { TenantGuard, RbacGuard } from "../../auth/guards";
import { JwtAuthGuard } from "../../auth/guards";
import { Audit } from "../../auth/services/audit.service";
import { Roles } from "../../auth/decorators/access-control.decorators";
import { UserRole } from "../../database/entities/enums/subscription.enum";
import {
  CreatePricelistCategoryDto,
  CreatePricelistDto,
  CreatePricelistItemDto,
  PricelistFiltersDto,
  UpdatePricelistCategoryDto,
  UpdatePricelistDto,
  UpdatePricelistItemDto,
} from "../dto/pricelist.dto";
import { PricelistService } from "../services/pricelist.service";

@ApiTags("Pricelists")
@Controller("pricelists")
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class PricelistsController {
  constructor(private readonly pricelistService: PricelistService) {}

  private static readonly EDITOR_ROLES = [
    UserRole.ORGANIZATION_OWNER,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.LAWYER,
    UserRole.ACCOUNTANT,
  ] as const;

  @Get()
  @ApiOperation({ summary: "Get all pricelists" })
  @ApiResponse({ status: 200, description: "Pricelists retrieved" })
  async findAll(
    @Query() filters: PricelistFiltersDto,
    @Req() req: any,
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const tenantId = req.user?.tenant_id;
    return this.pricelistService.findAll(tenantId, filters);
  }

  @Get("default")
  @ApiOperation({ summary: "Get default pricelist" })
  @ApiResponse({ status: 200, description: "Default pricelist retrieved" })
  async getDefault(@Req() req: any): Promise<any> {
    const tenantId = req.user?.tenant_id;
    return this.pricelistService.getDefaultPricelist(tenantId);
  }

  @Get("items")
  @ApiOperation({ summary: "Get items by category" })
  @ApiResponse({ status: 200, description: "Items retrieved" })
  async getItemsByCategory(
    @Query("category") category: string,
    @Req() req: any,
  ): Promise<any[]> {
    const tenantId = req.user?.tenant_id;
    return this.pricelistService.getItemsByCategory(tenantId, category);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get pricelist by ID" })
  @ApiResponse({ status: 200, description: "Pricelist retrieved" })
  async findById(@Param("id") id: string, @Req() req: any): Promise<any> {
    const tenantId = req.user?.tenant_id;
    return this.pricelistService.findById(tenantId, id);
  }

  @Post()
  @UseGuards(RbacGuard)
  @Roles(...PricelistsController.EDITOR_ROLES)
  @ApiOperation({ summary: "Create new pricelist" })
  @ApiResponse({ status: 201, description: "Pricelist created" })
  @Audit("create")
  async create(@Body() dto: CreatePricelistDto, @Req() req: any): Promise<any> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.pricelistService.create(tenantId, userId, dto);
  }

  @Put(":id")
  @UseGuards(RbacGuard)
  @Roles(...PricelistsController.EDITOR_ROLES)
  @ApiOperation({ summary: "Update pricelist" })
  @ApiResponse({ status: 200, description: "Pricelist updated" })
  @Audit("update")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdatePricelistDto,
    @Req() req: any,
  ): Promise<any> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.pricelistService.update(tenantId, id, userId, dto);
  }

  @Delete(":id")
  @UseGuards(RbacGuard)
  @Roles(...PricelistsController.EDITOR_ROLES)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete pricelist" })
  @ApiResponse({ status: 204, description: "Pricelist deleted" })
  @Audit("delete")
  async delete(@Param("id") id: string, @Req() req: any): Promise<void> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.pricelistService.delete(tenantId, id, userId);
  }

  @Post(":id/categories")
  @UseGuards(RbacGuard)
  @Roles(...PricelistsController.EDITOR_ROLES)
  @ApiOperation({ summary: "Add category to pricelist" })
  @ApiResponse({ status: 201, description: "Category added" })
  @Audit("create")
  async addCategory(
    @Param("id") id: string,
    @Body() dto: CreatePricelistCategoryDto,
    @Req() req: any,
  ): Promise<any> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.pricelistService.addCategory(tenantId, userId, id, dto);
  }

  @Put("categories/:categoryId")
  @UseGuards(RbacGuard)
  @Roles(...PricelistsController.EDITOR_ROLES)
  @ApiOperation({ summary: "Update pricelist category" })
  @ApiResponse({ status: 200, description: "Category updated" })
  @Audit("update")
  async updateCategory(
    @Param("categoryId") categoryId: string,
    @Body() dto: UpdatePricelistCategoryDto,
    @Req() req: any,
  ): Promise<any> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.pricelistService.updateCategory(
      tenantId,
      categoryId,
      userId,
      dto,
    );
  }

  @Delete("categories/:categoryId")
  @UseGuards(RbacGuard)
  @Roles(...PricelistsController.EDITOR_ROLES)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete pricelist category" })
  @ApiResponse({ status: 204, description: "Category deleted" })
  @Audit("delete")
  async deleteCategory(
    @Param("categoryId") categoryId: string,
    @Req() req: any,
  ): Promise<void> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.pricelistService.deleteCategory(tenantId, categoryId, userId);
  }

  @Post(":id/items")
  @UseGuards(RbacGuard)
  @Roles(...PricelistsController.EDITOR_ROLES)
  @ApiOperation({ summary: "Add item to pricelist" })
  @ApiResponse({ status: 201, description: "Item added" })
  @Audit("create")
  async addItem(
    @Param("id") id: string,
    @Body() dto: CreatePricelistItemDto,
    @Req() req: any,
  ): Promise<any> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.pricelistService.addItem(tenantId, userId, id, dto);
  }

  @Put("items/:itemId")
  @UseGuards(RbacGuard)
  @Roles(...PricelistsController.EDITOR_ROLES)
  @ApiOperation({ summary: "Update pricelist item" })
  @ApiResponse({ status: 200, description: "Item updated" })
  @Audit("update")
  async updateItem(
    @Param("itemId") itemId: string,
    @Body() dto: UpdatePricelistItemDto,
    @Req() req: any,
  ): Promise<any> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.pricelistService.updateItem(tenantId, itemId, userId, dto);
  }

  @Delete("items/:itemId")
  @UseGuards(RbacGuard)
  @Roles(...PricelistsController.EDITOR_ROLES)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete pricelist item" })
  @ApiResponse({ status: 204, description: "Item deleted" })
  @Audit("delete")
  async deleteItem(
    @Param("itemId") itemId: string,
    @Req() req: any,
  ): Promise<void> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.pricelistService.deleteItem(tenantId, itemId, userId);
  }

  @Post(":id/duplicate")
  @UseGuards(RbacGuard)
  @Roles(...PricelistsController.EDITOR_ROLES)
  @ApiOperation({ summary: "Duplicate pricelist" })
  @ApiResponse({ status: 201, description: "Pricelist duplicated" })
  @Audit("create")
  async duplicate(@Param("id") id: string, @Req() req: any): Promise<any> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.pricelistService.duplicatePricelist(tenantId, userId, id);
  }
}
