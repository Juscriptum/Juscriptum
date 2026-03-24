"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "JwtStrategy", {
    enumerable: true,
    get: function() {
        return JwtStrategy;
    }
});
const _common = require("@nestjs/common");
const _passport = require("@nestjs/passport");
const _passportjwt = require("passport-jwt");
const _config = require("@nestjs/config");
const _Userentity = require("../../database/entities/User.entity");
const _RevokedAccessTokenentity = require("../../database/entities/RevokedAccessToken.entity");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
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
let JwtStrategy = class JwtStrategy extends (0, _passport.PassportStrategy)(_passportjwt.Strategy, "jwt") {
    async validate(payload) {
        if (payload.jti) {
            const revokedToken = await this.revokedAccessTokenRepository.findOne({
                where: {
                    jti: payload.jti
                }
            });
            if (revokedToken) {
                throw new _common.UnauthorizedException("Access token has been revoked");
            }
        }
        // Verify user still exists and is active
        const user = await this.userRepository.findOne({
            where: {
                id: payload.user_id,
                tenantId: payload.tenant_id,
                deletedAt: (0, _typeorm1.IsNull)()
            },
            relations: [
                "organization"
            ]
        });
        if (!user) {
            throw new _common.UnauthorizedException("User not found");
        }
        if (user.status !== "active") {
            throw new _common.UnauthorizedException("User account is not active");
        }
        if (!user.organization) {
            throw new _common.UnauthorizedException("User organization not found");
        }
        if (user.organization.status && user.organization.status !== "active") {
            throw new _common.UnauthorizedException("User organization is not active");
        }
        if (user.lastPasswordChangeAt && payload.iat && payload.iat * 1000 < user.lastPasswordChangeAt.getTime()) {
            throw new _common.UnauthorizedException("Access token is no longer valid after password change");
        }
        if (user.sessionInvalidBefore && payload.iat && payload.iat * 1000 < user.sessionInvalidBefore.getTime()) {
            throw new _common.UnauthorizedException("Access token is no longer valid after session invalidation");
        }
        return {
            user_id: payload.user_id,
            tenant_id: payload.tenant_id,
            role: user.role,
            subscription_plan: user.organization.subscriptionPlan,
            email: user.email
        };
    }
    constructor(configService, userRepository, revokedAccessTokenRepository){
        super({
            jwtFromRequest: _passportjwt.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get("JWT_SECRET")
        }), this.userRepository = userRepository, this.revokedAccessTokenRepository = revokedAccessTokenRepository;
    }
};
JwtStrategy = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(1, (0, _typeorm.InjectRepository)(_Userentity.User)),
    _ts_param(2, (0, _typeorm.InjectRepository)(_RevokedAccessTokenentity.RevokedAccessToken)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository
    ])
], JwtStrategy);

//# sourceMappingURL=jwt.strategy.js.map