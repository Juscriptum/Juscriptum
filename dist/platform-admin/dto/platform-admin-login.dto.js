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
    get PlatformAdminAuthResponseDto () {
        return PlatformAdminAuthResponseDto;
    },
    get PlatformAdminBootstrapDto () {
        return PlatformAdminBootstrapDto;
    },
    get PlatformAdminBootstrapStatusDto () {
        return PlatformAdminBootstrapStatusDto;
    },
    get PlatformAdminConfirmMfaDto () {
        return PlatformAdminConfirmMfaDto;
    },
    get PlatformAdminLoginDto () {
        return PlatformAdminLoginDto;
    },
    get PlatformAdminLogoutDto () {
        return PlatformAdminLogoutDto;
    },
    get PlatformAdminMfaSetupResponseDto () {
        return PlatformAdminMfaSetupResponseDto;
    },
    get PlatformAdminProfileDto () {
        return PlatformAdminProfileDto;
    },
    get PlatformAdminRefreshResponseDto () {
        return PlatformAdminRefreshResponseDto;
    },
    get PlatformAdminRefreshTokenDto () {
        return PlatformAdminRefreshTokenDto;
    },
    get PlatformAdminVerifyMfaDto () {
        return PlatformAdminVerifyMfaDto;
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
let PlatformAdminBootstrapStatusDto = class PlatformAdminBootstrapStatusDto {
};
let PlatformAdminBootstrapDto = class PlatformAdminBootstrapDto {
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MinLength)(24),
    (0, _classvalidator.MaxLength)(512),
    _ts_metadata("design:type", String)
], PlatformAdminBootstrapDto.prototype, "bootstrapToken", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MinLength)(2),
    (0, _classvalidator.MaxLength)(100),
    _ts_metadata("design:type", String)
], PlatformAdminBootstrapDto.prototype, "firstName", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MinLength)(2),
    (0, _classvalidator.MaxLength)(100),
    _ts_metadata("design:type", String)
], PlatformAdminBootstrapDto.prototype, "lastName", void 0);
_ts_decorate([
    (0, _classvalidator.IsEmail)(),
    _ts_metadata("design:type", String)
], PlatformAdminBootstrapDto.prototype, "email", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MinLength)(12),
    (0, _classvalidator.MaxLength)(128),
    _ts_metadata("design:type", String)
], PlatformAdminBootstrapDto.prototype, "password", void 0);
let PlatformAdminLoginDto = class PlatformAdminLoginDto {
};
_ts_decorate([
    (0, _classvalidator.IsEmail)(),
    _ts_metadata("design:type", String)
], PlatformAdminLoginDto.prototype, "email", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MinLength)(8),
    (0, _classvalidator.MaxLength)(128),
    _ts_metadata("design:type", String)
], PlatformAdminLoginDto.prototype, "password", void 0);
let PlatformAdminVerifyMfaDto = class PlatformAdminVerifyMfaDto {
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], PlatformAdminVerifyMfaDto.prototype, "mfaToken", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(32),
    _ts_metadata("design:type", String)
], PlatformAdminVerifyMfaDto.prototype, "code", void 0);
let PlatformAdminRefreshTokenDto = class PlatformAdminRefreshTokenDto {
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], PlatformAdminRefreshTokenDto.prototype, "refreshToken", void 0);
let PlatformAdminLogoutDto = class PlatformAdminLogoutDto {
};
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(4096),
    _ts_metadata("design:type", String)
], PlatformAdminLogoutDto.prototype, "mfaReason", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], PlatformAdminLogoutDto.prototype, "refreshToken", void 0);
let PlatformAdminMfaSetupResponseDto = class PlatformAdminMfaSetupResponseDto {
};
let PlatformAdminConfirmMfaDto = class PlatformAdminConfirmMfaDto {
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(32),
    _ts_metadata("design:type", String)
], PlatformAdminConfirmMfaDto.prototype, "code", void 0);
let PlatformAdminProfileDto = class PlatformAdminProfileDto {
};
let PlatformAdminAuthResponseDto = class PlatformAdminAuthResponseDto {
};
let PlatformAdminRefreshResponseDto = class PlatformAdminRefreshResponseDto {
};

//# sourceMappingURL=platform-admin-login.dto.js.map