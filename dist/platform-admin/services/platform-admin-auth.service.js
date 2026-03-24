"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PlatformAdminAuthService", {
    enumerable: true,
    get: function() {
        return PlatformAdminAuthService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _config = require("@nestjs/config");
const _logging = require("../../common/logging");
const _cryptoutil = require("../../common/utils/crypto.util");
const _piiprotection = require("../../common/security/pii-protection");
const _PlatformAdminUserentity = require("../../database/entities/PlatformAdminUser.entity");
const _PlatformAdminRefreshTokenentity = require("../../database/entities/PlatformAdminRefreshToken.entity");
const _PlatformAdminRevokedAccessTokenentity = require("../../database/entities/PlatformAdminRevokedAccessToken.entity");
const _platformadminenum = require("../../database/entities/enums/platform-admin.enum");
const _platformadminjwtservice = require("./platform-admin-jwt.service");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
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
const DEFAULT_PLATFORM_OWNER_PERMISSIONS = [
    "dashboard.read",
    "organizations.read",
    "organizations.write",
    "billing.read",
    "billing.write",
    "security.read",
    "security.write",
    "ops.read",
    "audit.read",
    "auth.manage"
];
let PlatformAdminAuthService = class PlatformAdminAuthService {
    async getBootstrapStatus() {
        const adminCount = await this.platformAdminUserRepository.count();
        const bootstrapEnabled = Boolean(this.getBootstrapToken());
        return {
            bootstrapRequired: adminCount === 0,
            bootstrapEnabled,
            hasPlatformAdmins: adminCount > 0
        };
    }
    async bootstrapFirstAdmin(dto, ipAddress, userAgent) {
        const bootstrapToken = this.getBootstrapToken();
        if (!bootstrapToken) {
            throw new _common.ForbiddenException("Platform admin bootstrap is not enabled on this environment");
        }
        if (dto.bootstrapToken.trim() !== bootstrapToken) {
            this.loggingService.logSecurityEvent("platform_admin_bootstrap_denied", "high", {
                ipAddress,
                userAgent,
                reason: "invalid_bootstrap_token"
            });
            throw new _common.ForbiddenException("Invalid platform admin bootstrap token");
        }
        const adminCount = await this.platformAdminUserRepository.count();
        if (adminCount > 0) {
            throw new _common.ConflictException("Platform admin bootstrap has already been completed");
        }
        const normalizedEmail = dto.email.trim().toLowerCase();
        const emailBlindIndex = (0, _piiprotection.computePlatformAdminEmailBlindIndex)(normalizedEmail);
        if (!emailBlindIndex) {
            throw new _common.ConflictException("Unable to prepare platform admin email");
        }
        const existingAdmin = await this.platformAdminUserRepository.findOne({
            where: {
                emailBlindIndex
            }
        });
        if (existingAdmin) {
            throw new _common.ConflictException("A platform admin with this email already exists");
        }
        const salt = await (0, _cryptoutil.generateSalt)();
        const passwordHash = await (0, _cryptoutil.hashPassword)(dto.password, salt);
        const savedAdmin = await this.platformAdminUserRepository.save({
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
            email: normalizedEmail,
            emailBlindIndex,
            passwordHash,
            salt,
            role: _platformadminenum.PlatformAdminRole.PLATFORM_OWNER,
            status: _platformadminenum.PlatformAdminStatus.ACTIVE,
            permissions: [
                ...DEFAULT_PLATFORM_OWNER_PERMISSIONS
            ],
            mfaEnabled: false,
            failedLoginAttempts: 0,
            lastPasswordChangeAt: new Date(),
            metadata: {
                bootstrapCreatedAt: new Date().toISOString(),
                bootstrapIpAddress: ipAddress
            }
        });
        this.loggingService.logSecurityEvent("platform_admin_bootstrap_completed", "high", {
            adminId: savedAdmin.id,
            email: normalizedEmail,
            ipAddress,
            userAgent
        });
        return this.issueSession(savedAdmin, ipAddress, userAgent, "password");
    }
    async login(dto, ipAddress, userAgent) {
        const normalizedEmail = dto.email.trim().toLowerCase();
        const emailBlindIndex = (0, _piiprotection.computePlatformAdminEmailBlindIndex)(normalizedEmail);
        const admin = emailBlindIndex ? await this.platformAdminUserRepository.findOne({
            where: {
                emailBlindIndex
            }
        }) : null;
        if (!admin) {
            this.loggingService.logAuthEvent("login_failed", {
                authScope: "platform_admin",
                email: normalizedEmail,
                ipAddress,
                userAgent
            });
            throw new _common.UnauthorizedException("Невірний email або пароль");
        }
        this.assertAdminCanAuthenticate(admin, ipAddress, userAgent);
        const validPassword = await (0, _cryptoutil.verifyPassword)(dto.password, admin.salt, admin.passwordHash);
        if (!validPassword) {
            await this.handleFailedPassword(admin, ipAddress, userAgent);
            throw new _common.UnauthorizedException("Невірний email або пароль");
        }
        if (admin.mfaEnabled) {
            const mfaToken = await this.platformAdminJwtService.generateMfaToken({
                admin_id: admin.id,
                email: admin.email
            });
            this.loggingService.logAuthEvent("mfa_required", {
                authScope: "platform_admin",
                adminId: admin.id,
                ipAddress,
                userAgent
            });
            return {
                mfaRequired: true,
                mfaToken,
                mfaTokenExpiresIn: this.platformAdminJwtService.getMfaTokenExpiresInSeconds()
            };
        }
        return this.issueSession(admin, ipAddress, userAgent, "password");
    }
    async verifyMfa(dto, ipAddress, userAgent) {
        const payload = await this.platformAdminJwtService.verifyMfaToken(dto.mfaToken);
        const admin = await this.platformAdminUserRepository.findOne({
            where: {
                id: payload.admin_id
            }
        });
        if (!admin) {
            throw new _common.UnauthorizedException("Platform admin user not found");
        }
        this.assertAdminCanAuthenticate(admin, ipAddress, userAgent);
        if (!admin.mfaEnabled) {
            throw new _common.UnauthorizedException("MFA is not enabled for this account");
        }
        const mfaValid = await this.verifyMfaCode(admin, dto.code);
        if (!mfaValid) {
            this.loggingService.logSecurityEvent("platform_admin_mfa_failed", "high", {
                adminId: admin.id,
                ipAddress,
                userAgent
            });
            throw new _common.UnauthorizedException("Невірний MFA код");
        }
        this.loggingService.logAuthEvent("mfa_verified", {
            authScope: "platform_admin",
            adminId: admin.id,
            ipAddress,
            userAgent
        });
        return this.issueSession(admin, ipAddress, userAgent, "mfa");
    }
    async setupMfa(adminId) {
        const admin = await this.platformAdminUserRepository.findOne({
            where: {
                id: adminId
            }
        });
        if (!admin) {
            throw new _common.UnauthorizedException("Platform admin user not found");
        }
        if (admin.mfaEnabled) {
            throw new _common.ConflictException("MFA is already enabled for this account");
        }
        const secret = (0, _cryptoutil.generateTotpSecret)();
        const backupCodes = (0, _cryptoutil.generateMfaBackupCodes)();
        const issuer = this.configService.get("PLATFORM_ADMIN_MFA_ISSUER", "Law Organizer Platform Admin");
        const label = admin.email;
        const otpauthUrl = await this.generateOtpAuthUrl(secret, issuer, label);
        const qrCodeDataUrl = await this.generateQrCodeDataUrl(otpauthUrl);
        await this.platformAdminUserRepository.update(admin.id, {
            mfaSecret: secret,
            mfaBackupCodes: backupCodes,
            metadata: {
                ...admin.metadata || {},
                mfaSetupIssuedAt: new Date().toISOString()
            }
        });
        this.loggingService.logSecurityEvent("platform_admin_mfa_setup_started", "medium", {
            adminId: admin.id
        });
        return {
            issuer,
            label,
            secret,
            otpauthUrl,
            qrCodeDataUrl,
            backupCodes
        };
    }
    async confirmMfa(adminId, dto, ipAddress, userAgent) {
        const admin = await this.platformAdminUserRepository.findOne({
            where: {
                id: adminId
            }
        });
        if (!admin) {
            throw new _common.UnauthorizedException("Platform admin user not found");
        }
        if (admin.mfaEnabled) {
            throw new _common.ConflictException("MFA is already enabled for this account");
        }
        if (!admin.mfaSecret) {
            throw new _common.ConflictException("MFA setup must be started before confirmation");
        }
        const validCode = await this.validateTotpCode(admin.mfaSecret, dto.code);
        if (!validCode) {
            this.loggingService.logSecurityEvent("platform_admin_mfa_setup_failed", "high", {
                adminId,
                ipAddress,
                userAgent
            });
            throw new _common.UnauthorizedException("Невірний MFA код");
        }
        await this.platformAdminUserRepository.update(admin.id, {
            mfaEnabled: true,
            metadata: {
                ...admin.metadata || {},
                mfaSetupConfirmedAt: new Date().toISOString()
            }
        });
        await this.revokeAllSessions(admin.id, "platform_admin_mfa_enabled");
        this.loggingService.logSecurityEvent("platform_admin_mfa_enabled", "high", {
            adminId: admin.id,
            ipAddress,
            userAgent
        });
        const freshAdmin = await this.platformAdminUserRepository.findOne({
            where: {
                id: admin.id
            }
        });
        if (!freshAdmin) {
            throw new _common.UnauthorizedException("Platform admin user not found");
        }
        return this.issueSession(freshAdmin, ipAddress, userAgent, "mfa");
    }
    async refreshToken(dto) {
        const payload = await this.platformAdminJwtService.verifyRefreshToken(dto.refreshToken);
        const refreshTokenEntity = await this.platformAdminRefreshTokenRepository.findOne({
            where: {
                token: dto.refreshToken
            }
        });
        if (!refreshTokenEntity) {
            this.loggingService.logSecurityEvent("platform_admin_invalid_refresh_token", "medium", {
                adminId: payload.admin_id
            });
            throw new _common.UnauthorizedException("Invalid refresh token");
        }
        if (refreshTokenEntity.revokedAt) {
            throw new _common.UnauthorizedException("Refresh token revoked");
        }
        if (refreshTokenEntity.expiresAt < new Date()) {
            throw new _common.UnauthorizedException("Refresh token expired");
        }
        const admin = await this.platformAdminUserRepository.findOne({
            where: {
                id: payload.admin_id
            }
        });
        if (!admin || admin.status !== _platformadminenum.PlatformAdminStatus.ACTIVE) {
            throw new _common.UnauthorizedException("Platform admin user is not active");
        }
        const deviceId = payload.device_id;
        const accessToken = await this.platformAdminJwtService.generateAccessToken({
            admin_id: admin.id,
            email: admin.email,
            role: admin.role,
            permissions: admin.permissions || [],
            mfa_level: admin.mfaEnabled ? "mfa" : "password"
        });
        const refreshToken = await this.platformAdminJwtService.generateRefreshToken({
            admin_id: admin.id,
            token_id: (0, _cryptoutil.generateUuid)(),
            device_id: deviceId
        });
        await this.platformAdminRefreshTokenRepository.update({
            id: refreshTokenEntity.id
        }, {
            revokedAt: new Date()
        });
        await this.platformAdminRefreshTokenRepository.save({
            platformAdminUserId: admin.id,
            token: refreshToken,
            deviceInfo: refreshTokenEntity.deviceInfo,
            ipAddress: refreshTokenEntity.ipAddress,
            userAgent: refreshTokenEntity.userAgent,
            expiresAt: this.getRefreshTokenExpiryDate(),
            replacedBy: refreshTokenEntity.id
        });
        this.loggingService.logAuthEvent("token_refresh", {
            authScope: "platform_admin",
            adminId: admin.id,
            deviceId
        });
        return {
            accessToken,
            refreshToken,
            expiresIn: this.platformAdminJwtService.getAccessTokenExpiresInSeconds()
        };
    }
    async logout(adminId, accessToken, dto) {
        if (dto?.refreshToken) {
            await this.platformAdminRefreshTokenRepository.update({
                token: dto.refreshToken,
                platformAdminUserId: adminId
            }, {
                revokedAt: new Date()
            });
        }
        if (accessToken) {
            const decoded = this.platformAdminJwtService.decodeToken(accessToken);
            if (decoded?.jti && decoded?.exp) {
                await this.platformAdminRevokedAccessTokenRepository.save({
                    jti: decoded.jti,
                    platformAdminUserId: adminId,
                    expiresAt: new Date(decoded.exp * 1000),
                    reason: dto?.mfaReason || "platform_admin_logout"
                });
            }
        }
        this.loggingService.logAuthEvent("logout", {
            authScope: "platform_admin",
            adminId
        });
    }
    async getCurrentAdmin(adminId) {
        const admin = await this.platformAdminUserRepository.findOne({
            where: {
                id: adminId
            }
        });
        if (!admin) {
            throw new _common.UnauthorizedException("Platform admin user not found");
        }
        return this.mapAdminProfile(admin);
    }
    async revokeAllSessions(adminId, reason) {
        await this.platformAdminRefreshTokenRepository.update({
            platformAdminUserId: adminId,
            revokedAt: (0, _typeorm1.IsNull)()
        }, {
            revokedAt: new Date()
        });
        await this.platformAdminUserRepository.update(adminId, {
            sessionInvalidBefore: new Date()
        });
        this.loggingService.logSecurityEvent("platform_admin_sessions_revoked", "high", {
            adminId,
            reason
        });
    }
    assertAdminCanAuthenticate(admin, ipAddress, userAgent) {
        if (admin.status !== _platformadminenum.PlatformAdminStatus.ACTIVE) {
            this.loggingService.logSecurityEvent("platform_admin_login_blocked_inactive", "high", {
                adminId: admin.id,
                status: admin.status,
                ipAddress,
                userAgent
            });
            throw new _common.ForbiddenException("Platform admin account is not active");
        }
        if (admin.lockedUntil && admin.lockedUntil > new Date()) {
            this.loggingService.logSecurityEvent("platform_admin_login_blocked_locked", "high", {
                adminId: admin.id,
                lockedUntil: admin.lockedUntil.toISOString(),
                ipAddress,
                userAgent
            });
            throw new _common.UnauthorizedException("Забагато невдалих спроб. Акаунт тимчасово заблоковано.");
        }
    }
    async handleFailedPassword(admin, ipAddress, userAgent) {
        await this.platformAdminUserRepository.increment({
            id: admin.id
        }, "failedLoginAttempts", 1);
        const updatedAdmin = await this.platformAdminUserRepository.findOne({
            where: {
                id: admin.id
            }
        });
        if ((updatedAdmin?.failedLoginAttempts || 0) >= 5) {
            const lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
            await this.platformAdminUserRepository.update(admin.id, {
                lockedUntil
            });
            this.loggingService.logSecurityEvent("platform_admin_account_locked", "high", {
                adminId: admin.id,
                ipAddress,
                userAgent,
                lockedUntil: lockedUntil.toISOString()
            });
            return;
        }
        this.loggingService.logAuthEvent("login_failed", {
            authScope: "platform_admin",
            adminId: admin.id,
            ipAddress,
            userAgent,
            failedAttempts: updatedAdmin?.failedLoginAttempts || 1
        });
    }
    async issueSession(admin, ipAddress, userAgent, mfaLevel) {
        const deviceId = (0, _cryptoutil.generateDeviceFingerprint)(userAgent, ipAddress);
        await this.platformAdminUserRepository.update(admin.id, {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
            lastLoginIp: ipAddress
        });
        const accessToken = await this.platformAdminJwtService.generateAccessToken({
            admin_id: admin.id,
            email: admin.email,
            role: admin.role,
            permissions: admin.permissions || [],
            mfa_level: mfaLevel
        });
        const refreshToken = await this.platformAdminJwtService.generateRefreshToken({
            admin_id: admin.id,
            token_id: (0, _cryptoutil.generateUuid)(),
            device_id: deviceId
        });
        await this.platformAdminRefreshTokenRepository.save({
            platformAdminUserId: admin.id,
            token: refreshToken,
            deviceInfo: {
                userAgent,
                ipAddress,
                deviceId
            },
            ipAddress,
            userAgent,
            expiresAt: this.getRefreshTokenExpiryDate()
        });
        await this.limitRefreshTokens(admin.id);
        this.loggingService.logAuthEvent("login", {
            authScope: "platform_admin",
            adminId: admin.id,
            ipAddress,
            userAgent,
            deviceId,
            mfaLevel
        });
        const freshAdmin = await this.platformAdminUserRepository.findOne({
            where: {
                id: admin.id
            }
        });
        return {
            mfaRequired: false,
            accessToken,
            refreshToken,
            expiresIn: this.platformAdminJwtService.getAccessTokenExpiresInSeconds(),
            admin: this.mapAdminProfile(freshAdmin || admin)
        };
    }
    async verifyMfaCode(admin, code) {
        if (!admin.mfaSecret) {
            return false;
        }
        if (await this.validateTotpCode(admin.mfaSecret, code)) {
            return true;
        }
        if (admin.mfaBackupCodes?.includes(code)) {
            const updatedBackupCodes = admin.mfaBackupCodes.filter((item)=>item !== code);
            await this.platformAdminUserRepository.update(admin.id, {
                mfaBackupCodes: updatedBackupCodes
            });
            this.loggingService.logSecurityEvent("platform_admin_backup_code_used", "medium", {
                adminId: admin.id,
                remainingCodes: updatedBackupCodes.length
            });
            return true;
        }
        return false;
    }
    async validateTotpCode(secret, code) {
        const { TOTP } = await Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("otpauth")));
        const totp = new TOTP({
            secret,
            digits: 6,
            period: 30
        });
        const delta = totp.validate({
            token: code,
            window: 2
        });
        return delta !== null;
    }
    async limitRefreshTokens(adminId, maxTokens = 5) {
        const tokens = await this.platformAdminRefreshTokenRepository.find({
            where: {
                platformAdminUserId: adminId,
                revokedAt: (0, _typeorm1.IsNull)(),
                expiresAt: (0, _typeorm1.MoreThan)(new Date())
            },
            order: {
                createdAt: "DESC"
            }
        });
        if (tokens.length <= maxTokens) {
            return;
        }
        const staleTokens = tokens.slice(maxTokens);
        await Promise.all(staleTokens.map((token)=>this.platformAdminRefreshTokenRepository.update(token.id, {
                revokedAt: new Date()
            })));
    }
    getRefreshTokenExpiryDate() {
        const rawExpiry = this.configService.get("PLATFORM_ADMIN_JWT_REFRESH_TOKEN_EXPIRY", "7d");
        const amount = rawExpiry.match(/^(\d+)([dhm])$/i);
        if (!amount) {
            return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        }
        const value = Number(amount[1]);
        const unit = amount[2].toLowerCase();
        const multiplier = unit === "d" ? 24 * 60 * 60 * 1000 : unit === "h" ? 60 * 60 * 1000 : 60 * 1000;
        return new Date(Date.now() + value * multiplier);
    }
    mapAdminProfile(admin) {
        return {
            id: admin.id,
            email: admin.email,
            firstName: admin.firstName,
            lastName: admin.lastName,
            role: admin.role,
            permissions: admin.permissions || [],
            mfaEnabled: admin.mfaEnabled,
            status: admin.status,
            lastLoginAt: admin.lastLoginAt?.toISOString()
        };
    }
    getBootstrapToken() {
        return this.configService.get("PLATFORM_ADMIN_BOOTSTRAP_TOKEN")?.trim() || null;
    }
    async generateOtpAuthUrl(secret, issuer, label) {
        const { TOTP } = await Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("otpauth")));
        const totp = new TOTP({
            issuer,
            label,
            secret,
            digits: 6,
            period: 30
        });
        return totp.toString();
    }
    async generateQrCodeDataUrl(payload) {
        const QRCode = await Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("qrcode")));
        return QRCode.toDataURL(payload, {
            errorCorrectionLevel: "M",
            margin: 1,
            width: 240
        });
    }
    constructor(platformAdminUserRepository, platformAdminRefreshTokenRepository, platformAdminRevokedAccessTokenRepository, platformAdminJwtService, loggingService, configService){
        this.platformAdminUserRepository = platformAdminUserRepository;
        this.platformAdminRefreshTokenRepository = platformAdminRefreshTokenRepository;
        this.platformAdminRevokedAccessTokenRepository = platformAdminRevokedAccessTokenRepository;
        this.platformAdminJwtService = platformAdminJwtService;
        this.loggingService = loggingService;
        this.configService = configService;
    }
};
PlatformAdminAuthService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_PlatformAdminUserentity.PlatformAdminUser)),
    _ts_param(1, (0, _typeorm.InjectRepository)(_PlatformAdminRefreshTokenentity.PlatformAdminRefreshToken)),
    _ts_param(2, (0, _typeorm.InjectRepository)(_PlatformAdminRevokedAccessTokenentity.PlatformAdminRevokedAccessToken)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _platformadminjwtservice.PlatformAdminJwtService === "undefined" ? Object : _platformadminjwtservice.PlatformAdminJwtService,
        typeof _logging.LoggingService === "undefined" ? Object : _logging.LoggingService,
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], PlatformAdminAuthService);

//# sourceMappingURL=platform-admin-auth.service.js.map