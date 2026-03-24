"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "Invoice", {
    enumerable: true,
    get: function() {
        return Invoice;
    }
});
const _typeorm = require("typeorm");
const _Userentity = require("./User.entity");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let Invoice = class Invoice {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)("uuid"),
    _ts_metadata("design:type", String)
], Invoice.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "tenant_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], Invoice.prototype, "tenantId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "client_id",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Invoice.prototype, "clientId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "calculation_id",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Invoice.prototype, "calculationId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 50
    }),
    _ts_metadata("design:type", String)
], Invoice.prototype, "invoiceNumber", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "invoice_date",
        type: "date"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Invoice.prototype, "invoiceDate", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "due_date",
        type: "date",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Invoice.prototype, "dueDate", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Invoice.prototype, "description", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "subtotal",
        type: "decimal",
        precision: 14,
        scale: 2,
        nullable: true
    }),
    _ts_metadata("design:type", Number)
], Invoice.prototype, "subtotal", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "discount_amount",
        type: "decimal",
        precision: 14,
        scale: 2,
        default: 0
    }),
    _ts_metadata("design:type", Number)
], Invoice.prototype, "discountAmount", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "vat_amount",
        type: "decimal",
        precision: 14,
        scale: 2,
        nullable: true
    }),
    _ts_metadata("design:type", Number)
], Invoice.prototype, "vatAmount", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "total_amount",
        type: "decimal",
        precision: 14,
        scale: 2,
        nullable: true
    }),
    _ts_metadata("design:type", Number)
], Invoice.prototype, "totalAmount", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "paid_amount",
        type: "decimal",
        precision: 14,
        scale: 2,
        default: 0
    }),
    _ts_metadata("design:type", Number)
], Invoice.prototype, "paidAmount", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "currency",
        type: "varchar",
        length: 3,
        default: "UAH"
    }),
    _ts_metadata("design:type", String)
], Invoice.prototype, "currency", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        default: "draft"
    }),
    _ts_metadata("design:type", typeof InvoiceStatus === "undefined" ? Object : InvoiceStatus)
], Invoice.prototype, "status", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        nullable: true
    }),
    _ts_metadata("design:type", typeof PaymentMethod === "undefined" ? Object : PaymentMethod)
], Invoice.prototype, "paymentMethod", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "payment_reference",
        type: "varchar",
        length: 255,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Invoice.prototype, "paymentReference", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "paid_at",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Invoice.prototype, "paidAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "pdf_url",
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Invoice.prototype, "pdfUrl", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "pdf_generated_at",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Invoice.prototype, "pdfGeneratedAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Invoice.prototype, "internalNotes", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Invoice.prototype, "clientNotes", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "json"
    }),
    _ts_metadata("design:type", typeof Record === "undefined" ? Object : Record)
], Invoice.prototype, "metadata", void 0);
_ts_decorate([
    (0, _typeorm.DeleteDateColumn)({
        name: "deleted_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Invoice.prototype, "deletedAt", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: "created_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Invoice.prototype, "createdAt", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: "updated_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Invoice.prototype, "updatedAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "created_by",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Invoice.prototype, "createdBy", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "updated_by",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Invoice.prototype, "updatedBy", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_Userentity.User, {
        nullable: true
    }),
    (0, _typeorm.JoinColumn)({
        name: "created_by"
    }),
    _ts_metadata("design:type", typeof _Userentity.User === "undefined" ? Object : _Userentity.User)
], Invoice.prototype, "createdByUser", void 0);
Invoice = _ts_decorate([
    (0, _typeorm.Entity)("invoices"),
    (0, _typeorm.Index)("idx_invoices_tenant_id", [
        "tenantId"
    ]),
    (0, _typeorm.Index)("idx_invoices_client_id", [
        "clientId"
    ]),
    (0, _typeorm.Index)("idx_invoices_status", [
        "status"
    ]),
    (0, _typeorm.Index)("idx_invoices_invoice_date", [
        "invoiceDate"
    ])
], Invoice);

//# sourceMappingURL=Invoice.entity.js.map