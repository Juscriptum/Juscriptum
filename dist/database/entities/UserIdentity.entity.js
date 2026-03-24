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
    get TRUST_PROVIDER_TYPES () {
        return TRUST_PROVIDER_TYPES;
    },
    get TRUST_VERIFICATION_STATUSES () {
        return TRUST_VERIFICATION_STATUSES;
    },
    get UserIdentity () {
        return UserIdentity;
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
const TRUST_PROVIDER_TYPES = [
    "acsk",
    "diia",
    "bankid_nbu",
    "manual"
];
const TRUST_VERIFICATION_STATUSES = [
    "pending",
    "verified",
    "rejected",
    "revoked"
];
let UserIdentity = class UserIdentity {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)("uuid"),
    _ts_metadata("design:type", String)
], UserIdentity.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "tenant_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], UserIdentity.prototype, "tenantId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "user_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], UserIdentity.prototype, "userId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 32
    }),
    _ts_metadata("design:type", typeof TrustProviderType === "undefined" ? Object : TrustProviderType)
], UserIdentity.prototype, "provider", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 32,
        default: "pending"
    }),
    _ts_metadata("design:type", typeof TrustVerificationStatus === "undefined" ? Object : TrustVerificationStatus)
], UserIdentity.prototype, "status", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "external_subject_id",
        type: "varchar",
        length: 255
    }),
    _ts_metadata("design:type", String)
], UserIdentity.prototype, "externalSubjectId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "display_name",
        type: "varchar",
        length: 255,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], UserIdentity.prototype, "displayName", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "certificate_serial_number",
        type: "varchar",
        length: 255,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], UserIdentity.prototype, "certificateSerialNumber", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "certificate_issuer",
        type: "varchar",
        length: 255,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], UserIdentity.prototype, "certificateIssuer", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "tax_id_hash",
        type: "varchar",
        length: 255,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], UserIdentity.prototype, "taxIdHash", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "assurance_level",
        type: "varchar",
        length: 64,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], UserIdentity.prototype, "assuranceLevel", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "verified_at",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], UserIdentity.prototype, "verifiedAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "last_checked_at",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], UserIdentity.prototype, "lastCheckedAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "verification_attempts",
        type: "int",
        default: 0
    }),
    _ts_metadata("design:type", Number)
], UserIdentity.prototype, "verificationAttempts", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "next_check_at",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], UserIdentity.prototype, "nextCheckAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "last_error",
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], UserIdentity.prototype, "lastError", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "external_verification_id",
        type: "varchar",
        length: 255,
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], UserIdentity.prototype, "externalVerificationId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "json",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Record === "undefined" ? Object : Record)
], UserIdentity.prototype, "metadata", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: "created_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], UserIdentity.prototype, "createdAt", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: "updated_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], UserIdentity.prototype, "updatedAt", void 0);
UserIdentity = _ts_decorate([
    (0, _typeorm.Entity)("user_identities"),
    (0, _typeorm.Index)("idx_user_identities_tenant_id", [
        "tenantId"
    ]),
    (0, _typeorm.Index)("idx_user_identities_user_id", [
        "userId"
    ]),
    (0, _typeorm.Index)("idx_user_identities_provider", [
        "provider"
    ]),
    (0, _typeorm.Index)("idx_user_identities_status", [
        "status"
    ])
], UserIdentity);

//# sourceMappingURL=UserIdentity.entity.js.map