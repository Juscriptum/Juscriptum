import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { UnauthorizedException, ConflictException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { User } from "../../database/entities/User.entity";
import { Organization } from "../../database/entities/Organization.entity";
import { RefreshToken } from "../../database/entities/RefreshToken.entity";
import { RevokedAccessToken } from "../../database/entities/RevokedAccessToken.entity";
import { Subscription } from "../../database/entities/Subscription.entity";
import { JwtService } from "./jwt.service";
import { AuditService } from "./audit.service";
import { LoggingService } from "../../common/logging";
import {
  UserRole,
  UserStatus,
} from "../../database/entities/enums/subscription.enum";
import * as cryptoUtil from "../../common/utils/crypto.util";
import * as validationUtil from "../../common/utils/validation.util";

// Mock crypto utilities
jest.mock("../../common/utils/crypto.util");
jest.mock("../../common/utils/validation.util");

describe("AuthService", () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Repository<User>>;
  let organizationRepository: jest.Mocked<Repository<Organization>>;
  let refreshTokenRepository: jest.Mocked<Repository<RefreshToken>>;
  let revokedAccessTokenRepository: jest.Mocked<Repository<RevokedAccessToken>>;
  let subscriptionRepository: jest.Mocked<Repository<Subscription>>;
  let jwtService: jest.Mocked<JwtService>;
  let auditService: jest.Mocked<AuditService>;
  let loggingService: jest.Mocked<LoggingService>;
  let dataSource: jest.Mocked<DataSource>;

  const mockTenantId = "test-tenant-id";
  const mockUserId = "test-user-id";
  const mockEmail = "test@example.com";
  const mockPassword = "StrongP@ss123";
  const mockIpAddress = "127.0.0.1";
  const mockUserAgent = "test-agent";

  beforeEach(async () => {
    const mockRepository = () => ({
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      increment: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
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
          save: jest.fn(),
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useFactory: mockRepository,
        },
        {
          provide: getRepositoryToken(Organization),
          useFactory: mockRepository,
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useFactory: mockRepository,
        },
        {
          provide: getRepositoryToken(RevokedAccessToken),
          useFactory: mockRepository,
        },
        {
          provide: getRepositoryToken(Subscription),
          useFactory: mockRepository,
        },
        {
          provide: JwtService,
          useValue: {
            generateAccessToken: jest.fn(),
            generateRefreshToken: jest.fn(),
            verifyRefreshToken: jest.fn(),
            decodeToken: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
        {
          provide: LoggingService,
          useValue: {
            debug: jest.fn(),
            logAuthEvent: jest.fn(),
            logSecurityEvent: jest.fn(),
            logBusinessEvent: jest.fn(),
            logError: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            options: { type: "postgres" },
            createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    organizationRepository = module.get(getRepositoryToken(Organization));
    refreshTokenRepository = module.get(getRepositoryToken(RefreshToken));
    revokedAccessTokenRepository = module.get(
      getRepositoryToken(RevokedAccessToken),
    );
    subscriptionRepository = module.get(getRepositoryToken(Subscription));
    jwtService = module.get(JwtService);
    auditService = module.get(AuditService);
    loggingService = module.get(LoggingService);
    dataSource = module.get(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("login", () => {
    const mockUser = {
      id: mockUserId,
      tenantId: mockTenantId,
      email: mockEmail,
      passwordHash: "hashed-password",
      salt: "salt",
      role: UserRole.LAWYER,
      status: UserStatus.ACTIVE,
      failedLoginAttempts: 0,
      lockedUntil: null,
      mfaEnabled: false,
      organization: {
        id: mockTenantId,
        subscriptionPlan: "basic",
        subscriptionStatus: "active",
      },
    } as any;

    const mockLoginDto = {
      email: mockEmail,
      password: mockPassword,
    };

    beforeEach(() => {
      (validationUtil.validatePasswordStrength as jest.Mock).mockReturnValue({
        valid: true,
      });
      (cryptoUtil.verifyPassword as jest.Mock).mockResolvedValue(true);
      (cryptoUtil.generateUuid as jest.Mock).mockReturnValue("test-uuid");
      (cryptoUtil.generateDeviceFingerprint as jest.Mock).mockReturnValue(
        "test-device-id",
      );
    });

    it("should successfully login with valid credentials", async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      jwtService.generateAccessToken.mockResolvedValue("access-token");
      jwtService.generateRefreshToken.mockResolvedValue("refresh-token");
      refreshTokenRepository.save.mockResolvedValue({} as any);
      refreshTokenRepository.find.mockResolvedValue([]);
      userRepository.update.mockResolvedValue({} as any);

      const result = await service.login(
        mockLoginDto,
        mockIpAddress,
        mockUserAgent,
      );

      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
      expect(result.user.email).toBe(mockEmail);
      expect(loggingService.logAuthEvent).toHaveBeenCalledWith(
        "login",
        expect.any(Object),
      );
    });

    it("should throw UnauthorizedException for non-existent user", async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login(mockLoginDto, mockIpAddress, mockUserAgent),
      ).rejects.toThrow(UnauthorizedException);

      expect(loggingService.logAuthEvent).toHaveBeenCalledWith(
        "login_failed",
        expect.any(Object),
      );
    });

    it("should throw UnauthorizedException for suspended account", async () => {
      const suspendedUser = {
        ...mockUser,
        status: UserStatus.SUSPENDED,
      };
      userRepository.findOne.mockResolvedValue(suspendedUser);

      await expect(
        service.login(mockLoginDto, mockIpAddress, mockUserAgent),
      ).rejects.toThrow(UnauthorizedException);

      expect(loggingService.logSecurityEvent).toHaveBeenCalledWith(
        "login_attempt_suspended",
        "high",
        expect.any(Object),
      );
    });

    it("should throw UnauthorizedException for locked account", async () => {
      const lockedUser = {
        ...mockUser,
        lockedUntil: new Date(Date.now() + 30 * 60 * 1000),
      };
      userRepository.findOne.mockResolvedValue(lockedUser);

      await expect(
        service.login(mockLoginDto, mockIpAddress, mockUserAgent),
      ).rejects.toThrow(UnauthorizedException);

      expect(loggingService.logSecurityEvent).toHaveBeenCalledWith(
        "login_attempt_locked",
        "medium",
        expect.any(Object),
      );
    });

    it("should increment failed attempts on wrong password", async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      (cryptoUtil.verifyPassword as jest.Mock).mockResolvedValue(false);
      userRepository.increment.mockResolvedValue({} as any);
      userRepository.findOne.mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: 1,
      });

      await expect(
        service.login(mockLoginDto, mockIpAddress, mockUserAgent),
      ).rejects.toThrow(UnauthorizedException);

      expect(userRepository.increment).toHaveBeenCalledWith(
        { id: mockUserId },
        "failedLoginAttempts",
        1,
      );
    });

    it("should lock account after 5 failed attempts", async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      (cryptoUtil.verifyPassword as jest.Mock).mockResolvedValue(false);
      userRepository.increment.mockResolvedValue({} as any);
      userRepository.findOne.mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: 5,
      });

      await expect(
        service.login(mockLoginDto, mockIpAddress, mockUserAgent),
      ).rejects.toThrow(UnauthorizedException);

      expect(userRepository.update).toHaveBeenCalledWith(mockUserId, {
        lockedUntil: expect.any(Date),
      });
    });

    it("should require MFA code when MFA is enabled", async () => {
      const mfaUser = {
        ...mockUser,
        mfaEnabled: true,
      };
      userRepository.findOne.mockResolvedValue(mfaUser);

      await expect(
        service.login(mockLoginDto, mockIpAddress, mockUserAgent),
      ).rejects.toThrow(UnauthorizedException);

      expect(loggingService.logAuthEvent).toHaveBeenCalledWith(
        "mfa_required",
        expect.any(Object),
      );
    });
  });

  describe("refreshToken", () => {
    const mockRefreshTokenDto = {
      refreshToken: "test-refresh-token",
    };

    const mockPayload = {
      user_id: mockUserId,
      tenant_id: mockTenantId,
      token_id: "test-token-id",
      device_id: "test-device-id",
    };

    const mockRefreshTokenEntity = {
      id: "token-id",
      userId: mockUserId,
      tenantId: mockTenantId,
      token: "test-refresh-token",
      revokedAt: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      deviceInfo: {},
    };

    const mockUser = {
      id: mockUserId,
      tenantId: mockTenantId,
      email: mockEmail,
      role: UserRole.LAWYER,
      organization: {
        subscriptionPlan: "basic",
      },
    };

    beforeEach(() => {
      (cryptoUtil.generateUuid as jest.Mock).mockReturnValue("test-uuid");
      revokedAccessTokenRepository.findOne.mockResolvedValue(null);
    });

    it("should successfully refresh tokens", async () => {
      jwtService.verifyRefreshToken.mockResolvedValue(mockPayload);
      refreshTokenRepository.findOne.mockResolvedValue(
        mockRefreshTokenEntity as any,
      );
      userRepository.findOne.mockResolvedValue(mockUser as any);
      jwtService.generateAccessToken.mockResolvedValue("new-access-token");
      jwtService.generateRefreshToken.mockResolvedValue("new-refresh-token");
      refreshTokenRepository.update.mockResolvedValue({} as any);
      refreshTokenRepository.save.mockResolvedValue({} as any);

      const result = await service.refreshToken(mockRefreshTokenDto);

      expect(result).toHaveProperty("accessToken", "new-access-token");
      expect(result).toHaveProperty("refreshToken", "new-refresh-token");
    });

    it("should throw UnauthorizedException for invalid refresh token", async () => {
      jwtService.verifyRefreshToken.mockResolvedValue(mockPayload);
      refreshTokenRepository.findOne.mockResolvedValue(null);

      await expect(service.refreshToken(mockRefreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException for revoked token", async () => {
      jwtService.verifyRefreshToken.mockResolvedValue(mockPayload);
      refreshTokenRepository.findOne.mockResolvedValue({
        ...mockRefreshTokenEntity,
        revokedAt: new Date(),
      } as any);

      await expect(service.refreshToken(mockRefreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(loggingService.logSecurityEvent).toHaveBeenCalledWith(
        "revoked_refresh_token_used",
        "high",
        expect.any(Object),
      );
    });

    it("should throw UnauthorizedException for expired token", async () => {
      jwtService.verifyRefreshToken.mockResolvedValue(mockPayload);
      refreshTokenRepository.findOne.mockResolvedValue({
        ...mockRefreshTokenEntity,
        expiresAt: new Date(Date.now() - 1000),
      } as any);

      await expect(service.refreshToken(mockRefreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("registration RLS context", () => {
    it("should set tenant/user/role session context before saving organization owner during organization registration", async () => {
      const registerOrganizationDto = {
        name: "Test Org",
        email: mockEmail,
        firstName: "Test",
        lastName: "Owner",
        password: mockPassword,
      } as any;
      const mockQueryRunner = dataSource.createQueryRunner();

      (validationUtil.validatePasswordStrength as jest.Mock).mockReturnValue({
        valid: true,
      });
      (cryptoUtil.generateSalt as jest.Mock).mockResolvedValue("salt");
      (cryptoUtil.hashPassword as jest.Mock).mockResolvedValue("hash");
      (cryptoUtil.generateUuid as jest.Mock).mockReturnValue("pending-user-id");
      (cryptoUtil.generateToken as jest.Mock).mockReturnValue("verify-token");
      (mockQueryRunner.manager.create as jest.Mock)
        .mockImplementationOnce((_entity, payload) => payload)
        .mockImplementationOnce((_entity, payload) => payload)
        .mockImplementationOnce((_entity, payload) => payload);
      (mockQueryRunner.manager.save as jest.Mock)
        .mockResolvedValueOnce({ id: mockTenantId, trialEndAt: new Date() })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ id: "pending-user-id" });

      await service.registerOrganization(registerOrganizationDto);

      expect(mockQueryRunner.query).toHaveBeenCalledWith(
        expect.stringContaining("set_config('app.current_tenant_id'"),
        [mockTenantId, "pending-user-id", UserRole.ORGANIZATION_OWNER],
      );
    });

    it("should set tenant/user/role session context before saving self-register user", async () => {
      const registerDto = {
        email: mockEmail,
        password: mockPassword,
      } as any;
      const mockQueryRunner = dataSource.createQueryRunner();
      const onboardingProgressRepository = {
        save: jest.fn().mockResolvedValue({}),
      };

      userRepository.findOne.mockResolvedValue(null);
      (cryptoUtil.generateSalt as jest.Mock).mockResolvedValue("salt");
      (cryptoUtil.hashPassword as jest.Mock).mockResolvedValue("hash");
      (cryptoUtil.generateUuid as jest.Mock)
        .mockReturnValueOnce("pending-user-id")
        .mockReturnValueOnce("refresh-token-id");
      (cryptoUtil.generateToken as jest.Mock).mockReturnValue("verify-token");
      (cryptoUtil.generateDeviceFingerprint as jest.Mock).mockReturnValue(
        "device-id",
      );
      jwtService.generateAccessToken.mockResolvedValue("access-token");
      jwtService.generateRefreshToken.mockResolvedValue("refresh-token");
      refreshTokenRepository.save.mockResolvedValue({} as any);
      (mockQueryRunner.manager.getRepository as jest.Mock).mockReturnValue(
        onboardingProgressRepository,
      );
      (mockQueryRunner.manager.create as jest.Mock)
        .mockImplementationOnce((_entity, payload) => payload)
        .mockImplementationOnce((_entity, payload) => payload);
      (mockQueryRunner.manager.save as jest.Mock)
        .mockResolvedValueOnce({
          id: mockTenantId,
          subscriptionPlan: "basic",
          legalForm: "other",
          name: "Кабінет test",
        })
        .mockResolvedValueOnce({
          id: "pending-user-id",
          tenantId: mockTenantId,
          email: mockEmail,
          firstName: "Новий",
          lastName: "користувач",
          role: UserRole.ORGANIZATION_OWNER,
          emailVerified: false,
          mfaEnabled: false,
        });

      await service.register(registerDto);

      expect(mockQueryRunner.query).toHaveBeenCalledWith(
        expect.stringContaining("set_config('app.current_tenant_id'"),
        [mockTenantId, "pending-user-id", UserRole.ORGANIZATION_OWNER],
      );
      expect(onboardingProgressRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          step: "organization_details",
          completed: false,
          data: expect.objectContaining({
            capturedAtRegistration: expect.objectContaining({
              email: registerDto.email,
            }),
          }),
        }),
      );
      expect(onboardingProgressRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          step: "user_profile",
          completed: false,
          data: expect.objectContaining({
            capturedAtRegistration: expect.objectContaining({
              email: registerDto.email,
            }),
          }),
        }),
      );
    });
  });

  describe("logout", () => {
    it("should revoke refresh and access tokens on logout", async () => {
      refreshTokenRepository.update.mockResolvedValue({} as any);
      revokedAccessTokenRepository.save.mockResolvedValue({} as any);
      jwtService.decodeToken = jest.fn().mockReturnValue({
        jti: "access-jti",
        user_id: mockUserId,
        tenant_id: mockTenantId,
        exp: Math.floor(Date.now() / 1000) + 900,
      } as any);

      await service.logout(mockUserId, "access-token", {
        refreshToken: "test-token",
      });

      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        { token: "test-token" },
        { revokedAt: expect.any(Date) },
      );
      expect(revokedAccessTokenRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          jti: "access-jti",
          userId: mockUserId,
          tenantId: mockTenantId,
          reason: "logout",
        }),
      );
      expect(loggingService.logAuthEvent).toHaveBeenCalledWith("logout", {
        userId: mockUserId,
      });
    });

    it("should log logout without token", async () => {
      await service.logout(mockUserId);

      expect(loggingService.logAuthEvent).toHaveBeenCalledWith("logout", {
        userId: mockUserId,
      });
    });
  });

  describe("logoutAllDevices", () => {
    it("should invalidate user sessions and revoke all refresh tokens", async () => {
      userRepository.update.mockResolvedValue({} as any);
      refreshTokenRepository.update.mockResolvedValue({} as any);

      await service.logoutAllDevices(mockUserId);

      expect(userRepository.update).toHaveBeenCalledWith(mockUserId, {
        sessionInvalidBefore: expect.any(Date),
      });
      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({ userId: mockUserId }),
        { revokedAt: expect.any(Date) },
      );
    });
  });

  describe("forgotPassword", () => {
    const mockForgotDto = {
      email: mockEmail,
    };

    beforeEach(() => {
      (cryptoUtil.generateToken as jest.Mock).mockReturnValue("reset-token");
    });

    it("should generate reset token for existing user", async () => {
      const mockUser = {
        id: mockUserId,
        tenantId: mockTenantId,
        email: mockEmail,
      };
      userRepository.findOne.mockResolvedValue(mockUser as any);
      userRepository.update.mockResolvedValue({} as any);

      await service.forgotPassword(mockForgotDto);

      expect(userRepository.update).toHaveBeenCalledWith(mockUserId, {
        passwordResetToken: "reset-token",
        passwordResetExpiresAt: expect.any(Date),
      });
    });

    it("should not throw error for non-existent user", async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.forgotPassword(mockForgotDto),
      ).resolves.not.toThrow();
    });
  });

  describe("resetPassword", () => {
    const mockResetDto = {
      token: "reset-token",
      newPassword: "NewStrongP@ss123",
    };

    const mockUser = {
      id: mockUserId,
      tenantId: mockTenantId,
      passwordResetToken: "reset-token",
      passwordResetExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
    };

    beforeEach(() => {
      (validationUtil.validatePasswordStrength as jest.Mock).mockReturnValue({
        valid: true,
      });
      (cryptoUtil.generateSalt as jest.Mock).mockResolvedValue("new-salt");
      (cryptoUtil.hashPassword as jest.Mock).mockResolvedValue("new-hash");
    });

    it("should reset password with valid token", async () => {
      userRepository.findOne.mockResolvedValue(mockUser as any);
      userRepository.update.mockResolvedValue({} as any);
      refreshTokenRepository.update.mockResolvedValue({} as any);

      await service.resetPassword(mockResetDto);

      expect(userRepository.update).toHaveBeenCalledWith(mockUserId, {
        passwordHash: "new-hash",
        salt: "new-salt",
        passwordResetToken: undefined,
        passwordResetExpiresAt: undefined,
        lastPasswordChangeAt: expect.any(Date),
      });
      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({ userId: mockUserId }),
        { revokedAt: expect.any(Date) },
      );
      expect(loggingService.logSecurityEvent).toHaveBeenCalledWith(
        "user_sessions_invalidated",
        "medium",
        expect.objectContaining({
          userId: mockUserId,
          reason: "password_reset",
        }),
      );
    });

    it("should throw UnauthorizedException for invalid token", async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.resetPassword(mockResetDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException for expired token", async () => {
      const expiredUser = {
        ...mockUser,
        passwordResetExpiresAt: new Date(Date.now() - 1000),
      };
      userRepository.findOne.mockResolvedValue(expiredUser as any);

      await expect(service.resetPassword(mockResetDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw ConflictException for weak password", async () => {
      (validationUtil.validatePasswordStrength as jest.Mock).mockReturnValue({
        valid: false,
        errors: ["Too short"],
      });
      userRepository.findOne.mockResolvedValue(mockUser as any);

      await expect(service.resetPassword(mockResetDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe("verifyEmail", () => {
    const mockVerifyDto = {
      token: "verification-token",
    };

    const mockUser = {
      id: mockUserId,
      tenantId: mockTenantId,
      emailVerificationToken: "verification-token",
      organization: {},
    };

    it("should verify email with valid token", async () => {
      userRepository.findOne.mockResolvedValue(mockUser as any);
      userRepository.update.mockResolvedValue({} as any);

      await service.verifyEmail(mockVerifyDto);

      expect(userRepository.update).toHaveBeenCalledWith(mockUserId, {
        emailVerified: true,
        emailVerifiedAt: expect.any(Date),
        emailVerificationToken: undefined,
        status: UserStatus.ACTIVE,
      });
    });

    it("should throw UnauthorizedException for invalid token", async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.verifyEmail(mockVerifyDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("enableMfa", () => {
    const mockUser = {
      id: mockUserId,
      tenantId: mockTenantId,
    };

    beforeEach(() => {
      (cryptoUtil.generateTotpSecret as jest.Mock).mockReturnValue(
        "test-secret",
      );
      (cryptoUtil.generateMfaBackupCodes as jest.Mock).mockReturnValue([
        "code1",
        "code2",
      ]);
    });

    it("should enable MFA for user", async () => {
      userRepository.findOne.mockResolvedValue(mockUser as any);
      userRepository.update.mockResolvedValue({} as any);

      const result = await service.enableMfa(mockUserId);

      expect(result).toHaveProperty("secret", "test-secret");
      expect(result).toHaveProperty("backupCodes");
      expect(userRepository.update).toHaveBeenCalledWith(mockUserId, {
        mfaSecret: "test-secret",
        mfaBackupCodes: ["code1", "code2"],
      });
    });

    it("should throw UnauthorizedException for non-existent user", async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.enableMfa(mockUserId)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
