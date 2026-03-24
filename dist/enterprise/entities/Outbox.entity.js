"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "Outbox", {
    enumerable: true,
    get: function() {
        return Outbox;
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
let Outbox = class Outbox {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)("uuid"),
    _ts_metadata("design:type", String)
], Outbox.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 100
    }),
    _ts_metadata("design:type", String)
], Outbox.prototype, "eventType", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "json"
    }),
    _ts_metadata("design:type", typeof Record === "undefined" ? Object : Record)
], Outbox.prototype, "payload", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "boolean",
        default: false
    }),
    _ts_metadata("design:type", Boolean)
], Outbox.prototype, "processed", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "int",
        default: 0
    }),
    _ts_metadata("design:type", Number)
], Outbox.prototype, "retryCount", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "json",
        nullable: true
    }),
    _ts_metadata("design:type", typeof OutboxError === "undefined" ? Object : OutboxError)
], Outbox.prototype, "lastError", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Outbox.prototype, "processedAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "datetime",
        default: ()=>"NOW()"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Outbox.prototype, "createdAt", void 0);
Outbox = _ts_decorate([
    (0, _typeorm.Entity)("outbox"),
    (0, _typeorm.Index)("idx_outbox_processed")
], Outbox);

//# sourceMappingURL=Outbox.entity.js.map