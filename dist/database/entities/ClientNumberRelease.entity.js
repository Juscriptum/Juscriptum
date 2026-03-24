"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ClientNumberRelease", {
    enumerable: true,
    get: function() {
        return ClientNumberRelease;
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
let ClientNumberRelease = class ClientNumberRelease {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)("uuid"),
    _ts_metadata("design:type", String)
], ClientNumberRelease.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "tenant_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], ClientNumberRelease.prototype, "tenantId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "client_number",
        type: "integer"
    }),
    _ts_metadata("design:type", Number)
], ClientNumberRelease.prototype, "clientNumber", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "released_from_client_id",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], ClientNumberRelease.prototype, "releasedFromClientId", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: "created_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], ClientNumberRelease.prototype, "createdAt", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: "updated_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], ClientNumberRelease.prototype, "updatedAt", void 0);
ClientNumberRelease = _ts_decorate([
    (0, _typeorm.Entity)("client_number_releases"),
    (0, _typeorm.Index)("idx_client_number_releases_tenant_id", [
        "tenantId"
    ]),
    (0, _typeorm.Index)("idx_client_number_releases_tenant_number", [
        "tenantId",
        "clientNumber"
    ], {
        unique: true
    })
], ClientNumberRelease);

//# sourceMappingURL=ClientNumberRelease.entity.js.map