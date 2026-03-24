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
    get DOCUMENT_PROCESSING_ARTIFACT_KINDS () {
        return DOCUMENT_PROCESSING_ARTIFACT_KINDS;
    },
    get DocumentProcessingArtifact () {
        return DocumentProcessingArtifact;
    },
    get PAGE_PROCESSING_STATUSES () {
        return PAGE_PROCESSING_STATUSES;
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
const DOCUMENT_PROCESSING_ARTIFACT_KINDS = [
    "original_pdf",
    "processed_pdf",
    "searchable_pdf",
    "page_preview",
    "original_page_image",
    "processed_page_image",
    "ocr_text_per_page",
    "full_ocr_text",
    "processing_metadata"
];
const PAGE_PROCESSING_STATUSES = [
    "pending",
    "analyzed",
    "cropped",
    "corrected",
    "enhanced",
    "ocr_done",
    "failed"
];
let DocumentProcessingArtifact = class DocumentProcessingArtifact {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)("uuid"),
    _ts_metadata("design:type", String)
], DocumentProcessingArtifact.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "tenant_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], DocumentProcessingArtifact.prototype, "tenantId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "document_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], DocumentProcessingArtifact.prototype, "documentId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "processing_job_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], DocumentProcessingArtifact.prototype, "processingJobId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "artifact_kind",
        type: "varchar",
        length: 48
    }),
    _ts_metadata("design:type", typeof DocumentProcessingArtifactKind === "undefined" ? Object : DocumentProcessingArtifactKind)
], DocumentProcessingArtifact.prototype, "artifactKind", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "page_number",
        type: "int",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], DocumentProcessingArtifact.prototype, "pageNumber", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "storage_path",
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], DocumentProcessingArtifact.prototype, "storagePath", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "mime_type",
        type: "varchar",
        length: 128,
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], DocumentProcessingArtifact.prototype, "mimeType", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "text_content",
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], DocumentProcessingArtifact.prototype, "textContent", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "ocr_confidence",
        type: "float",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], DocumentProcessingArtifact.prototype, "ocrConfidence", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "page_status",
        type: "varchar",
        length: 32,
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], DocumentProcessingArtifact.prototype, "pageStatus", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "json",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], DocumentProcessingArtifact.prototype, "metadata", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: "created_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], DocumentProcessingArtifact.prototype, "createdAt", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: "updated_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], DocumentProcessingArtifact.prototype, "updatedAt", void 0);
DocumentProcessingArtifact = _ts_decorate([
    (0, _typeorm.Entity)("document_processing_artifacts"),
    (0, _typeorm.Index)("idx_document_processing_artifacts_tenant_id", [
        "tenantId"
    ]),
    (0, _typeorm.Index)("idx_document_processing_artifacts_job_kind", [
        "processingJobId",
        "artifactKind"
    ]),
    (0, _typeorm.Index)("idx_document_processing_artifacts_document_page", [
        "documentId",
        "pageNumber"
    ])
], DocumentProcessingArtifact);

//# sourceMappingURL=DocumentProcessingArtifact.entity.js.map