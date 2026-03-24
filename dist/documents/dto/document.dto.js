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
    get BulkUploadDocumentsDto () {
        return BulkUploadDocumentsDto;
    },
    get DocumentContentQueryDto () {
        return DocumentContentQueryDto;
    },
    get DocumentFiltersDto () {
        return DocumentFiltersDto;
    },
    get GenerateSignedUrlDto () {
        return GenerateSignedUrlDto;
    },
    get ProcessPdfDocumentDto () {
        return ProcessPdfDocumentDto;
    },
    get SignDocumentDto () {
        return SignDocumentDto;
    },
    get UpdateDocumentDto () {
        return UpdateDocumentDto;
    },
    get UploadDocumentDto () {
        return UploadDocumentDto;
    }
});
const _classvalidator = require("class-validator");
const _classtransformer = require("class-transformer");
const _Documententity = require("../../database/entities/Document.entity");
const _accesscontrol = require("../../common/security/access-control");
const _UserIdentityentity = require("../../database/entities/UserIdentity.entity");
const _FileScanRecordentity = require("../../database/entities/FileScanRecord.entity");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let UploadDocumentDto = class UploadDocumentDto {
};
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsUUID)(),
    _ts_metadata("design:type", String)
], UploadDocumentDto.prototype, "caseId", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsUUID)(),
    _ts_metadata("design:type", String)
], UploadDocumentDto.prototype, "clientId", void 0);
_ts_decorate([
    (0, _classvalidator.IsEnum)([
        "contract",
        "agreement",
        "court_order",
        "evidence",
        "invoice",
        "other"
    ]),
    _ts_metadata("design:type", typeof _Documententity.DocumentType === "undefined" ? Object : _Documententity.DocumentType)
], UploadDocumentDto.prototype, "type", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UploadDocumentDto.prototype, "description", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)([
        "public",
        "internal",
        "confidential"
    ]),
    _ts_metadata("design:type", String)
], UploadDocumentDto.prototype, "accessLevel", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)([
        "private",
        "assigned",
        "tenant"
    ]),
    _ts_metadata("design:type", typeof _accesscontrol.DataAccessScope === "undefined" ? Object : _accesscontrol.DataAccessScope)
], UploadDocumentDto.prototype, "accessScope", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsUUID)(),
    _ts_metadata("design:type", String)
], UploadDocumentDto.prototype, "parentDocumentId", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsUUID)(),
    _ts_metadata("design:type", String)
], UploadDocumentDto.prototype, "eventId", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsUUID)(),
    _ts_metadata("design:type", String)
], UploadDocumentDto.prototype, "calculationId", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UploadDocumentDto.prototype, "sourceKind", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UploadDocumentDto.prototype, "sourceTemplateId", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UploadDocumentDto.prototype, "plainTextContent", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UploadDocumentDto.prototype, "metadataJson", void 0);
let UpdateDocumentDto = class UpdateDocumentDto {
};
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UpdateDocumentDto.prototype, "description", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)([
        "draft",
        "signed",
        "rejected",
        "archived"
    ]),
    _ts_metadata("design:type", typeof _Documententity.DocumentStatus === "undefined" ? Object : _Documententity.DocumentStatus)
], UpdateDocumentDto.prototype, "status", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)([
        "public",
        "internal",
        "confidential"
    ]),
    _ts_metadata("design:type", String)
], UpdateDocumentDto.prototype, "accessLevel", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)([
        "private",
        "assigned",
        "tenant"
    ]),
    _ts_metadata("design:type", typeof _accesscontrol.DataAccessScope === "undefined" ? Object : _accesscontrol.DataAccessScope)
], UpdateDocumentDto.prototype, "accessScope", void 0);
let DocumentFiltersDto = class DocumentFiltersDto {
};
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsUUID)(),
    _ts_metadata("design:type", String)
], DocumentFiltersDto.prototype, "caseId", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsUUID)(),
    _ts_metadata("design:type", String)
], DocumentFiltersDto.prototype, "clientId", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)([
        "contract",
        "agreement",
        "court_order",
        "evidence",
        "invoice",
        "other"
    ]),
    _ts_metadata("design:type", typeof _Documententity.DocumentType === "undefined" ? Object : _Documententity.DocumentType)
], DocumentFiltersDto.prototype, "type", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)([
        "draft",
        "uploading",
        "signed",
        "rejected",
        "archived"
    ]),
    _ts_metadata("design:type", typeof _Documententity.DocumentStatus === "undefined" ? Object : _Documententity.DocumentStatus)
], DocumentFiltersDto.prototype, "status", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)([
        "public",
        "internal",
        "confidential"
    ]),
    _ts_metadata("design:type", String)
], DocumentFiltersDto.prototype, "accessLevel", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], DocumentFiltersDto.prototype, "search", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)([
        "pending",
        "clean",
        "infected",
        "failed"
    ]),
    _ts_metadata("design:type", typeof _FileScanRecordentity.MalwareScanStatus === "undefined" ? Object : _FileScanRecordentity.MalwareScanStatus)
], DocumentFiltersDto.prototype, "malwareScanStatus", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.Min)(1),
    (0, _classvalidator.Max)(100),
    _ts_metadata("design:type", Number)
], DocumentFiltersDto.prototype, "page", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.Min)(1),
    (0, _classvalidator.Max)(100),
    _ts_metadata("design:type", Number)
], DocumentFiltersDto.prototype, "limit", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], DocumentFiltersDto.prototype, "sortBy", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], DocumentFiltersDto.prototype, "sortOrder", void 0);
let BulkUploadDocumentsDto = class BulkUploadDocumentsDto {
};
_ts_decorate([
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.ArrayMinSize)(1),
    (0, _classvalidator.ValidateNested)({
        each: true
    }),
    (0, _classtransformer.Type)(()=>UploadDocumentDto),
    _ts_metadata("design:type", Array)
], BulkUploadDocumentsDto.prototype, "documents", void 0);
let SignDocumentDto = class SignDocumentDto {
};
_ts_decorate([
    (0, _classvalidator.IsUUID)(),
    _ts_metadata("design:type", String)
], SignDocumentDto.prototype, "documentId", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], SignDocumentDto.prototype, "signatureHash", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], SignDocumentDto.prototype, "signatureAlgorithm", void 0);
_ts_decorate([
    (0, _classvalidator.IsEnum)([
        "acsk",
        "diia",
        "bankid_nbu",
        "manual"
    ]),
    _ts_metadata("design:type", typeof _UserIdentityentity.TrustProviderType === "undefined" ? Object : _UserIdentityentity.TrustProviderType)
], SignDocumentDto.prototype, "provider", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], SignDocumentDto.prototype, "certificateSerialNumber", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], SignDocumentDto.prototype, "certificateIssuer", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], SignDocumentDto.prototype, "signedPayloadHash", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], SignDocumentDto.prototype, "ipAddress", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], SignDocumentDto.prototype, "userAgent", void 0);
let GenerateSignedUrlDto = class GenerateSignedUrlDto {
};
_ts_decorate([
    (0, _classvalidator.IsUUID)(),
    _ts_metadata("design:type", String)
], GenerateSignedUrlDto.prototype, "documentId", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.Max)(7 * 24 * 60 * 60),
    _ts_metadata("design:type", Number)
], GenerateSignedUrlDto.prototype, "expiresIn", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)([
        "attachment",
        "inline"
    ]),
    _ts_metadata("design:type", String)
], GenerateSignedUrlDto.prototype, "disposition", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], GenerateSignedUrlDto.prototype, "contentType", void 0);
let DocumentContentQueryDto = class DocumentContentQueryDto {
};
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)([
        "attachment",
        "inline"
    ]),
    _ts_metadata("design:type", String)
], DocumentContentQueryDto.prototype, "disposition", void 0);
let ProcessPdfDocumentDto = class ProcessPdfDocumentDto {
};
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], ProcessPdfDocumentDto.prototype, "processingMode", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], ProcessPdfDocumentDto.prototype, "targetPageFormat", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(()=>Boolean),
    _ts_metadata("design:type", Boolean)
], ProcessPdfDocumentDto.prototype, "ocrEnabled", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], ProcessPdfDocumentDto.prototype, "ocrLanguage", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(()=>Boolean),
    _ts_metadata("design:type", Boolean)
], ProcessPdfDocumentDto.prototype, "useUnpaper", void 0);

//# sourceMappingURL=document.dto.js.map