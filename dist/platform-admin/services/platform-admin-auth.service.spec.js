"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _testing = require("@nestjs/testing");
const _typeorm = require("@nestjs/typeorm");
const _config = require("@nestjs/config");
const _common = require("@nestjs/common");
const _logging = require("../../common/logging");
const _PlatformAdminUserentity = require("../../database/entities/PlatformAdminUser.entity");
const _PlatformAdminRefreshTokenentity = require("../../database/entities/PlatformAdminRefreshToken.entity");
const _PlatformAdminRevokedAccessTokenentity = require("../../database/entities/PlatformAdminRevokedAccessToken.entity");
const _platformadminenum = require("../../database/entities/enums/platform-admin.enum");
const _platformadminjwtservice = require("./platform-admin-jwt.service");
const _platformadminauthservice = require("./platform-admin-auth.service");
const _cryptoutil = /*#__PURE__*/ _interop_require_wildcard(require("../../common/utils/crypto.util"));
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
jest.mock("../../common/utils/crypto.util");
describe("PlatformAdminAuthService", ()=>{
    let service;
    let platformAdminUserRepository;
    let platformAdminRefreshTokenRepository;
    let platformAdminRevokedAccessTokenRepository;
    let platformAdminJwtService;
    let loggingService;
    let configService;
    const mockAdmin = {
        id: "platform-admin-1",
        firstName: "Portal",
        lastName: "Owner",
        email: "owner@example.com",
        salt: "salt",
        passwordHash: "hash",
        role: _platformadminenum.PlatformAdminRole.PLATFORM_OWNER,
        status: _platformadminenum.PlatformAdminStatus.ACTIVE,
        permissions: [
            "organizations.read",
            "organizations.write"
        ],
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: null,
        lastLoginIp: null
    };
    beforeEach(async ()=>{
        const createRepository = ()=>({
                count: jest.fn(),
                findOne: jest.fn(),
                save: jest.fn(),
                update: jest.fn(),
                increment: jest.fn(),
                find: jest.fn()
            });
        const module = await _testing.Test.createTestingModule({
            providers: [
                _platformadminauthservice.PlatformAdminAuthService,
                {
                    provide: (0, _typeorm.getRepositoryToken)(_PlatformAdminUserentity.PlatformAdminUser),
                    useFactory: createRepository
                },
                {
                    provide: (0, _typeorm.getRepositoryToken)(_PlatformAdminRefreshTokenentity.PlatformAdminRefreshToken),
                    useFactory: createRepository
                },
                {
                    provide: (0, _typeorm.getRepositoryToken)(_PlatformAdminRevokedAccessTokenentity.PlatformAdminRevokedAccessToken),
                    useFactory: createRepository
                },
                {
                    provide: _platformadminjwtservice.PlatformAdminJwtService,
                    useValue: {
                        generateAccessToken: jest.fn(),
                        generateRefreshToken: jest.fn(),
                        generateMfaToken: jest.fn(),
                        verifyRefreshToken: jest.fn(),
                        verifyMfaToken: jest.fn(),
                        decodeToken: jest.fn(),
                        getAccessTokenExpiresInSeconds: jest.fn().mockReturnValue(900),
                        getMfaTokenExpiresInSeconds: jest.fn().mockReturnValue(300)
                    }
                },
                {
                    provide: _logging.LoggingService,
                    useValue: {
                        logAuthEvent: jest.fn(),
                        logSecurityEvent: jest.fn()
                    }
                },
                {
                    provide: _config.ConfigService,
                    useValue: {
                        get: jest.fn().mockImplementation((key, fallback)=>key === "PLATFORM_ADMIN_JWT_REFRESH_TOKEN_EXPIRY" ? "7d" : fallback)
                    }
                }
            ]
        }).compile();
        service = module.get(_platformadminauthservice.PlatformAdminAuthService);
        platformAdminUserRepository = module.get((0, _typeorm.getRepositoryToken)(_PlatformAdminUserentity.PlatformAdminUser));
        platformAdminRefreshTokenRepository = module.get((0, _typeorm.getRepositoryToken)(_PlatformAdminRefreshTokenentity.PlatformAdminRefreshToken));
        platformAdminRevokedAccessTokenRepository = module.get((0, _typeorm.getRepositoryToken)(_PlatformAdminRevokedAccessTokenentity.PlatformAdminRevokedAccessToken));
        platformAdminJwtService = module.get(_platformadminjwtservice.PlatformAdminJwtService);
        loggingService = module.get(_logging.LoggingService);
        configService = module.get(_config.ConfigService);
        _cryptoutil.verifyPassword.mockResolvedValue(true);
        _cryptoutil.generateUuid.mockReturnValue("generated-uuid");
        _cryptoutil.generateDeviceFingerprint.mockReturnValue("device-1");
        _cryptoutil.generateSalt.mockResolvedValue("bootstrap-salt");
        _cryptoutil.hashPassword.mockResolvedValue("bootstrap-hash");
        _cryptoutil.generateTotpSecret.mockReturnValue("MFASECRET");
        _cryptoutil.generateMfaBackupCodes.mockReturnValue([
            "ABCD-1234",
            "EFGH-5678"
        ]);
        platformAdminUserRepository.count.mockResolvedValue(1);
    });
    afterEach(()=>{
        jest.clearAllMocks();
    });
    it("issues a session when platform admin login succeeds without MFA", async ()=>{
        platformAdminUserRepository.findOne.mockResolvedValueOnce(mockAdmin).mockResolvedValueOnce(mockAdmin);
        platformAdminJwtService.generateAccessToken.mockResolvedValue("access");
        platformAdminJwtService.generateRefreshToken.mockResolvedValue("refresh");
        platformAdminRefreshTokenRepository.save.mockResolvedValue({});
        platformAdminRefreshTokenRepository.find.mockResolvedValue([]);
        platformAdminUserRepository.update.mockResolvedValue({});
        const result = await service.login({
            email: mockAdmin.email,
            password: "StrongPassword123"
        }, "127.0.0.1", "jest-agent");
        expect(result.mfaRequired).toBe(false);
        expect(result.accessToken).toBe("access");
        expect(result.refreshToken).toBe("refresh");
        expect(result.admin?.id).toBe(mockAdmin.id);
    });
    it("reports bootstrap availability when no platform admins exist", async ()=>{
        platformAdminUserRepository.count.mockResolvedValue(0);
        const result = await service.getBootstrapStatus();
        expect(result).toEqual({
            bootstrapRequired: true,
            bootstrapEnabled: false,
            hasPlatformAdmins: false
        });
    });
    it("bootstraps the first platform owner and issues a session", async ()=>{
        platformAdminUserRepository.count.mockResolvedValue(0);
        platformAdminUserRepository.findOne.mockResolvedValueOnce(null);
        platformAdminUserRepository.save.mockImplementation(async (entity)=>({
                id: mockAdmin.id,
                role: _platformadminenum.PlatformAdminRole.PLATFORM_OWNER,
                status: _platformadminenum.PlatformAdminStatus.ACTIVE,
                permissions: [
                    "dashboard.read"
                ],
                mfaEnabled: false,
                failedLoginAttempts: 0,
                lockedUntil: null,
                lastLoginAt: null,
                lastLoginIp: null,
                ...entity
            }));
        platformAdminUserRepository.findOne.mockResolvedValueOnce({
            ...mockAdmin,
            permissions: [
                "dashboard.read"
            ],
            mfaEnabled: false
        });
        platformAdminJwtService.generateAccessToken.mockResolvedValue("access");
        platformAdminJwtService.generateRefreshToken.mockResolvedValue("refresh");
        platformAdminRefreshTokenRepository.save.mockResolvedValue({});
        platformAdminRefreshTokenRepository.find.mockResolvedValue([]);
        platformAdminUserRepository.update.mockResolvedValue({});
        const getSpy = jest.spyOn(configService, "get").mockImplementation((key, fallback)=>key === "PLATFORM_ADMIN_BOOTSTRAP_TOKEN" ? "bootstrap-secret-token-value" : key === "PLATFORM_ADMIN_JWT_REFRESH_TOKEN_EXPIRY" ? "7d" : fallback);
        const result = await service.bootstrapFirstAdmin({
            bootstrapToken: "bootstrap-secret-token-value",
            firstName: "Portal",
            lastName: "Owner",
            email: "owner@example.com",
            password: "StrongPassword123!"
        }, "127.0.0.1", "jest-agent");
        expect(result.accessToken).toBe("access");
        expect(platformAdminUserRepository.save).toHaveBeenCalled();
        getSpy.mockRestore();
    });
    it("refuses bootstrap after the first platform admin exists", async ()=>{
        platformAdminUserRepository.count.mockResolvedValue(1);
        const getSpy = jest.spyOn(configService, "get").mockImplementation((key, fallback)=>key === "PLATFORM_ADMIN_BOOTSTRAP_TOKEN" ? "bootstrap-secret-token-value" : fallback);
        await expect(service.bootstrapFirstAdmin({
            bootstrapToken: "bootstrap-secret-token-value",
            firstName: "Portal",
            lastName: "Owner",
            email: "owner@example.com",
            password: "StrongPassword123!"
        }, "127.0.0.1", "jest-agent")).rejects.toThrow(_common.ConflictException);
        getSpy.mockRestore();
    });
    it("returns an MFA challenge when MFA is enabled", async ()=>{
        platformAdminUserRepository.findOne.mockResolvedValue({
            ...mockAdmin,
            mfaEnabled: true,
            mfaSecret: "MFASECRET"
        });
        platformAdminJwtService.generateMfaToken.mockResolvedValue("mfa-token");
        const result = await service.login({
            email: mockAdmin.email,
            password: "StrongPassword123"
        }, "127.0.0.1", "jest-agent");
        expect(result).toEqual({
            mfaRequired: true,
            mfaToken: "mfa-token",
            mfaTokenExpiresIn: 300
        });
    });
    it("completes MFA verification and issues a session", async ()=>{
        platformAdminJwtService.verifyMfaToken.mockResolvedValue({
            admin_id: mockAdmin.id,
            email: mockAdmin.email,
            scope: "platform_admin",
            token_type: "mfa"
        });
        platformAdminUserRepository.findOne.mockResolvedValueOnce({
            ...mockAdmin,
            mfaEnabled: true,
            mfaSecret: "MFASECRET"
        }).mockResolvedValueOnce(mockAdmin);
        jest.spyOn(service, "verifyMfaCode").mockResolvedValue(true);
        platformAdminJwtService.generateAccessToken.mockResolvedValue("access");
        platformAdminJwtService.generateRefreshToken.mockResolvedValue("refresh");
        platformAdminRefreshTokenRepository.save.mockResolvedValue({});
        platformAdminRefreshTokenRepository.find.mockResolvedValue([]);
        platformAdminUserRepository.update.mockResolvedValue({});
        const result = await service.verifyMfa({
            mfaToken: "mfa-token",
            code: "123456"
        }, "127.0.0.1", "jest-agent");
        expect(result.mfaRequired).toBe(false);
        expect(result.accessToken).toBe("access");
        expect(platformAdminJwtService.verifyMfaToken).toHaveBeenCalledWith("mfa-token");
    });
    it("creates a fresh MFA enrollment kit for a password-only admin session", async ()=>{
        platformAdminUserRepository.findOne.mockResolvedValue({
            ...mockAdmin,
            metadata: null,
            mfaEnabled: false
        });
        platformAdminUserRepository.update.mockResolvedValue({});
        jest.spyOn(service, "generateOtpAuthUrl").mockResolvedValue("otpauth://platform-admin");
        jest.spyOn(service, "generateQrCodeDataUrl").mockResolvedValue("data:image/png;base64,qr");
        const result = await service.setupMfa(mockAdmin.id);
        expect(result.secret).toBe("MFASECRET");
        expect(result.backupCodes).toEqual([
            "ABCD-1234",
            "EFGH-5678"
        ]);
        expect(platformAdminUserRepository.update).toHaveBeenCalledWith(mockAdmin.id, expect.objectContaining({
            mfaSecret: "MFASECRET"
        }));
    });
    it("confirms MFA enrollment and rotates into an MFA session", async ()=>{
        platformAdminUserRepository.findOne.mockResolvedValueOnce({
            ...mockAdmin,
            mfaEnabled: false,
            mfaSecret: "MFASECRET",
            metadata: null
        }).mockResolvedValueOnce({
            ...mockAdmin,
            mfaEnabled: true,
            mfaSecret: "MFASECRET",
            metadata: null
        }).mockResolvedValueOnce({
            ...mockAdmin,
            mfaEnabled: true,
            mfaSecret: "MFASECRET",
            metadata: null
        });
        platformAdminUserRepository.update.mockResolvedValue({});
        platformAdminRefreshTokenRepository.update.mockResolvedValue({});
        platformAdminJwtService.generateAccessToken.mockResolvedValue("mfa-access");
        platformAdminJwtService.generateRefreshToken.mockResolvedValue("mfa-refresh");
        platformAdminRefreshTokenRepository.save.mockResolvedValue({});
        platformAdminRefreshTokenRepository.find.mockResolvedValue([]);
        jest.spyOn(service, "validateTotpCode").mockResolvedValue(true);
        const result = await service.confirmMfa(mockAdmin.id, {
            code: "123456"
        }, "127.0.0.1", "jest-agent");
        expect(result.accessToken).toBe("mfa-access");
        expect(platformAdminRefreshTokenRepository.update).toHaveBeenCalled();
    });
    it("refreshes a valid platform-admin token pair", async ()=>{
        platformAdminJwtService.verifyRefreshToken.mockResolvedValue({
            admin_id: mockAdmin.id,
            scope: "platform_admin",
            token_type: "refresh",
            token_id: "refresh-1",
            device_id: "device-1"
        });
        platformAdminRefreshTokenRepository.findOne.mockResolvedValue({
            id: "token-1",
            platformAdminUserId: mockAdmin.id,
            token: "refresh-token",
            deviceInfo: {},
            ipAddress: "127.0.0.1",
            userAgent: "jest-agent",
            expiresAt: new Date(Date.now() + 60_000),
            revokedAt: null
        });
        platformAdminUserRepository.findOne.mockResolvedValue(mockAdmin);
        platformAdminJwtService.generateAccessToken.mockResolvedValue("next-access");
        platformAdminJwtService.generateRefreshToken.mockResolvedValue("next-refresh");
        platformAdminRefreshTokenRepository.update.mockResolvedValue({});
        platformAdminRefreshTokenRepository.save.mockResolvedValue({});
        const result = await service.refreshToken({
            refreshToken: "refresh-token"
        });
        expect(result).toEqual({
            accessToken: "next-access",
            refreshToken: "next-refresh",
            expiresIn: 900
        });
    });
    it("rejects login when password is invalid", async ()=>{
        platformAdminUserRepository.findOne.mockResolvedValueOnce(mockAdmin).mockResolvedValueOnce({
            ...mockAdmin,
            failedLoginAttempts: 1
        });
        _cryptoutil.verifyPassword.mockResolvedValue(false);
        platformAdminUserRepository.increment.mockResolvedValue({});
        await expect(service.login({
            email: mockAdmin.email,
            password: "wrong-password"
        }, "127.0.0.1", "jest-agent")).rejects.toThrow(_common.UnauthorizedException);
    });
    it("revokes current access token on logout when a jti is present", async ()=>{
        platformAdminJwtService.decodeToken.mockReturnValue({
            admin_id: mockAdmin.id,
            scope: "platform_admin",
            token_type: "access",
            role: mockAdmin.role,
            permissions: [],
            email: mockAdmin.email,
            mfa_level: "password",
            jti: "access-jti",
            exp: Math.floor(Date.now() / 1000) + 60
        });
        platformAdminRevokedAccessTokenRepository.save.mockResolvedValue({});
        await service.logout(mockAdmin.id, "access-token", {
            refreshToken: "refresh-token"
        });
        expect(platformAdminRevokedAccessTokenRepository.save).toHaveBeenCalled();
        expect(platformAdminRefreshTokenRepository.update).toHaveBeenCalled();
    });
});

//# sourceMappingURL=platform-admin-auth.service.spec.js.map