"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "JwtService", {
    enumerable: true,
    get: function() {
        return JwtService;
    }
});
const _common = require("@nestjs/common");
const _jwt = require("@nestjs/jwt");
const _config = require("@nestjs/config");
const _jwtinterface = require("../interfaces/jwt.interface");
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
let JwtService = class JwtService {
    /**
   * Generate access token
   */ async generateAccessToken(payload) {
        const jwtPayload = {
            ...payload,
            jti: (0, _cryptoutil.generateUuid)()
        };
        return this.jwtService.sign(jwtPayload, {
            expiresIn: this.configService.get("JWT_ACCESS_TOKEN_EXPIRY", _jwtinterface.SecurityConfig.JWT_ACCESS_TOKEN_EXPIRY)
        });
    }
    /**
   * Generate refresh token
   */ async generateRefreshToken(payload) {
        return this.jwtService.sign(payload, {
            expiresIn: this.configService.get("JWT_REFRESH_TOKEN_EXPIRY", _jwtinterface.SecurityConfig.JWT_REFRESH_TOKEN_EXPIRY)
        });
    }
    /**
   * Verify access token
   */ async verifyAccessToken(token) {
        try {
            return this.jwtService.verify(token);
        } catch (error) {
            throw new _common.UnauthorizedException("Invalid or expired token");
        }
    }
    /**
   * Verify refresh token
   */ async verifyRefreshToken(token) {
        try {
            return this.jwtService.verify(token);
        } catch (error) {
            throw new _common.UnauthorizedException("Invalid or expired refresh token");
        }
    }
    /**
   * Decode token without verification (for JTI extraction)
   */ decodeToken(token) {
        try {
            return this.jwtService.decode(token);
        } catch (error) {
            return null;
        }
    }
    /**
   * Get token expiration time
   */ getTokenExpiry(token) {
        const decoded = this.decodeToken(token);
        return decoded?.exp || null;
    }
    /**
   * Check if token is expired
   */ isTokenExpired(token) {
        const decoded = this.decodeToken(token);
        if (!decoded || !decoded.exp) {
            return true;
        }
        return Date.now() >= decoded.exp * 1000;
    }
    /**
   * Get time until token expiration (in seconds)
   */ getTimeUntilExpiration(token) {
        const decoded = this.decodeToken(token);
        if (!decoded || !decoded.exp) {
            return null;
        }
        const expirationTime = decoded.exp * 1000;
        const remainingTime = Math.max(0, expirationTime - Date.now());
        return Math.floor(remainingTime / 1000);
    }
    constructor(jwtService, configService){
        this.jwtService = jwtService;
        this.configService = configService;
    }
};
JwtService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _jwt.JwtService === "undefined" ? Object : _jwt.JwtService,
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], JwtService);

//# sourceMappingURL=jwt.service.js.map