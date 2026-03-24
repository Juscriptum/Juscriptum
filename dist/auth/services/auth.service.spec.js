"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _testing = require("@nestjs/testing");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _common = require("@nestjs/common");
const _authservice = require("./auth.service");
const _Userentity = require("../../database/entities/User.entity");
const _Organizationentity = require("../../database/entities/Organization.entity");
const _RefreshTokenentity = require("../../database/entities/RefreshToken.entity");
const _RevokedAccessTokenentity = require("../../database/entities/RevokedAccessToken.entity");
const _Subscriptionentity = require("../../database/entities/Subscription.entity");
const _jwtservice = require("./jwt.service");
const _auditservice = require("./audit.service");
const _logging = require("../../common/logging");
const _subscriptionenum = require("../../database/entities/enums/subscription.enum");
const _cryptoutil = /*#__PURE__*/ _interop_require_wildcard(require("../../common/utils/crypto.util"));
const _validationutil = /*#__PURE__*/ _interop_require_wildcard(require("../../common/utils/validation.util"));
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
// Mock crypto utilities
jest.mock("../../common/utils/crypto.util");
jest.mock("../../common/utils/validation.util");
describe("AuthService", ()=>{
    let service;
    let userRepository;
    let organizationRepository;
    let refreshTokenRepository;
    let revokedAccessTokenRepository;
    let subscriptionRepository;
    let jwtService;
    let auditService;
    let loggingService;
    let dataSource;
    const mockTenantId = "test-tenant-id";
    const mockUserId = "test-user-id";
    const mockEmail = "test@example.com";
    const mockPassword = "StrongP@ss123";
    const mockIpAddress = "127.0.0.1";
    const mockUserAgent = "test-agent";
    beforeEach(async ()=>{
        const mockRepository = ()=>({
                findOne: jest.fn(),
                save: jest.fn(),
                update: jest.fn(),
                increment: jest.fn(),
                find: jest.fn(),
                create: jest.fn()
            });
        const mockQueryRunner = {
            connect: jest.fn(),
            query: jest.fn(),
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            rollbackTransaction: jest.fn(),
            release: jest.fn(),
            manager: {
                create: jest.fn(),
                save: jest.fn(),
                getRepository: jest.fn().mockReturnValue({
                    save: jest.fn()
                })
            }
        };
        const module = await _testing.Test.createTestingModule({
            providers: [
                _authservice.AuthService,
                {
                    provide: (0, _typeorm.getRepositoryToken)(_Userentity.User),
                    useFactory: mockRepository
                },
                {
                    provide: (0, _typeorm.getRepositoryToken)(_Organizationentity.Organization),
                    useFactory: mockRepository
                },
                {
                    provide: (0, _typeorm.getRepositoryToken)(_RefreshTokenentity.RefreshToken),
                    useFactory: mockRepository
                },
                {
                    provide: (0, _typeorm.getRepositoryToken)(_RevokedAccessTokenentity.RevokedAccessToken),
                    useFactory: mockRepository
                },
                {
                    provide: (0, _typeorm.getRepositoryToken)(_Subscriptionentity.Subscription),
                    useFactory: mockRepository
                },
                {
                    provide: _jwtservice.JwtService,
                    useValue: {
                        generateAccessToken: jest.fn(),
                        generateRefreshToken: jest.fn(),
                        verifyRefreshToken: jest.fn(),
                        decodeToken: jest.fn()
                    }
                },
                {
                    provide: _auditservice.AuditService,
                    useValue: {
                        log: jest.fn()
                    }
                },
                {
                    provide: _logging.LoggingService,
                    useValue: {
                        debug: jest.fn(),
                        logAuthEvent: jest.fn(),
                        logSecurityEvent: jest.fn(),
                        logBusinessEvent: jest.fn(),
                        logError: jest.fn()
                    }
                },
                {
                    provide: _typeorm1.DataSource,
                    useValue: {
                        options: {
                            type: "postgres"
                        },
                        createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner)
                    }
                }
            ]
        }).compile();
        service = module.get(_authservice.AuthService);
        userRepository = module.get((0, _typeorm.getRepositoryToken)(_Userentity.User));
        organizationRepository = module.get((0, _typeorm.getRepositoryToken)(_Organizationentity.Organization));
        refreshTokenRepository = module.get((0, _typeorm.getRepositoryToken)(_RefreshTokenentity.RefreshToken));
        revokedAccessTokenRepository = module.get((0, _typeorm.getRepositoryToken)(_RevokedAccessTokenentity.RevokedAccessToken));
        subscriptionRepository = module.get((0, _typeorm.getRepositoryToken)(_Subscriptionentity.Subscription));
        jwtService = module.get(_jwtservice.JwtService);
        auditService = module.get(_auditservice.AuditService);
        loggingService = module.get(_logging.LoggingService);
        dataSource = module.get(_typeorm1.DataSource);
    });
    afterEach(()=>{
        jest.clearAllMocks();
    });
    describe("login", ()=>{
        const mockUser = {
            id: mockUserId,
            tenantId: mockTenantId,
            email: mockEmail,
            passwordHash: "hashed-password",
            salt: "salt",
            role: _subscriptionenum.UserRole.LAWYER,
            status: _subscriptionenum.UserStatus.ACTIVE,
            failedLoginAttempts: 0,
            lockedUntil: null,
            mfaEnabled: false,
            organization: {
                id: mockTenantId,
                subscriptionPlan: "basic",
                subscriptionStatus: "active"
            }
        };
        const mockLoginDto = {
            email: mockEmail,
            password: mockPassword
        };
        beforeEach(()=>{
            _validationutil.validatePasswordStrength.mockReturnValue({
                valid: true
            });
            _cryptoutil.verifyPassword.mockResolvedValue(true);
            _cryptoutil.generateUuid.mockReturnValue("test-uuid");
            _cryptoutil.generateDeviceFingerprint.mockReturnValue("test-device-id");
        });
        it("should successfully login with valid credentials", async ()=>{
            userRepository.findOne.mockResolvedValue(mockUser);
            jwtService.generateAccessToken.mockResolvedValue("access-token");
            jwtService.generateRefreshToken.mockResolvedValue("refresh-token");
            refreshTokenRepository.save.mockResolvedValue({});
            refreshTokenRepository.find.mockResolvedValue([]);
            userRepository.update.mockResolvedValue({});
            const result = await service.login(mockLoginDto, mockIpAddress, mockUserAgent);
            expect(result).toHaveProperty("accessToken");
            expect(result).toHaveProperty("refreshToken");
            expect(result.user.email).toBe(mockEmail);
            expect(loggingService.logAuthEvent).toHaveBeenCalledWith("login", expect.any(Object));
        });
        it("should throw UnauthorizedException for non-existent user", async ()=>{
            userRepository.findOne.mockResolvedValue(null);
            await expect(service.login(mockLoginDto, mockIpAddress, mockUserAgent)).rejects.toThrow(_common.UnauthorizedException);
            expect(loggingService.logAuthEvent).toHaveBeenCalledWith("login_failed", expect.any(Object));
        });
        it("should throw UnauthorizedException for suspended account", async ()=>{
            const suspendedUser = {
                ...mockUser,
                status: _subscriptionenum.UserStatus.SUSPENDED
            };
            userRepository.findOne.mockResolvedValue(suspendedUser);
            await expect(service.login(mockLoginDto, mockIpAddress, mockUserAgent)).rejects.toThrow(_common.UnauthorizedException);
            expect(loggingService.logSecurityEvent).toHaveBeenCalledWith("login_attempt_suspended", "high", expect.any(Object));
        });
        it("should throw UnauthorizedException for locked account", async ()=>{
            const lockedUser = {
                ...mockUser,
                lockedUntil: new Date(Date.now() + 30 * 60 * 1000)
            };
            userRepository.findOne.mockResolvedValue(lockedUser);
            await expect(service.login(mockLoginDto, mockIpAddress, mockUserAgent)).rejects.toThrow(_common.UnauthorizedException);
            expect(loggingService.logSecurityEvent).toHaveBeenCalledWith("login_attempt_locked", "medium", expect.any(Object));
        });
        it("should increment failed attempts on wrong password", async ()=>{
            userRepository.findOne.mockResolvedValue(mockUser);
            _cryptoutil.verifyPassword.mockResolvedValue(false);
            userRepository.increment.mockResolvedValue({});
            userRepository.findOne.mockResolvedValue({
                ...mockUser,
                failedLoginAttempts: 1
            });
            await expect(service.login(mockLoginDto, mockIpAddress, mockUserAgent)).rejects.toThrow(_common.UnauthorizedException);
            expect(userRepository.increment).toHaveBeenCalledWith({
                id: mockUserId
            }, "failedLoginAttempts", 1);
        });
        it("should lock account after 5 failed attempts", async ()=>{
            userRepository.findOne.mockResolvedValue(mockUser);
            _cryptoutil.verifyPassword.mockResolvedValue(false);
            userRepository.increment.mockResolvedValue({});
            userRepository.findOne.mockResolvedValue({
                ...mockUser,
                failedLoginAttempts: 5
            });
            await expect(service.login(mockLoginDto, mockIpAddress, mockUserAgent)).rejects.toThrow(_common.UnauthorizedException);
            expect(userRepository.update).toHaveBeenCalledWith(mockUserId, {
                lockedUntil: expect.any(Date)
            });
        });
        it("should require MFA code when MFA is enabled", async ()=>{
            const mfaUser = {
                ...mockUser,
                mfaEnabled: true
            };
            userRepository.findOne.mockResolvedValue(mfaUser);
            await expect(service.login(mockLoginDto, mockIpAddress, mockUserAgent)).rejects.toThrow(_common.UnauthorizedException);
            expect(loggingService.logAuthEvent).toHaveBeenCalledWith("mfa_required", expect.any(Object));
        });
    });
    describe("refreshToken", ()=>{
        const mockRefreshTokenDto = {
            refreshToken: "test-refresh-token"
        };
        const mockPayload = {
            user_id: mockUserId,
            tenant_id: mockTenantId,
            token_id: "test-token-id",
            device_id: "test-device-id"
        };
        const mockRefreshTokenEntity = {
            id: "token-id",
            userId: mockUserId,
            tenantId: mockTenantId,
            token: "test-refresh-token",
            revokedAt: null,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            deviceInfo: {}
        };
        const mockUser = {
            id: mockUserId,
            tenantId: mockTenantId,
            email: mockEmail,
            role: _subscriptionenum.UserRole.LAWYER,
            organization: {
                subscriptionPlan: "basic"
            }
        };
        beforeEach(()=>{
            _cryptoutil.generateUuid.mockReturnValue("test-uuid");
            revokedAccessTokenRepository.findOne.mockResolvedValue(null);
        });
        it("should successfully refresh tokens", async ()=>{
            jwtService.verifyRefreshToken.mockResolvedValue(mockPayload);
            refreshTokenRepository.findOne.mockResolvedValue(mockRefreshTokenEntity);
            userRepository.findOne.mockResolvedValue(mockUser);
            jwtService.generateAccessToken.mockResolvedValue("new-access-token");
            jwtService.generateRefreshToken.mockResolvedValue("new-refresh-token");
            refreshTokenRepository.update.mockResolvedValue({});
            refreshTokenRepository.save.mockResolvedValue({});
            const result = await service.refreshToken(mockRefreshTokenDto);
            expect(result).toHaveProperty("accessToken", "new-access-token");
            expect(result).toHaveProperty("refreshToken", "new-refresh-token");
        });
        it("should throw UnauthorizedException for invalid refresh token", async ()=>{
            jwtService.verifyRefreshToken.mockResolvedValue(mockPayload);
            refreshTokenRepository.findOne.mockResolvedValue(null);
            await expect(service.refreshToken(mockRefreshTokenDto)).rejects.toThrow(_common.UnauthorizedException);
        });
        it("should throw UnauthorizedException for revoked token", async ()=>{
            jwtService.verifyRefreshToken.mockResolvedValue(mockPayload);
            refreshTokenRepository.findOne.mockResolvedValue({
                ...mockRefreshTokenEntity,
                revokedAt: new Date()
            });
            await expect(service.refreshToken(mockRefreshTokenDto)).rejects.toThrow(_common.UnauthorizedException);
            expect(loggingService.logSecurityEvent).toHaveBeenCalledWith("revoked_refresh_token_used", "high", expect.any(Object));
        });
        it("should throw UnauthorizedException for expired token", async ()=>{
            jwtService.verifyRefreshToken.mockResolvedValue(mockPayload);
            refreshTokenRepository.findOne.mockResolvedValue({
                ...mockRefreshTokenEntity,
                expiresAt: new Date(Date.now() - 1000)
            });
            await expect(service.refreshToken(mockRefreshTokenDto)).rejects.toThrow(_common.UnauthorizedException);
        });
    });
    describe("registration RLS context", ()=>{
        it("should set tenant/user/role session context before saving organization owner during organization registration", async ()=>{
            const registerOrganizationDto = {
                name: "Test Org",
                email: mockEmail,
                firstName: "Test",
                lastName: "Owner",
                password: mockPassword
            };
            const mockQueryRunner = dataSource.createQueryRunner();
            _validationutil.validatePasswordStrength.mockReturnValue({
                valid: true
            });
            _cryptoutil.generateSalt.mockResolvedValue("salt");
            _cryptoutil.hashPassword.mockResolvedValue("hash");
            _cryptoutil.generateUuid.mockReturnValue("pending-user-id");
            _cryptoutil.generateToken.mockReturnValue("verify-token");
            mockQueryRunner.manager.create.mockImplementationOnce((_entity, payload)=>payload).mockImplementationOnce((_entity, payload)=>payload).mockImplementationOnce((_entity, payload)=>payload);
            mockQueryRunner.manager.save.mockResolvedValueOnce({
                id: mockTenantId,
                trialEndAt: new Date()
            }).mockResolvedValueOnce({}).mockResolvedValueOnce({
                id: "pending-user-id"
            });
            await service.registerOrganization(registerOrganizationDto);
            expect(mockQueryRunner.query).toHaveBeenCalledWith(expect.stringContaining("set_config('app.current_tenant_id'"), [
                mockTenantId,
                "pending-user-id",
                _subscriptionenum.UserRole.ORGANIZATION_OWNER
            ]);
        });
        it("should set tenant/user/role session context before saving self-register user", async ()=>{
            const registerDto = {
                email: mockEmail,
                password: mockPassword
            };
            const mockQueryRunner = dataSource.createQueryRunner();
            const onboardingProgressRepository = {
                save: jest.fn().mockResolvedValue({})
            };
            userRepository.findOne.mockResolvedValue(null);
            _cryptoutil.generateSalt.mockResolvedValue("salt");
            _cryptoutil.hashPassword.mockResolvedValue("hash");
            _cryptoutil.generateUuid.mockReturnValueOnce("pending-user-id").mockReturnValueOnce("refresh-token-id");
            _cryptoutil.generateToken.mockReturnValue("verify-token");
            _cryptoutil.generateDeviceFingerprint.mockReturnValue("device-id");
            jwtService.generateAccessToken.mockResolvedValue("access-token");
            jwtService.generateRefreshToken.mockResolvedValue("refresh-token");
            refreshTokenRepository.save.mockResolvedValue({});
            mockQueryRunner.manager.getRepository.mockReturnValue(onboardingProgressRepository);
            mockQueryRunner.manager.create.mockImplementationOnce((_entity, payload)=>payload).mockImplementationOnce((_entity, payload)=>payload);
            mockQueryRunner.manager.save.mockResolvedValueOnce({
                id: mockTenantId,
                subscriptionPlan: "basic",
                legalForm: "other",
                name: "Кабінет test"
            }).mockResolvedValueOnce({
                id: "pending-user-id",
                tenantId: mockTenantId,
                email: mockEmail,
                firstName: "Новий",
                lastName: "користувач",
                role: _subscriptionenum.UserRole.ORGANIZATION_OWNER,
                emailVerified: false,
                mfaEnabled: false
            });
            await service.register(registerDto);
            expect(mockQueryRunner.query).toHaveBeenCalledWith(expect.stringContaining("set_config('app.current_tenant_id'"), [
                mockTenantId,
                "pending-user-id",
                _subscriptionenum.UserRole.ORGANIZATION_OWNER
            ]);
            expect(onboardingProgressRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                step: "organization_details",
                completed: false,
                data: expect.objectContaining({
                    capturedAtRegistration: expect.objectContaining({
                        email: registerDto.email
                    })
                })
            }));
            expect(onboardingProgressRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                step: "user_profile",
                completed: false,
                data: expect.objectContaining({
                    capturedAtRegistration: expect.objectContaining({
                        email: registerDto.email
                    })
                })
            }));
        });
    });
    describe("logout", ()=>{
        it("should revoke refresh and access tokens on logout", async ()=>{
            refreshTokenRepository.update.mockResolvedValue({});
            revokedAccessTokenRepository.save.mockResolvedValue({});
            jwtService.decodeToken = jest.fn().mockReturnValue({
                jti: "access-jti",
                user_id: mockUserId,
                tenant_id: mockTenantId,
                exp: Math.floor(Date.now() / 1000) + 900
            });
            await service.logout(mockUserId, "access-token", {
                refreshToken: "test-token"
            });
            expect(refreshTokenRepository.update).toHaveBeenCalledWith({
                token: "test-token"
            }, {
                revokedAt: expect.any(Date)
            });
            expect(revokedAccessTokenRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                jti: "access-jti",
                userId: mockUserId,
                tenantId: mockTenantId,
                reason: "logout"
            }));
            expect(loggingService.logAuthEvent).toHaveBeenCalledWith("logout", {
                userId: mockUserId
            });
        });
        it("should log logout without token", async ()=>{
            await service.logout(mockUserId);
            expect(loggingService.logAuthEvent).toHaveBeenCalledWith("logout", {
                userId: mockUserId
            });
        });
    });
    describe("logoutAllDevices", ()=>{
        it("should invalidate user sessions and revoke all refresh tokens", async ()=>{
            userRepository.update.mockResolvedValue({});
            refreshTokenRepository.update.mockResolvedValue({});
            await service.logoutAllDevices(mockUserId);
            expect(userRepository.update).toHaveBeenCalledWith(mockUserId, {
                sessionInvalidBefore: expect.any(Date)
            });
            expect(refreshTokenRepository.update).toHaveBeenCalledWith(expect.objectContaining({
                userId: mockUserId
            }), {
                revokedAt: expect.any(Date)
            });
        });
    });
    describe("forgotPassword", ()=>{
        const mockForgotDto = {
            email: mockEmail
        };
        beforeEach(()=>{
            _cryptoutil.generateToken.mockReturnValue("reset-token");
        });
        it("should generate reset token for existing user", async ()=>{
            const mockUser = {
                id: mockUserId,
                tenantId: mockTenantId,
                email: mockEmail
            };
            userRepository.findOne.mockResolvedValue(mockUser);
            userRepository.update.mockResolvedValue({});
            await service.forgotPassword(mockForgotDto);
            expect(userRepository.update).toHaveBeenCalledWith(mockUserId, {
                passwordResetToken: "reset-token",
                passwordResetExpiresAt: expect.any(Date)
            });
        });
        it("should not throw error for non-existent user", async ()=>{
            userRepository.findOne.mockResolvedValue(null);
            await expect(service.forgotPassword(mockForgotDto)).resolves.not.toThrow();
        });
    });
    describe("resetPassword", ()=>{
        const mockResetDto = {
            token: "reset-token",
            newPassword: "NewStrongP@ss123"
        };
        const mockUser = {
            id: mockUserId,
            tenantId: mockTenantId,
            passwordResetToken: "reset-token",
            passwordResetExpiresAt: new Date(Date.now() + 60 * 60 * 1000)
        };
        beforeEach(()=>{
            _validationutil.validatePasswordStrength.mockReturnValue({
                valid: true
            });
            _cryptoutil.generateSalt.mockResolvedValue("new-salt");
            _cryptoutil.hashPassword.mockResolvedValue("new-hash");
        });
        it("should reset password with valid token", async ()=>{
            userRepository.findOne.mockResolvedValue(mockUser);
            userRepository.update.mockResolvedValue({});
            refreshTokenRepository.update.mockResolvedValue({});
            await service.resetPassword(mockResetDto);
            expect(userRepository.update).toHaveBeenCalledWith(mockUserId, {
                passwordHash: "new-hash",
                salt: "new-salt",
                passwordResetToken: undefined,
                passwordResetExpiresAt: undefined,
                lastPasswordChangeAt: expect.any(Date)
            });
            expect(refreshTokenRepository.update).toHaveBeenCalledWith(expect.objectContaining({
                userId: mockUserId
            }), {
                revokedAt: expect.any(Date)
            });
            expect(loggingService.logSecurityEvent).toHaveBeenCalledWith("user_sessions_invalidated", "medium", expect.objectContaining({
                userId: mockUserId,
                reason: "password_reset"
            }));
        });
        it("should throw UnauthorizedException for invalid token", async ()=>{
            userRepository.findOne.mockResolvedValue(null);
            await expect(service.resetPassword(mockResetDto)).rejects.toThrow(_common.UnauthorizedException);
        });
        it("should throw UnauthorizedException for expired token", async ()=>{
            const expiredUser = {
                ...mockUser,
                passwordResetExpiresAt: new Date(Date.now() - 1000)
            };
            userRepository.findOne.mockResolvedValue(expiredUser);
            await expect(service.resetPassword(mockResetDto)).rejects.toThrow(_common.UnauthorizedException);
        });
        it("should throw ConflictException for weak password", async ()=>{
            _validationutil.validatePasswordStrength.mockReturnValue({
                valid: false,
                errors: [
                    "Too short"
                ]
            });
            userRepository.findOne.mockResolvedValue(mockUser);
            await expect(service.resetPassword(mockResetDto)).rejects.toThrow(_common.ConflictException);
        });
    });
    describe("verifyEmail", ()=>{
        const mockVerifyDto = {
            token: "verification-token"
        };
        const mockUser = {
            id: mockUserId,
            tenantId: mockTenantId,
            emailVerificationToken: "verification-token",
            organization: {}
        };
        it("should verify email with valid token", async ()=>{
            userRepository.findOne.mockResolvedValue(mockUser);
            userRepository.update.mockResolvedValue({});
            await service.verifyEmail(mockVerifyDto);
            expect(userRepository.update).toHaveBeenCalledWith(mockUserId, {
                emailVerified: true,
                emailVerifiedAt: expect.any(Date),
                emailVerificationToken: undefined,
                status: _subscriptionenum.UserStatus.ACTIVE
            });
        });
        it("should throw UnauthorizedException for invalid token", async ()=>{
            userRepository.findOne.mockResolvedValue(null);
            await expect(service.verifyEmail(mockVerifyDto)).rejects.toThrow(_common.UnauthorizedException);
        });
    });
    describe("enableMfa", ()=>{
        const mockUser = {
            id: mockUserId,
            tenantId: mockTenantId
        };
        beforeEach(()=>{
            _cryptoutil.generateTotpSecret.mockReturnValue("test-secret");
            _cryptoutil.generateMfaBackupCodes.mockReturnValue([
                "code1",
                "code2"
            ]);
        });
        it("should enable MFA for user", async ()=>{
            userRepository.findOne.mockResolvedValue(mockUser);
            userRepository.update.mockResolvedValue({});
            const result = await service.enableMfa(mockUserId);
            expect(result).toHaveProperty("secret", "test-secret");
            expect(result).toHaveProperty("backupCodes");
            expect(userRepository.update).toHaveBeenCalledWith(mockUserId, {
                mfaSecret: "test-secret",
                mfaBackupCodes: [
                    "code1",
                    "code2"
                ]
            });
        });
        it("should throw UnauthorizedException for non-existent user", async ()=>{
            userRepository.findOne.mockResolvedValue(null);
            await expect(service.enableMfa(mockUserId)).rejects.toThrow(_common.UnauthorizedException);
        });
    });
});

//# sourceMappingURL=auth.service.spec.js.map