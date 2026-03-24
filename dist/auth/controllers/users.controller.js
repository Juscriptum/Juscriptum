"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UsersController", {
    enumerable: true,
    get: function() {
        return UsersController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _guards = require("../guards");
const _accesscontroldecorators = require("../decorators/access-control.decorators");
const _subscriptionenum = require("../../database/entities/enums/subscription.enum");
const _usersservice = require("../services/users.service");
const _profiledto = require("../../users/dto/profile.dto");
const _usermanagementdto = require("../../users/dto/user-management.dto");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let UsersController = class UsersController {
    async getProfile(req) {
        return this.usersService.getProfile(req.user?.tenant_id, req.user?.user_id);
    }
    async updateProfile(req, dto) {
        return this.usersService.updateProfile(req.user?.tenant_id, req.user?.user_id, dto);
    }
    async changePassword(req, dto) {
        await this.usersService.changePassword(req.user?.tenant_id, req.user?.user_id, dto);
        return {
            success: true
        };
    }
    async listMembers(req) {
        return this.usersService.listMembers(req.user?.tenant_id);
    }
    async updateMember(req, memberId, dto) {
        return this.usersService.updateMember(req.user?.tenant_id, req.user?.user_id, memberId, dto);
    }
    async listInvitations(req) {
        return this.usersService.listInvitations(req.user?.tenant_id);
    }
    async createInvitation(req, dto) {
        return this.usersService.createInvitation(req.user?.tenant_id, req.user?.user_id, dto);
    }
    async revokeInvitation(req, invitationId) {
        return this.usersService.revokeInvitation(req.user?.tenant_id, req.user?.user_id, invitationId);
    }
    constructor(usersService){
        this.usersService = usersService;
    }
};
_ts_decorate([
    (0, _common.Get)("profile"),
    (0, _swagger.ApiOperation)({
        summary: "Get current user profile"
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof Request === "undefined" ? Object : Request
    ]),
    _ts_metadata("design:returntype", Promise)
], UsersController.prototype, "getProfile", null);
_ts_decorate([
    (0, _common.Put)("profile"),
    (0, _swagger.ApiOperation)({
        summary: "Update current user profile"
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof Request === "undefined" ? Object : Request,
        typeof _profiledto.UpdateProfileDto === "undefined" ? Object : _profiledto.UpdateProfileDto
    ]),
    _ts_metadata("design:returntype", Promise)
], UsersController.prototype, "updateProfile", null);
_ts_decorate([
    (0, _common.Put)("profile/password"),
    (0, _swagger.ApiOperation)({
        summary: "Change current user password"
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof Request === "undefined" ? Object : Request,
        typeof _profiledto.ChangePasswordDto === "undefined" ? Object : _profiledto.ChangePasswordDto
    ]),
    _ts_metadata("design:returntype", Promise)
], UsersController.prototype, "changePassword", null);
_ts_decorate([
    (0, _common.Get)("members"),
    (0, _common.UseGuards)(_guards.JwtAuthGuard, _guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN),
    (0, _swagger.ApiOperation)({
        summary: "List tenant members"
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof Request === "undefined" ? Object : Request
    ]),
    _ts_metadata("design:returntype", Promise)
], UsersController.prototype, "listMembers", null);
_ts_decorate([
    (0, _common.Patch)("members/:id"),
    (0, _common.UseGuards)(_guards.JwtAuthGuard, _guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN),
    (0, _swagger.ApiOperation)({
        summary: "Update tenant member role or status"
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)("id")),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof Request === "undefined" ? Object : Request,
        String,
        typeof _usermanagementdto.UpdateMemberDto === "undefined" ? Object : _usermanagementdto.UpdateMemberDto
    ]),
    _ts_metadata("design:returntype", Promise)
], UsersController.prototype, "updateMember", null);
_ts_decorate([
    (0, _common.Get)("invitations"),
    (0, _common.UseGuards)(_guards.JwtAuthGuard, _guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN),
    (0, _swagger.ApiOperation)({
        summary: "List tenant invitations"
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof Request === "undefined" ? Object : Request
    ]),
    _ts_metadata("design:returntype", Promise)
], UsersController.prototype, "listInvitations", null);
_ts_decorate([
    (0, _common.Post)("invitations"),
    (0, _common.UseGuards)(_guards.JwtAuthGuard, _guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN),
    (0, _swagger.ApiOperation)({
        summary: "Create tenant invitation"
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof Request === "undefined" ? Object : Request,
        typeof _usermanagementdto.CreateInvitationDto === "undefined" ? Object : _usermanagementdto.CreateInvitationDto
    ]),
    _ts_metadata("design:returntype", Promise)
], UsersController.prototype, "createInvitation", null);
_ts_decorate([
    (0, _common.Patch)("invitations/:id/revoke"),
    (0, _common.UseGuards)(_guards.JwtAuthGuard, _guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN),
    (0, _swagger.ApiOperation)({
        summary: "Revoke tenant invitation"
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)("id")),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof Request === "undefined" ? Object : Request,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], UsersController.prototype, "revokeInvitation", null);
UsersController = _ts_decorate([
    (0, _swagger.ApiTags)("Users"),
    (0, _swagger.ApiBearerAuth)(),
    (0, _common.Controller)("users"),
    (0, _common.UseGuards)(_guards.JwtAuthGuard),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _usersservice.UsersService === "undefined" ? Object : _usersservice.UsersService
    ])
], UsersController);

//# sourceMappingURL=users.controller.js.map