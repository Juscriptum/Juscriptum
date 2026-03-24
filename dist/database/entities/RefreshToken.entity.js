"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RefreshToken", {
    enumerable: true,
    get: function() {
        return RefreshToken;
    }
});
const _typeorm = require("typeorm");
const _Userentity = require("./User.entity");
const _Organizationentity = require("./Organization.entity");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let RefreshToken = class RefreshToken {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)("uuid"),
    _ts_metadata("design:type", String)
], RefreshToken.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "user_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], RefreshToken.prototype, "userId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "tenant_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], RefreshToken.prototype, "tenantId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "text"
    }),
    _ts_metadata("design:type", String)
], RefreshToken.prototype, "token", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "device_info",
        type: "json"
    }),
    _ts_metadata("design:type", typeof Record === "undefined" ? Object : Record)
], RefreshToken.prototype, "deviceInfo", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "ip_address",
        type: "varchar",
        length: 45,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], RefreshToken.prototype, "ipAddress", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "user_agent",
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], RefreshToken.prototype, "userAgent", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "expires_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], RefreshToken.prototype, "expiresAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "revoked_at",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], RefreshToken.prototype, "revokedAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "replaced_by",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], RefreshToken.prototype, "replacedBy", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: "created_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], RefreshToken.prototype, "createdAt", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_Userentity.User, {
        onDelete: "CASCADE"
    }),
    (0, _typeorm.JoinColumn)({
        name: "user_id"
    }),
    _ts_metadata("design:type", typeof _Userentity.User === "undefined" ? Object : _Userentity.User)
], RefreshToken.prototype, "user", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_Organizationentity.Organization, {
        onDelete: "CASCADE"
    }),
    (0, _typeorm.JoinColumn)({
        name: "tenant_id"
    }),
    _ts_metadata("design:type", typeof _Organizationentity.Organization === "undefined" ? Object : _Organizationentity.Organization)
], RefreshToken.prototype, "organization", void 0);
RefreshToken = _ts_decorate([
    (0, _typeorm.Entity)("refresh_tokens"),
    (0, _typeorm.Index)("idx_refresh_tokens_user_id", [
        "userId"
    ]),
    (0, _typeorm.Index)("idx_refresh_tokens_tenant_id", [
        "tenantId"
    ]),
    (0, _typeorm.Index)("idx_refresh_tokens_token", [
        "token"
    ]),
    (0, _typeorm.Index)("idx_refresh_tokens_expires_at", [
        "expiresAt"
    ])
], RefreshToken);

//# sourceMappingURL=RefreshToken.entity.js.map