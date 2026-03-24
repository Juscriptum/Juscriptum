"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ScanPage", {
    enumerable: true,
    get: function() {
        return ScanPage;
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
let ScanPage = class ScanPage {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)("uuid"),
    _ts_metadata("design:type", String)
], ScanPage.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "scan_session_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], ScanPage.prototype, "scanSessionId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "page_number",
        type: "int"
    }),
    _ts_metadata("design:type", Number)
], ScanPage.prototype, "pageNumber", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 32,
        default: "created"
    }),
    _ts_metadata("design:type", typeof ScanPageStatus === "undefined" ? Object : ScanPageStatus)
], ScanPage.prototype, "status", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "original_file_path",
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], ScanPage.prototype, "originalFilePath", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "processed_file_path",
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], ScanPage.prototype, "processedFilePath", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "thumbnail_path",
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], ScanPage.prototype, "thumbnailPath", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "file_size",
        type: "bigint",
        default: 0
    }),
    _ts_metadata("design:type", Number)
], ScanPage.prototype, "fileSize", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "int",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], ScanPage.prototype, "width", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "int",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], ScanPage.prototype, "height", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "int",
        default: 0
    }),
    _ts_metadata("design:type", Number)
], ScanPage.prototype, "rotation", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: "created_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], ScanPage.prototype, "createdAt", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: "updated_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], ScanPage.prototype, "updatedAt", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>require("./ScanSession.entity").ScanSession, {
        nullable: false,
        onDelete: "CASCADE"
    }),
    (0, _typeorm.JoinColumn)({
        name: "scan_session_id"
    }),
    _ts_metadata("design:type", typeof ScanSession === "undefined" ? Object : ScanSession)
], ScanPage.prototype, "scanSession", void 0);
ScanPage = _ts_decorate([
    (0, _typeorm.Entity)("scan_pages"),
    (0, _typeorm.Index)("idx_scan_pages_session_page", [
        "scanSessionId",
        "pageNumber"
    ]),
    (0, _typeorm.Index)("idx_scan_pages_status", [
        "status"
    ])
], ScanPage);

//# sourceMappingURL=ScanPage.entity.js.map