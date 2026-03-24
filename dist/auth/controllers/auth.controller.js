"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuthController", {
    enumerable: true,
    get: function() {
        return AuthController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _throttler = require("@nestjs/throttler");
const _authservice = require("../services/auth.service");
const _logindto = require("../dto/login.dto");
const _registerdto = require("../dto/register.dto");
const _refreshtokendto = require("../dto/refresh-token.dto");
const _forgotpassworddto = require("../dto/forgot-password.dto");
const _verifyemaildto = require("../dto/verify-email.dto");
const _guards = require("../guards");
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
let AuthController = class AuthController {
    async register(dto) {
        try {
            this.logger.log(`[REGISTER] Attempting registration for email: ${dto.email}`);
            const result = await this.authService.register(dto);
            this.logger.log(`[REGISTER] Registration successful for userId: ${result.user.id}`);
            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.stack || error.message : String(error);
            this.logger.error(`[REGISTER] Registration failed for email: ${dto.email}`, errorMessage);
            throw error;
        }
    }
    async login(dto, req) {
        const ipAddress = req.ip || req.connection?.remoteAddress || "0.0.0.0";
        const userAgent = req.headers["user-agent"] ?? "unknown";
        return this.authService.login(dto, ipAddress, userAgent);
    }
    async refreshToken(dto) {
        return this.authService.refreshToken(dto);
    }
    async logout(req, dto) {
        const userId = req.user?.user_id;
        const authorizationHeader = req.headers.authorization;
        const accessToken = authorizationHeader?.startsWith("Bearer ") ? authorizationHeader.slice("Bearer ".length) : undefined;
        await this.authService.logout(userId, accessToken, dto);
    }
    async logoutAll(req) {
        const userId = req.user?.user_id;
        await this.authService.logoutAllDevices(userId);
    }
    async forgotPassword(dto) {
        await this.authService.forgotPassword(dto);
    }
    async resetPassword(dto) {
        await this.authService.resetPassword(dto);
    }
    async verifyEmail(dto) {
        await this.authService.verifyEmail(dto);
    }
    async getMe(req) {
        return req.user;
    }
    constructor(authService){
        this.authService = authService;
        this.logger = new _common.Logger(AuthController.name);
    }
};
_ts_decorate([
    (0, _common.Post)("register"),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    (0, _throttler.Throttle)({
        default: {
            limit: 3,
            ttl: 3600000
        }
    }),
    (0, _swagger.ApiOperation)({
        summary: "Register new user (email + password only)"
    }),
    (0, _swagger.ApiResponse)({
        status: 201,
        description: "User registered successfully"
    }),
    (0, _swagger.ApiResponse)({
        status: 400,
        description: "Validation error"
    }),
    (0, _swagger.ApiResponse)({
        status: 409,
        description: "Email already exists"
    }),
    (0, _swagger.ApiResponse)({
        status: 429,
        description: "Too many registration attempts"
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _registerdto.RegisterDto === "undefined" ? Object : _registerdto.RegisterDto
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
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
        summary: "Login user"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Login successful",
        type: _logindto.LoginResponseDto
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: "Invalid credentials"
    }),
    (0, _swagger.ApiResponse)({
        status: 429,
        description: "Too many login attempts"
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _logindto.LoginDto === "undefined" ? Object : _logindto.LoginDto,
        typeof Request === "undefined" ? Object : Request
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
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
        summary: "Refresh access token"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Token refreshed",
        type: _refreshtokendto.RefreshTokenResponseDto
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: "Invalid refresh token"
    }),
    (0, _swagger.ApiResponse)({
        status: 429,
        description: "Too many refresh attempts"
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _refreshtokendto.RefreshTokenDto === "undefined" ? Object : _refreshtokendto.RefreshTokenDto
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "refreshToken", null);
_ts_decorate([
    (0, _common.Post)("logout"),
    (0, _common.UseGuards)(_guards.JwtAuthGuard),
    (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT),
    (0, _swagger.ApiBearerAuth)(),
    (0, _swagger.ApiOperation)({
        summary: "Logout user"
    }),
    (0, _swagger.ApiResponse)({
        status: 204,
        description: "Logout successful"
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof Request === "undefined" ? Object : Request,
        typeof _refreshtokendto.LogoutDto === "undefined" ? Object : _refreshtokendto.LogoutDto
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
_ts_decorate([
    (0, _common.Post)("logout-all"),
    (0, _common.UseGuards)(_guards.JwtAuthGuard),
    (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT),
    (0, _swagger.ApiBearerAuth)(),
    (0, _swagger.ApiOperation)({
        summary: "Logout from all devices"
    }),
    (0, _swagger.ApiResponse)({
        status: 204,
        description: "Logged out from all devices"
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof Request === "undefined" ? Object : Request
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "logoutAll", null);
_ts_decorate([
    (0, _common.Post)("forgot-password"),
    (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT),
    (0, _throttler.Throttle)({
        default: {
            limit: 3,
            ttl: 3600000
        }
    }),
    (0, _swagger.ApiOperation)({
        summary: "Request password reset"
    }),
    (0, _swagger.ApiResponse)({
        status: 204,
        description: "Password reset email sent"
    }),
    (0, _swagger.ApiResponse)({
        status: 429,
        description: "Too many password reset attempts"
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _forgotpassworddto.ForgotPasswordDto === "undefined" ? Object : _forgotpassworddto.ForgotPasswordDto
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
_ts_decorate([
    (0, _common.Post)("reset-password"),
    (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT),
    (0, _throttler.Throttle)({
        default: {
            limit: 5,
            ttl: 3600000
        }
    }),
    (0, _swagger.ApiOperation)({
        summary: "Reset password with token"
    }),
    (0, _swagger.ApiResponse)({
        status: 204,
        description: "Password reset successful"
    }),
    (0, _swagger.ApiResponse)({
        status: 400,
        description: "Invalid or expired token"
    }),
    (0, _swagger.ApiResponse)({
        status: 429,
        description: "Too many reset attempts"
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _forgotpassworddto.ResetPasswordDto === "undefined" ? Object : _forgotpassworddto.ResetPasswordDto
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
_ts_decorate([
    (0, _common.Post)("verify-email"),
    (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT),
    (0, _swagger.ApiOperation)({
        summary: "Verify email address"
    }),
    (0, _swagger.ApiResponse)({
        status: 204,
        description: "Email verified successfully"
    }),
    (0, _swagger.ApiResponse)({
        status: 400,
        description: "Invalid or expired token"
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _verifyemaildto.VerifyEmailDto === "undefined" ? Object : _verifyemaildto.VerifyEmailDto
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "verifyEmail", null);
_ts_decorate([
    (0, _common.Get)("me"),
    (0, _common.UseGuards)(_guards.JwtAuthGuard),
    (0, _swagger.ApiBearerAuth)(),
    (0, _swagger.ApiOperation)({
        summary: "Get current user info"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "User info retrieved"
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof Request === "undefined" ? Object : Request
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "getMe", null);
AuthController = _ts_decorate([
    (0, _swagger.ApiTags)("Authentication"),
    (0, _common.Controller)("auth"),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _authservice.AuthService === "undefined" ? Object : _authservice.AuthService
    ])
], AuthController);

//# sourceMappingURL=auth.controller.js.map