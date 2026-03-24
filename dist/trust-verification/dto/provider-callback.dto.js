"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ProviderCallbackDto", {
    enumerable: true,
    get: function() {
        return ProviderCallbackDto;
    }
});
const _classvalidator = require("class-validator");
const _UserIdentityentity = require("../../database/entities/UserIdentity.entity");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let ProviderCallbackDto = class ProviderCallbackDto {
};
_ts_decorate([
    (0, _classvalidator.IsEnum)([
        "acsk",
        "diia",
        "bankid_nbu",
        "manual"
    ]),
    _ts_metadata("design:type", typeof _UserIdentityentity.TrustProviderType === "undefined" ? Object : _UserIdentityentity.TrustProviderType)
], ProviderCallbackDto.prototype, "provider", void 0);
_ts_decorate([
    (0, _classvalidator.IsEnum)([
        "user_identity",
        "document_signature"
    ]),
    _ts_metadata("design:type", String)
], ProviderCallbackDto.prototype, "subjectType", void 0);
_ts_decorate([
    (0, _classvalidator.IsUUID)(),
    _ts_metadata("design:type", String)
], ProviderCallbackDto.prototype, "subjectId", void 0);
_ts_decorate([
    (0, _classvalidator.IsEnum)([
        "verified",
        "failed",
        "revoked",
        "retry"
    ]),
    _ts_metadata("design:type", String)
], ProviderCallbackDto.prototype, "event", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], ProviderCallbackDto.prototype, "externalVerificationId", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], ProviderCallbackDto.prototype, "reason", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsObject)(),
    _ts_metadata("design:type", typeof Record === "undefined" ? Object : Record)
], ProviderCallbackDto.prototype, "metadata", void 0);

//# sourceMappingURL=provider-callback.dto.js.map