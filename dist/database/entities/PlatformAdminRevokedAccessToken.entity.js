"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PlatformAdminRevokedAccessToken", {
    enumerable: true,
    get: function() {
        return PlatformAdminRevokedAccessToken;
    }
});
const _typeorm = require("typeorm");
const _PlatformAdminUserentity = require("./PlatformAdminUser.entity");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let PlatformAdminRevokedAccessToken = class PlatformAdminRevokedAccessToken {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)("uuid"),
    _ts_metadata("design:type", String)
], PlatformAdminRevokedAccessToken.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 255
    }),
    _ts_metadata("design:type", String)
], PlatformAdminRevokedAccessToken.prototype, "jti", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "platform_admin_user_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], PlatformAdminRevokedAccessToken.prototype, "platformAdminUserId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "expires_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], PlatformAdminRevokedAccessToken.prototype, "expiresAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 100,
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], PlatformAdminRevokedAccessToken.prototype, "reason", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: "created_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], PlatformAdminRevokedAccessToken.prototype, "createdAt", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_PlatformAdminUserentity.PlatformAdminUser, {
        onDelete: "CASCADE"
    }),
    (0, _typeorm.JoinColumn)({
        name: "platform_admin_user_id"
    }),
    _ts_metadata("design:type", typeof _PlatformAdminUserentity.PlatformAdminUser === "undefined" ? Object : _PlatformAdminUserentity.PlatformAdminUser)
], PlatformAdminRevokedAccessToken.prototype, "platformAdminUser", void 0);
PlatformAdminRevokedAccessToken = _ts_decorate([
    (0, _typeorm.Entity)("platform_admin_revoked_access_tokens"),
    (0, _typeorm.Index)("idx_platform_admin_revoked_access_tokens_jti", [
        "jti"
    ], {
        unique: true
    }),
    (0, _typeorm.Index)("idx_platform_admin_revoked_access_tokens_user_id", [
        "platformAdminUserId"
    ]),
    (0, _typeorm.Index)("idx_platform_admin_revoked_access_tokens_expires_at", [
        "expiresAt"
    ])
], PlatformAdminRevokedAccessToken);

//# sourceMappingURL=PlatformAdminRevokedAccessToken.entity.js.map