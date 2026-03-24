"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ScanSession", {
    enumerable: true,
    get: function() {
        return ScanSession;
    }
});
const _typeorm = require("typeorm");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let ScanSession = class ScanSession {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)("uuid"),
    _ts_metadata("design:type", String)
], ScanSession.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "tenant_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], ScanSession.prototype, "tenantId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "case_id",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], ScanSession.prototype, "caseId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "client_id",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], ScanSession.prototype, "clientId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "created_by_user_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], ScanSession.prototype, "createdByUserId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "token_hash",
        type: "varchar",
        length: 128
    }),
    _ts_metadata("design:type", String)
], ScanSession.prototype, "tokenHash", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 32,
        default: "created"
    }),
    _ts_metadata("design:type", typeof ScanSessionStatus === "undefined" ? Object : ScanSessionStatus)
], ScanSession.prototype, "status", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "mobile_url",
        type: "text"
    }),
    _ts_metadata("design:type", String)
], ScanSession.prototype, "mobileUrl", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "desktop_url",
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], ScanSession.prototype, "desktopUrl", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "expires_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], ScanSession.prototype, "expiresAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "started_at",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], ScanSession.prototype, "startedAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "completed_at",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], ScanSession.prototype, "completedAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "pages_count",
        type: "int",
        default: 0
    }),
    _ts_metadata("design:type", Number)
], ScanSession.prototype, "pagesCount", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "uploaded_pages",
        type: "int",
        default: 0
    }),
    _ts_metadata("design:type", Number)
], ScanSession.prototype, "uploadedPages", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "processed_pages",
        type: "int",
        default: 0
    }),
    _ts_metadata("design:type", Number)
], ScanSession.prototype, "processedPages", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "total_bytes",
        type: "bigint",
        default: 0
    }),
    _ts_metadata("design:type", Number)
], ScanSession.prototype, "totalBytes", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "final_document_id",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], ScanSession.prototype, "finalDocumentId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "document_format",
        type: "varchar",
        length: 24,
        default: "A4"
    }),
    _ts_metadata("design:type", typeof ScanDocumentFormat === "undefined" ? Object : ScanDocumentFormat)
], ScanSession.prototype, "documentFormat", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "destination_scope",
        type: "varchar",
        length: 24,
        default: "root"
    }),
    _ts_metadata("design:type", typeof ScanDestinationScope === "undefined" ? Object : ScanDestinationScope)
], ScanSession.prototype, "destinationScope", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "ocr_status",
        type: "varchar",
        length: 32,
        default: "pending"
    }),
    _ts_metadata("design:type", String)
], ScanSession.prototype, "ocrStatus", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "last_error",
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], ScanSession.prototype, "lastError", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: "created_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], ScanSession.prototype, "createdAt", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: "updated_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], ScanSession.prototype, "updatedAt", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>require("./Case.entity").Case, {
        nullable: true
    }),
    (0, _typeorm.JoinColumn)({
        name: "case_id"
    }),
    _ts_metadata("design:type", Object)
], ScanSession.prototype, "case", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>require("./User.entity").User, {
        nullable: false
    }),
    (0, _typeorm.JoinColumn)({
        name: "created_by_user_id"
    }),
    _ts_metadata("design:type", typeof User === "undefined" ? Object : User)
], ScanSession.prototype, "createdByUser", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>require("./Document.entity").Document, {
        nullable: true
    }),
    (0, _typeorm.JoinColumn)({
        name: "final_document_id"
    }),
    _ts_metadata("design:type", Object)
], ScanSession.prototype, "finalDocument", void 0);
ScanSession = _ts_decorate([
    (0, _typeorm.Entity)("scan_sessions"),
    (0, _typeorm.Index)("idx_scan_sessions_tenant_case", [
        "tenantId",
        "caseId"
    ]),
    (0, _typeorm.Index)("idx_scan_sessions_created_by", [
        "createdByUserId"
    ]),
    (0, _typeorm.Index)("idx_scan_sessions_status", [
        "status"
    ])
], ScanSession);

//# sourceMappingURL=ScanSession.entity.js.map