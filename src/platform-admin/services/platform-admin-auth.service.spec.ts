import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { Repository } from "typeorm";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { LoggingService } from "../../common/logging";
import { PlatformAdminUser } from "../../database/entities/PlatformAdminUser.entity";
import { PlatformAdminRefreshToken } from "../../database/entities/PlatformAdminRefreshToken.entity";
import { PlatformAdminRevokedAccessToken } from "../../database/entities/PlatformAdminRevokedAccessToken.entity";
import {
  PlatformAdminRole,
  PlatformAdminStatus,
} from "../../database/entities/enums/platform-admin.enum";
import { PlatformAdminJwtService } from "./platform-admin-jwt.service";
import { PlatformAdminAuthService } from "./platform-admin-auth.service";
import * as cryptoUtil from "../../common/utils/crypto.util";

jest.mock("../../common/utils/crypto.util");

describe("PlatformAdminAuthService", () => {
  let service: PlatformAdminAuthService;
  let platformAdminUserRepository: jest.Mocked<Repository<PlatformAdminUser>>;
  let platformAdminRefreshTokenRepository: jest.Mocked<
    Repository<PlatformAdminRefreshToken>
  >;
  let platformAdminRevokedAccessTokenRepository: jest.Mocked<
    Repository<PlatformAdminRevokedAccessToken>
  >;
  let platformAdminJwtService: jest.Mocked<PlatformAdminJwtService>;
  let loggingService: jest.Mocked<LoggingService>;
  let configService: jest.Mocked<ConfigService>;

  const mockAdmin = {
    id: "platform-admin-1",
    firstName: "Portal",
    lastName: "Owner",
    email: "owner@example.com",
    salt: "salt",
    passwordHash: "hash",
    role: PlatformAdminRole.PLATFORM_OWNER,
    status: PlatformAdminStatus.ACTIVE,
    permissions: ["organizations.read", "organizations.write"],
    mfaEnabled: false,
    mfaSecret: null,
    mfaBackupCodes: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    lastLoginIp: null,
  } as unknown as PlatformAdminUser;

  beforeEach(async () => {
    const createRepository = () => ({
      count: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      increment: jest.fn(),
      find: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlatformAdminAuthService,
        {
          provide: getRepositoryToken(PlatformAdminUser),
          useFactory: createRepository,
        },
        {
          provide: getRepositoryToken(PlatformAdminRefreshToken),
          useFactory: createRepository,
        },
        {
          provide: getRepositoryToken(PlatformAdminRevokedAccessToken),
          useFactory: createRepository,
        },
        {
          provide: PlatformAdminJwtService,
          useValue: {
            generateAccessToken: jest.fn(),
            generateRefreshToken: jest.fn(),
            generateMfaToken: jest.fn(),
            verifyRefreshToken: jest.fn(),
            verifyMfaToken: jest.fn(),
            decodeToken: jest.fn(),
            getAccessTokenExpiresInSeconds: jest.fn().mockReturnValue(900),
            getMfaTokenExpiresInSeconds: jest.fn().mockReturnValue(300),
          },
        },
        {
          provide: LoggingService,
          useValue: {
            logAuthEvent: jest.fn(),
            logSecurityEvent: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest
              .fn()
              .mockImplementation((key: string, fallback?: string) =>
                key === "PLATFORM_ADMIN_JWT_REFRESH_TOKEN_EXPIRY"
                  ? "7d"
                  : fallback,
              ),
          },
        },
      ],
    }).compile();

    service = module.get(PlatformAdminAuthService);
    platformAdminUserRepository = module.get(
      getRepositoryToken(PlatformAdminUser),
    );
    platformAdminRefreshTokenRepository = module.get(
      getRepositoryToken(PlatformAdminRefreshToken),
    );
    platformAdminRevokedAccessTokenRepository = module.get(
      getRepositoryToken(PlatformAdminRevokedAccessToken),
    );
    platformAdminJwtService = module.get(PlatformAdminJwtService);
    loggingService = module.get(LoggingService);
    configService = module.get(ConfigService);

    (cryptoUtil.verifyPassword as jest.Mock).mockResolvedValue(true);
    (cryptoUtil.generateUuid as jest.Mock).mockReturnValue("generated-uuid");
    (cryptoUtil.generateDeviceFingerprint as jest.Mock).mockReturnValue(
      "device-1",
    );
    (cryptoUtil.generateSalt as jest.Mock).mockResolvedValue("bootstrap-salt");
    (cryptoUtil.hashPassword as jest.Mock).mockResolvedValue("bootstrap-hash");
    (cryptoUtil.generateTotpSecret as jest.Mock).mockReturnValue("MFASECRET");
    (cryptoUtil.generateMfaBackupCodes as jest.Mock).mockReturnValue([
      "ABCD-1234",
      "EFGH-5678",
    ]);
    platformAdminUserRepository.count.mockResolvedValue(1);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("issues a session when platform admin login succeeds without MFA", async () => {
    platformAdminUserRepository.findOne
      .mockResolvedValueOnce(mockAdmin)
      .mockResolvedValueOnce(mockAdmin);
    platformAdminJwtService.generateAccessToken.mockResolvedValue("access");
    platformAdminJwtService.generateRefreshToken.mockResolvedValue("refresh");
    platformAdminRefreshTokenRepository.save.mockResolvedValue({} as any);
    platformAdminRefreshTokenRepository.find.mockResolvedValue([]);
    platformAdminUserRepository.update.mockResolvedValue({} as any);

    const result = await service.login(
      {
        email: mockAdmin.email,
        password: "StrongPassword123",
      },
      "127.0.0.1",
      "jest-agent",
    );

    expect(result.mfaRequired).toBe(false);
    expect(result.accessToken).toBe("access");
    expect(result.refreshToken).toBe("refresh");
    expect(result.admin?.id).toBe(mockAdmin.id);
  });

  it("reports bootstrap availability when no platform admins exist", async () => {
    platformAdminUserRepository.count.mockResolvedValue(0);

    const result = await service.getBootstrapStatus();

    expect(result).toEqual({
      bootstrapRequired: true,
      bootstrapEnabled: false,
      hasPlatformAdmins: false,
    });
  });

  it("bootstraps the first platform owner and issues a session", async () => {
    platformAdminUserRepository.count.mockResolvedValue(0);
    platformAdminUserRepository.findOne.mockResolvedValueOnce(null);
    platformAdminUserRepository.save.mockImplementation(
      async (entity) =>
        ({
          id: mockAdmin.id,
          role: PlatformAdminRole.PLATFORM_OWNER,
          status: PlatformAdminStatus.ACTIVE,
          permissions: ["dashboard.read"],
          mfaEnabled: false,
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: null,
          lastLoginIp: null,
          ...entity,
        }) as PlatformAdminUser,
    );
    platformAdminUserRepository.findOne.mockResolvedValueOnce({
      ...mockAdmin,
      permissions: ["dashboard.read"],
      mfaEnabled: false,
    } as PlatformAdminUser);
    platformAdminJwtService.generateAccessToken.mockResolvedValue("access");
    platformAdminJwtService.generateRefreshToken.mockResolvedValue("refresh");
    platformAdminRefreshTokenRepository.save.mockResolvedValue({} as any);
    platformAdminRefreshTokenRepository.find.mockResolvedValue([]);
    platformAdminUserRepository.update.mockResolvedValue({} as any);
    const getSpy = jest
      .spyOn(configService, "get")
      .mockImplementation((key: string, fallback?: unknown) =>
        key === "PLATFORM_ADMIN_BOOTSTRAP_TOKEN"
          ? "bootstrap-secret-token-value"
          : key === "PLATFORM_ADMIN_JWT_REFRESH_TOKEN_EXPIRY"
            ? "7d"
            : fallback,
      );

    const result = await service.bootstrapFirstAdmin(
      {
        bootstrapToken: "bootstrap-secret-token-value",
        firstName: "Portal",
        lastName: "Owner",
        email: "owner@example.com",
        password: "StrongPassword123!",
      },
      "127.0.0.1",
      "jest-agent",
    );

    expect(result.accessToken).toBe("access");
    expect(platformAdminUserRepository.save).toHaveBeenCalled();
    getSpy.mockRestore();
  });

  it("refuses bootstrap after the first platform admin exists", async () => {
    platformAdminUserRepository.count.mockResolvedValue(1);
    const getSpy = jest
      .spyOn(configService, "get")
      .mockImplementation((key: string, fallback?: unknown) =>
        key === "PLATFORM_ADMIN_BOOTSTRAP_TOKEN"
          ? "bootstrap-secret-token-value"
          : fallback,
      );

    await expect(
      service.bootstrapFirstAdmin(
        {
          bootstrapToken: "bootstrap-secret-token-value",
          firstName: "Portal",
          lastName: "Owner",
          email: "owner@example.com",
          password: "StrongPassword123!",
        },
        "127.0.0.1",
        "jest-agent",
      ),
    ).rejects.toThrow(ConflictException);

    getSpy.mockRestore();
  });

  it("returns an MFA challenge when MFA is enabled", async () => {
    platformAdminUserRepository.findOne.mockResolvedValue({
      ...mockAdmin,
      mfaEnabled: true,
      mfaSecret: "MFASECRET",
    } as PlatformAdminUser);
    platformAdminJwtService.generateMfaToken.mockResolvedValue("mfa-token");

    const result = await service.login(
      {
        email: mockAdmin.email,
        password: "StrongPassword123",
      },
      "127.0.0.1",
      "jest-agent",
    );

    expect(result).toEqual({
      mfaRequired: true,
      mfaToken: "mfa-token",
      mfaTokenExpiresIn: 300,
    });
  });

  it("completes MFA verification and issues a session", async () => {
    platformAdminJwtService.verifyMfaToken.mockResolvedValue({
      admin_id: mockAdmin.id,
      email: mockAdmin.email,
      scope: "platform_admin",
      token_type: "mfa",
    });
    platformAdminUserRepository.findOne
      .mockResolvedValueOnce({
        ...mockAdmin,
        mfaEnabled: true,
        mfaSecret: "MFASECRET",
      } as PlatformAdminUser)
      .mockResolvedValueOnce(mockAdmin);
    jest
      .spyOn(service as any, "verifyMfaCode")
      .mockResolvedValue(true as never);
    platformAdminJwtService.generateAccessToken.mockResolvedValue("access");
    platformAdminJwtService.generateRefreshToken.mockResolvedValue("refresh");
    platformAdminRefreshTokenRepository.save.mockResolvedValue({} as any);
    platformAdminRefreshTokenRepository.find.mockResolvedValue([]);
    platformAdminUserRepository.update.mockResolvedValue({} as any);

    const result = await service.verifyMfa(
      {
        mfaToken: "mfa-token",
        code: "123456",
      },
      "127.0.0.1",
      "jest-agent",
    );

    expect(result.mfaRequired).toBe(false);
    expect(result.accessToken).toBe("access");
    expect(platformAdminJwtService.verifyMfaToken).toHaveBeenCalledWith(
      "mfa-token",
    );
  });

  it("creates a fresh MFA enrollment kit for a password-only admin session", async () => {
    platformAdminUserRepository.findOne.mockResolvedValue({
      ...mockAdmin,
      metadata: null,
      mfaEnabled: false,
    } as PlatformAdminUser);
    platformAdminUserRepository.update.mockResolvedValue({} as any);
    jest
      .spyOn(service as any, "generateOtpAuthUrl")
      .mockResolvedValue("otpauth://platform-admin");
    jest
      .spyOn(service as any, "generateQrCodeDataUrl")
      .mockResolvedValue("data:image/png;base64,qr");

    const result = await service.setupMfa(mockAdmin.id);

    expect(result.secret).toBe("MFASECRET");
    expect(result.backupCodes).toEqual(["ABCD-1234", "EFGH-5678"]);
    expect(platformAdminUserRepository.update).toHaveBeenCalledWith(
      mockAdmin.id,
      expect.objectContaining({
        mfaSecret: "MFASECRET",
      }),
    );
  });

  it("confirms MFA enrollment and rotates into an MFA session", async () => {
    platformAdminUserRepository.findOne
      .mockResolvedValueOnce({
        ...mockAdmin,
        mfaEnabled: false,
        mfaSecret: "MFASECRET",
        metadata: null,
      } as PlatformAdminUser)
      .mockResolvedValueOnce({
        ...mockAdmin,
        mfaEnabled: true,
        mfaSecret: "MFASECRET",
        metadata: null,
      } as PlatformAdminUser)
      .mockResolvedValueOnce({
        ...mockAdmin,
        mfaEnabled: true,
        mfaSecret: "MFASECRET",
        metadata: null,
      } as PlatformAdminUser);
    platformAdminUserRepository.update.mockResolvedValue({} as any);
    platformAdminRefreshTokenRepository.update.mockResolvedValue({} as any);
    platformAdminJwtService.generateAccessToken.mockResolvedValue("mfa-access");
    platformAdminJwtService.generateRefreshToken.mockResolvedValue(
      "mfa-refresh",
    );
    platformAdminRefreshTokenRepository.save.mockResolvedValue({} as any);
    platformAdminRefreshTokenRepository.find.mockResolvedValue([]);
    jest
      .spyOn(service as any, "validateTotpCode")
      .mockResolvedValue(true as never);

    const result = await service.confirmMfa(
      mockAdmin.id,
      { code: "123456" },
      "127.0.0.1",
      "jest-agent",
    );

    expect(result.accessToken).toBe("mfa-access");
    expect(platformAdminRefreshTokenRepository.update).toHaveBeenCalled();
  });

  it("refreshes a valid platform-admin token pair", async () => {
    platformAdminJwtService.verifyRefreshToken.mockResolvedValue({
      admin_id: mockAdmin.id,
      scope: "platform_admin",
      token_type: "refresh",
      token_id: "refresh-1",
      device_id: "device-1",
    });
    platformAdminRefreshTokenRepository.findOne.mockResolvedValue({
      id: "token-1",
      platformAdminUserId: mockAdmin.id,
      token: "refresh-token",
      deviceInfo: {},
      ipAddress: "127.0.0.1",
      userAgent: "jest-agent",
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    } as PlatformAdminRefreshToken);
    platformAdminUserRepository.findOne.mockResolvedValue(mockAdmin);
    platformAdminJwtService.generateAccessToken.mockResolvedValue(
      "next-access",
    );
    platformAdminJwtService.generateRefreshToken.mockResolvedValue(
      "next-refresh",
    );
    platformAdminRefreshTokenRepository.update.mockResolvedValue({} as any);
    platformAdminRefreshTokenRepository.save.mockResolvedValue({} as any);

    const result = await service.refreshToken({
      refreshToken: "refresh-token",
    });

    expect(result).toEqual({
      accessToken: "next-access",
      refreshToken: "next-refresh",
      expiresIn: 900,
    });
  });

  it("rejects login when password is invalid", async () => {
    platformAdminUserRepository.findOne
      .mockResolvedValueOnce(mockAdmin)
      .mockResolvedValueOnce({
        ...mockAdmin,
        failedLoginAttempts: 1,
      } as PlatformAdminUser);
    (cryptoUtil.verifyPassword as jest.Mock).mockResolvedValue(false);
    platformAdminUserRepository.increment.mockResolvedValue({} as any);

    await expect(
      service.login(
        {
          email: mockAdmin.email,
          password: "wrong-password",
        },
        "127.0.0.1",
        "jest-agent",
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("revokes current access token on logout when a jti is present", async () => {
    platformAdminJwtService.decodeToken.mockReturnValue({
      admin_id: mockAdmin.id,
      scope: "platform_admin",
      token_type: "access",
      role: mockAdmin.role,
      permissions: [],
      email: mockAdmin.email,
      mfa_level: "password",
      jti: "access-jti",
      exp: Math.floor(Date.now() / 1000) + 60,
    });
    platformAdminRevokedAccessTokenRepository.save.mockResolvedValue({} as any);

    await service.logout(mockAdmin.id, "access-token", {
      refreshToken: "refresh-token",
    });

    expect(platformAdminRevokedAccessTokenRepository.save).toHaveBeenCalled();
    expect(platformAdminRefreshTokenRepository.update).toHaveBeenCalled();
  });
});
