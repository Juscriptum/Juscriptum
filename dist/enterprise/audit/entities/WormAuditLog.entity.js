"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "WormAuditLog", {
    enumerable: true,
    get: function() {
        return WormAuditLog;
    }
});
const _typeorm = require("typeorm");
const _Organizationentity = require("../../../database/entities/Organization.entity");
const _Userentity = require("../../../database/entities/User.entity");
const _wormauditinterface = require("../interfaces/worm-audit.interface");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let WormAuditLog = class WormAuditLog {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)("uuid"),
    _ts_metadata("design:type", String)
], WormAuditLog.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "tenant_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], WormAuditLog.prototype, "tenantId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "user_id",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], WormAuditLog.prototype, "userId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "simple-enum",
        enum: [
            "create",
            "update",
            "delete",
            "login",
            "logout",
            "login_failed",
            "permission_change",
            "role_change",
            "password_change",
            "mfa_enabled",
            "mfa_disabled",
            "export",
            "download",
            "share",
            "api_key_create",
            "api_key_revoke",
            "settings_change",
            "subscription_change",
            "user_invite",
            "user_remove"
        ]
    }),
    _ts_metadata("design:type", typeof _wormauditinterface.AuditActionType === "undefined" ? Object : _wormauditinterface.AuditActionType)
], WormAuditLog.prototype, "action", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "entity_type",
        type: "varchar",
        length: 100
    }),
    _ts_metadata("design:type", String)
], WormAuditLog.prototype, "entityType", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "entity_id",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], WormAuditLog.prototype, "entityId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "old_values",
        type: "json",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Record === "undefined" ? Object : Record)
], WormAuditLog.prototype, "oldValues", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "new_values",
        type: "json",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Record === "undefined" ? Object : Record)
], WormAuditLog.prototype, "newValues", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "changed_fields",
        type: "json",
        nullable: true
    }),
    _ts_metadata("design:type", Array)
], WormAuditLog.prototype, "changedFields", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "ip_address",
        type: "varchar",
        length: 45,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], WormAuditLog.prototype, "ipAddress", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "user_agent",
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], WormAuditLog.prototype, "userAgent", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "request_id",
        type: "varchar",
        length: 100,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], WormAuditLog.prototype, "requestId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "session_id",
        type: "varchar",
        length: 100,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], WormAuditLog.prototype, "sessionId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "json"
    }),
    _ts_metadata("design:type", typeof Record === "undefined" ? Object : Record)
], WormAuditLog.prototype, "metadata", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], WormAuditLog.prototype, "timestamp", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 128
    }),
    _ts_metadata("design:type", String)
], WormAuditLog.prototype, "hash", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "previous_hash",
        type: "varchar",
        length: 128,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], WormAuditLog.prototype, "previousHash", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "chain_index",
        type: "bigint"
    }),
    _ts_metadata("design:type", Number)
], WormAuditLog.prototype, "chainIndex", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: "created_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], WormAuditLog.prototype, "createdAt", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_Organizationentity.Organization, {
        onDelete: "CASCADE"
    }),
    (0, _typeorm.JoinColumn)({
        name: "tenant_id"
    }),
    _ts_metadata("design:type", typeof _Organizationentity.Organization === "undefined" ? Object : _Organizationentity.Organization)
], WormAuditLog.prototype, "organization", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_Userentity.User),
    (0, _typeorm.JoinColumn)({
        name: "user_id"
    }),
    _ts_metadata("design:type", typeof _Userentity.User === "undefined" ? Object : _Userentity.User)
], WormAuditLog.prototype, "user", void 0);
WormAuditLog = _ts_decorate([
    (0, _typeorm.Entity)("worm_audit_logs"),
    (0, _typeorm.Index)("idx_worm_audit_tenant_id", [
        "tenantId"
    ]),
    (0, _typeorm.Index)("idx_worm_audit_user_id", [
        "userId"
    ]),
    (0, _typeorm.Index)("idx_worm_audit_action", [
        "action"
    ]),
    (0, _typeorm.Index)("idx_worm_audit_entity", [
        "entityType",
        "entityId"
    ]),
    (0, _typeorm.Index)("idx_worm_audit_timestamp", [
        "timestamp"
    ]),
    (0, _typeorm.Index)("idx_worm_audit_tenant_timestamp", [
        "tenantId",
        "timestamp"
    ])
], WormAuditLog);

//# sourceMappingURL=WormAuditLog.entity.js.map