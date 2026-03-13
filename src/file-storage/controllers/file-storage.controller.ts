import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  HttpCode,
  HttpStatus,
  Res,
  StreamableFile,
  Req,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger";
import { Response } from "express";
import { FileStorageService } from "../services/file-storage.service";
import { JwtAuthGuard } from "../../auth/guards";
import { TenantGuard, RbacGuard, SubscriptionGuard } from "../../auth/guards";
import { Audit } from "../../auth/services/audit.service";
import {
  RequirePlan,
  Roles,
} from "../../auth/decorators/access-control.decorators";
import {
  SubscriptionPlan,
  UserRole,
} from "../../database/entities/enums/subscription.enum";

/**
 * File Storage Controller
 *
 * Provides endpoints for file upload, download, and management
 */
@ApiTags("File Storage")
@Controller("file-storage")
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class FileStorageController {
  constructor(private readonly fileStorageService: FileStorageService) {}

  private static readonly FILE_EDITOR_ROLES = [
    UserRole.ORGANIZATION_OWNER,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.LAWYER,
    UserRole.ASSISTANT,
  ] as const;

  @Post("upload")
  @UseGuards(RbacGuard)
  @Roles(...FileStorageController.FILE_EDITOR_ROLES)
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload a file" })
  @ApiResponse({ status: 201, description: "File uploaded successfully" })
  @ApiResponse({ status: 400, description: "Invalid file" })
  @Audit("create")
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
    @Query("caseId") caseId?: string,
    @Query("clientId") clientId?: string,
    @Query("folder") folder?: string,
    @Query("isPublic") isPublic?: string,
  ) {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;

    return this.fileStorageService.uploadFile(tenantId, userId, file, {
      caseId,
      clientId,
      folder,
      isPublic: isPublic === "true",
    });
  }

  @Post("upload/bulk")
  @UseGuards(RbacGuard, SubscriptionGuard)
  @Roles(...FileStorageController.FILE_EDITOR_ROLES)
  @RequirePlan(SubscriptionPlan.PROFESSIONAL)
  @UseInterceptors(FilesInterceptor("files", 10))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload multiple files" })
  @ApiResponse({ status: 201, description: "Files uploaded successfully" })
  @ApiResponse({ status: 400, description: "Invalid files" })
  @Audit("create")
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
    @Query("caseId") caseId?: string,
    @Query("clientId") clientId?: string,
    @Query("folder") folder?: string,
    @Query("isPublic") isPublic?: string,
  ) {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;

    return this.fileStorageService.uploadFiles(tenantId, userId, files, {
      caseId,
      clientId,
      folder,
      isPublic: isPublic === "true",
    });
  }

  @Get("download/:path(*)")
  @ApiOperation({ summary: "Download a file" })
  @ApiResponse({ status: 200, description: "File downloaded" })
  @ApiResponse({ status: 404, description: "File not found" })
  @Audit("read")
  async downloadFile(
    @Param("path") path: string,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const tenantId = req.user?.tenant_id;
    const buffer = await this.fileStorageService.downloadFile(tenantId, path);

    res.set({
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${path.split("/").pop()}"`,
      "Content-Length": buffer.length.toString(),
    });

    return new StreamableFile(buffer);
  }

  @Get("signed-url")
  @ApiOperation({ summary: "Generate signed URL for file access" })
  @ApiResponse({ status: 200, description: "Signed URL generated" })
  @ApiResponse({ status: 400, description: "Invalid request" })
  @Audit("read")
  async generateSignedUrl(
    @Req() req: any,
    @Query("path") path: string,
    @Query("expiresIn") expiresIn?: string,
    @Query("disposition") disposition?: "attachment" | "inline",
    @Query("contentType") contentType?: string,
  ) {
    const tenantId = req.user?.tenant_id;

    const url = await this.fileStorageService.generateSignedUrl(
      tenantId,
      path,
      {
        expiresIn: expiresIn ? parseInt(expiresIn) : undefined,
        disposition,
        contentType,
      },
    );

    return { url };
  }

  @Delete("file/:path(*)")
  @UseGuards(RbacGuard)
  @Roles(...FileStorageController.FILE_EDITOR_ROLES)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a file" })
  @ApiResponse({ status: 204, description: "File deleted" })
  @ApiResponse({ status: 404, description: "File not found" })
  @Audit("delete")
  async deleteFile(
    @Param("path") path: string,
    @Req() req: any,
  ): Promise<void> {
    const tenantId = req.user?.tenant_id;
    await this.fileStorageService.deleteFile(tenantId, path);
  }

  @Delete("files")
  @UseGuards(RbacGuard)
  @Roles(...FileStorageController.FILE_EDITOR_ROLES)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete multiple files" })
  @ApiResponse({ status: 204, description: "Files deleted" })
  @Audit("delete")
  async deleteFiles(
    @Body("paths") paths: string[],
    @Req() req: any,
  ): Promise<void> {
    const tenantId = req.user?.tenant_id;
    await this.fileStorageService.deleteFiles(tenantId, paths);
  }

  @Post("copy")
  @UseGuards(RbacGuard)
  @Roles(...FileStorageController.FILE_EDITOR_ROLES)
  @ApiOperation({ summary: "Copy a file" })
  @ApiResponse({ status: 201, description: "File copied" })
  @Audit("update")
  async copyFile(
    @Body("sourcePath") sourcePath: string,
    @Body("destinationPath") destinationPath: string,
    @Req() req: any,
  ) {
    const tenantId = req.user?.tenant_id;
    return this.fileStorageService.copyFile(
      tenantId,
      sourcePath,
      destinationPath,
    );
  }

  @Post("move")
  @UseGuards(RbacGuard)
  @Roles(...FileStorageController.FILE_EDITOR_ROLES)
  @ApiOperation({ summary: "Move a file" })
  @ApiResponse({ status: 201, description: "File moved" })
  @Audit("update")
  async moveFile(
    @Body("sourcePath") sourcePath: string,
    @Body("destinationPath") destinationPath: string,
    @Req() req: any,
  ) {
    const tenantId = req.user?.tenant_id;
    return this.fileStorageService.moveFile(
      tenantId,
      sourcePath,
      destinationPath,
    );
  }

  @Get("exists/:path(*)")
  @ApiOperation({ summary: "Check if file exists" })
  @ApiResponse({ status: 200, description: "File exists" })
  @ApiResponse({ status: 404, description: "File not found" })
  async fileExists(@Param("path") path: string, @Req() req: any) {
    const tenantId = req.user?.tenant_id;
    const exists = await this.fileStorageService.fileExists(tenantId, path);
    return { exists };
  }

  @Get("metadata/:path(*)")
  @ApiOperation({ summary: "Get file metadata" })
  @ApiResponse({ status: 200, description: "Metadata retrieved" })
  @ApiResponse({ status: 404, description: "File not found" })
  async getFileMetadata(@Param("path") path: string, @Req() req: any) {
    const tenantId = req.user?.tenant_id;
    return this.fileStorageService.getFileMetadata(tenantId, path);
  }

  @Get("quota")
  @ApiOperation({ summary: "Get storage quota for tenant" })
  @ApiResponse({ status: 200, description: "Quota retrieved" })
  async getStorageQuota(@Req() req: any, @Query("plan") plan?: string) {
    const tenantId = req.user?.tenant_id;
    return this.fileStorageService.getStorageQuota(tenantId, plan);
  }

  @Get("config")
  @ApiOperation({ summary: "Get file storage configuration" })
  @ApiResponse({ status: 200, description: "Configuration retrieved" })
  async getConfig(@Query("plan") plan?: string) {
    return {
      allowedMimeTypes: this.fileStorageService.getAllowedMimeTypes(),
      fileSizeLimit: this.fileStorageService.getFileSizeLimit(plan),
    };
  }
}
