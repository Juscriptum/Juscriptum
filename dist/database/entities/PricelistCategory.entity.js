"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PricelistCategory", {
    enumerable: true,
    get: function() {
        return PricelistCategory;
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
let PricelistCategory = class PricelistCategory {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)("uuid"),
    _ts_metadata("design:type", String)
], PricelistCategory.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "tenant_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], PricelistCategory.prototype, "tenantId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "pricelist_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], PricelistCategory.prototype, "pricelistId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "parent_id",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], PricelistCategory.prototype, "parentId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 255
    }),
    _ts_metadata("design:type", String)
], PricelistCategory.prototype, "name", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "display_order",
        type: "int",
        default: 0
    }),
    _ts_metadata("design:type", Number)
], PricelistCategory.prototype, "displayOrder", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "json"
    }),
    _ts_metadata("design:type", typeof Record === "undefined" ? Object : Record)
], PricelistCategory.prototype, "metadata", void 0);
_ts_decorate([
    (0, _typeorm.DeleteDateColumn)({
        name: "deleted_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], PricelistCategory.prototype, "deletedAt", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: "created_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], PricelistCategory.prototype, "createdAt", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: "updated_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], PricelistCategory.prototype, "updatedAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "created_by",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], PricelistCategory.prototype, "createdBy", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "updated_by",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], PricelistCategory.prototype, "updatedBy", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)("Pricelist", "categories", {
        onDelete: "CASCADE"
    }),
    (0, _typeorm.JoinColumn)({
        name: "pricelist_id"
    }),
    _ts_metadata("design:type", typeof Pricelist === "undefined" ? Object : Pricelist)
], PricelistCategory.prototype, "pricelist", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)("PricelistCategory", "children", {
        nullable: true
    }),
    (0, _typeorm.JoinColumn)({
        name: "parent_id"
    }),
    _ts_metadata("design:type", Object)
], PricelistCategory.prototype, "parent", void 0);
_ts_decorate([
    (0, _typeorm.OneToMany)("PricelistCategory", "parent"),
    _ts_metadata("design:type", Array)
], PricelistCategory.prototype, "children", void 0);
PricelistCategory = _ts_decorate([
    (0, _typeorm.Entity)("pricelist_categories"),
    (0, _typeorm.Index)("idx_pricelist_categories_tenant_id", [
        "tenantId"
    ]),
    (0, _typeorm.Index)("idx_pricelist_categories_pricelist_id", [
        "pricelistId"
    ]),
    (0, _typeorm.Index)("idx_pricelist_categories_parent_id", [
        "parentId"
    ])
], PricelistCategory);

//# sourceMappingURL=PricelistCategory.entity.js.map