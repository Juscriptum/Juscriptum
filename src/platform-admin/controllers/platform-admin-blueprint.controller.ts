import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { PLATFORM_ADMIN_BLUEPRINT, PlatformAdminBlueprint } from "../blueprint";
import { PlatformAdminJwtAuthGuard } from "../guards";

@ApiTags("Platform Admin")
@ApiBearerAuth()
@Controller("platform-admin")
@UseGuards(PlatformAdminJwtAuthGuard)
export class PlatformAdminBlueprintController {
  @Get("blueprint")
  @ApiOperation({
    summary:
      "Return the current platform-admin architecture blueprint and API roadmap",
  })
  getBlueprint(): PlatformAdminBlueprint {
    return PLATFORM_ADMIN_BLUEPRINT;
  }
}
