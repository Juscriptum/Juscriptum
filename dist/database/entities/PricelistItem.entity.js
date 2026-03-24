"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PricelistItem", {
    enumerable: true,
    get: function() {
        return PricelistItem;
    }
});
const _typeorm = require("typeorm");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let PricelistItem = class PricelistItem {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)("uuid"),
    _ts_metadata("design:type", String)
], PricelistItem.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "tenant_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], PricelistItem.prototype, "tenantId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "pricelist_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], PricelistItem.prototype, "pricelistId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 255
    }),
    _ts_metadata("design:type", String)
], PricelistItem.prototype, "name", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 50
    }),
    _ts_metadata("design:type", String)
], PricelistItem.prototype, "code", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], PricelistItem.prototype, "description", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 100
    }),
    _ts_metadata("design:type", String)
], PricelistItem.prototype, "category", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        default: "fixed"
    }),
    _ts_metadata("design:type", String)
], PricelistItem.prototype, "unitType", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "base_price",
        type: "decimal",
        precision: 12,
        scale: 2
    }),
    _ts_metadata("design:type", Number)
], PricelistItem.prototype, "basePrice", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "currency",
        type: "varchar",
        length: 3,
        default: "UAH"
    }),
    _ts_metadata("design:type", String)
], PricelistItem.prototype, "currency", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "default_duration",
        type: "int",
        nullable: true
    }),
    _ts_metadata("design:type", Number)
], PricelistItem.prototype, "defaultDuration", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 50,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], PricelistItem.prototype, "unit", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "min_quantity",
        type: "int",
        nullable: true
    }),
    _ts_metadata("design:type", Number)
], PricelistItem.prototype, "minQuantity", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "boolean",
        default: true
    }),
    _ts_metadata("design:type", Boolean)
], PricelistItem.prototype, "isActive", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "display_order",
        type: "int",
        default: 0
    }),
    _ts_metadata("design:type", Number)
], PricelistItem.prototype, "displayOrder", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "json"
    }),
    _ts_metadata("design:type", typeof Record === "undefined" ? Object : Record)
], PricelistItem.prototype, "metadata", void 0);
_ts_decorate([
    (0, _typeorm.DeleteDateColumn)({
        name: "deleted_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], PricelistItem.prototype, "deletedAt", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: "created_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], PricelistItem.prototype, "createdAt", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: "updated_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], PricelistItem.prototype, "updatedAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "created_by",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], PricelistItem.prototype, "createdBy", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "updated_by",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], PricelistItem.prototype, "updatedBy", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)("Pricelist", "items"),
    (0, _typeorm.JoinColumn)({
        name: "pricelist_id"
    }),
    _ts_metadata("design:type", typeof Pricelist === "undefined" ? Object : Pricelist)
], PricelistItem.prototype, "pricelist", void 0);
PricelistItem = _ts_decorate([
    (0, _typeorm.Entity)("pricelist_items"),
    (0, _typeorm.Index)("idx_pricelist_items_tenant_id", [
        "tenantId"
    ]),
    (0, _typeorm.Index)("idx_pricelist_items_pricelist_id", [
        "pricelistId"
    ]),
    (0, _typeorm.Index)("idx_pricelist_items_category", [
        "category"
    ])
], PricelistItem);

//# sourceMappingURL=PricelistItem.entity.js.map