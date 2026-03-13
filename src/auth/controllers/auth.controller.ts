import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Logger,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "../services/auth.service";
import { LoginDto, LoginResponseDto } from "../dto/login.dto";
import { RegisterDto } from "../dto/register.dto";
import {
  RefreshTokenDto,
  RefreshTokenResponseDto,
  LogoutDto,
} from "../dto/refresh-token.dto";
import {
  ForgotPasswordDto,
  ResetPasswordDto,
} from "../dto/forgot-password.dto";
import { VerifyEmailDto } from "../dto/verify-email.dto";
import { JwtAuthGuard } from "../guards";
import { JwtPayload } from "../interfaces/jwt.interface";
import type { Request } from "express";

/**
 * Auth Controller
 */
@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 registrations per hour
  @ApiOperation({ summary: "Register new user (email + password only)" })
  @ApiResponse({ status: 201, description: "User registered successfully" })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 409, description: "Email already exists" })
  @ApiResponse({ status: 429, description: "Too many registration attempts" })
  async register(@Body() dto: RegisterDto): Promise<LoginResponseDto> {
    try {
      this.logger.log(
        `[REGISTER] Attempting registration for email: ${dto.email}`,
      );
      const result = await this.authService.register(dto);
      this.logger.log(
        `[REGISTER] Registration successful for userId: ${result.user.id}`,
      );
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.stack || error.message : String(error);
      this.logger.error(
        `[REGISTER] Registration failed for email: ${dto.email}`,
        errorMessage,
      );
      throw error;
    }
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  @ApiOperation({ summary: "Login user" })
  @ApiResponse({
    status: 200,
    description: "Login successful",
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  @ApiResponse({ status: 429, description: "Too many login attempts" })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
  ): Promise<LoginResponseDto> {
    const ipAddress =
      (req as any).ip || (req as any).connection?.remoteAddress || "0.0.0.0";
    const userAgent =
      (req.headers as unknown as Record<string, string | undefined>)[
        "user-agent"
      ] ?? "unknown";

    return this.authService.login(dto, ipAddress, userAgent);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: "Refresh access token" })
  @ApiResponse({
    status: 200,
    description: "Token refreshed",
    type: RefreshTokenResponseDto,
  })
  @ApiResponse({ status: 401, description: "Invalid refresh token" })
  @ApiResponse({ status: 429, description: "Too many refresh attempts" })
  async refreshToken(
    @Body() dto: RefreshTokenDto,
  ): Promise<RefreshTokenResponseDto> {
    return this.authService.refreshToken(dto);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Logout user" })
  @ApiResponse({ status: 204, description: "Logout successful" })
  async logout(@Req() req: Request, @Body() dto?: LogoutDto): Promise<void> {
    const userId = (req as any).user?.user_id;
    const authorizationHeader = req.headers.authorization;
    const accessToken = authorizationHeader?.startsWith("Bearer ")
      ? authorizationHeader.slice("Bearer ".length)
      : undefined;

    await this.authService.logout(userId, accessToken, dto);
  }

  @Post("logout-all")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Logout from all devices" })
  @ApiResponse({ status: 204, description: "Logged out from all devices" })
  async logoutAll(@Req() req: Request): Promise<void> {
    const userId = (req as any).user?.user_id;
    await this.authService.logoutAllDevices(userId);
  }

  @Post("forgot-password")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 attempts per hour
  @ApiOperation({ summary: "Request password reset" })
  @ApiResponse({ status: 204, description: "Password reset email sent" })
  @ApiResponse({ status: 429, description: "Too many password reset attempts" })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    await this.authService.forgotPassword(dto);
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 resets per hour
  @ApiOperation({ summary: "Reset password with token" })
  @ApiResponse({ status: 204, description: "Password reset successful" })
  @ApiResponse({ status: 400, description: "Invalid or expired token" })
  @ApiResponse({ status: 429, description: "Too many reset attempts" })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.authService.resetPassword(dto);
  }

  @Post("verify-email")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Verify email address" })
  @ApiResponse({ status: 204, description: "Email verified successfully" })
  @ApiResponse({ status: 400, description: "Invalid or expired token" })
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<void> {
    await this.authService.verifyEmail(dto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user info" })
  @ApiResponse({ status: 200, description: "User info retrieved" })
  async getMe(@Req() req: Request): Promise<JwtPayload> {
    return (req as any).user;
  }
}
