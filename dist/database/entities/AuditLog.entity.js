"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuditLog", {
    enumerable: true,
    get: function() {
        return AuditLog;
    }
});
const _typeorm = require("typeorm");
const _subscriptionenum = require("./enums/subscription.enum");
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
let AuditLog = class AuditLog {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)("uuid"),
    _ts_metadata("design:type", String)
], AuditLog.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "tenant_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], AuditLog.prototype, "tenantId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "user_id",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], AuditLog.prototype, "userId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar"
    }),
    _ts_metadata("design:type", typeof _subscriptionenum.AuditAction === "undefined" ? Object : _subscriptionenum.AuditAction)
], AuditLog.prototype, "action", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "entity_type",
        type: "varchar",
        length: 100
    }),
    _ts_metadata("design:type", String)
], AuditLog.prototype, "entityType", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "entity_id",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], AuditLog.prototype, "entityId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "old_values",
        type: "json",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Record === "undefined" ? Object : Record)
], AuditLog.prototype, "oldValues", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "new_values",
        type: "json",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Record === "undefined" ? Object : Record)
], AuditLog.prototype, "newValues", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "changed_fields",
        type: "json",
        nullable: true
    }),
    _ts_metadata("design:type", Array)
], AuditLog.prototype, "changedFields", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "ip_address",
        type: "varchar",
        length: 45,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], AuditLog.prototype, "ipAddress", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "user_agent",
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], AuditLog.prototype, "userAgent", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "request_id",
        type: "varchar",
        length: 100,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], AuditLog.prototype, "requestId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "json"
    }),
    _ts_metadata("design:type", typeof Record === "undefined" ? Object : Record)
], AuditLog.prototype, "metadata", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: "created_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], AuditLog.prototype, "createdAt", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_Organizationentity.Organization, {
        onDelete: "CASCADE"
    }),
    (0, _typeorm.JoinColumn)({
        name: "tenant_id"
    }),
    _ts_metadata("design:type", typeof _Organizationentity.Organization === "undefined" ? Object : _Organizationentity.Organization)
], AuditLog.prototype, "organization", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_Userentity.User),
    (0, _typeorm.JoinColumn)({
        name: "user_id"
    }),
    _ts_metadata("design:type", typeof _Userentity.User === "undefined" ? Object : _Userentity.User)
], AuditLog.prototype, "user", void 0);
AuditLog = _ts_decorate([
    (0, _typeorm.Entity)("audit_logs"),
    (0, _typeorm.Index)("idx_audit_logs_tenant_id", [
        "tenantId"
    ]),
    (0, _typeorm.Index)("idx_audit_logs_user_id", [
        "userId"
    ]),
    (0, _typeorm.Index)("idx_audit_logs_action", [
        "action"
    ]),
    (0, _typeorm.Index)("idx_audit_logs_entity_type", [
        "entityType"
    ]),
    (0, _typeorm.Index)("idx_audit_logs_entity_id", [
        "entityId"
    ]),
    (0, _typeorm.Index)("idx_audit_logs_created_at", [
        "createdAt"
    ]),
    (0, _typeorm.Index)("idx_audit_logs_tenant_created", [
        "tenantId",
        "createdAt"
    ])
], AuditLog);

//# sourceMappingURL=AuditLog.entity.js.map