import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { CustomDomainService } from "../services/custom-domain.service";
import { JwtAuthGuard } from "../../../auth/guards";
import { AddDomainDto, VerifyDomainDto } from "../dto/custom-domain.dto";

@ApiTags("Custom Domains")
@ApiBearerAuth()
@Controller("v1/domains")
@UseGuards(JwtAuthGuard)
export class CustomDomainController {
  constructor(private readonly customDomainService: CustomDomainService) {}

  @Get()
  @ApiOperation({ summary: "Get all custom domains for organization" })
  async getDomains(@Request() req: any) {
    return this.customDomainService.getDomains(req.user.tenant_id);
  }

  @Post()
  @ApiOperation({ summary: "Add custom domain" })
  async addDomain(@Request() req: any, @Body() dto: AddDomainDto) {
    return this.customDomainService.addDomain(req.user.tenant_id, dto.domain);
  }

  @Post(":id/verify")
  @ApiOperation({ summary: "Verify domain ownership" })
  async verifyDomain(@Request() req: any, @Param("id") id: string) {
    return this.customDomainService.verifyDomain(req.user.tenant_id, id);
  }

  @Post(":id/primary")
  @ApiOperation({ summary: "Set domain as primary" })
  async setPrimaryDomain(@Request() req: any, @Param("id") id: string) {
    return this.customDomainService.setPrimaryDomain(req.user.tenant_id, id);
  }

  @Post(":id/ssl")
  @ApiOperation({ summary: "Generate SSL certificate" })
  async generateSsl(@Request() req: any, @Param("id") id: string) {
    return this.customDomainService.generateSslCertificate(
      req.user.tenant_id,
      id,
    );
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remove custom domain" })
  async removeDomain(@Request() req: any, @Param("id") id: string) {
    await this.customDomainService.removeDomain(req.user.tenant_id, id);
    return { success: true };
  }
}
