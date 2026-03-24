"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "Note", {
    enumerable: true,
    get: function() {
        return Note;
    }
});
const _typeorm = require("typeorm");
const _accesscontrol = require("../../common/security/access-control");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let Note = class Note {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)("uuid"),
    _ts_metadata("design:type", String)
], Note.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "tenant_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], Note.prototype, "tenantId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 255,
        default: ""
    }),
    _ts_metadata("design:type", String)
], Note.prototype, "title", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "text",
        default: ""
    }),
    _ts_metadata("design:type", String)
], Note.prototype, "content", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "boolean",
        default: false
    }),
    _ts_metadata("design:type", Boolean)
], Note.prototype, "pinned", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "json",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], Note.prototype, "tags", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "access_scope",
        type: "varchar",
        default: "assigned"
    }),
    _ts_metadata("design:type", typeof _accesscontrol.DataAccessScope === "undefined" ? Object : _accesscontrol.DataAccessScope)
], Note.prototype, "accessScope", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "assigned_user_id",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], Note.prototype, "assignedUserId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "client_id",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], Note.prototype, "clientId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "case_id",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], Note.prototype, "caseId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "user_id",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], Note.prototype, "userId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "json",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], Note.prototype, "metadata", void 0);
_ts_decorate([
    (0, _typeorm.DeleteDateColumn)({
        name: "deleted_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", Object)
], Note.prototype, "deletedAt", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: "created_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Note.prototype, "createdAt", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: "updated_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Note.prototype, "updatedAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "created_by",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], Note.prototype, "createdBy", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "updated_by",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], Note.prototype, "updatedBy", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>require("./Client.entity").Client, {
        nullable: true
    }),
    (0, _typeorm.JoinColumn)({
        name: "client_id"
    }),
    _ts_metadata("design:type", Object)
], Note.prototype, "client", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>require("./Case.entity").Case, {
        nullable: true
    }),
    (0, _typeorm.JoinColumn)({
        name: "case_id"
    }),
    _ts_metadata("design:type", Object)
], Note.prototype, "case", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>require("./User.entity").User, {
        nullable: true
    }),
    (0, _typeorm.JoinColumn)({
        name: "user_id"
    }),
    _ts_metadata("design:type", Object)
], Note.prototype, "user", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>require("./User.entity").User, {
        nullable: true
    }),
    (0, _typeorm.JoinColumn)({
        name: "assigned_user_id"
    }),
    _ts_metadata("design:type", Object)
], Note.prototype, "assignedUser", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>require("./User.entity").User, {
        nullable: true
    }),
    (0, _typeorm.JoinColumn)({
        name: "created_by"
    }),
    _ts_metadata("design:type", Object)
], Note.prototype, "createdByUser", void 0);
Note = _ts_decorate([
    (0, _typeorm.Entity)("notes"),
    (0, _typeorm.Index)("idx_notes_tenant_id", [
        "tenantId"
    ]),
    (0, _typeorm.Index)("idx_notes_case_id", [
        "caseId"
    ]),
    (0, _typeorm.Index)("idx_notes_client_id", [
        "clientId"
    ]),
    (0, _typeorm.Index)("idx_notes_user_id", [
        "userId"
    ]),
    (0, _typeorm.Index)("idx_notes_assigned_user_id", [
        "assignedUserId"
    ]),
    (0, _typeorm.Index)("idx_notes_updated_at", [
        "updatedAt"
    ])
], Note);

//# sourceMappingURL=Note.entity.js.map