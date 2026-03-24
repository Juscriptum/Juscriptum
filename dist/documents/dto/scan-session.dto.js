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
    get CreateScanSessionDto () {
        return CreateScanSessionDto;
    },
    get FinalizeScanSessionDto () {
        return FinalizeScanSessionDto;
    },
    get MobileTokenDto () {
        return MobileTokenDto;
    },
    get ReorderScanPageItemDto () {
        return ReorderScanPageItemDto;
    },
    get ReorderScanPagesDto () {
        return ReorderScanPagesDto;
    },
    get ScanSessionStatusResponseDto () {
        return ScanSessionStatusResponseDto;
    },
    get UploadScanPageDto () {
        return UploadScanPageDto;
    }
});
const _classvalidator = require("class-validator");
const _classtransformer = require("class-transformer");
const _ScanSessionentity = require("../../database/entities/ScanSession.entity");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let CreateScanSessionDto = class CreateScanSessionDto {
};
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)([
        "root",
        "personal",
        "client"
    ]),
    _ts_metadata("design:type", typeof _ScanSessionentity.ScanDestinationScope === "undefined" ? Object : _ScanSessionentity.ScanDestinationScope)
], CreateScanSessionDto.prototype, "destinationScope", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsUUID)(),
    _ts_metadata("design:type", String)
], CreateScanSessionDto.prototype, "clientId", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsUUID)(),
    _ts_metadata("design:type", String)
], CreateScanSessionDto.prototype, "caseId", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)([
        "A4",
        "Original"
    ]),
    _ts_metadata("design:type", typeof _ScanSessionentity.ScanDocumentFormat === "undefined" ? Object : _ScanSessionentity.ScanDocumentFormat)
], CreateScanSessionDto.prototype, "documentFormat", void 0);
let MobileTokenDto = class MobileTokenDto {
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], MobileTokenDto.prototype, "token", void 0);
let UploadScanPageDto = class UploadScanPageDto extends MobileTokenDto {
};
_ts_decorate([
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.Min)(1),
    (0, _classvalidator.Max)(50),
    _ts_metadata("design:type", Number)
], UploadScanPageDto.prototype, "clientPageNumber", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.Min)(0),
    (0, _classvalidator.Max)(360),
    _ts_metadata("design:type", Number)
], UploadScanPageDto.prototype, "rotation", void 0);
let ReorderScanPageItemDto = class ReorderScanPageItemDto {
};
_ts_decorate([
    (0, _classvalidator.IsUUID)(),
    _ts_metadata("design:type", String)
], ReorderScanPageItemDto.prototype, "pageId", void 0);
_ts_decorate([
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.Min)(1),
    (0, _classvalidator.Max)(50),
    _ts_metadata("design:type", Number)
], ReorderScanPageItemDto.prototype, "pageNumber", void 0);
let ReorderScanPagesDto = class ReorderScanPagesDto extends MobileTokenDto {
};
_ts_decorate([
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.ArrayMinSize)(1),
    (0, _classvalidator.ValidateNested)({
        each: true
    }),
    (0, _classtransformer.Type)(()=>ReorderScanPageItemDto),
    _ts_metadata("design:type", Array)
], ReorderScanPagesDto.prototype, "pages", void 0);
let FinalizeScanSessionDto = class FinalizeScanSessionDto extends MobileTokenDto {
};
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)([
        "A4",
        "Original"
    ]),
    _ts_metadata("design:type", typeof _ScanSessionentity.ScanDocumentFormat === "undefined" ? Object : _ScanSessionentity.ScanDocumentFormat)
], FinalizeScanSessionDto.prototype, "documentFormat", void 0);
let ScanSessionStatusResponseDto = class ScanSessionStatusResponseDto {
};

//# sourceMappingURL=scan-session.dto.js.map