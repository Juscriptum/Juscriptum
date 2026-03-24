import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { PlatformAdminJwtAuthGuard } from "../guards";
import { PlatformAdminReadService } from "../services/platform-admin-read.service";
import {
  PlatformAdminOrganizationDetailDto,
  PlatformAdminOrganizationListResponseDto,
  PlatformAdminOrganizationsQueryDto,
  PlatformAdminOrganizationUserDto,
} from "../dto/platform-admin-read-model.dto";

@ApiTags("Platform Admin Organizations")
@ApiBearerAuth()
@Controller("platform-admin/organizations")
@UseGuards(PlatformAdminJwtAuthGuard)
export class PlatformAdminOrganizationsController {
  constructor(
    private readonly platformAdminReadService: PlatformAdminReadService,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      "List organizations through a metadata-only platform-admin read model",
  })
  @ApiResponse({
    status: 200,
    description: "Platform-admin organizations registry retrieved",
    type: PlatformAdminOrganizationListResponseDto,
  })
  async listOrganizations(
    @Query() query: PlatformAdminOrganizationsQueryDto,
  ): Promise<PlatformAdminOrganizationListResponseDto> {
    return this.platformAdminReadService.getOrganizations(query);
  }

  @Get(":id")
  @ApiOperation({
    summary:
      "Return a single organization metadata card for support, billing, and security review",
  })
  @ApiResponse({
    status: 200,
    description: "Platform-admin organization detail retrieved",
    type: PlatformAdminOrganizationDetailDto,
  })
  async getOrganization(
    @Param("id") organizationId: string,
  ): Promise<PlatformAdminOrganizationDetailDto> {
    return this.platformAdminReadService.getOrganizationDetail(organizationId);
  }

  @Get(":id/users")
  @ApiOperation({
    summary:
      "Return a masked organization-user roster for owner back-office review",
  })
  @ApiResponse({
    status: 200,
    description: "Masked organization users retrieved",
    type: PlatformAdminOrganizationUserDto,
    isArray: true,
  })
  async getOrganizationUsers(
    @Param("id") organizationId: string,
  ): Promise<PlatformAdminOrganizationUserDto[]> {
    return this.platformAdminReadService.getOrganizationUsers(organizationId);
  }
}
