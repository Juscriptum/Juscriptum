"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CalculationItem", {
    enumerable: true,
    get: function() {
        return CalculationItem;
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
let CalculationItem = class CalculationItem {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)("uuid"),
    _ts_metadata("design:type", String)
], CalculationItem.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "calculation_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], CalculationItem.prototype, "calculationId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 255
    }),
    _ts_metadata("design:type", String)
], CalculationItem.prototype, "description", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "pricelist_item_id",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], CalculationItem.prototype, "pricelistItemId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 100,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], CalculationItem.prototype, "code", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "unit_type",
        type: "varchar",
        length: 20,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], CalculationItem.prototype, "unitType", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "decimal",
        precision: 12,
        scale: 2,
        nullable: true
    }),
    _ts_metadata("design:type", Number)
], CalculationItem.prototype, "quantity", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "int",
        nullable: true
    }),
    _ts_metadata("design:type", Number)
], CalculationItem.prototype, "duration", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "unit_price",
        type: "decimal",
        precision: 12,
        scale: 2
    }),
    _ts_metadata("design:type", Number)
], CalculationItem.prototype, "unitPrice", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "line_total",
        type: "decimal",
        precision: 14,
        scale: 2
    }),
    _ts_metadata("design:type", Number)
], CalculationItem.prototype, "lineTotal", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "vat_rate",
        type: "decimal",
        precision: 5,
        scale: 4,
        nullable: true
    }),
    _ts_metadata("design:type", Number)
], CalculationItem.prototype, "vatRate", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "vat_amount",
        type: "decimal",
        precision: 12,
        scale: 2,
        default: 0
    }),
    _ts_metadata("design:type", Number)
], CalculationItem.prototype, "vatAmount", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "discount_amount",
        type: "decimal",
        precision: 12,
        scale: 2,
        default: 0
    }),
    _ts_metadata("design:type", Number)
], CalculationItem.prototype, "discountAmount", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "display_order",
        type: "int",
        default: 0
    }),
    _ts_metadata("design:type", Number)
], CalculationItem.prototype, "displayOrder", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: "created_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], CalculationItem.prototype, "createdAt", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)("Calculation", "items"),
    (0, _typeorm.JoinColumn)({
        name: "calculation_id"
    }),
    _ts_metadata("design:type", typeof Calculation === "undefined" ? Object : Calculation)
], CalculationItem.prototype, "calculation", void 0);
CalculationItem = _ts_decorate([
    (0, _typeorm.Entity)("calculation_items")
], CalculationItem);

//# sourceMappingURL=CalculationItem.entity.js.map