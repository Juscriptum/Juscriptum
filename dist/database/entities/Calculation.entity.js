"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "Calculation", {
    enumerable: true,
    get: function() {
        return Calculation;
    }
});
const _typeorm = require("typeorm");
const _Caseentity = require("./Case.entity");
const _Userentity = require("./User.entity");
const _CalculationItementity = require("./CalculationItem.entity");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let Calculation = class Calculation {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)("uuid"),
    _ts_metadata("design:type", String)
], Calculation.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "tenant_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], Calculation.prototype, "tenantId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "case_id",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Calculation.prototype, "caseId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 50
    }),
    _ts_metadata("design:type", String)
], Calculation.prototype, "number", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 255
    }),
    _ts_metadata("design:type", String)
], Calculation.prototype, "name", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Calculation.prototype, "description", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "calculation_date",
        type: "date"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Calculation.prototype, "calculationDate", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "due_date",
        type: "date",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Calculation.prototype, "dueDate", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "paid_date",
        type: "date",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Calculation.prototype, "paidDate", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "pdf_url",
        type: "varchar",
        length: 500,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Calculation.prototype, "pdfUrl", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "pdf_generated_at",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Calculation.prototype, "pdfGeneratedAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "subtotal",
        type: "decimal",
        precision: 14,
        scale: 2,
        nullable: true
    }),
    _ts_metadata("design:type", Number)
], Calculation.prototype, "subtotal", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "discount_amount",
        type: "decimal",
        precision: 14,
        scale: 2,
        default: 0
    }),
    _ts_metadata("design:type", Number)
], Calculation.prototype, "discountAmount", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "vat_amount",
        type: "decimal",
        precision: 14,
        scale: 2,
        default: 0
    }),
    _ts_metadata("design:type", Number)
], Calculation.prototype, "vatAmount", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "total_amount",
        type: "decimal",
        precision: 14,
        scale: 2,
        nullable: true
    }),
    _ts_metadata("design:type", Number)
], Calculation.prototype, "totalAmount", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "paid_amount",
        type: "decimal",
        precision: 14,
        scale: 2,
        default: 0
    }),
    _ts_metadata("design:type", Number)
], Calculation.prototype, "paidAmount", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "currency",
        type: "varchar",
        length: 3,
        default: "UAH"
    }),
    _ts_metadata("design:type", String)
], Calculation.prototype, "currency", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        default: "draft"
    }),
    _ts_metadata("design:type", typeof CalculationStatus === "undefined" ? Object : CalculationStatus)
], Calculation.prototype, "status", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "pricelist_id",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Calculation.prototype, "pricelistId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Calculation.prototype, "internalNotes", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Calculation.prototype, "clientNotes", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "json"
    }),
    _ts_metadata("design:type", typeof Record === "undefined" ? Object : Record)
], Calculation.prototype, "metadata", void 0);
_ts_decorate([
    (0, _typeorm.DeleteDateColumn)({
        name: "deleted_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Calculation.prototype, "deletedAt", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: "created_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Calculation.prototype, "createdAt", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: "updated_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Calculation.prototype, "updatedAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "created_by",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Calculation.prototype, "createdBy", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "updated_by",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Calculation.prototype, "updatedBy", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "approved_by",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Calculation.prototype, "approvedById", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_Caseentity.Case),
    (0, _typeorm.JoinColumn)({
        name: "case_id"
    }),
    _ts_metadata("design:type", typeof _Caseentity.Case === "undefined" ? Object : _Caseentity.Case)
], Calculation.prototype, "case", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_Userentity.User, {
        nullable: true
    }),
    (0, _typeorm.JoinColumn)({
        name: "approved_by"
    }),
    _ts_metadata("design:type", typeof _Userentity.User === "undefined" ? Object : _Userentity.User)
], Calculation.prototype, "approvedBy", void 0);
_ts_decorate([
    (0, _typeorm.OneToMany)(()=>_CalculationItementity.CalculationItem, (item)=>item.calculation),
    _ts_metadata("design:type", Array)
], Calculation.prototype, "items", void 0);
Calculation = _ts_decorate([
    (0, _typeorm.Entity)("calculations"),
    (0, _typeorm.Index)("idx_calculations_tenant_id", [
        "tenantId"
    ]),
    (0, _typeorm.Index)("idx_calculations_case_id", [
        "caseId"
    ]),
    (0, _typeorm.Index)("idx_calculations_status", [
        "status"
    ]),
    (0, _typeorm.Index)("idx_calculations_date", [
        "calculationDate"
    ])
], Calculation);

//# sourceMappingURL=Calculation.entity.js.map