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
    get DOCUMENT_PROCESSING_STATUSES () {
        return DOCUMENT_PROCESSING_STATUSES;
    },
    get DocumentProcessingJob () {
        return DocumentProcessingJob;
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
const DOCUMENT_PROCESSING_STATUSES = [
    "uploaded",
    "analyzing",
    "preprocessing",
    "geometry_corrected",
    "enhanced",
    "pdf_assembled",
    "ocr_processing",
    "completed",
    "failed"
];
let DocumentProcessingJob = class DocumentProcessingJob {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)("uuid"),
    _ts_metadata("design:type", String)
], DocumentProcessingJob.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "tenant_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], DocumentProcessingJob.prototype, "tenantId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "document_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], DocumentProcessingJob.prototype, "documentId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "source_document_id",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], DocumentProcessingJob.prototype, "sourceDocumentId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 32,
        default: "uploaded"
    }),
    _ts_metadata("design:type", typeof DocumentProcessingStatus === "undefined" ? Object : DocumentProcessingStatus)
], DocumentProcessingJob.prototype, "status", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "ocr_enabled",
        type: "boolean",
        default: true
    }),
    _ts_metadata("design:type", Boolean)
], DocumentProcessingJob.prototype, "ocrEnabled", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "ocr_language",
        type: "varchar",
        length: 64,
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], DocumentProcessingJob.prototype, "ocrLanguage", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "processing_mode",
        type: "varchar",
        length: 32,
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], DocumentProcessingJob.prototype, "processingMode", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "target_page_format",
        type: "varchar",
        length: 32,
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], DocumentProcessingJob.prototype, "targetPageFormat", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "page_count",
        type: "int",
        default: 0
    }),
    _ts_metadata("design:type", Number)
], DocumentProcessingJob.prototype, "pageCount", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "processed_page_count",
        type: "int",
        default: 0
    }),
    _ts_metadata("design:type", Number)
], DocumentProcessingJob.prototype, "processedPageCount", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "json",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], DocumentProcessingJob.prototype, "metadata", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "last_error",
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], DocumentProcessingJob.prototype, "lastError", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "completed_at",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], DocumentProcessingJob.prototype, "completedAt", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: "created_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], DocumentProcessingJob.prototype, "createdAt", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: "updated_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], DocumentProcessingJob.prototype, "updatedAt", void 0);
DocumentProcessingJob = _ts_decorate([
    (0, _typeorm.Entity)("document_processing_jobs"),
    (0, _typeorm.Index)("idx_document_processing_jobs_tenant_id", [
        "tenantId"
    ]),
    (0, _typeorm.Index)("idx_document_processing_jobs_document_id", [
        "documentId"
    ]),
    (0, _typeorm.Index)("idx_document_processing_jobs_status", [
        "status"
    ])
], DocumentProcessingJob);

//# sourceMappingURL=DocumentProcessingJob.entity.js.map