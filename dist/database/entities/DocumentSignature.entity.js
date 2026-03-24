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
    get DocumentSignature () {
        return DocumentSignature;
    },
    get SIGNATURE_VERIFICATION_STATUSES () {
        return SIGNATURE_VERIFICATION_STATUSES;
    }
});
const _typeorm = require("typeorm");
const _UserIdentityentity = require("./UserIdentity.entity");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
const SIGNATURE_VERIFICATION_STATUSES = [
    "pending",
    "verified",
    "failed",
    "revoked"
];
let DocumentSignature = class DocumentSignature {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)("uuid"),
    _ts_metadata("design:type", String)
], DocumentSignature.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "tenant_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], DocumentSignature.prototype, "tenantId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "document_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], DocumentSignature.prototype, "documentId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "user_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], DocumentSignature.prototype, "userId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 32
    }),
    _ts_metadata("design:type", typeof _UserIdentityentity.TrustProviderType === "undefined" ? Object : _UserIdentityentity.TrustProviderType)
], DocumentSignature.prototype, "provider", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "verification_status",
        type: "varchar",
        length: 32,
        default: "pending"
    }),
    _ts_metadata("design:type", typeof SignatureVerificationStatus === "undefined" ? Object : SignatureVerificationStatus)
], DocumentSignature.prototype, "verificationStatus", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "signature_hash",
        type: "varchar",
        length: 255
    }),
    _ts_metadata("design:type", String)
], DocumentSignature.prototype, "signatureHash", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "signature_algorithm",
        type: "varchar",
        length: 64,
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], DocumentSignature.prototype, "signatureAlgorithm", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "signed_payload_hash",
        type: "varchar",
        length: 255,
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], DocumentSignature.prototype, "signedPayloadHash", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "certificate_serial_number",
        type: "varchar",
        length: 255,
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], DocumentSignature.prototype, "certificateSerialNumber", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "certificate_issuer",
        type: "varchar",
        length: 255,
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], DocumentSignature.prototype, "certificateIssuer", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "verified_at",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], DocumentSignature.prototype, "verifiedAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "last_checked_at",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], DocumentSignature.prototype, "lastCheckedAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "verification_attempts",
        type: "int",
        default: 0
    }),
    _ts_metadata("design:type", Number)
], DocumentSignature.prototype, "verificationAttempts", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "next_check_at",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], DocumentSignature.prototype, "nextCheckAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "last_error",
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], DocumentSignature.prototype, "lastError", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "external_verification_id",
        type: "varchar",
        length: 255,
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], DocumentSignature.prototype, "externalVerificationId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "signature_time",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], DocumentSignature.prototype, "signatureTime", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "json",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], DocumentSignature.prototype, "metadata", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: "created_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], DocumentSignature.prototype, "createdAt", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: "updated_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], DocumentSignature.prototype, "updatedAt", void 0);
DocumentSignature = _ts_decorate([
    (0, _typeorm.Entity)("document_signatures"),
    (0, _typeorm.Index)("idx_document_signatures_tenant_id", [
        "tenantId"
    ]),
    (0, _typeorm.Index)("idx_document_signatures_document_id", [
        "documentId"
    ]),
    (0, _typeorm.Index)("idx_document_signatures_user_id", [
        "userId"
    ]),
    (0, _typeorm.Index)("idx_document_signatures_verification_status", [
        "verificationStatus"
    ])
], DocumentSignature);

//# sourceMappingURL=DocumentSignature.entity.js.map