"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RefreshStrategy", {
    enumerable: true,
    get: function() {
        return RefreshStrategy;
    }
});
const _common = require("@nestjs/common");
const _passport = require("@nestjs/passport");
const _passportjwt = require("passport-jwt");
const _config = require("@nestjs/config");
const _RefreshTokenentity = require("../../database/entities/RefreshToken.entity");
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
let RefreshStrategy = class RefreshStrategy extends (0, _passport.PassportStrategy)(_passportjwt.Strategy, "refresh") {
    async validate(payload) {
        // Find refresh token in database
        const refreshToken = await this.refreshTokenRepository.findOne({
            where: {
                token: payload.token_id
            }
        });
        if (!refreshToken) {
            throw new _common.UnauthorizedException("Refresh token not found");
        }
        if (refreshToken.revokedAt) {
            throw new _common.UnauthorizedException("Refresh token revoked");
        }
        if (refreshToken.expiresAt < new Date()) {
            throw new _common.UnauthorizedException("Refresh token expired");
        }
        return {
            user_id: payload.user_id,
            tenant_id: payload.tenant_id,
            token_id: payload.token_id,
            device_id: payload.device_id
        };
    }
    constructor(configService, refreshTokenRepository){
        super({
            jwtFromRequest: _passportjwt.ExtractJwt.fromBodyField("refreshToken"),
            ignoreExpiration: false,
            secretOrKey: configService.get("JWT_REFRESH_SECRET")
        }), this.refreshTokenRepository = refreshTokenRepository;
    }
};
RefreshStrategy = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(1, (0, _typeorm.InjectRepository)(_RefreshTokenentity.RefreshToken)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository
    ])
], RefreshStrategy);

//# sourceMappingURL=refresh.strategy.js.map