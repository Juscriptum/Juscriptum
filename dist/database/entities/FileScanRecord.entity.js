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
    get FileScanRecord () {
        return FileScanRecord;
    },
    get MALWARE_SCAN_STATUSES () {
        return MALWARE_SCAN_STATUSES;
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
const MALWARE_SCAN_STATUSES = [
    "pending",
    "clean",
    "infected",
    "failed"
];
let FileScanRecord = class FileScanRecord {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)("uuid"),
    _ts_metadata("design:type", String)
], FileScanRecord.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "tenant_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], FileScanRecord.prototype, "tenantId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "storage_path",
        type: "text"
    }),
    _ts_metadata("design:type", String)
], FileScanRecord.prototype, "storagePath", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "file_name",
        type: "varchar",
        length: 500
    }),
    _ts_metadata("design:type", String)
], FileScanRecord.prototype, "fileName", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "mime_type",
        type: "varchar",
        length: 100,
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], FileScanRecord.prototype, "mimeType", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 32,
        default: "pending"
    }),
    _ts_metadata("design:type", typeof MalwareScanStatus === "undefined" ? Object : MalwareScanStatus)
], FileScanRecord.prototype, "status", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "scanner_engine",
        type: "varchar",
        length: 64,
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], FileScanRecord.prototype, "scannerEngine", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "malware_signature",
        type: "varchar",
        length: 255,
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], FileScanRecord.prototype, "malwareSignature", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "scan_error",
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], FileScanRecord.prototype, "scanError", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "scan_attempts",
        type: "int",
        default: 0
    }),
    _ts_metadata("design:type", Number)
], FileScanRecord.prototype, "scanAttempts", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "max_attempts",
        type: "int",
        default: 3
    }),
    _ts_metadata("design:type", Number)
], FileScanRecord.prototype, "maxAttempts", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "next_attempt_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], FileScanRecord.prototype, "nextAttemptAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "scanned_at",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], FileScanRecord.prototype, "scannedAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "document_id",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], FileScanRecord.prototype, "documentId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "json",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], FileScanRecord.prototype, "metadata", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: "created_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], FileScanRecord.prototype, "createdAt", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: "updated_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], FileScanRecord.prototype, "updatedAt", void 0);
FileScanRecord = _ts_decorate([
    (0, _typeorm.Entity)("file_scan_records"),
    (0, _typeorm.Index)("idx_file_scan_records_tenant_id", [
        "tenantId"
    ]),
    (0, _typeorm.Index)("idx_file_scan_records_storage_path", [
        "storagePath"
    ], {
        unique: true
    }),
    (0, _typeorm.Index)("idx_file_scan_records_status_next_attempt", [
        "status",
        "nextAttemptAt"
    ])
], FileScanRecord);

//# sourceMappingURL=FileScanRecord.entity.js.map