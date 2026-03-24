"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DocumentsController", {
    enumerable: true,
    get: function() {
        return DocumentsController;
    }
});
const _common = require("@nestjs/common");
const _platformexpress = require("@nestjs/platform-express");
const _swagger = require("@nestjs/swagger");
const _express = require("express");
const _documentservice = require("../services/document.service");
const _documentdto = require("../dto/document.dto");
const _guards = require("../../auth/guards");
const _auditservice = require("../../auth/services/audit.service");
const _accesscontroldecorators = require("../../auth/decorators/access-control.decorators");
const _subscriptionenum = require("../../database/entities/enums/subscription.enum");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
const buildContentDispositionHeader = (disposition, fileName)=>{
    const fallbackName = fileName.normalize("NFKD").replace(/[^\x20-\x7E]/g, "_").replace(/["\\;\r\n/]+/g, "_").trim() || "document";
    const encodedFileName = encodeURIComponent(fileName).replace(/['()*]/g, (char)=>`%${char.charCodeAt(0).toString(16).toUpperCase()}`);
    return `${disposition}; filename="${fallbackName}"; filename*=UTF-8''${encodedFileName}`;
};
let DocumentsController = class DocumentsController {
    async findAll(filters, req) {
        const tenantId = req.user?.tenant_id;
        return this.documentService.findAll(tenantId, filters, req.user);
    }
    async getStatistics(req) {
        const tenantId = req.user?.tenant_id;
        return this.documentService.getStatistics(tenantId, req.user);
    }
    async getProcessingRuntime() {
        return this.documentService.getProcessingRuntime();
    }
    async findById(id, req) {
        const tenantId = req.user?.tenant_id;
        return this.documentService.findById(tenantId, id, req.user);
    }
    async getProcessingSummary(id, req) {
        const tenantId = req.user?.tenant_id;
        return this.documentService.getProcessingSummary(tenantId, id, req.user);
    }
    async getContent(id, query, req, res) {
        const tenantId = req.user?.tenant_id;
        const content = await this.documentService.getContent(tenantId, id, req.user);
        const disposition = query.disposition || "inline";
        res.set({
            "Content-Type": content.contentType,
            "Content-Disposition": buildContentDispositionHeader(disposition, content.fileName),
            "Content-Length": content.buffer.length.toString(),
            "Cache-Control": "private, max-age=0, must-revalidate"
        });
        return new _common.StreamableFile(content.buffer);
    }
    async download(id, req, res) {
        const tenantId = req.user?.tenant_id;
        const content = await this.documentService.getContent(tenantId, id, req.user);
        res.set({
            "Content-Type": content.contentType,
            "Content-Disposition": buildContentDispositionHeader("attachment", content.fileName),
            "Content-Length": content.buffer.length.toString(),
            "Cache-Control": "private, max-age=0, must-revalidate"
        });
        return new _common.StreamableFile(content.buffer);
    }
    async upload(file, dto, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.documentService.upload(tenantId, userId, file, dto, req.user);
    }
    async bulkUpload(files, dto, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.documentService.bulkUpload(tenantId, userId, files, dto.documents, req.user);
    }
    async processPdf(id, dto, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.documentService.processUploadedPdf(tenantId, id, userId, dto, req.user);
    }
    async update(id, dto, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.documentService.update(tenantId, id, userId, dto, req.user);
    }
    async sign(id, dto, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.documentService.sign(tenantId, id, userId, dto, req.user);
    }
    async generateSignedUrl(id, dto, req) {
        const tenantId = req.user?.tenant_id;
        return this.documentService.generateSignedUrl(tenantId, id, dto, req.user);
    }
    async delete(id, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.documentService.delete(tenantId, id, userId, req.user);
    }
    constructor(documentService){
        this.documentService = documentService;
    }
};
_ts_decorate([
    (0, _common.Get)(),
    (0, _swagger.ApiOperation)({
        summary: "Get all documents"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Documents retrieved"
    }),
    _ts_param(0, (0, _common.Query)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _documentdto.DocumentFiltersDto === "undefined" ? Object : _documentdto.DocumentFiltersDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], DocumentsController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)("statistics"),
    (0, _swagger.ApiOperation)({
        summary: "Get document statistics"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Statistics retrieved"
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], DocumentsController.prototype, "getStatistics", null);
_ts_decorate([
    (0, _common.Get)("processing/runtime"),
    (0, _swagger.ApiOperation)({
        summary: "Get PDF post-processing runtime capabilities"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Runtime capabilities retrieved"
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], DocumentsController.prototype, "getProcessingRuntime", null);
_ts_decorate([
    (0, _common.Get)(":id"),
    (0, _swagger.ApiOperation)({
        summary: "Get document by ID"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Document retrieved"
    }),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], DocumentsController.prototype, "findById", null);
_ts_decorate([
    (0, _common.Get)(":id/processing"),
    (0, _swagger.ApiOperation)({
        summary: "Get server-side document processing summary"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Processing summary retrieved"
    }),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], DocumentsController.prototype, "getProcessingSummary", null);
_ts_decorate([
    (0, _common.Get)(":id/content"),
    (0, _swagger.ApiOperation)({
        summary: "Get document content for preview or download"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Document content returned"
    }),
    (0, _auditservice.Audit)("read"),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Query)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_param(3, (0, _common.Res)({
        passthrough: true
    })),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _documentdto.DocumentContentQueryDto === "undefined" ? Object : _documentdto.DocumentContentQueryDto,
        Object,
        typeof _express.Response === "undefined" ? Object : _express.Response
    ]),
    _ts_metadata("design:returntype", Promise)
], DocumentsController.prototype, "getContent", null);
_ts_decorate([
    (0, _common.Get)(":id/download"),
    (0, _swagger.ApiOperation)({
        summary: "Download document file"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Document downloaded"
    }),
    (0, _auditservice.Audit)("read"),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Req)()),
    _ts_param(2, (0, _common.Res)({
        passthrough: true
    })),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object,
        typeof _express.Response === "undefined" ? Object : _express.Response
    ]),
    _ts_metadata("design:returntype", Promise)
], DocumentsController.prototype, "download", null);
_ts_decorate([
    (0, _common.Post)("upload"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN, _subscriptionenum.UserRole.LAWYER, _subscriptionenum.UserRole.ASSISTANT),
    (0, _common.UseInterceptors)((0, _platformexpress.FileInterceptor)("file")),
    (0, _swagger.ApiConsumes)("multipart/form-data"),
    (0, _swagger.ApiOperation)({
        summary: "Upload document"
    }),
    (0, _swagger.ApiResponse)({
        status: 201,
        description: "Document uploaded"
    }),
    (0, _auditservice.Audit)("create"),
    _ts_param(0, (0, _common.UploadedFile)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof Express === "undefined" || typeof Express.Multer === "undefined" || typeof Express.Multer.File === "undefined" ? Object : Express.Multer.File,
        typeof _documentdto.UploadDocumentDto === "undefined" ? Object : _documentdto.UploadDocumentDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], DocumentsController.prototype, "upload", null);
_ts_decorate([
    (0, _common.Post)("bulk-upload"),
    (0, _common.UseGuards)(_guards.RbacGuard, _guards.SubscriptionGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN, _subscriptionenum.UserRole.LAWYER, _subscriptionenum.UserRole.ASSISTANT),
    (0, _accesscontroldecorators.RequirePlan)(_subscriptionenum.SubscriptionPlan.PROFESSIONAL),
    (0, _common.UseInterceptors)((0, _platformexpress.FileInterceptor)("files")),
    (0, _swagger.ApiConsumes)("multipart/form-data"),
    (0, _swagger.ApiOperation)({
        summary: "Bulk upload documents"
    }),
    (0, _swagger.ApiResponse)({
        status: 201,
        description: "Documents uploaded"
    }),
    _ts_param(0, (0, _common.UploadedFile)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Array,
        typeof _documentdto.BulkUploadDocumentsDto === "undefined" ? Object : _documentdto.BulkUploadDocumentsDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], DocumentsController.prototype, "bulkUpload", null);
_ts_decorate([
    (0, _common.Post)(":id/process-pdf"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN, _subscriptionenum.UserRole.LAWYER, _subscriptionenum.UserRole.ASSISTANT),
    (0, _swagger.ApiOperation)({
        summary: "Server-side post-process an uploaded PDF"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "PDF post-processing completed"
    }),
    (0, _auditservice.Audit)("update"),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _documentdto.ProcessPdfDocumentDto === "undefined" ? Object : _documentdto.ProcessPdfDocumentDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], DocumentsController.prototype, "processPdf", null);
_ts_decorate([
    (0, _common.Put)(":id"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN, _subscriptionenum.UserRole.LAWYER, _subscriptionenum.UserRole.ASSISTANT),
    (0, _swagger.ApiOperation)({
        summary: "Update document metadata"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Document updated"
    }),
    (0, _auditservice.Audit)("update"),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _documentdto.UpdateDocumentDto === "undefined" ? Object : _documentdto.UpdateDocumentDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], DocumentsController.prototype, "update", null);
_ts_decorate([
    (0, _common.Post)(":id/sign"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN, _subscriptionenum.UserRole.LAWYER),
    (0, _swagger.ApiOperation)({
        summary: "Sign document"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Document signed"
    }),
    (0, _auditservice.Audit)("update"),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _documentdto.SignDocumentDto === "undefined" ? Object : _documentdto.SignDocumentDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], DocumentsController.prototype, "sign", null);
_ts_decorate([
    (0, _common.Post)(":id/signed-url"),
    (0, _swagger.ApiOperation)({
        summary: "Generate time-limited signed URL"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Signed URL generated"
    }),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _documentdto.GenerateSignedUrlDto === "undefined" ? Object : _documentdto.GenerateSignedUrlDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], DocumentsController.prototype, "generateSignedUrl", null);
_ts_decorate([
    (0, _common.Delete)(":id"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN, _subscriptionenum.UserRole.LAWYER),
    (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT),
    (0, _swagger.ApiOperation)({
        summary: "Delete document"
    }),
    (0, _swagger.ApiResponse)({
        status: 204,
        description: "Document deleted"
    }),
    (0, _auditservice.Audit)("delete"),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], DocumentsController.prototype, "delete", null);
DocumentsController = _ts_decorate([
    (0, _swagger.ApiTags)("Documents"),
    (0, _common.Controller)("documents"),
    (0, _common.UseGuards)(_guards.JwtAuthGuard, _guards.TenantGuard),
    (0, _swagger.ApiBearerAuth)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _documentservice.DocumentService === "undefined" ? Object : _documentservice.DocumentService
    ])
], DocumentsController);

//# sourceMappingURL=documents.controller.js.map