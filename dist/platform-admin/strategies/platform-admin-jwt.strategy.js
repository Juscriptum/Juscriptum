"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PlatformAdminJwtStrategy", {
    enumerable: true,
    get: function() {
        return PlatformAdminJwtStrategy;
    }
});
const _common = require("@nestjs/common");
const _passport = require("@nestjs/passport");
const _passportjwt = require("passport-jwt");
const _config = require("@nestjs/config");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _PlatformAdminUserentity = require("../../database/entities/PlatformAdminUser.entity");
const _PlatformAdminRevokedAccessTokenentity = require("../../database/entities/PlatformAdminRevokedAccessToken.entity");
const _platformadminenum = require("../../database/entities/enums/platform-admin.enum");
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
let PlatformAdminJwtStrategy = class PlatformAdminJwtStrategy extends (0, _passport.PassportStrategy)(_passportjwt.Strategy, "platform-admin-jwt") {
    async validate(payload) {
        if (payload.scope !== "platform_admin" || payload.token_type !== "access" || !payload.admin_id) {
            throw new _common.UnauthorizedException("Invalid platform admin token");
        }
        if (payload.jti) {
            const revokedToken = await this.revokedAccessTokenRepository.findOne({
                where: {
                    jti: payload.jti
                }
            });
            if (revokedToken) {
                throw new _common.UnauthorizedException("Platform admin access token has been revoked");
            }
        }
        const admin = await this.platformAdminUserRepository.findOne({
            where: {
                id: payload.admin_id
            }
        });
        if (!admin) {
            throw new _common.UnauthorizedException("Platform admin user not found");
        }
        if (admin.status !== _platformadminenum.PlatformAdminStatus.ACTIVE) {
            throw new _common.UnauthorizedException("Platform admin user is not active");
        }
        if (admin.lastPasswordChangeAt && payload.iat && payload.iat * 1000 < admin.lastPasswordChangeAt.getTime()) {
            throw new _common.UnauthorizedException("Platform admin access token is no longer valid after password change");
        }
        if (admin.sessionInvalidBefore && payload.iat && payload.iat * 1000 < admin.sessionInvalidBefore.getTime()) {
            throw new _common.UnauthorizedException("Platform admin access token is no longer valid after session invalidation");
        }
        return {
            admin_id: admin.id,
            email: admin.email,
            role: admin.role,
            permissions: admin.permissions || [],
            scope: "platform_admin",
            token_type: "access",
            mfa_level: payload.mfa_level,
            jti: payload.jti,
            iat: payload.iat,
            exp: payload.exp
        };
    }
    constructor(configService, platformAdminUserRepository, revokedAccessTokenRepository){
        super({
            jwtFromRequest: _passportjwt.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get("PLATFORM_ADMIN_JWT_SECRET") || "platform-admin-dev-only-secret-not-for-production"
        }), this.platformAdminUserRepository = platformAdminUserRepository, this.revokedAccessTokenRepository = revokedAccessTokenRepository;
    }
};
PlatformAdminJwtStrategy = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(1, (0, _typeorm.InjectRepository)(_PlatformAdminUserentity.PlatformAdminUser)),
    _ts_param(2, (0, _typeorm.InjectRepository)(_PlatformAdminRevokedAccessTokenentity.PlatformAdminRevokedAccessToken)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository
    ])
], PlatformAdminJwtStrategy);

//# sourceMappingURL=platform-admin-jwt.strategy.js.map