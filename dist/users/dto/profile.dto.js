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
    get AddressDto () {
        return AddressDto;
    },
    get ChangePasswordDto () {
        return ChangePasswordDto;
    },
    get DirectorDto () {
        return DirectorDto;
    },
    get LegalEntityDto () {
        return LegalEntityDto;
    },
    get ProfileResponseDto () {
        return ProfileResponseDto;
    },
    get UpdateProfileDto () {
        return UpdateProfileDto;
    }
});
const _classtransformer = require("class-transformer");
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
const phoneRegex = /^\+380\d{9}$/;
const taxIdRegex = /^\d{10}$/;
const bankMfoRegex = /^\d{6}$/;
const ibanRegex = /^UA\d{27}$/;
let AddressDto = class AddressDto {
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(100),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], AddressDto.prototype, "region", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(100),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], AddressDto.prototype, "city", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(20),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], AddressDto.prototype, "cityCode", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(150),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], AddressDto.prototype, "street", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(30),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], AddressDto.prototype, "building", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(30),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], AddressDto.prototype, "unit", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(30),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], AddressDto.prototype, "apartment", void 0);
let LegalEntityDto = class LegalEntityDto {
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(100),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], LegalEntityDto.prototype, "legalForm", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(255),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], LegalEntityDto.prototype, "legalEntityName", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.Matches)(/^\d{8}$/, {
        message: "EDRPOU must be 8 digits"
    }),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], LegalEntityDto.prototype, "edrpou", void 0);
_ts_decorate([
    (0, _classvalidator.IsEnum)([
        "non_profit",
        "general",
        "simplified",
        "other"
    ]),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", typeof TaxSystem === "undefined" ? Object : TaxSystem)
], LegalEntityDto.prototype, "taxSystem", void 0);
let DirectorDto = class DirectorDto {
};
_ts_decorate([
    (0, _classvalidator.IsBoolean)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Boolean)
], DirectorDto.prototype, "sameAsUser", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(100),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], DirectorDto.prototype, "firstName", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(100),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], DirectorDto.prototype, "lastName", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(100),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], DirectorDto.prototype, "middleName", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(100),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], DirectorDto.prototype, "position", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(255),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], DirectorDto.prototype, "actingBasis", void 0);
let UpdateProfileDto = class UpdateProfileDto {
};
_ts_decorate([
    (0, _classvalidator.IsEnum)([
        "SELF_EMPLOYED",
        "FOP",
        "LEGAL_ENTITY"
    ]),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", typeof OrganizationType === "undefined" ? Object : OrganizationType)
], UpdateProfileDto.prototype, "organizationType", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MinLength)(2),
    (0, _classvalidator.MaxLength)(100),
    _ts_metadata("design:type", String)
], UpdateProfileDto.prototype, "firstName", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MinLength)(2),
    (0, _classvalidator.MaxLength)(100),
    _ts_metadata("design:type", String)
], UpdateProfileDto.prototype, "lastName", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(100),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], UpdateProfileDto.prototype, "patronymic", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(100),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], UpdateProfileDto.prototype, "middleName", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(20),
    (0, _classvalidator.Matches)(taxIdRegex, {
        message: "Tax ID must be 10 digits"
    }),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], UpdateProfileDto.prototype, "taxId", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(20),
    (0, _classvalidator.Matches)(phoneRegex, {
        message: "Phone must match +380XXXXXXXXX"
    }),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], UpdateProfileDto.prototype, "phonePrimary", void 0);
_ts_decorate([
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.ArrayMaxSize)(5),
    (0, _classvalidator.Matches)(phoneRegex, {
        each: true,
        message: "Secondary phone must match +380XXXXXXXXX"
    }),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Array)
], UpdateProfileDto.prototype, "phoneSecondary", void 0);
_ts_decorate([
    (0, _classvalidator.IsEmail)(),
    (0, _classvalidator.MaxLength)(255),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], UpdateProfileDto.prototype, "emailPrimary", void 0);
_ts_decorate([
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.ArrayMaxSize)(5),
    (0, _classvalidator.IsEmail)({}, {
        each: true
    }),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Array)
], UpdateProfileDto.prototype, "emailSecondary", void 0);
_ts_decorate([
    (0, _classvalidator.IsEnum)([
        "LAWYER",
        "ADVOCATE",
        "ADVOCATE_BPD"
    ]),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", typeof LegalStatus === "undefined" ? Object : LegalStatus)
], UpdateProfileDto.prototype, "legalStatus", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(100),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], UpdateProfileDto.prototype, "position", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(150),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], UpdateProfileDto.prototype, "bankName", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.Matches)(bankMfoRegex, {
        message: "Bank MFO must be 6 digits"
    }),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], UpdateProfileDto.prototype, "bankMfo", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.Matches)(ibanRegex, {
        message: "IBAN must match UA + 27 digits"
    }),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], UpdateProfileDto.prototype, "iban", void 0);
_ts_decorate([
    (0, _classvalidator.IsEnum)([
        "non_profit",
        "general",
        "simplified",
        "other"
    ]),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", typeof TaxSystem === "undefined" ? Object : TaxSystem)
], UpdateProfileDto.prototype, "taxSystem", void 0);
_ts_decorate([
    (0, _classvalidator.IsBoolean)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Boolean)
], UpdateProfileDto.prototype, "vatPayer", void 0);
_ts_decorate([
    (0, _classvalidator.ValidateNested)(),
    (0, _classtransformer.Type)(()=>AddressDto),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", typeof AddressDto === "undefined" ? Object : AddressDto)
], UpdateProfileDto.prototype, "legalAddress", void 0);
_ts_decorate([
    (0, _classvalidator.IsBoolean)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Boolean)
], UpdateProfileDto.prototype, "actualSameAsLegal", void 0);
_ts_decorate([
    (0, _classvalidator.ValidateNested)(),
    (0, _classtransformer.Type)(()=>AddressDto),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", typeof AddressDto === "undefined" ? Object : AddressDto)
], UpdateProfileDto.prototype, "actualAddress", void 0);
_ts_decorate([
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.ArrayMaxSize)(10),
    (0, _classvalidator.ValidateNested)({
        each: true
    }),
    (0, _classtransformer.Type)(()=>AddressDto),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Array)
], UpdateProfileDto.prototype, "additionalAddresses", void 0);
_ts_decorate([
    (0, _classvalidator.ValidateNested)(),
    (0, _classtransformer.Type)(()=>DirectorDto),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", typeof DirectorDto === "undefined" ? Object : DirectorDto)
], UpdateProfileDto.prototype, "director", void 0);
_ts_decorate([
    (0, _classvalidator.ValidateNested)(),
    (0, _classtransformer.Type)(()=>LegalEntityDto),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", typeof LegalEntityDto === "undefined" ? Object : LegalEntityDto)
], UpdateProfileDto.prototype, "legalEntity", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(100),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], UpdateProfileDto.prototype, "certificateNumber", void 0);
_ts_decorate([
    (0, _classvalidator.IsDateString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], UpdateProfileDto.prototype, "certificateDate", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(255),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], UpdateProfileDto.prototype, "issuedBy", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(100),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], UpdateProfileDto.prototype, "registryNumber", void 0);
_ts_decorate([
    (0, _classvalidator.IsDateString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], UpdateProfileDto.prototype, "registryDate", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(100),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], UpdateProfileDto.prototype, "contractNumber", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(255),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], UpdateProfileDto.prototype, "contractWith", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], UpdateProfileDto.prototype, "avatarUrl", void 0);
let ChangePasswordDto = class ChangePasswordDto {
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], ChangePasswordDto.prototype, "currentPassword", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MinLength)(8),
    (0, _classvalidator.MaxLength)(128),
    (0, _classvalidator.Matches)(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
        message: "Password must contain lowercase, uppercase and number"
    }),
    _ts_metadata("design:type", String)
], ChangePasswordDto.prototype, "newPassword", void 0);
let ProfileResponseDto = class ProfileResponseDto {
};

//# sourceMappingURL=profile.dto.js.map