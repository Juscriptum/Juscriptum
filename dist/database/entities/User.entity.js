"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "User", {
    enumerable: true,
    get: function() {
        return User;
    }
});
const _typeorm = require("typeorm");
const _subscriptionenum = require("./enums/subscription.enum");
const _Organizationentity = require("./Organization.entity");
const _piiprotection = require("../../common/security/pii-protection");
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
let User = class User {
    syncBlindIndexes() {
        this.emailBlindIndex = (0, _piiprotection.computeEmailBlindIndex)(this.email, "user_email") ?? null;
    }
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)("uuid"),
    _ts_metadata("design:type", String)
], User.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "tenant_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], User.prototype, "tenantId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 100
    }),
    _ts_metadata("design:type", String)
], User.prototype, "firstName", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 100
    }),
    _ts_metadata("design:type", String)
], User.prototype, "lastName", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 100,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], User.prototype, "patronymic", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "text",
        transformer: encryptedStringTransformer
    }),
    _ts_metadata("design:type", String)
], User.prototype, "email", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "email_blind_index",
        type: "varchar",
        length: 64,
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], User.prototype, "emailBlindIndex", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "text",
        nullable: true,
        transformer: encryptedStringTransformer
    }),
    _ts_metadata("design:type", String)
], User.prototype, "phone", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "password_hash",
        type: "varchar",
        length: 255
    }),
    _ts_metadata("design:type", String)
], User.prototype, "passwordHash", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 255
    }),
    _ts_metadata("design:type", String)
], User.prototype, "salt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "mfa_secret",
        type: "text",
        nullable: true,
        transformer: encryptedStringTransformer
    }),
    _ts_metadata("design:type", String)
], User.prototype, "mfaSecret", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "mfa_enabled",
        type: "boolean",
        default: false
    }),
    _ts_metadata("design:type", Boolean)
], User.prototype, "mfaEnabled", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "mfa_backup_codes",
        type: "json",
        nullable: true
    }),
    _ts_metadata("design:type", Array)
], User.prototype, "mfaBackupCodes", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar"
    }),
    _ts_metadata("design:type", typeof _subscriptionenum.UserRole === "undefined" ? Object : _subscriptionenum.UserRole)
], User.prototype, "role", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        default: _subscriptionenum.UserStatus.PENDING
    }),
    _ts_metadata("design:type", typeof _subscriptionenum.UserStatus === "undefined" ? Object : _subscriptionenum.UserStatus)
], User.prototype, "status", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 100,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], User.prototype, "position", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "avatar_url",
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], User.prototype, "avatarUrl", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "bar_number",
        type: "text",
        nullable: true,
        transformer: encryptedStringTransformer
    }),
    _ts_metadata("design:type", String)
], User.prototype, "barNumber", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "json",
        nullable: true
    }),
    _ts_metadata("design:type", Array)
], User.prototype, "specialties", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "json",
        nullable: true
    }),
    _ts_metadata("design:type", Array)
], User.prototype, "languages", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "email_verified",
        type: "boolean",
        default: false
    }),
    _ts_metadata("design:type", Boolean)
], User.prototype, "emailVerified", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "email_verified_at",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], User.prototype, "emailVerifiedAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "email_verification_token",
        type: "varchar",
        length: 255,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], User.prototype, "emailVerificationToken", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "password_reset_token",
        type: "varchar",
        length: 255,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], User.prototype, "passwordResetToken", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "password_reset_expires_at",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], User.prototype, "passwordResetExpiresAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "last_password_change_at",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], User.prototype, "lastPasswordChangeAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "session_invalid_before",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], User.prototype, "sessionInvalidBefore", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "last_login_at",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], User.prototype, "lastLoginAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "last_login_ip",
        type: "varchar",
        length: 45,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], User.prototype, "lastLoginIp", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "failed_login_attempts",
        type: "int",
        default: 0
    }),
    _ts_metadata("design:type", Number)
], User.prototype, "failedLoginAttempts", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "locked_until",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], User.prototype, "lockedUntil", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "json",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Record === "undefined" ? Object : Record)
], User.prototype, "preferences", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "json",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Record === "undefined" ? Object : Record)
], User.prototype, "metadata", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: "created_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], User.prototype, "createdAt", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: "updated_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], User.prototype, "updatedAt", void 0);
_ts_decorate([
    (0, _typeorm.DeleteDateColumn)({
        name: "deleted_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], User.prototype, "deletedAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "created_by",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], User.prototype, "createdBy", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "updated_by",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], User.prototype, "updatedBy", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_Organizationentity.Organization),
    (0, _typeorm.JoinColumn)({
        name: "tenant_id"
    }),
    _ts_metadata("design:type", typeof _Organizationentity.Organization === "undefined" ? Object : _Organizationentity.Organization)
], User.prototype, "organization", void 0);
_ts_decorate([
    (0, _typeorm.BeforeInsert)(),
    (0, _typeorm.BeforeUpdate)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", void 0)
], User.prototype, "syncBlindIndexes", null);
User = _ts_decorate([
    (0, _typeorm.Entity)("users"),
    (0, _typeorm.Index)("idx_users_tenant_id", [
        "tenantId"
    ]),
    (0, _typeorm.Index)("idx_users_email", [
        "email"
    ]),
    (0, _typeorm.Index)("idx_users_email_blind_index", [
        "emailBlindIndex"
    ]),
    (0, _typeorm.Index)("idx_users_role", [
        "role"
    ]),
    (0, _typeorm.Index)("idx_users_status", [
        "status"
    ])
], User);

//# sourceMappingURL=User.entity.js.map