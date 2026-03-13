import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  StreamableFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger";
import { Response } from "express";
import { DocumentService } from "../services/document.service";
import {
  UploadDocumentDto,
  UpdateDocumentDto,
  DocumentFiltersDto,
  BulkUploadDocumentsDto,
  SignDocumentDto,
  GenerateSignedUrlDto,
  DocumentContentQueryDto,
  ProcessPdfDocumentDto,
} from "../dto/document.dto";
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

const buildContentDispositionHeader = (
  disposition: "attachment" | "inline",
  fileName: string,
): string => {
  const fallbackName =
    fileName
      .normalize("NFKD")
      .replace(/[^\x20-\x7E]/g, "_")
      .replace(/["\\;\r\n/]+/g, "_")
      .trim() || "document";
  const encodedFileName = encodeURIComponent(fileName).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );

  return `${disposition}; filename="${fallbackName}"; filename*=UTF-8''${encodedFileName}`;
};

/**
 * Documents Controller
 */
@ApiTags("Documents")
@Controller("documents")
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentService: DocumentService) {}

  @Get()
  @ApiOperation({ summary: "Get all documents" })
  @ApiResponse({ status: 200, description: "Documents retrieved" })
  async findAll(
    @Query() filters: DocumentFiltersDto,
    @Req() req: any,
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const tenantId = req.user?.tenant_id;
    return this.documentService.findAll(tenantId, filters, req.user);
  }

  @Get("statistics")
  @ApiOperation({ summary: "Get document statistics" })
  @ApiResponse({ status: 200, description: "Statistics retrieved" })
  async getStatistics(@Req() req: any): Promise<any> {
    const tenantId = req.user?.tenant_id;
    return this.documentService.getStatistics(tenantId, req.user);
  }

  @Get("processing/runtime")
  @ApiOperation({ summary: "Get PDF post-processing runtime capabilities" })
  @ApiResponse({ status: 200, description: "Runtime capabilities retrieved" })
  async getProcessingRuntime(): Promise<any> {
    return this.documentService.getProcessingRuntime();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get document by ID" })
  @ApiResponse({ status: 200, description: "Document retrieved" })
  async findById(@Param("id") id: string, @Req() req: any): Promise<any> {
    const tenantId = req.user?.tenant_id;
    return this.documentService.findById(tenantId, id, req.user);
  }

  @Get(":id/processing")
  @ApiOperation({ summary: "Get server-side document processing summary" })
  @ApiResponse({ status: 200, description: "Processing summary retrieved" })
  async getProcessingSummary(
    @Param("id") id: string,
    @Req() req: any,
  ): Promise<any> {
    const tenantId = req.user?.tenant_id;
    return this.documentService.getProcessingSummary(tenantId, id, req.user);
  }

  @Get(":id/content")
  @ApiOperation({ summary: "Get document content for preview or download" })
  @ApiResponse({ status: 200, description: "Document content returned" })
  @Audit("read")
  async getContent(
    @Param("id") id: string,
    @Query() query: DocumentContentQueryDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const tenantId = req.user?.tenant_id;
    const content = await this.documentService.getContent(
      tenantId,
      id,
      req.user,
    );
    const disposition = query.disposition || "inline";

    res.set({
      "Content-Type": content.contentType,
      "Content-Disposition": buildContentDispositionHeader(
        disposition,
        content.fileName,
      ),
      "Content-Length": content.buffer.length.toString(),
      "Cache-Control": "private, max-age=0, must-revalidate",
    });

    return new StreamableFile(content.buffer);
  }

  @Get(":id/download")
  @ApiOperation({ summary: "Download document file" })
  @ApiResponse({ status: 200, description: "Document downloaded" })
  @Audit("read")
  async download(
    @Param("id") id: string,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const tenantId = req.user?.tenant_id;
    const content = await this.documentService.getContent(
      tenantId,
      id,
      req.user,
    );

    res.set({
      "Content-Type": content.contentType,
      "Content-Disposition": buildContentDispositionHeader(
        "attachment",
        content.fileName,
      ),
      "Content-Length": content.buffer.length.toString(),
      "Cache-Control": "private, max-age=0, must-revalidate",
    });

    return new StreamableFile(content.buffer);
  }

  @Post("upload")
  @UseGuards(RbacGuard)
  @Roles(
    UserRole.ORGANIZATION_OWNER,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.LAWYER,
    UserRole.ASSISTANT,
  )
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload document" })
  @ApiResponse({ status: 201, description: "Document uploaded" })
  @Audit("create")
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
    @Req() req: any,
  ): Promise<any> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.documentService.upload(tenantId, userId, file, dto, req.user);
  }

  @Post("bulk-upload")
  @UseGuards(RbacGuard, SubscriptionGuard)
  @Roles(
    UserRole.ORGANIZATION_OWNER,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.LAWYER,
    UserRole.ASSISTANT,
  )
  @RequirePlan(SubscriptionPlan.PROFESSIONAL)
  @UseInterceptors(FileInterceptor("files"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Bulk upload documents" })
  @ApiResponse({ status: 201, description: "Documents uploaded" })
  async bulkUpload(
    @UploadedFile() files: Express.Multer.File[],
    @Body() dto: BulkUploadDocumentsDto,
    @Req() req: any,
  ): Promise<{ success: number; failed: number; documents: any[] }> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.documentService.bulkUpload(
      tenantId,
      userId,
      files,
      dto.documents,
      req.user,
    );
  }

  @Post(":id/process-pdf")
  @UseGuards(RbacGuard)
  @Roles(
    UserRole.ORGANIZATION_OWNER,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.LAWYER,
    UserRole.ASSISTANT,
  )
  @ApiOperation({ summary: "Server-side post-process an uploaded PDF" })
  @ApiResponse({ status: 200, description: "PDF post-processing completed" })
  @Audit("update")
  async processPdf(
    @Param("id") id: string,
    @Body() dto: ProcessPdfDocumentDto,
    @Req() req: any,
  ): Promise<any> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.documentService.processUploadedPdf(
      tenantId,
      id,
      userId,
      dto,
      req.user,
    );
  }

  @Put(":id")
  @UseGuards(RbacGuard)
  @Roles(
    UserRole.ORGANIZATION_OWNER,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.LAWYER,
    UserRole.ASSISTANT,
  )
  @ApiOperation({ summary: "Update document metadata" })
  @ApiResponse({ status: 200, description: "Document updated" })
  @Audit("update")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateDocumentDto,
    @Req() req: any,
  ): Promise<any> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.documentService.update(tenantId, id, userId, dto, req.user);
  }

  @Post(":id/sign")
  @UseGuards(RbacGuard)
  @Roles(
    UserRole.ORGANIZATION_OWNER,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.LAWYER,
  )
  @ApiOperation({ summary: "Sign document" })
  @ApiResponse({ status: 200, description: "Document signed" })
  @Audit("update")
  async sign(
    @Param("id") id: string,
    @Body() dto: SignDocumentDto,
    @Req() req: any,
  ): Promise<any> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.documentService.sign(tenantId, id, userId, dto, req.user);
  }

  @Post(":id/signed-url")
  @ApiOperation({ summary: "Generate time-limited signed URL" })
  @ApiResponse({ status: 200, description: "Signed URL generated" })
  async generateSignedUrl(
    @Param("id") id: string,
    @Body() dto: GenerateSignedUrlDto,
    @Req() req: any,
  ): Promise<{ url: string; expiresAt: Date }> {
    const tenantId = req.user?.tenant_id;
    return this.documentService.generateSignedUrl(tenantId, id, dto, req.user);
  }

  @Delete(":id")
  @UseGuards(RbacGuard)
  @Roles(
    UserRole.ORGANIZATION_OWNER,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.LAWYER,
  )
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete document" })
  @ApiResponse({ status: 204, description: "Document deleted" })
  @Audit("delete")
  async delete(@Param("id") id: string, @Req() req: any): Promise<void> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.documentService.delete(tenantId, id, userId, req.user);
  }
}
