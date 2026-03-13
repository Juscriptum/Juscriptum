import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Patch,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Param,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "../services/auth.service";
import { OrganizationService } from "../services/organization.service";
import { RegisterOrganizationDto } from "../dto/register.dto";
import { JwtAuthGuard, RbacGuard } from "../guards";
import { Roles } from "../decorators/access-control.decorators";
import { UserRole } from "../../database/entities/enums/subscription.enum";
import type { Request } from "express";

/**
 * Organization Controller
 */
@ApiTags("Organizations")
@Controller("organizations")
export class OrganizationController {
  constructor(
    private readonly authService: AuthService,
    private readonly organizationService: OrganizationService,
  ) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @ApiOperation({ summary: "Register new organization" })
  @ApiResponse({
    status: 201,
    description: "Organization registered successfully",
  })
  @ApiResponse({ status: 400, description: "Validation error" })
  async register(@Body() dto: RegisterOrganizationDto): Promise<{
    organizationId: string;
    userId: string;
  }> {
    return this.authService.registerOrganization(dto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current organization info" })
  @ApiResponse({ status: 200, description: "Organization info retrieved" })
  async getOrganization(@Req() req: Request): Promise<any> {
    const tenantId = (req as any).user?.tenant_id;
    return this.organizationService.getOrganizationById(tenantId);
  }

  @Put("me")
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(UserRole.ORGANIZATION_OWNER, UserRole.ORGANIZATION_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update organization info" })
  @ApiResponse({ status: 200, description: "Organization updated" })
  async updateOrganization(
    @Req() req: Request,
    @Body() data: any,
  ): Promise<any> {
    const tenantId = (req as any).user?.tenant_id;
    return this.organizationService.updateOrganization(tenantId, data);
  }

  @Get("subscription")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get subscription status" })
  @ApiResponse({ status: 200, description: "Subscription info retrieved" })
  async getSubscription(@Req() req: Request): Promise<any> {
    const tenantId = (req as any).user?.tenant_id;
    return this.organizationService.getSubscriptionStatus(tenantId);
  }

  @Get("onboarding")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get onboarding progress" })
  @ApiResponse({ status: 200, description: "Onboarding progress retrieved" })
  async getOnboardingProgress(@Req() req: Request): Promise<any> {
    const tenantId = (req as any).user?.tenant_id;
    const userId = (req as any).user?.user_id;
    return this.organizationService.getOnboardingProgress(tenantId, userId);
  }

  @Patch("onboarding/:step")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update onboarding step" })
  @ApiResponse({ status: 200, description: "Onboarding step updated" })
  async updateOnboardingStep(
    @Param("step") step: string,
    @Req() req: Request,
    @Body() data: { completed: boolean; data?: Record<string, any> },
  ): Promise<void> {
    const tenantId = (req as any).user?.tenant_id;
    const userId = (req as any).user?.user_id;

    await this.organizationService.updateOnboardingStep(
      tenantId,
      userId,
      step,
      data.completed,
      data.data,
    );
  }
}
