import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import {
  PlatformAdminAuthResponseDto,
  PlatformAdminBootstrapDto,
  PlatformAdminBootstrapStatusDto,
  PlatformAdminConfirmMfaDto,
  PlatformAdminLoginDto,
  PlatformAdminLogoutDto,
  PlatformAdminMfaSetupResponseDto,
  PlatformAdminProfileDto,
  PlatformAdminRefreshResponseDto,
  PlatformAdminRefreshTokenDto,
  PlatformAdminVerifyMfaDto,
} from "../dto/platform-admin-login.dto";
import { PlatformAdminJwtAuthGuard } from "../guards";
import { PlatformAdminAuthService } from "../services/platform-admin-auth.service";

@ApiTags("Platform Admin Auth")
@Controller("platform-admin/auth")
export class PlatformAdminAuthController {
  constructor(
    private readonly platformAdminAuthService: PlatformAdminAuthService,
  ) {}

  @Get("bootstrap-status")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Check whether the owner back office still needs first-admin bootstrap",
  })
  @ApiResponse({
    status: 200,
    description: "Bootstrap availability for the platform-admin surface",
    type: PlatformAdminBootstrapStatusDto,
  })
  async getBootstrapStatus(): Promise<PlatformAdminBootstrapStatusDto> {
    return this.platformAdminAuthService.getBootstrapStatus();
  }

  @Post("bootstrap")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({
    summary:
      "Create the very first platform-admin owner using a bootstrap token",
  })
  @ApiResponse({
    status: 200,
    description:
      "Returns the initial platform-admin session for the newly bootstrapped owner",
    type: PlatformAdminAuthResponseDto,
  })
  async bootstrap(
    @Body() dto: PlatformAdminBootstrapDto,
    @Req() req: Request,
  ): Promise<PlatformAdminAuthResponseDto> {
    return this.platformAdminAuthService.bootstrapFirstAdmin(
      dto,
      this.resolveIpAddress(req),
      this.resolveUserAgent(req),
    );
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: "Platform-admin primary login step" })
  @ApiResponse({
    status: 200,
    description:
      "Returns either MFA challenge or a ready platform-admin session",
    type: PlatformAdminAuthResponseDto,
  })
  async login(
    @Body() dto: PlatformAdminLoginDto,
    @Req() req: Request,
  ): Promise<PlatformAdminAuthResponseDto> {
    return this.platformAdminAuthService.login(
      dto,
      this.resolveIpAddress(req),
      this.resolveUserAgent(req),
    );
  }

  @Post("verify-mfa")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: "Verify platform-admin MFA challenge" })
  @ApiResponse({
    status: 200,
    description: "Returns an authenticated platform-admin session",
    type: PlatformAdminAuthResponseDto,
  })
  async verifyMfa(
    @Body() dto: PlatformAdminVerifyMfaDto,
    @Req() req: Request,
  ): Promise<PlatformAdminAuthResponseDto> {
    return this.platformAdminAuthService.verifyMfa(
      dto,
      this.resolveIpAddress(req),
      this.resolveUserAgent(req),
    );
  }

  @Post("mfa/setup")
  @UseGuards(PlatformAdminJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: "Generate a fresh MFA enrollment kit" })
  @ApiResponse({
    status: 200,
    description: "Provisioning data for TOTP enrollment",
    type: PlatformAdminMfaSetupResponseDto,
  })
  async setupMfa(
    @Req() req: Request,
  ): Promise<PlatformAdminMfaSetupResponseDto> {
    return this.platformAdminAuthService.setupMfa((req as any).user?.admin_id);
  }

  @Post("mfa/confirm")
  @UseGuards(PlatformAdminJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: "Confirm MFA enrollment and rotate into an MFA session",
  })
  @ApiResponse({
    status: 200,
    description: "Returns a refreshed MFA-backed platform-admin session",
    type: PlatformAdminAuthResponseDto,
  })
  async confirmMfa(
    @Req() req: Request,
    @Body() dto: PlatformAdminConfirmMfaDto,
  ): Promise<PlatformAdminAuthResponseDto> {
    return this.platformAdminAuthService.confirmMfa(
      (req as any).user?.admin_id,
      dto,
      this.resolveIpAddress(req),
      this.resolveUserAgent(req),
    );
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: "Refresh platform-admin tokens" })
  @ApiResponse({
    status: 200,
    description: "Platform-admin token pair refreshed",
    type: PlatformAdminRefreshResponseDto,
  })
  async refresh(
    @Body() dto: PlatformAdminRefreshTokenDto,
  ): Promise<PlatformAdminRefreshResponseDto> {
    return this.platformAdminAuthService.refreshToken(dto);
  }

  @Post("logout")
  @UseGuards(PlatformAdminJwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Logout current platform-admin session" })
  async logout(
    @Req() req: Request,
    @Body() dto?: PlatformAdminLogoutDto,
  ): Promise<void> {
    const authorizationHeader = req.headers.authorization;
    const accessToken = authorizationHeader?.startsWith("Bearer ")
      ? authorizationHeader.slice("Bearer ".length)
      : undefined;

    await this.platformAdminAuthService.logout(
      (req as any).user?.admin_id,
      accessToken,
      dto,
    );
  }

  @Get("me")
  @UseGuards(PlatformAdminJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current platform-admin profile" })
  @ApiResponse({
    status: 200,
    description: "Platform-admin profile retrieved",
    type: PlatformAdminProfileDto,
  })
  async getMe(@Req() req: Request): Promise<PlatformAdminProfileDto> {
    return this.platformAdminAuthService.getCurrentAdmin(
      (req as any).user?.admin_id,
    );
  }

  private resolveIpAddress(req: Request): string {
    return (
      (req as any).ip || (req as any).connection?.remoteAddress || "0.0.0.0"
    );
  }

  private resolveUserAgent(req: Request): string {
    return (
      (req.headers as unknown as Record<string, string | undefined>)[
        "user-agent"
      ] ?? "unknown"
    );
  }
}
