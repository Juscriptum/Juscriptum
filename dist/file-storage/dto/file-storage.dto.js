"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get BulkUploadResultDto () {
        return BulkUploadResultDto;
    },
    get CopyFileDto () {
        return CopyFileDto;
    },
    get DeleteMultipleFilesDto () {
        return DeleteMultipleFilesDto;
    },
    get FileStorageConfigDto () {
        return FileStorageConfigDto;
    },
    get FileUploadResultDto () {
        return FileUploadResultDto;
    },
    get GenerateSignedUrlQueryDto () {
        return GenerateSignedUrlQueryDto;
    },
    get GetConfigQueryDto () {
        return GetConfigQueryDto;
    },
    get GetQuotaQueryDto () {
        return GetQuotaQueryDto;
    },
    get MoveFileDto () {
        return MoveFileDto;
    },
    get StorageQuotaDto () {
        return StorageQuotaDto;
    },
    get UploadFileQueryDto () {
        return UploadFileQueryDto;
    },
    get UploadMultipleFilesQueryDto () {
        return UploadMultipleFilesQueryDto;
    }
});
const _swagger = require("@nestjs/swagger");
const _classvalidator = require("class-validator");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let UploadFileQueryDto = class UploadFileQueryDto {
};
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: "Case ID to associate file with"
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UploadFileQueryDto.prototype, "caseId", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: "Client ID to associate file with"
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UploadFileQueryDto.prototype, "clientId", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: "Folder name within tenant directory"
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UploadFileQueryDto.prototype, "folder", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: "Whether file should be public"
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsBoolean)(),
    _ts_metadata("design:type", Boolean)
], UploadFileQueryDto.prototype, "isPublic", void 0);
let UploadMultipleFilesQueryDto = class UploadMultipleFilesQueryDto extends UploadFileQueryDto {
};
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: "Number of files to upload (max: 10)",
        default: 10
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsNumber)(),
    _ts_metadata("design:type", Number)
], UploadMultipleFilesQueryDto.prototype, "maxFiles", void 0);
let GenerateSignedUrlQueryDto = class GenerateSignedUrlQueryDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Storage path of the file"
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], GenerateSignedUrlQueryDto.prototype, "path", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: "URL expiration time in seconds",
        default: 3600
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsNumber)(),
    _ts_metadata("design:type", Number)
], GenerateSignedUrlQueryDto.prototype, "expiresIn", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: "Content disposition",
        enum: [
            "attachment",
            "inline"
        ]
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)([
        "attachment",
        "inline"
    ]),
    _ts_metadata("design:type", String)
], GenerateSignedUrlQueryDto.prototype, "disposition", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: "Override content type"
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], GenerateSignedUrlQueryDto.prototype, "contentType", void 0);
let CopyFileDto = class CopyFileDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Source file path"
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], CopyFileDto.prototype, "sourcePath", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Destination file path"
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], CopyFileDto.prototype, "destinationPath", void 0);
let MoveFileDto = class MoveFileDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Source file path"
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], MoveFileDto.prototype, "sourcePath", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Destination file path"
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], MoveFileDto.prototype, "destinationPath", void 0);
let DeleteMultipleFilesDto = class DeleteMultipleFilesDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Array of file paths to delete",
        type: [
            String
        ]
    }),
    (0, _classvalidator.IsString)({
        each: true
    }),
    _ts_metadata("design:type", Array)
], DeleteMultipleFilesDto.prototype, "paths", void 0);
let GetQuotaQueryDto = class GetQuotaQueryDto {
};
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: "Subscription plan",
        enum: [
            "basic",
            "professional",
            "enterprise"
        ],
        default: "basic"
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)([
        "basic",
        "professional",
        "enterprise"
    ]),
    _ts_metadata("design:type", String)
], GetQuotaQueryDto.prototype, "plan", void 0);
let GetConfigQueryDto = class GetConfigQueryDto {
};
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: "Subscription plan",
        enum: [
            "basic",
            "professional",
            "enterprise"
        ],
        default: "basic"
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)([
        "basic",
        "professional",
        "enterprise"
    ]),
    _ts_metadata("design:type", String)
], GetConfigQueryDto.prototype, "plan", void 0);
let FileUploadResultDto = class FileUploadResultDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Storage path"
    }),
    _ts_metadata("design:type", String)
], FileUploadResultDto.prototype, "path", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Public URL"
    }),
    _ts_metadata("design:type", String)
], FileUploadResultDto.prototype, "url", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "File size in bytes"
    }),
    _ts_metadata("design:type", Number)
], FileUploadResultDto.prototype, "size", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: "ETag"
    }),
    _ts_metadata("design:type", String)
], FileUploadResultDto.prototype, "etag", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: "Version ID"
    }),
    _ts_metadata("design:type", String)
], FileUploadResultDto.prototype, "versionId", void 0);
let BulkUploadResultDto = class BulkUploadResultDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Successfully uploaded files",
        type: [
            FileUploadResultDto
        ]
    }),
    _ts_metadata("design:type", Array)
], BulkUploadResultDto.prototype, "success", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Failed uploads",
        type: [
            Object
        ]
    }),
    _ts_metadata("design:type", typeof Array === "undefined" ? Object : Array)
], BulkUploadResultDto.prototype, "failed", void 0);
let StorageQuotaDto = class StorageQuotaDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Total quota in bytes"
    }),
    _ts_metadata("design:type", Number)
], StorageQuotaDto.prototype, "total", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Used space in bytes"
    }),
    _ts_metadata("design:type", Number)
], StorageQuotaDto.prototype, "used", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Available space in bytes"
    }),
    _ts_metadata("design:type", Number)
], StorageQuotaDto.prototype, "available", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Usage percentage (0-100)"
    }),
    _ts_metadata("design:type", Number)
], StorageQuotaDto.prototype, "usagePercentage", void 0);
let FileStorageConfigDto = class FileStorageConfigDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Allowed MIME types",
        type: [
            String
        ]
    }),
    _ts_metadata("design:type", Array)
], FileStorageConfigDto.prototype, "allowedMimeTypes", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Max file size in bytes"
    }),
    _ts_metadata("design:type", Number)
], FileStorageConfigDto.prototype, "fileSizeLimit", void 0);

//# sourceMappingURL=file-storage.dto.js.map