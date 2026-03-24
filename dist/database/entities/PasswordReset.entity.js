"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PasswordReset", {
    enumerable: true,
    get: function() {
        return PasswordReset;
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
let PasswordReset = class PasswordReset {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)("uuid"),
    _ts_metadata("design:type", String)
], PasswordReset.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "user_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], PasswordReset.prototype, "userId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "tenant_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], PasswordReset.prototype, "tenantId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 255
    }),
    _ts_metadata("design:type", String)
], PasswordReset.prototype, "token", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "used_at",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], PasswordReset.prototype, "usedAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "expires_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], PasswordReset.prototype, "expiresAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "ip_address",
        type: "varchar",
        length: 45,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], PasswordReset.prototype, "ipAddress", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "user_agent",
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], PasswordReset.prototype, "userAgent", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: "created_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], PasswordReset.prototype, "createdAt", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_Userentity.User, {
        onDelete: "CASCADE"
    }),
    (0, _typeorm.JoinColumn)({
        name: "user_id"
    }),
    _ts_metadata("design:type", typeof _Userentity.User === "undefined" ? Object : _Userentity.User)
], PasswordReset.prototype, "user", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_Organizationentity.Organization, {
        onDelete: "CASCADE"
    }),
    (0, _typeorm.JoinColumn)({
        name: "tenant_id"
    }),
    _ts_metadata("design:type", typeof _Organizationentity.Organization === "undefined" ? Object : _Organizationentity.Organization)
], PasswordReset.prototype, "organization", void 0);
PasswordReset = _ts_decorate([
    (0, _typeorm.Entity)("password_resets"),
    (0, _typeorm.Index)("idx_password_resets_user_id", [
        "userId"
    ]),
    (0, _typeorm.Index)("idx_password_resets_tenant_id", [
        "tenantId"
    ]),
    (0, _typeorm.Index)("idx_password_resets_token", [
        "token"
    ])
], PasswordReset);

//# sourceMappingURL=PasswordReset.entity.js.map