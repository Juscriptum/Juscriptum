"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PlatformAdminAuthController", {
    enumerable: true,
    get: function() {
        return PlatformAdminAuthController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _throttler = require("@nestjs/throttler");
const _platformadminlogindto = require("../dto/platform-admin-login.dto");
const _guards = require("../guards");
const _platformadminauthservice = require("../services/platform-admin-auth.service");
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
let PlatformAdminAuthController = class PlatformAdminAuthController {
    async getBootstrapStatus() {
        return this.platformAdminAuthService.getBootstrapStatus();
    }
    async bootstrap(dto, req) {
        return this.platformAdminAuthService.bootstrapFirstAdmin(dto, this.resolveIpAddress(req), this.resolveUserAgent(req));
    }
    async login(dto, req) {
        return this.platformAdminAuthService.login(dto, this.resolveIpAddress(req), this.resolveUserAgent(req));
    }
    async verifyMfa(dto, req) {
        return this.platformAdminAuthService.verifyMfa(dto, this.resolveIpAddress(req), this.resolveUserAgent(req));
    }
    async setupMfa(req) {
        return this.platformAdminAuthService.setupMfa(req.user?.admin_id);
    }
    async confirmMfa(req, dto) {
        return this.platformAdminAuthService.confirmMfa(req.user?.admin_id, dto, this.resolveIpAddress(req), this.resolveUserAgent(req));
    }
    async refresh(dto) {
        return this.platformAdminAuthService.refreshToken(dto);
    }
    async logout(req, dto) {
        const authorizationHeader = req.headers.authorization;
        const accessToken = authorizationHeader?.startsWith("Bearer ") ? authorizationHeader.slice("Bearer ".length) : undefined;
        await this.platformAdminAuthService.logout(req.user?.admin_id, accessToken, dto);
    }
    async getMe(req) {
        return this.platformAdminAuthService.getCurrentAdmin(req.user?.admin_id);
    }
    resolveIpAddress(req) {
        return req.ip || req.connection?.remoteAddress || "0.0.0.0";
    }
    resolveUserAgent(req) {
        return req.headers["user-agent"] ?? "unknown";
    }
    constructor(platformAdminAuthService){
        this.platformAdminAuthService = platformAdminAuthService;
    }
};
_ts_decorate([
    (0, _common.Get)("bootstrap-status"),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _swagger.ApiOperation)({
        summary: "Check whether the owner back office still needs first-admin bootstrap"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Bootstrap availability for the platform-admin surface",
        type: _platformadminlogindto.PlatformAdminBootstrapStatusDto
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], PlatformAdminAuthController.prototype, "getBootstrapStatus", null);
_ts_decorate([
    (0, _common.Post)("bootstrap"),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _throttler.Throttle)({
        default: {
            limit: 3,
            ttl: 60000
        }
    }),
    (0, _swagger.ApiOperation)({
        summary: "Create the very first platform-admin owner using a bootstrap token"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Returns the initial platform-admin session for the newly bootstrapped owner",
        type: _platformadminlogindto.PlatformAdminAuthResponseDto
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _platformadminlogindto.PlatformAdminBootstrapDto === "undefined" ? Object : _platformadminlogindto.PlatformAdminBootstrapDto,
        typeof Request === "undefined" ? Object : Request
    ]),
    _ts_metadata("design:returntype", Promise)
], PlatformAdminAuthController.prototype, "bootstrap", null);
_ts_decorate([
    (0, _common.Post)("login"),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _throttler.Throttle)({
        default: {
            limit: 5,
            ttl: 60000
        }
    }),
    (0, _swagger.ApiOperation)({
        summary: "Platform-admin primary login step"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Returns either MFA challenge or a ready platform-admin session",
        type: _platformadminlogindto.PlatformAdminAuthResponseDto
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _platformadminlogindto.PlatformAdminLoginDto === "undefined" ? Object : _platformadminlogindto.PlatformAdminLoginDto,
        typeof Request === "undefined" ? Object : Request
    ]),
    _ts_metadata("design:returntype", Promise)
], PlatformAdminAuthController.prototype, "login", null);
_ts_decorate([
    (0, _common.Post)("verify-mfa"),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _throttler.Throttle)({
        default: {
            limit: 10,
            ttl: 60000
        }
    }),
    (0, _swagger.ApiOperation)({
        summary: "Verify platform-admin MFA challenge"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Returns an authenticated platform-admin session",
        type: _platformadminlogindto.PlatformAdminAuthResponseDto
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _platformadminlogindto.PlatformAdminVerifyMfaDto === "undefined" ? Object : _platformadminlogindto.PlatformAdminVerifyMfaDto,
        typeof Request === "undefined" ? Object : Request
    ]),
    _ts_metadata("design:returntype", Promise)
], PlatformAdminAuthController.prototype, "verifyMfa", null);
_ts_decorate([
    (0, _common.Post)("mfa/setup"),
    (0, _common.UseGuards)(_guards.PlatformAdminJwtAuthGuard),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _swagger.ApiBearerAuth)(),
    (0, _throttler.Throttle)({
        default: {
            limit: 5,
            ttl: 60000
        }
    }),
    (0, _swagger.ApiOperation)({
        summary: "Generate a fresh MFA enrollment kit"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Provisioning data for TOTP enrollment",
        type: _platformadminlogindto.PlatformAdminMfaSetupResponseDto
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof Request === "undefined" ? Object : Request
    ]),
    _ts_metadata("design:returntype", Promise)
], PlatformAdminAuthController.prototype, "setupMfa", null);
_ts_decorate([
    (0, _common.Post)("mfa/confirm"),
    (0, _common.UseGuards)(_guards.PlatformAdminJwtAuthGuard),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _swagger.ApiBearerAuth)(),
    (0, _throttler.Throttle)({
        default: {
            limit: 10,
            ttl: 60000
        }
    }),
    (0, _swagger.ApiOperation)({
        summary: "Confirm MFA enrollment and rotate into an MFA session"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Returns a refreshed MFA-backed platform-admin session",
        type: _platformadminlogindto.PlatformAdminAuthResponseDto
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof Request === "undefined" ? Object : Request,
        typeof _platformadminlogindto.PlatformAdminConfirmMfaDto === "undefined" ? Object : _platformadminlogindto.PlatformAdminConfirmMfaDto
    ]),
    _ts_metadata("design:returntype", Promise)
], PlatformAdminAuthController.prototype, "confirmMfa", null);
_ts_decorate([
    (0, _common.Post)("refresh"),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _throttler.Throttle)({
        default: {
            limit: 10,
            ttl: 60000
        }
    }),
    (0, _swagger.ApiOperation)({
        summary: "Refresh platform-admin tokens"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Platform-admin token pair refreshed",
        type: _platformadminlogindto.PlatformAdminRefreshResponseDto
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _platformadminlogindto.PlatformAdminRefreshTokenDto === "undefined" ? Object : _platformadminlogindto.PlatformAdminRefreshTokenDto
    ]),
    _ts_metadata("design:returntype", Promise)
], PlatformAdminAuthController.prototype, "refresh", null);
_ts_decorate([
    (0, _common.Post)("logout"),
    (0, _common.UseGuards)(_guards.PlatformAdminJwtAuthGuard),
    (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT),
    (0, _swagger.ApiBearerAuth)(),
    (0, _swagger.ApiOperation)({
        summary: "Logout current platform-admin session"
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof Request === "undefined" ? Object : Request,
        typeof _platformadminlogindto.PlatformAdminLogoutDto === "undefined" ? Object : _platformadminlogindto.PlatformAdminLogoutDto
    ]),
    _ts_metadata("design:returntype", Promise)
], PlatformAdminAuthController.prototype, "logout", null);
_ts_decorate([
    (0, _common.Get)("me"),
    (0, _common.UseGuards)(_guards.PlatformAdminJwtAuthGuard),
    (0, _swagger.ApiBearerAuth)(),
    (0, _swagger.ApiOperation)({
        summary: "Get current platform-admin profile"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Platform-admin profile retrieved",
        type: _platformadminlogindto.PlatformAdminProfileDto
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof Request === "undefined" ? Object : Request
    ]),
    _ts_metadata("design:returntype", Promise)
], PlatformAdminAuthController.prototype, "getMe", null);
PlatformAdminAuthController = _ts_decorate([
    (0, _swagger.ApiTags)("Platform Admin Auth"),
    (0, _common.Controller)("platform-admin/auth"),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _platformadminauthservice.PlatformAdminAuthService === "undefined" ? Object : _platformadminauthservice.PlatformAdminAuthService
    ])
], PlatformAdminAuthController);

//# sourceMappingURL=platform-admin-auth.controller.js.map