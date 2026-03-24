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
    get CreateInvitationDto () {
        return CreateInvitationDto;
    },
    get InvitationResponseDto () {
        return InvitationResponseDto;
    },
    get TeamMemberResponseDto () {
        return TeamMemberResponseDto;
    },
    get UpdateMemberDto () {
        return UpdateMemberDto;
    }
});
const _classvalidator = require("class-validator");
const _subscriptionenum = require("../../database/entities/enums/subscription.enum");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let CreateInvitationDto = class CreateInvitationDto {
};
_ts_decorate([
    (0, _classvalidator.IsEmail)(),
    _ts_metadata("design:type", String)
], CreateInvitationDto.prototype, "email", void 0);
_ts_decorate([
    (0, _classvalidator.IsEnum)(_subscriptionenum.UserRole),
    _ts_metadata("design:type", typeof _subscriptionenum.UserRole === "undefined" ? Object : _subscriptionenum.UserRole)
], CreateInvitationDto.prototype, "role", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.MaxLength)(500),
    _ts_metadata("design:type", String)
], CreateInvitationDto.prototype, "message", void 0);
let UpdateMemberDto = class UpdateMemberDto {
};
_ts_decorate([
    (0, _classvalidator.IsEnum)(_subscriptionenum.UserRole),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", typeof _subscriptionenum.UserRole === "undefined" ? Object : _subscriptionenum.UserRole)
], UpdateMemberDto.prototype, "role", void 0);
_ts_decorate([
    (0, _classvalidator.IsEnum)(_subscriptionenum.UserStatus),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", typeof _subscriptionenum.UserStatus === "undefined" ? Object : _subscriptionenum.UserStatus)
], UpdateMemberDto.prototype, "status", void 0);
let TeamMemberResponseDto = class TeamMemberResponseDto {
};
let InvitationResponseDto = class InvitationResponseDto {
};

//# sourceMappingURL=user-management.dto.js.map