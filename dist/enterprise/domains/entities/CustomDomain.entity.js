"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CustomDomain", {
    enumerable: true,
    get: function() {
        return CustomDomain;
    }
});
const _typeorm = require("typeorm");
const _Organizationentity = require("../../../database/entities/Organization.entity");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let CustomDomain = class CustomDomain {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)("uuid"),
    _ts_metadata("design:type", String)
], CustomDomain.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "tenant_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], CustomDomain.prototype, "tenantId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 255,
        unique: true
    }),
    _ts_metadata("design:type", String)
], CustomDomain.prototype, "domain", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "is_verified",
        type: "boolean",
        default: false
    }),
    _ts_metadata("design:type", Boolean)
], CustomDomain.prototype, "isVerified", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "is_primary",
        type: "boolean",
        default: false
    }),
    _ts_metadata("design:type", Boolean)
], CustomDomain.prototype, "isPrimary", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "ssl_enabled",
        type: "boolean",
        default: false
    }),
    _ts_metadata("design:type", Boolean)
], CustomDomain.prototype, "sslEnabled", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "ssl_certificate",
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], CustomDomain.prototype, "sslCertificate", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "ssl_private_key",
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], CustomDomain.prototype, "sslPrivateKey", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "ssl_expires_at",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], CustomDomain.prototype, "sslExpiresAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "dns_records",
        type: "json",
        default: []
    }),
    _ts_metadata("design:type", Array)
], CustomDomain.prototype, "dnsRecords", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "verification_token",
        type: "varchar",
        length: 64,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], CustomDomain.prototype, "verificationToken", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "verified_at",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], CustomDomain.prototype, "verifiedAt", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: "created_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], CustomDomain.prototype, "createdAt", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: "updated_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], CustomDomain.prototype, "updatedAt", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_Organizationentity.Organization, {
        onDelete: "CASCADE"
    }),
    (0, _typeorm.JoinColumn)({
        name: "tenant_id"
    }),
    _ts_metadata("design:type", typeof _Organizationentity.Organization === "undefined" ? Object : _Organizationentity.Organization)
], CustomDomain.prototype, "organization", void 0);
CustomDomain = _ts_decorate([
    (0, _typeorm.Entity)("custom_domains"),
    (0, _typeorm.Index)("idx_custom_domains_tenant_id", [
        "tenantId"
    ]),
    (0, _typeorm.Index)("idx_custom_domains_domain", [
        "domain"
    ], {
        unique: true
    })
], CustomDomain);

//# sourceMappingURL=CustomDomain.entity.js.map