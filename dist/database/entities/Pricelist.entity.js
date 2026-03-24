"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "Pricelist", {
    enumerable: true,
    get: function() {
        return Pricelist;
    }
});
const _typeorm = require("typeorm");
const _PricelistItementity = require("./PricelistItem.entity");
const _PricelistCategoryentity = require("./PricelistCategory.entity");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let Pricelist = class Pricelist {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)("uuid"),
    _ts_metadata("design:type", String)
], Pricelist.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "tenant_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], Pricelist.prototype, "tenantId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 255
    }),
    _ts_metadata("design:type", String)
], Pricelist.prototype, "name", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Pricelist.prototype, "description", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar"
    }),
    _ts_metadata("design:type", typeof PricelistType === "undefined" ? Object : PricelistType)
], Pricelist.prototype, "type", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        default: "active"
    }),
    _ts_metadata("design:type", typeof PricelistStatus === "undefined" ? Object : PricelistStatus)
], Pricelist.prototype, "status", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "is_default",
        type: "boolean",
        default: false
    }),
    _ts_metadata("design:type", Boolean)
], Pricelist.prototype, "isDefault", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        default: "none"
    }),
    _ts_metadata("design:type", String)
], Pricelist.prototype, "roundingRule", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "rounding_precision",
        type: "int",
        default: 2
    }),
    _ts_metadata("design:type", Number)
], Pricelist.prototype, "roundingPrecision", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "vat_rate",
        type: "decimal",
        precision: 5,
        scale: 4,
        nullable: true
    }),
    _ts_metadata("design:type", Number)
], Pricelist.prototype, "vatRate", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "vat_included",
        type: "boolean",
        default: true
    }),
    _ts_metadata("design:type", Boolean)
], Pricelist.prototype, "vatIncluded", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "discount_enabled",
        type: "boolean",
        default: false
    }),
    _ts_metadata("design:type", Boolean)
], Pricelist.prototype, "discountEnabled", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], Pricelist.prototype, "discountType", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "discount_value",
        type: "decimal",
        precision: 10,
        scale: 2,
        nullable: true
    }),
    _ts_metadata("design:type", Number)
], Pricelist.prototype, "discountValue", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "json"
    }),
    _ts_metadata("design:type", typeof Record === "undefined" ? Object : Record)
], Pricelist.prototype, "metadata", void 0);
_ts_decorate([
    (0, _typeorm.DeleteDateColumn)({
        name: "deleted_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Pricelist.prototype, "deletedAt", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: "created_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Pricelist.prototype, "createdAt", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: "updated_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Pricelist.prototype, "updatedAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "created_by",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Pricelist.prototype, "createdBy", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "updated_by",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Pricelist.prototype, "updatedBy", void 0);
_ts_decorate([
    (0, _typeorm.OneToMany)(()=>_PricelistItementity.PricelistItem, (item)=>item.pricelist),
    _ts_metadata("design:type", Array)
], Pricelist.prototype, "items", void 0);
_ts_decorate([
    (0, _typeorm.OneToMany)(()=>_PricelistCategoryentity.PricelistCategory, (category)=>category.pricelist),
    _ts_metadata("design:type", Array)
], Pricelist.prototype, "categories", void 0);
Pricelist = _ts_decorate([
    (0, _typeorm.Entity)("pricelists"),
    (0, _typeorm.Index)("idx_pricelists_tenant_id", [
        "tenantId"
    ]),
    (0, _typeorm.Index)("idx_pricelists_type", [
        "type"
    ]),
    (0, _typeorm.Index)("idx_pricelists_status", [
        "status"
    ])
], Pricelist);

//# sourceMappingURL=Pricelist.entity.js.map