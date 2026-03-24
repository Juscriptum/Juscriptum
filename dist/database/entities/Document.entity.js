"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "Document", {
    enumerable: true,
    get: function() {
        return Document;
    }
});
const _typeorm = require("typeorm");
const _accesscontrol = require("../../common/security/access-control");
const _FileScanRecordentity = require("./FileScanRecord.entity");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let Document = class Document {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)("uuid"),
    _ts_metadata("design:type", String)
], Document.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "tenant_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], Document.prototype, "tenantId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "case_id",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Document.prototype, "caseId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "client_id",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Document.prototype, "clientId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "file_name",
        type: "varchar",
        length: 500
    }),
    _ts_metadata("design:type", String)
], Document.prototype, "fileName", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "original_name",
        type: "varchar",
        length: 500
    }),
    _ts_metadata("design:type", String)
], Document.prototype, "originalName", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar"
    }),
    _ts_metadata("design:type", typeof DocumentType === "undefined" ? Object : DocumentType)
], Document.prototype, "type", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "mime_type",
        type: "varchar",
        length: 100,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Document.prototype, "mimeType", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "file_size",
        type: "bigint",
        nullable: true
    }),
    _ts_metadata("design:type", Number)
], Document.prototype, "fileSize", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Document.prototype, "description", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        default: "uploading"
    }),
    _ts_metadata("design:type", typeof DocumentStatus === "undefined" ? Object : DocumentStatus)
], Document.prototype, "status", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "storage_path",
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Document.prototype, "storagePath", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "cdn_url",
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Document.prototype, "cdnUrl", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "signed_url",
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Document.prototype, "signedUrl", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "malware_scan_status",
        type: "varchar",
        length: 32,
        default: "pending"
    }),
    _ts_metadata("design:type", typeof _FileScanRecordentity.MalwareScanStatus === "undefined" ? Object : _FileScanRecordentity.MalwareScanStatus)
], Document.prototype, "malwareScanStatus", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "malware_scanned_at",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], Document.prototype, "malwareScannedAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "malware_scanner",
        type: "varchar",
        length: 64,
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], Document.prototype, "malwareScanner", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "malware_signature",
        type: "varchar",
        length: 255,
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], Document.prototype, "malwareSignature", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "malware_scan_error",
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], Document.prototype, "malwareScanError", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "signature_hash",
        type: "varchar",
        length: 255,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Document.prototype, "signatureHash", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "signature_algorithm",
        type: "varchar",
        length: 50,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Document.prototype, "signatureAlgorithm", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "signed_at",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Document.prototype, "signedAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "signed_by",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Document.prototype, "signedBy", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "uploaded_by",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], Document.prototype, "uploadedBy", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "uploaded_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Document.prototype, "uploadedAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "upload_ip",
        type: "varchar",
        length: 45,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Document.prototype, "uploadIp", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "version",
        type: "int",
        default: 1
    }),
    _ts_metadata("design:type", Number)
], Document.prototype, "version", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "parent_document_id",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Document.prototype, "parentDocumentId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "access_scope",
        type: "varchar",
        default: "assigned"
    }),
    _ts_metadata("design:type", typeof _accesscontrol.DataAccessScope === "undefined" ? Object : _accesscontrol.DataAccessScope)
], Document.prototype, "accessScope", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        default: "internal"
    }),
    _ts_metadata("design:type", String)
], Document.prototype, "accessLevel", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "json",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Record === "undefined" ? Object : Record)
], Document.prototype, "metadata", void 0);
_ts_decorate([
    (0, _typeorm.DeleteDateColumn)({
        name: "deleted_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Document.prototype, "deletedAt", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: "created_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Document.prototype, "createdAt", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: "updated_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Document.prototype, "updatedAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "created_by",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Document.prototype, "createdBy", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "updated_by",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Document.prototype, "updatedBy", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>require("./Case.entity").Case, {
        nullable: true
    }),
    (0, _typeorm.JoinColumn)({
        name: "case_id"
    }),
    _ts_metadata("design:type", typeof Case === "undefined" ? Object : Case)
], Document.prototype, "case", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>require("./User.entity").User, {
        nullable: true
    }),
    (0, _typeorm.JoinColumn)({
        name: "signed_by"
    }),
    _ts_metadata("design:type", typeof User === "undefined" ? Object : User)
], Document.prototype, "signedByUser", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>require("./User.entity").User),
    (0, _typeorm.JoinColumn)({
        name: "uploaded_by"
    }),
    _ts_metadata("design:type", typeof User === "undefined" ? Object : User)
], Document.prototype, "uploadedByUser", void 0);
Document = _ts_decorate([
    (0, _typeorm.Entity)("documents"),
    (0, _typeorm.Index)("idx_documents_tenant_id", [
        "tenantId"
    ]),
    (0, _typeorm.Index)("idx_documents_case_id", [
        "caseId"
    ]),
    (0, _typeorm.Index)("idx_documents_type", [
        "type"
    ]),
    (0, _typeorm.Index)("idx_documents_status", [
        "status"
    ]),
    (0, _typeorm.Index)("idx_documents_uploaded_by", [
        "uploadedBy"
    ]),
    (0, _typeorm.Index)("idx_documents_malware_scan_status", [
        "malwareScanStatus"
    ])
], Document);

//# sourceMappingURL=Document.entity.js.map