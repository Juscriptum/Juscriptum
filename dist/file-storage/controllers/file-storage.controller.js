"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "FileStorageController", {
    enumerable: true,
    get: function() {
        return FileStorageController;
    }
});
const _common = require("@nestjs/common");
const _platformexpress = require("@nestjs/platform-express");
const _swagger = require("@nestjs/swagger");
const _express = require("express");
const _filestorageservice = require("../services/file-storage.service");
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
let FileStorageController = class FileStorageController {
    async uploadFile(file, req, caseId, clientId, folder, isPublic) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.fileStorageService.uploadFile(tenantId, userId, file, {
            caseId,
            clientId,
            folder,
            isPublic: isPublic === "true"
        });
    }
    async uploadFiles(files, req, caseId, clientId, folder, isPublic) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.fileStorageService.uploadFiles(tenantId, userId, files, {
            caseId,
            clientId,
            folder,
            isPublic: isPublic === "true"
        });
    }
    async downloadFile(path, req, res) {
        const tenantId = req.user?.tenant_id;
        const buffer = await this.fileStorageService.downloadFile(tenantId, path);
        res.set({
            "Content-Type": "application/octet-stream",
            "Content-Disposition": `attachment; filename="${path.split("/").pop()}"`,
            "Content-Length": buffer.length.toString()
        });
        return new _common.StreamableFile(buffer);
    }
    async generateSignedUrl(req, path, expiresIn, disposition, contentType) {
        const tenantId = req.user?.tenant_id;
        const url = await this.fileStorageService.generateSignedUrl(tenantId, path, {
            expiresIn: expiresIn ? parseInt(expiresIn) : undefined,
            disposition,
            contentType
        });
        return {
            url
        };
    }
    async deleteFile(path, req) {
        const tenantId = req.user?.tenant_id;
        await this.fileStorageService.deleteFile(tenantId, path);
    }
    async deleteFiles(paths, req) {
        const tenantId = req.user?.tenant_id;
        await this.fileStorageService.deleteFiles(tenantId, paths);
    }
    async copyFile(sourcePath, destinationPath, req) {
        const tenantId = req.user?.tenant_id;
        return this.fileStorageService.copyFile(tenantId, sourcePath, destinationPath);
    }
    async moveFile(sourcePath, destinationPath, req) {
        const tenantId = req.user?.tenant_id;
        return this.fileStorageService.moveFile(tenantId, sourcePath, destinationPath);
    }
    async fileExists(path, req) {
        const tenantId = req.user?.tenant_id;
        const exists = await this.fileStorageService.fileExists(tenantId, path);
        return {
            exists
        };
    }
    async getFileMetadata(path, req) {
        const tenantId = req.user?.tenant_id;
        return this.fileStorageService.getFileMetadata(tenantId, path);
    }
    async getStorageQuota(req, plan) {
        const tenantId = req.user?.tenant_id;
        return this.fileStorageService.getStorageQuota(tenantId, plan);
    }
    async getConfig(plan) {
        return {
            allowedMimeTypes: this.fileStorageService.getAllowedMimeTypes(),
            fileSizeLimit: this.fileStorageService.getFileSizeLimit(plan)
        };
    }
    constructor(fileStorageService){
        this.fileStorageService = fileStorageService;
    }
};
FileStorageController.FILE_EDITOR_ROLES = [
    _subscriptionenum.UserRole.ORGANIZATION_OWNER,
    _subscriptionenum.UserRole.ORGANIZATION_ADMIN,
    _subscriptionenum.UserRole.LAWYER,
    _subscriptionenum.UserRole.ASSISTANT
];
_ts_decorate([
    (0, _common.Post)("upload"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(...FileStorageController.FILE_EDITOR_ROLES),
    (0, _common.UseInterceptors)((0, _platformexpress.FileInterceptor)("file")),
    (0, _swagger.ApiConsumes)("multipart/form-data"),
    (0, _swagger.ApiOperation)({
        summary: "Upload a file"
    }),
    (0, _swagger.ApiResponse)({
        status: 201,
        description: "File uploaded successfully"
    }),
    (0, _swagger.ApiResponse)({
        status: 400,
        description: "Invalid file"
    }),
    (0, _auditservice.Audit)("create"),
    _ts_param(0, (0, _common.UploadedFile)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_param(2, (0, _common.Query)("caseId")),
    _ts_param(3, (0, _common.Query)("clientId")),
    _ts_param(4, (0, _common.Query)("folder")),
    _ts_param(5, (0, _common.Query)("isPublic")),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof Express === "undefined" || typeof Express.Multer === "undefined" || typeof Express.Multer.File === "undefined" ? Object : Express.Multer.File,
        Object,
        String,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], FileStorageController.prototype, "uploadFile", null);
_ts_decorate([
    (0, _common.Post)("upload/bulk"),
    (0, _common.UseGuards)(_guards.RbacGuard, _guards.SubscriptionGuard),
    (0, _accesscontroldecorators.Roles)(...FileStorageController.FILE_EDITOR_ROLES),
    (0, _accesscontroldecorators.RequirePlan)(_subscriptionenum.SubscriptionPlan.PROFESSIONAL),
    (0, _common.UseInterceptors)((0, _platformexpress.FilesInterceptor)("files", 10)),
    (0, _swagger.ApiConsumes)("multipart/form-data"),
    (0, _swagger.ApiOperation)({
        summary: "Upload multiple files"
    }),
    (0, _swagger.ApiResponse)({
        status: 201,
        description: "Files uploaded successfully"
    }),
    (0, _swagger.ApiResponse)({
        status: 400,
        description: "Invalid files"
    }),
    (0, _auditservice.Audit)("create"),
    _ts_param(0, (0, _common.UploadedFiles)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_param(2, (0, _common.Query)("caseId")),
    _ts_param(3, (0, _common.Query)("clientId")),
    _ts_param(4, (0, _common.Query)("folder")),
    _ts_param(5, (0, _common.Query)("isPublic")),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Array,
        Object,
        String,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], FileStorageController.prototype, "uploadFiles", null);
_ts_decorate([
    (0, _common.Get)("download/:path(*)"),
    (0, _swagger.ApiOperation)({
        summary: "Download a file"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "File downloaded"
    }),
    (0, _swagger.ApiResponse)({
        status: 404,
        description: "File not found"
    }),
    (0, _auditservice.Audit)("read"),
    _ts_param(0, (0, _common.Param)("path")),
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
], FileStorageController.prototype, "downloadFile", null);
_ts_decorate([
    (0, _common.Get)("signed-url"),
    (0, _swagger.ApiOperation)({
        summary: "Generate signed URL for file access"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Signed URL generated"
    }),
    (0, _swagger.ApiResponse)({
        status: 400,
        description: "Invalid request"
    }),
    (0, _auditservice.Audit)("read"),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Query)("path")),
    _ts_param(2, (0, _common.Query)("expiresIn")),
    _ts_param(3, (0, _common.Query)("disposition")),
    _ts_param(4, (0, _common.Query)("contentType")),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], FileStorageController.prototype, "generateSignedUrl", null);
_ts_decorate([
    (0, _common.Delete)("file/:path(*)"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(...FileStorageController.FILE_EDITOR_ROLES),
    (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT),
    (0, _swagger.ApiOperation)({
        summary: "Delete a file"
    }),
    (0, _swagger.ApiResponse)({
        status: 204,
        description: "File deleted"
    }),
    (0, _swagger.ApiResponse)({
        status: 404,
        description: "File not found"
    }),
    (0, _auditservice.Audit)("delete"),
    _ts_param(0, (0, _common.Param)("path")),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], FileStorageController.prototype, "deleteFile", null);
_ts_decorate([
    (0, _common.Delete)("files"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(...FileStorageController.FILE_EDITOR_ROLES),
    (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT),
    (0, _swagger.ApiOperation)({
        summary: "Delete multiple files"
    }),
    (0, _swagger.ApiResponse)({
        status: 204,
        description: "Files deleted"
    }),
    (0, _auditservice.Audit)("delete"),
    _ts_param(0, (0, _common.Body)("paths")),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Array,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], FileStorageController.prototype, "deleteFiles", null);
_ts_decorate([
    (0, _common.Post)("copy"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(...FileStorageController.FILE_EDITOR_ROLES),
    (0, _swagger.ApiOperation)({
        summary: "Copy a file"
    }),
    (0, _swagger.ApiResponse)({
        status: 201,
        description: "File copied"
    }),
    (0, _auditservice.Audit)("update"),
    _ts_param(0, (0, _common.Body)("sourcePath")),
    _ts_param(1, (0, _common.Body)("destinationPath")),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], FileStorageController.prototype, "copyFile", null);
_ts_decorate([
    (0, _common.Post)("move"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(...FileStorageController.FILE_EDITOR_ROLES),
    (0, _swagger.ApiOperation)({
        summary: "Move a file"
    }),
    (0, _swagger.ApiResponse)({
        status: 201,
        description: "File moved"
    }),
    (0, _auditservice.Audit)("update"),
    _ts_param(0, (0, _common.Body)("sourcePath")),
    _ts_param(1, (0, _common.Body)("destinationPath")),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], FileStorageController.prototype, "moveFile", null);
_ts_decorate([
    (0, _common.Get)("exists/:path(*)"),
    (0, _swagger.ApiOperation)({
        summary: "Check if file exists"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "File exists"
    }),
    (0, _swagger.ApiResponse)({
        status: 404,
        description: "File not found"
    }),
    _ts_param(0, (0, _common.Param)("path")),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], FileStorageController.prototype, "fileExists", null);
_ts_decorate([
    (0, _common.Get)("metadata/:path(*)"),
    (0, _swagger.ApiOperation)({
        summary: "Get file metadata"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Metadata retrieved"
    }),
    (0, _swagger.ApiResponse)({
        status: 404,
        description: "File not found"
    }),
    _ts_param(0, (0, _common.Param)("path")),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], FileStorageController.prototype, "getFileMetadata", null);
_ts_decorate([
    (0, _common.Get)("quota"),
    (0, _swagger.ApiOperation)({
        summary: "Get storage quota for tenant"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Quota retrieved"
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Query)("plan")),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], FileStorageController.prototype, "getStorageQuota", null);
_ts_decorate([
    (0, _common.Get)("config"),
    (0, _swagger.ApiOperation)({
        summary: "Get file storage configuration"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Configuration retrieved"
    }),
    _ts_param(0, (0, _common.Query)("plan")),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], FileStorageController.prototype, "getConfig", null);
FileStorageController = _ts_decorate([
    (0, _swagger.ApiTags)("File Storage"),
    (0, _common.Controller)("file-storage"),
    (0, _common.UseGuards)(_guards.JwtAuthGuard, _guards.TenantGuard),
    (0, _swagger.ApiBearerAuth)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _filestorageservice.FileStorageService === "undefined" ? Object : _filestorageservice.FileStorageService
    ])
], FileStorageController);

//# sourceMappingURL=file-storage.controller.js.map