"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "Case", {
    enumerable: true,
    get: function() {
        return Case;
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
let Case = class Case {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)("uuid"),
    _ts_metadata("design:type", String)
], Case.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "tenant_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], Case.prototype, "tenantId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "case_number",
        type: "varchar",
        length: 50
    }),
    _ts_metadata("design:type", String)
], Case.prototype, "caseNumber", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "registry_case_number",
        type: "varchar",
        length: 100,
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], Case.prototype, "registryCaseNumber", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar"
    }),
    _ts_metadata("design:type", String)
], Case.prototype, "caseType", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "assigned_lawyer_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], Case.prototype, "assignedLawyerId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "access_scope",
        type: "varchar",
        default: "assigned"
    }),
    _ts_metadata("design:type", typeof _accesscontrol.DataAccessScope === "undefined" ? Object : _accesscontrol.DataAccessScope)
], Case.prototype, "accessScope", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "client_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], Case.prototype, "clientId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Case.prototype, "title", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Case.prototype, "description", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar"
    }),
    _ts_metadata("design:type", String)
], Case.prototype, "priority", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar"
    }),
    _ts_metadata("design:type", String)
], Case.prototype, "status", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "start_date",
        type: "date",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Case.prototype, "startDate", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "end_date",
        type: "date",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Case.prototype, "endDate", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "next_hearing_date",
        type: "date",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Case.prototype, "nextHearingDate", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "deadline_date",
        type: "date",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Case.prototype, "deadlineDate", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "estimated_amount",
        type: "decimal",
        precision: 12,
        scale: 2,
        nullable: true
    }),
    _ts_metadata("design:type", Number)
], Case.prototype, "estimatedAmount", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "paid_amount",
        type: "decimal",
        precision: 12,
        scale: 2,
        nullable: true,
        default: 0
    }),
    _ts_metadata("design:type", Number)
], Case.prototype, "paidAmount", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "court_name",
        type: "varchar",
        length: 255,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Case.prototype, "courtName", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "court_address",
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Case.prototype, "courtAddress", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "judge_name",
        type: "varchar",
        length: 100,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Case.prototype, "judgeName", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "proceeding_stage",
        type: "varchar",
        length: 100,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Case.prototype, "proceedingStage", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "plaintiff_name",
        type: "varchar",
        length: 255,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Case.prototype, "plaintiffName", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "defendant_name",
        type: "varchar",
        length: 255,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Case.prototype, "defendantName", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "third_parties",
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Case.prototype, "thirdParties", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "claim_amount",
        type: "decimal",
        precision: 12,
        scale: 2,
        nullable: true
    }),
    _ts_metadata("design:type", Number)
], Case.prototype, "claimAmount", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "court_fee",
        type: "decimal",
        precision: 12,
        scale: 2,
        nullable: true
    }),
    _ts_metadata("design:type", Number)
], Case.prototype, "courtFee", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Case.prototype, "internalNotes", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Case.prototype, "clientNotes", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "json"
    }),
    _ts_metadata("design:type", typeof Record === "undefined" ? Object : Record)
], Case.prototype, "metadata", void 0);
_ts_decorate([
    (0, _typeorm.DeleteDateColumn)({
        name: "deleted_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Case.prototype, "deletedAt", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: "created_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Case.prototype, "createdAt", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: "updated_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Case.prototype, "updatedAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "created_by",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Case.prototype, "createdBy", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "updated_by",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Case.prototype, "updatedBy", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>require("./User.entity").User),
    (0, _typeorm.JoinColumn)({
        name: "assigned_lawyer_id"
    }),
    _ts_metadata("design:type", typeof User === "undefined" ? Object : User)
], Case.prototype, "assignedLawyer", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>require("./Client.entity").Client),
    (0, _typeorm.JoinColumn)({
        name: "client_id"
    }),
    _ts_metadata("design:type", typeof Client === "undefined" ? Object : Client)
], Case.prototype, "client", void 0);
_ts_decorate([
    (0, _typeorm.OneToMany)(()=>require("./Document.entity").Document, (document)=>document.case),
    _ts_metadata("design:type", Array)
], Case.prototype, "documents", void 0);
_ts_decorate([
    (0, _typeorm.OneToMany)(()=>require("./Event.entity").Event, (event)=>event.case),
    _ts_metadata("design:type", Array)
], Case.prototype, "events", void 0);
Case = _ts_decorate([
    (0, _typeorm.Entity)("cases"),
    (0, _typeorm.Index)("idx_cases_tenant_id", [
        "tenantId"
    ]),
    (0, _typeorm.Index)("idx_cases_client_id", [
        "clientId"
    ]),
    (0, _typeorm.Index)("idx_cases_status", [
        "status"
    ]),
    (0, _typeorm.Index)("idx_cases_priority", [
        "priority"
    ]),
    (0, _typeorm.Index)("idx_cases_case_number", [
        "caseNumber"
    ]),
    (0, _typeorm.Index)("idx_cases_created_at", [
        "createdAt"
    ])
], Case);

//# sourceMappingURL=Case.entity.js.map