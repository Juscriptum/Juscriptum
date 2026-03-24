"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PlatformAdminUser", {
    enumerable: true,
    get: function() {
        return PlatformAdminUser;
    }
});
const _typeorm = require("typeorm");
const _piiprotection = require("../../common/security/pii-protection");
const _platformadminenum = require("./enums/platform-admin.enum");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
const encryptedStringTransformer = (0, _piiprotection.createEncryptedStringTransformer)();
let PlatformAdminUser = class PlatformAdminUser {
    syncBlindIndexes() {
        this.emailBlindIndex = (0, _piiprotection.computePlatformAdminEmailBlindIndex)(this.email) || "";
    }
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)("uuid"),
    _ts_metadata("design:type", String)
], PlatformAdminUser.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "first_name",
        type: "varchar",
        length: 100
    }),
    _ts_metadata("design:type", String)
], PlatformAdminUser.prototype, "firstName", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "last_name",
        type: "varchar",
        length: 100
    }),
    _ts_metadata("design:type", String)
], PlatformAdminUser.prototype, "lastName", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "text",
        transformer: encryptedStringTransformer
    }),
    _ts_metadata("design:type", String)
], PlatformAdminUser.prototype, "email", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "email_blind_index",
        type: "varchar",
        length: 64
    }),
    _ts_metadata("design:type", String)
], PlatformAdminUser.prototype, "emailBlindIndex", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "password_hash",
        type: "varchar",
        length: 255
    }),
    _ts_metadata("design:type", String)
], PlatformAdminUser.prototype, "passwordHash", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 255
    }),
    _ts_metadata("design:type", String)
], PlatformAdminUser.prototype, "salt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "role",
        type: "varchar",
        default: _platformadminenum.PlatformAdminRole.PLATFORM_OWNER
    }),
    _ts_metadata("design:type", typeof _platformadminenum.PlatformAdminRole === "undefined" ? Object : _platformadminenum.PlatformAdminRole)
], PlatformAdminUser.prototype, "role", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "status",
        type: "varchar",
        default: _platformadminenum.PlatformAdminStatus.ACTIVE
    }),
    _ts_metadata("design:type", typeof _platformadminenum.PlatformAdminStatus === "undefined" ? Object : _platformadminenum.PlatformAdminStatus)
], PlatformAdminUser.prototype, "status", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "permissions",
        type: "json",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], PlatformAdminUser.prototype, "permissions", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "mfa_secret",
        type: "text",
        nullable: true,
        transformer: encryptedStringTransformer
    }),
    _ts_metadata("design:type", Object)
], PlatformAdminUser.prototype, "mfaSecret", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "mfa_enabled",
        type: "boolean",
        default: false
    }),
    _ts_metadata("design:type", Boolean)
], PlatformAdminUser.prototype, "mfaEnabled", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "mfa_backup_codes",
        type: "json",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], PlatformAdminUser.prototype, "mfaBackupCodes", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "last_login_at",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], PlatformAdminUser.prototype, "lastLoginAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "last_login_ip",
        type: "varchar",
        length: 45,
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], PlatformAdminUser.prototype, "lastLoginIp", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "failed_login_attempts",
        type: "int",
        default: 0
    }),
    _ts_metadata("design:type", Number)
], PlatformAdminUser.prototype, "failedLoginAttempts", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "locked_until",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], PlatformAdminUser.prototype, "lockedUntil", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "last_password_change_at",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], PlatformAdminUser.prototype, "lastPasswordChangeAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "session_invalid_before",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], PlatformAdminUser.prototype, "sessionInvalidBefore", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "metadata",
        type: "json",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], PlatformAdminUser.prototype, "metadata", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: "created_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], PlatformAdminUser.prototype, "createdAt", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: "updated_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], PlatformAdminUser.prototype, "updatedAt", void 0);
_ts_decorate([
    (0, _typeorm.BeforeInsert)(),
    (0, _typeorm.BeforeUpdate)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", void 0)
], PlatformAdminUser.prototype, "syncBlindIndexes", null);
PlatformAdminUser = _ts_decorate([
    (0, _typeorm.Entity)("platform_admin_users"),
    (0, _typeorm.Index)("idx_platform_admin_users_email_blind_index", [
        "emailBlindIndex"
    ], {
        unique: true
    }),
    (0, _typeorm.Index)("idx_platform_admin_users_status", [
        "status"
    ]),
    (0, _typeorm.Index)("idx_platform_admin_users_role", [
        "role"
    ])
], PlatformAdminUser);

//# sourceMappingURL=PlatformAdminUser.entity.js.map