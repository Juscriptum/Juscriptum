"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "Invitation", {
    enumerable: true,
    get: function() {
        return Invitation;
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
let Invitation = class Invitation {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)("uuid"),
    _ts_metadata("design:type", String)
], Invitation.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "tenant_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], Invitation.prototype, "tenantId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "invited_by",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], Invitation.prototype, "invitedBy", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 255
    }),
    _ts_metadata("design:type", String)
], Invitation.prototype, "email", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar"
    }),
    _ts_metadata("design:type", typeof _subscriptionenum.UserRole === "undefined" ? Object : _subscriptionenum.UserRole)
], Invitation.prototype, "role", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 255
    }),
    _ts_metadata("design:type", String)
], Invitation.prototype, "token", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        default: _subscriptionenum.InvitationStatus.PENDING
    }),
    _ts_metadata("design:type", typeof _subscriptionenum.InvitationStatus === "undefined" ? Object : _subscriptionenum.InvitationStatus)
], Invitation.prototype, "status", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Invitation.prototype, "message", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "expires_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Invitation.prototype, "expiresAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "accepted_at",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Invitation.prototype, "acceptedAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "revoked_at",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Invitation.prototype, "revokedAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "accepted_by",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Invitation.prototype, "acceptedBy", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "json"
    }),
    _ts_metadata("design:type", typeof Record === "undefined" ? Object : Record)
], Invitation.prototype, "metadata", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: "created_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Invitation.prototype, "createdAt", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: "updated_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Invitation.prototype, "updatedAt", void 0);
_ts_decorate([
    (0, _typeorm.DeleteDateColumn)({
        name: "deleted_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", Object)
], Invitation.prototype, "deletedAt", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_Organizationentity.Organization, {
        onDelete: "CASCADE"
    }),
    (0, _typeorm.JoinColumn)({
        name: "tenant_id"
    }),
    _ts_metadata("design:type", typeof _Organizationentity.Organization === "undefined" ? Object : _Organizationentity.Organization)
], Invitation.prototype, "organization", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_Userentity.User),
    (0, _typeorm.JoinColumn)({
        name: "invited_by"
    }),
    _ts_metadata("design:type", typeof _Userentity.User === "undefined" ? Object : _Userentity.User)
], Invitation.prototype, "inviter", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_Userentity.User),
    (0, _typeorm.JoinColumn)({
        name: "accepted_by"
    }),
    _ts_metadata("design:type", typeof _Userentity.User === "undefined" ? Object : _Userentity.User)
], Invitation.prototype, "acceptedUser", void 0);
Invitation = _ts_decorate([
    (0, _typeorm.Entity)("invitations"),
    (0, _typeorm.Index)("idx_invitations_tenant_id", [
        "tenantId"
    ]),
    (0, _typeorm.Index)("idx_invitations_email", [
        "email"
    ]),
    (0, _typeorm.Index)("idx_invitations_token", [
        "token"
    ]),
    (0, _typeorm.Index)("idx_invitations_status", [
        "status"
    ]),
    (0, _typeorm.Index)("idx_invitations_expires_at", [
        "expiresAt"
    ])
], Invitation);

//# sourceMappingURL=Invitation.entity.js.map