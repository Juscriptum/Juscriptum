import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { CdnService } from "../services/cdn.service";
import { JwtAuthGuard, SuperAdminGuard } from "../../../auth/guards";

@ApiTags("CDN")
@ApiBearerAuth()
@Controller("v1/cdn")
@UseGuards(JwtAuthGuard)
export class CdnController {
  constructor(private readonly cdnService: CdnService) {}

  @Get("config")
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: "Get CDN configuration" })
  getConfig() {
    return this.cdnService.getConfig();
  }

  @Post("purge")
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: "Purge CDN cache" })
  async purgeCache(
    @Body() body: { urls?: string[]; tags?: string[]; all?: boolean },
  ) {
    return this.cdnService.purge(body);
  }

  @Post("purge/tenant")
  @ApiOperation({ summary: "Purge tenant CDN cache" })
  async purgeTenantCache(@Request() req: any) {
    return this.cdnService.purgeTenantCache(req.user.tenant_id);
  }

  @Post("purge/static")
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: "Purge static assets cache" })
  async purgeStaticCache() {
    return this.cdnService.purgeStaticCache();
  }

  @Post("warm")
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: "Warm CDN cache" })
  async warmCache(@Body() body: { urls: string[] }) {
    return this.cdnService.warmCache(body.urls);
  }

  @Get("url")
  @ApiOperation({ summary: "Get CDN URL for path" })
  getCdnUrl(@Query("path") path: string) {
    return {
      original: path,
      cdnUrl: this.cdnService.getCdnUrl(path),
    };
  }
}
