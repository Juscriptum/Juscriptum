import {
  Body,
  Controller,
  Get,
  Headers,
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
import { JwtAuthGuard, TenantGuard } from "../../auth/guards";
import { ProviderCallbackDto } from "../dto/provider-callback.dto";
import { RequestIdentityVerificationDto } from "../dto/request-identity-verification.dto";
import { TrustVerificationService } from "../services/trust-verification.service";

@ApiTags("Trust Verification")
@Controller("trust-verifications")
export class TrustVerificationController {
  constructor(
    private readonly trustVerificationService: TrustVerificationService,
  ) {}

  @Post("identities")
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Request provider-backed identity verification" })
  @ApiResponse({ status: 201, description: "Identity verification requested" })
  async requestIdentityVerification(
    @Req() req: any,
    @Body() dto: RequestIdentityVerificationDto,
  ): Promise<any> {
    return this.trustVerificationService.requestIdentityVerification(
      req.user?.tenant_id,
      req.user?.user_id,
      dto,
    );
  }

  @Get("identities/me")
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List current user trust identities" })
  @ApiResponse({ status: 200, description: "Current identities returned" })
  async listMyIdentities(@Req() req: any): Promise<any[]> {
    return this.trustVerificationService.listUserIdentities(
      req.user?.tenant_id,
      req.user?.user_id,
    );
  }

  @Post("callbacks")
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: "Receive trust-provider verification callback" })
  @ApiResponse({ status: 202, description: "Callback accepted" })
  async providerCallback(
    @Body() dto: ProviderCallbackDto,
    @Headers("x-trust-provider-secret") providerSecret?: string,
    @Headers("x-trust-provider-signature") providerSignature?: string,
    @Headers("x-trust-provider-timestamp") providerTimestamp?: string,
    @Headers("x-trust-provider-nonce") providerNonce?: string,
  ): Promise<{ accepted: true }> {
    await this.trustVerificationService.handleProviderCallback(dto, {
      legacySecret: providerSecret,
      signature: providerSignature,
      timestamp: providerTimestamp,
      nonce: providerNonce,
    });

    return { accepted: true };
  }
}
