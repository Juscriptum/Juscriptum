"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get CompleteRegistrationDto () {
        return CompleteRegistrationDto;
    },
    get RegisterDto () {
        return RegisterDto;
    },
    get RegisterOrganizationDto () {
        return RegisterOrganizationDto;
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
let RegisterDto = class RegisterDto {
};
_ts_decorate([
    (0, _classvalidator.IsEmail)(),
    _ts_metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MinLength)(8),
    (0, _classvalidator.MaxLength)(128),
    _ts_metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
let RegisterOrganizationDto = class RegisterOrganizationDto {
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MinLength)(2),
    (0, _classvalidator.MaxLength)(255),
    _ts_metadata("design:type", String)
], RegisterOrganizationDto.prototype, "name", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], RegisterOrganizationDto.prototype, "legalForm", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.Matches)(/^\d{8}$/, {
        message: "EDRPOU must be 8 digits"
    }),
    _ts_metadata("design:type", String)
], RegisterOrganizationDto.prototype, "edrpou", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.Matches)(/^\d{10,12}$/, {
        message: "Tax number must be 10-12 digits"
    }),
    _ts_metadata("design:type", String)
], RegisterOrganizationDto.prototype, "taxNumber", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(500),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], RegisterOrganizationDto.prototype, "address", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(100),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], RegisterOrganizationDto.prototype, "city", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(100),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], RegisterOrganizationDto.prototype, "region", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(20),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], RegisterOrganizationDto.prototype, "phone", void 0);
_ts_decorate([
    (0, _classvalidator.IsEmail)(),
    _ts_metadata("design:type", String)
], RegisterOrganizationDto.prototype, "email", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(255),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], RegisterOrganizationDto.prototype, "website", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], RegisterOrganizationDto.prototype, "subscriptionPlan", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MinLength)(2),
    (0, _classvalidator.MaxLength)(100),
    _ts_metadata("design:type", String)
], RegisterOrganizationDto.prototype, "firstName", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MinLength)(2),
    (0, _classvalidator.MaxLength)(100),
    _ts_metadata("design:type", String)
], RegisterOrganizationDto.prototype, "lastName", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(100),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], RegisterOrganizationDto.prototype, "patronymic", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MinLength)(8),
    (0, _classvalidator.MaxLength)(128),
    _ts_metadata("design:type", String)
], RegisterOrganizationDto.prototype, "password", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(100),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], RegisterOrganizationDto.prototype, "position", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(20),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.Matches)(/^\d{10,12}$/, {
        message: "Bar number must be 10-12 digits"
    }),
    _ts_metadata("design:type", String)
], RegisterOrganizationDto.prototype, "barNumber", void 0);
let CompleteRegistrationDto = class CompleteRegistrationDto {
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], CompleteRegistrationDto.prototype, "token", void 0);

//# sourceMappingURL=register.dto.js.map