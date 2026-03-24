"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "Client", {
    enumerable: true,
    get: function() {
        return Client;
    }
});
const _typeorm = require("typeorm");
const _accesscontrol = require("../../common/security/access-control");
const _piiprotection = require("../../common/security/pii-protection");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
const encryptedStringTransformer = (0, _piiprotection.createEncryptedStringTransformer)();
let Client = class Client {
    syncBlindIndexes() {
        this.emailBlindIndex = (0, _piiprotection.computeEmailBlindIndex)(this.email, "client_email") ?? null;
        this.phoneBlindIndex = (0, _piiprotection.computePhoneBlindIndex)(this.phone) ?? null;
        this.edrpouBlindIndex = (0, _piiprotection.computeIdentifierBlindIndex)(this.edrpou, "client_edrpou") ?? null;
        this.innBlindIndex = (0, _piiprotection.computeIdentifierBlindIndex)(this.inn, "client_inn") ?? null;
    }
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)("uuid"),
    _ts_metadata("design:type", String)
], Client.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "tenant_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], Client.prototype, "tenantId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar"
    }),
    _ts_metadata("design:type", typeof ClientType === "undefined" ? Object : ClientType)
], Client.prototype, "type", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 100,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Client.prototype, "firstName", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 100,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Client.prototype, "lastName", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 100,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Client.prototype, "patronymic", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "company_name",
        type: "varchar",
        length: 255,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Client.prototype, "companyName", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "edrpou",
        type: "text",
        nullable: true,
        transformer: encryptedStringTransformer
    }),
    _ts_metadata("design:type", String)
], Client.prototype, "edrpou", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "edrpou_blind_index",
        type: "varchar",
        length: 64,
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], Client.prototype, "edrpouBlindIndex", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "inn",
        type: "text",
        nullable: true,
        transformer: encryptedStringTransformer
    }),
    _ts_metadata("design:type", String)
], Client.prototype, "inn", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "inn_blind_index",
        type: "varchar",
        length: 64,
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], Client.prototype, "innBlindIndex", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "text",
        nullable: true,
        transformer: encryptedStringTransformer
    }),
    _ts_metadata("design:type", String)
], Client.prototype, "email", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "email_blind_index",
        type: "varchar",
        length: 64,
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], Client.prototype, "emailBlindIndex", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "text",
        nullable: true,
        transformer: encryptedStringTransformer
    }),
    _ts_metadata("design:type", String)
], Client.prototype, "phone", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "phone_blind_index",
        type: "varchar",
        length: 64,
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], Client.prototype, "phoneBlindIndex", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "text",
        nullable: true,
        transformer: encryptedStringTransformer
    }),
    _ts_metadata("design:type", String)
], Client.prototype, "secondaryPhone", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "text",
        nullable: true,
        transformer: encryptedStringTransformer
    }),
    _ts_metadata("design:type", String)
], Client.prototype, "address", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 100,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Client.prototype, "city", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 100,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Client.prototype, "region", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "postal_code",
        type: "text",
        nullable: true,
        transformer: encryptedStringTransformer
    }),
    _ts_metadata("design:type", String)
], Client.prototype, "postalCode", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 2,
        default: "UA"
    }),
    _ts_metadata("design:type", String)
], Client.prototype, "country", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        default: "active"
    }),
    _ts_metadata("design:type", typeof ClientStatus === "undefined" ? Object : ClientStatus)
], Client.prototype, "status", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 20,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Client.prototype, "source", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "assigned_user_id",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Client.prototype, "assignedUserId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "access_scope",
        type: "varchar",
        default: "assigned"
    }),
    _ts_metadata("design:type", typeof _accesscontrol.DataAccessScope === "undefined" ? Object : _accesscontrol.DataAccessScope)
], Client.prototype, "accessScope", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "passport_number",
        type: "text",
        nullable: true,
        transformer: encryptedStringTransformer
    }),
    _ts_metadata("design:type", String)
], Client.prototype, "passportNumber", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "passport_date",
        type: "date",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Client.prototype, "passportDate", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "text",
        nullable: true,
        transformer: encryptedStringTransformer
    }),
    _ts_metadata("design:type", String)
], Client.prototype, "notes", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "json"
    }),
    _ts_metadata("design:type", typeof Record === "undefined" ? Object : Record)
], Client.prototype, "metadata", void 0);
_ts_decorate([
    (0, _typeorm.DeleteDateColumn)({
        name: "deleted_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Client.prototype, "deletedAt", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: "created_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Client.prototype, "createdAt", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: "updated_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Client.prototype, "updatedAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "created_by",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Client.prototype, "createdBy", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "updated_by",
        type: "uuid",
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Client.prototype, "updatedBy", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>require("./User.entity").User),
    (0, _typeorm.JoinColumn)({
        name: "assigned_user_id"
    }),
    _ts_metadata("design:type", typeof User === "undefined" ? Object : User)
], Client.prototype, "assignedUser", void 0);
_ts_decorate([
    (0, _typeorm.OneToMany)(()=>require("./Case.entity").Case, (caseEntity)=>caseEntity.client),
    _ts_metadata("design:type", Array)
], Client.prototype, "cases", void 0);
_ts_decorate([
    (0, _typeorm.BeforeInsert)(),
    (0, _typeorm.BeforeUpdate)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", void 0)
], Client.prototype, "syncBlindIndexes", null);
Client = _ts_decorate([
    (0, _typeorm.Entity)("clients"),
    (0, _typeorm.Index)("idx_clients_tenant_id", [
        "tenantId"
    ]),
    (0, _typeorm.Index)("idx_clients_status", [
        "status"
    ]),
    (0, _typeorm.Index)("idx_clients_type", [
        "type"
    ]),
    (0, _typeorm.Index)("idx_clients_name", [
        "firstName",
        "lastName"
    ]),
    (0, _typeorm.Index)("idx_clients_email_blind_index", [
        "emailBlindIndex"
    ]),
    (0, _typeorm.Index)("idx_clients_phone_blind_index", [
        "phoneBlindIndex"
    ]),
    (0, _typeorm.Index)("idx_clients_edrpou_blind_index", [
        "edrpouBlindIndex"
    ]),
    (0, _typeorm.Index)("idx_clients_inn_blind_index", [
        "innBlindIndex"
    ])
], Client);

//# sourceMappingURL=Client.entity.js.map