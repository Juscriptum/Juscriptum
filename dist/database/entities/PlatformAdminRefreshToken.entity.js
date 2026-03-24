"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PlatformAdminRefreshToken", {
    enumerable: true,
    get: function() {
        return PlatformAdminRefreshToken;
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
let PlatformAdminRefreshToken = class PlatformAdminRefreshToken {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)("uuid"),
    _ts_metadata("design:type", String)
], PlatformAdminRefreshToken.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "platform_admin_user_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], PlatformAdminRefreshToken.prototype, "platformAdminUserId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "text"
    }),
    _ts_metadata("design:type", String)
], PlatformAdminRefreshToken.prototype, "token", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "device_info",
        type: "json"
    }),
    _ts_metadata("design:type", typeof Record === "undefined" ? Object : Record)
], PlatformAdminRefreshToken.prototype, "deviceInfo", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "ip_address",
        type: "varchar",
        length: 45,
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], PlatformAdminRefreshToken.prototype, "ipAddress", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "user_agent",
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], PlatformAdminRefreshToken.prototype, "userAgent", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "expires_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], PlatformAdminRefreshToken.prototype, "expiresAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "revoked_at",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], PlatformAdminRefreshToken.prototype, "revokedAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "replaced_by",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], PlatformAdminRefreshToken.prototype, "replacedBy", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: "created_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], PlatformAdminRefreshToken.prototype, "createdAt", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_PlatformAdminUserentity.PlatformAdminUser, {
        onDelete: "CASCADE"
    }),
    (0, _typeorm.JoinColumn)({
        name: "platform_admin_user_id"
    }),
    _ts_metadata("design:type", typeof _PlatformAdminUserentity.PlatformAdminUser === "undefined" ? Object : _PlatformAdminUserentity.PlatformAdminUser)
], PlatformAdminRefreshToken.prototype, "platformAdminUser", void 0);
PlatformAdminRefreshToken = _ts_decorate([
    (0, _typeorm.Entity)("platform_admin_refresh_tokens"),
    (0, _typeorm.Index)("idx_platform_admin_refresh_tokens_user_id", [
        "platformAdminUserId"
    ]),
    (0, _typeorm.Index)("idx_platform_admin_refresh_tokens_token", [
        "token"
    ], {
        unique: true
    }),
    (0, _typeorm.Index)("idx_platform_admin_refresh_tokens_expires_at", [
        "expiresAt"
    ])
], PlatformAdminRefreshToken);

//# sourceMappingURL=PlatformAdminRefreshToken.entity.js.map