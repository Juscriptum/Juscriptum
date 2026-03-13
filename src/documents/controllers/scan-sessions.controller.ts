import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard, RbacGuard, TenantGuard } from "../../auth/guards";
import { Roles } from "../../auth/decorators/access-control.decorators";
import { UserRole } from "../../database/entities/enums/subscription.enum";
import {
  CreateScanSessionDto,
  FinalizeScanSessionDto,
  MobileTokenDto,
  ReorderScanPagesDto,
  UploadScanPageDto,
} from "../dto/scan-session.dto";
import { ScanSessionService } from "../services/scan-session.service";

@ApiTags("Scan Sessions")
@Controller()
export class ScanSessionsController {
  constructor(private readonly scanSessionService: ScanSessionService) {}

  @Post("scan-sessions")
  @UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
  @ApiBearerAuth()
  @Roles(
    UserRole.ORGANIZATION_OWNER,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.LAWYER,
    UserRole.ASSISTANT,
  )
  @ApiOperation({ summary: "Create scan session" })
  @ApiResponse({ status: 201, description: "Scan session created" })
  async createSession(@Body() dto: CreateScanSessionDto, @Req() req: any) {
    return this.scanSessionService.createSession(
      req.user?.tenant_id,
      req.user?.user_id,
      dto,
      req.user,
    );
  }

  @Get("scan-sessions/:sessionId")
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get scan session status for desktop UI" })
  @ApiResponse({ status: 200, description: "Scan session status returned" })
  async getStatus(@Param("sessionId") sessionId: string, @Req() req: any) {
    return this.scanSessionService.getStatus(
      req.user?.tenant_id,
      sessionId,
      req.user,
    );
  }

  @Get("scan-sessions/:sessionId/mobile")
  @ApiOperation({ summary: "Validate mobile scan session access" })
  @ApiResponse({ status: 200, description: "Mobile session opened" })
  async openMobileSession(
    @Param("sessionId") sessionId: string,
    @Query() query: MobileTokenDto,
  ) {
    return this.scanSessionService.openMobileSession(sessionId, query.token);
  }

  @Post("scan-sessions/:sessionId/pages")
  @UseInterceptors(FileInterceptor("image_file"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload scan page from mobile device" })
  @ApiResponse({ status: 201, description: "Page uploaded" })
  async uploadPage(
    @Param("sessionId") sessionId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadScanPageDto,
  ) {
    return this.scanSessionService.uploadPage(sessionId, file, dto);
  }

  @Delete("scan-sessions/:sessionId/pages/:pageId")
  @ApiOperation({ summary: "Delete uploaded scan page" })
  @ApiResponse({ status: 200, description: "Page deleted" })
  async deletePage(
    @Param("sessionId") sessionId: string,
    @Param("pageId") pageId: string,
    @Query() query: MobileTokenDto,
  ) {
    return this.scanSessionService.deletePage(sessionId, pageId, query.token);
  }

  @Patch("scan-sessions/:sessionId/pages/reorder")
  @ApiOperation({ summary: "Reorder pages inside scan session" })
  @ApiResponse({ status: 200, description: "Pages reordered" })
  async reorderPages(
    @Param("sessionId") sessionId: string,
    @Body() dto: ReorderScanPagesDto,
  ) {
    return this.scanSessionService.reorderPages(sessionId, dto);
  }

  @Post("scan-sessions/:sessionId/finalize")
  @ApiOperation({ summary: "Finalize mobile scan into PDF document" })
  @ApiResponse({ status: 200, description: "Scan finalized" })
  async finalizeSession(
    @Param("sessionId") sessionId: string,
    @Body() dto: FinalizeScanSessionDto,
  ) {
    return this.scanSessionService.finalizeSession(sessionId, dto);
  }
}
