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
    get CreateNoteDto () {
        return CreateNoteDto;
    },
    get NoteFiltersDto () {
        return NoteFiltersDto;
    },
    get UpdateNoteDto () {
        return UpdateNoteDto;
    }
});
const _classtransformer = require("class-transformer");
const _classvalidator = require("class-validator");
const _accesscontrol = require("../../common/security/access-control");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
const toOptionalTrimmedString = ({ value })=>typeof value === "string" ? value.trim() : value;
const toOptionalBoolean = ({ value })=>{
    if (value === undefined || value === null || value === "") {
        return undefined;
    }
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value === "string") {
        return value === "true";
    }
    return Boolean(value);
};
let CreateNoteDto = class CreateNoteDto {
};
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(toOptionalTrimmedString),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], CreateNoteDto.prototype, "title", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(toOptionalTrimmedString),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], CreateNoteDto.prototype, "content", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(toOptionalTrimmedString),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], CreateNoteDto.prototype, "clientId", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(toOptionalTrimmedString),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], CreateNoteDto.prototype, "caseId", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(toOptionalTrimmedString),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], CreateNoteDto.prototype, "userId", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(toOptionalTrimmedString),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], CreateNoteDto.prototype, "assignedUserId", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(toOptionalBoolean),
    (0, _classvalidator.IsBoolean)(),
    _ts_metadata("design:type", Boolean)
], CreateNoteDto.prototype, "pinned", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.IsString)({
        each: true
    }),
    _ts_metadata("design:type", Array)
], CreateNoteDto.prototype, "tags", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsIn)(_accesscontrol.DATA_ACCESS_SCOPES),
    _ts_metadata("design:type", Object)
], CreateNoteDto.prototype, "accessScope", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", typeof Record === "undefined" ? Object : Record)
], CreateNoteDto.prototype, "metadata", void 0);
let UpdateNoteDto = class UpdateNoteDto {
};
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(toOptionalTrimmedString),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UpdateNoteDto.prototype, "title", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(toOptionalTrimmedString),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UpdateNoteDto.prototype, "content", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(toOptionalTrimmedString),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UpdateNoteDto.prototype, "clientId", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(toOptionalTrimmedString),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UpdateNoteDto.prototype, "caseId", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(toOptionalTrimmedString),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UpdateNoteDto.prototype, "userId", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(toOptionalTrimmedString),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UpdateNoteDto.prototype, "assignedUserId", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(toOptionalBoolean),
    (0, _classvalidator.IsBoolean)(),
    _ts_metadata("design:type", Boolean)
], UpdateNoteDto.prototype, "pinned", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.IsString)({
        each: true
    }),
    _ts_metadata("design:type", Array)
], UpdateNoteDto.prototype, "tags", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsIn)(_accesscontrol.DATA_ACCESS_SCOPES),
    _ts_metadata("design:type", Object)
], UpdateNoteDto.prototype, "accessScope", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", typeof Record === "undefined" ? Object : Record)
], UpdateNoteDto.prototype, "metadata", void 0);
let NoteFiltersDto = class NoteFiltersDto {
};
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(toOptionalTrimmedString),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], NoteFiltersDto.prototype, "clientId", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(toOptionalTrimmedString),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], NoteFiltersDto.prototype, "caseId", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(toOptionalTrimmedString),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], NoteFiltersDto.prototype, "userId", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(toOptionalBoolean),
    (0, _classvalidator.IsBoolean)(),
    _ts_metadata("design:type", Boolean)
], NoteFiltersDto.prototype, "pinned", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(toOptionalTrimmedString),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], NoteFiltersDto.prototype, "search", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.Min)(1),
    (0, _classvalidator.Max)(100),
    _ts_metadata("design:type", Number)
], NoteFiltersDto.prototype, "page", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.Min)(1),
    (0, _classvalidator.Max)(100),
    _ts_metadata("design:type", Number)
], NoteFiltersDto.prototype, "limit", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsIn)([
        "createdAt",
        "updatedAt",
        "title"
    ]),
    _ts_metadata("design:type", String)
], NoteFiltersDto.prototype, "sortBy", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsIn)([
        "ASC",
        "DESC"
    ]),
    _ts_metadata("design:type", String)
], NoteFiltersDto.prototype, "sortOrder", void 0);

//# sourceMappingURL=note.dto.js.map