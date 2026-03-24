"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RequestIdentityVerificationDto", {
    enumerable: true,
    get: function() {
        return RequestIdentityVerificationDto;
    }
});
const _classvalidator = require("class-validator");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let RequestIdentityVerificationDto = class RequestIdentityVerificationDto {
};
_ts_decorate([
    (0, _classvalidator.IsEnum)([
        "acsk",
        "diia",
        "bankid_nbu"
    ]),
    _ts_metadata("design:type", typeof Exclude === "undefined" ? Object : Exclude)
], RequestIdentityVerificationDto.prototype, "provider", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], RequestIdentityVerificationDto.prototype, "externalSubjectId", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], RequestIdentityVerificationDto.prototype, "displayName", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], RequestIdentityVerificationDto.prototype, "certificateSerialNumber", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], RequestIdentityVerificationDto.prototype, "certificateIssuer", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], RequestIdentityVerificationDto.prototype, "taxIdHash", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], RequestIdentityVerificationDto.prototype, "assuranceLevel", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsObject)(),
    _ts_metadata("design:type", typeof Record === "undefined" ? Object : Record)
], RequestIdentityVerificationDto.prototype, "metadata", void 0);

//# sourceMappingURL=request-identity-verification.dto.js.map