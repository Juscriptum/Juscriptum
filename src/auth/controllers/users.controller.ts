import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard, RbacGuard } from "../guards";
import { Roles } from "../decorators/access-control.decorators";
import { UserRole } from "../../database/entities/enums/subscription.enum";
import { UsersService } from "../services/users.service";
import {
  ChangePasswordDto,
  UpdateProfileDto,
} from "../../users/dto/profile.dto";
import {
  CreateInvitationDto,
  UpdateMemberDto,
} from "../../users/dto/user-management.dto";
import type { Request } from "express";

@ApiTags("Users")
@ApiBearerAuth()
@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("profile")
  @ApiOperation({ summary: "Get current user profile" })
  async getProfile(@Req() req: Request) {
    return this.usersService.getProfile(
      (req as any).user?.tenant_id,
      (req as any).user?.user_id,
    );
  }

  @Put("profile")
  @ApiOperation({ summary: "Update current user profile" })
  async updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(
      (req as any).user?.tenant_id,
      (req as any).user?.user_id,
      dto,
    );
  }

  @Put("profile/password")
  @ApiOperation({ summary: "Change current user password" })
  async changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto) {
    await this.usersService.changePassword(
      (req as any).user?.tenant_id,
      (req as any).user?.user_id,
      dto,
    );

    return { success: true };
  }

  @Get("members")
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(UserRole.ORGANIZATION_OWNER, UserRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: "List tenant members" })
  async listMembers(@Req() req: Request) {
    return this.usersService.listMembers((req as any).user?.tenant_id);
  }

  @Patch("members/:id")
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(UserRole.ORGANIZATION_OWNER, UserRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: "Update tenant member role or status" })
  async updateMember(
    @Req() req: Request,
    @Param("id") memberId: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.usersService.updateMember(
      (req as any).user?.tenant_id,
      (req as any).user?.user_id,
      memberId,
      dto,
    );
  }

  @Get("invitations")
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(UserRole.ORGANIZATION_OWNER, UserRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: "List tenant invitations" })
  async listInvitations(@Req() req: Request) {
    return this.usersService.listInvitations((req as any).user?.tenant_id);
  }

  @Post("invitations")
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(UserRole.ORGANIZATION_OWNER, UserRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: "Create tenant invitation" })
  async createInvitation(
    @Req() req: Request,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.usersService.createInvitation(
      (req as any).user?.tenant_id,
      (req as any).user?.user_id,
      dto,
    );
  }

  @Patch("invitations/:id/revoke")
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(UserRole.ORGANIZATION_OWNER, UserRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: "Revoke tenant invitation" })
  async revokeInvitation(
    @Req() req: Request,
    @Param("id") invitationId: string,
  ) {
    return this.usersService.revokeInvitation(
      (req as any).user?.tenant_id,
      (req as any).user?.user_id,
      invitationId,
    );
  }
}
