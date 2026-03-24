"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PlatformAdminJwtService", {
    enumerable: true,
    get: function() {
        return PlatformAdminJwtService;
    }
});
const _common = require("@nestjs/common");
const _jwt = require("@nestjs/jwt");
const _config = require("@nestjs/config");
const _cryptoutil = require("../../common/utils/crypto.util");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let PlatformAdminJwtService = class PlatformAdminJwtService {
    async generateAccessToken(payload) {
        return this.jwtService.signAsync({
            ...payload,
            scope: "platform_admin",
            token_type: "access",
            jti: (0, _cryptoutil.generateUuid)()
        });
    }
    async generateRefreshToken(payload) {
        return this.jwtService.signAsync({
            ...payload,
            scope: "platform_admin",
            token_type: "refresh"
        }, {
            expiresIn: this.configService.get("PLATFORM_ADMIN_JWT_REFRESH_TOKEN_EXPIRY", "7d")
        });
    }
    async generateMfaToken(payload) {
        return this.jwtService.signAsync({
            ...payload,
            scope: "platform_admin",
            token_type: "mfa"
        }, {
            expiresIn: this.configService.get("PLATFORM_ADMIN_JWT_MFA_TOKEN_EXPIRY", "5m")
        });
    }
    async verifyAccessToken(token) {
        const payload = await this.verifyToken(token);
        if (payload.scope !== "platform_admin" || payload.token_type !== "access" || !payload.admin_id) {
            throw new _common.UnauthorizedException("Invalid platform admin access token");
        }
        return payload;
    }
    async verifyRefreshToken(token) {
        const payload = await this.verifyToken(token);
        if (payload.scope !== "platform_admin" || payload.token_type !== "refresh" || !payload.admin_id) {
            throw new _common.UnauthorizedException("Invalid platform admin refresh token");
        }
        return payload;
    }
    async verifyMfaToken(token) {
        const payload = await this.verifyToken(token);
        if (payload.scope !== "platform_admin" || payload.token_type !== "mfa" || !payload.admin_id) {
            throw new _common.UnauthorizedException("Invalid platform admin MFA token");
        }
        return payload;
    }
    decodeToken(token) {
        try {
            return this.jwtService.decode(token);
        } catch  {
            return null;
        }
    }
    getAccessTokenExpiresInSeconds() {
        return this.parseDuration(this.configService.get("PLATFORM_ADMIN_JWT_ACCESS_TOKEN_EXPIRY"), 15 * 60);
    }
    getMfaTokenExpiresInSeconds() {
        return this.parseDuration(this.configService.get("PLATFORM_ADMIN_JWT_MFA_TOKEN_EXPIRY"), 5 * 60);
    }
    async verifyToken(token) {
        try {
            return await this.jwtService.verifyAsync(token);
        } catch  {
            throw new _common.UnauthorizedException("Invalid or expired platform admin token");
        }
    }
    parseDuration(value, fallback) {
        if (!value) {
            return fallback;
        }
        const normalized = value.trim().toLowerCase();
        const match = normalized.match(/^(\d+)([smhd])$/);
        if (!match) {
            const asNumber = Number(normalized);
            return Number.isFinite(asNumber) && asNumber > 0 ? asNumber : fallback;
        }
        const amount = Number(match[1]);
        const unit = match[2];
        switch(unit){
            case "s":
                return amount;
            case "m":
                return amount * 60;
            case "h":
                return amount * 60 * 60;
            case "d":
                return amount * 60 * 60 * 24;
            default:
                return fallback;
        }
    }
    constructor(jwtService, configService){
        this.jwtService = jwtService;
        this.configService = configService;
    }
};
PlatformAdminJwtService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _jwt.JwtService === "undefined" ? Object : _jwt.JwtService,
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], PlatformAdminJwtService);

//# sourceMappingURL=platform-admin-jwt.service.js.map