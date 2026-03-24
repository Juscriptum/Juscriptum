import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, MoreThan, Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { LoggingService } from "../../common/logging";
import {
  generateDeviceFingerprint,
  generateMfaBackupCodes,
  generateTotpSecret,
  generateUuid,
  generateSalt,
  hashPassword,
  verifyPassword,
} from "../../common/utils/crypto.util";
import { computePlatformAdminEmailBlindIndex } from "../../common/security/pii-protection";
import { PlatformAdminUser } from "../../database/entities/PlatformAdminUser.entity";
import { PlatformAdminRefreshToken } from "../../database/entities/PlatformAdminRefreshToken.entity";
import { PlatformAdminRevokedAccessToken } from "../../database/entities/PlatformAdminRevokedAccessToken.entity";
import {
  PlatformAdminRole,
  PlatformAdminStatus,
} from "../../database/entities/enums/platform-admin.enum";
import {
  PlatformAdminAuthResponseDto,
  PlatformAdminBootstrapDto,
  PlatformAdminBootstrapStatusDto,
  PlatformAdminConfirmMfaDto,
  PlatformAdminLoginDto,
  PlatformAdminLogoutDto,
  PlatformAdminMfaSetupResponseDto,
  PlatformAdminProfileDto,
  PlatformAdminRefreshResponseDto,
  PlatformAdminRefreshTokenDto,
  PlatformAdminVerifyMfaDto,
} from "../dto/platform-admin-login.dto";
import { PlatformAdminJwtPayload } from "../interfaces/platform-admin-jwt.interface";
import { PlatformAdminJwtService } from "./platform-admin-jwt.service";

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
  "auth.manage",
];

@Injectable()
export class PlatformAdminAuthService {
  constructor(
    @InjectRepository(PlatformAdminUser)
    private readonly platformAdminUserRepository: Repository<PlatformAdminUser>,
    @InjectRepository(PlatformAdminRefreshToken)
    private readonly platformAdminRefreshTokenRepository: Repository<PlatformAdminRefreshToken>,
    @InjectRepository(PlatformAdminRevokedAccessToken)
    private readonly platformAdminRevokedAccessTokenRepository: Repository<PlatformAdminRevokedAccessToken>,
    private readonly platformAdminJwtService: PlatformAdminJwtService,
    private readonly loggingService: LoggingService,
    private readonly configService: ConfigService,
  ) {}

  async getBootstrapStatus(): Promise<PlatformAdminBootstrapStatusDto> {
    const adminCount = await this.platformAdminUserRepository.count();
    const bootstrapEnabled = Boolean(this.getBootstrapToken());

    return {
      bootstrapRequired: adminCount === 0,
      bootstrapEnabled,
      hasPlatformAdmins: adminCount > 0,
    };
  }

  async bootstrapFirstAdmin(
    dto: PlatformAdminBootstrapDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<PlatformAdminAuthResponseDto> {
    const bootstrapToken = this.getBootstrapToken();

    if (!bootstrapToken) {
      throw new ForbiddenException(
        "Platform admin bootstrap is not enabled on this environment",
      );
    }

    if (dto.bootstrapToken.trim() !== bootstrapToken) {
      this.loggingService.logSecurityEvent(
        "platform_admin_bootstrap_denied",
        "high",
        {
          ipAddress,
          userAgent,
          reason: "invalid_bootstrap_token",
        },
      );
      throw new ForbiddenException("Invalid platform admin bootstrap token");
    }

    const adminCount = await this.platformAdminUserRepository.count();
    if (adminCount > 0) {
      throw new ConflictException(
        "Platform admin bootstrap has already been completed",
      );
    }

    const normalizedEmail = dto.email.trim().toLowerCase();
    const emailBlindIndex =
      computePlatformAdminEmailBlindIndex(normalizedEmail);

    if (!emailBlindIndex) {
      throw new ConflictException("Unable to prepare platform admin email");
    }

    const existingAdmin = await this.platformAdminUserRepository.findOne({
      where: { emailBlindIndex },
    });

    if (existingAdmin) {
      throw new ConflictException(
        "A platform admin with this email already exists",
      );
    }

    const salt = await generateSalt();
    const passwordHash = await hashPassword(dto.password, salt);

    const savedAdmin = await this.platformAdminUserRepository.save({
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      email: normalizedEmail,
      emailBlindIndex,
      passwordHash,
      salt,
      role: PlatformAdminRole.PLATFORM_OWNER,
      status: PlatformAdminStatus.ACTIVE,
      permissions: [...DEFAULT_PLATFORM_OWNER_PERMISSIONS],
      mfaEnabled: false,
      failedLoginAttempts: 0,
      lastPasswordChangeAt: new Date(),
      metadata: {
        bootstrapCreatedAt: new Date().toISOString(),
        bootstrapIpAddress: ipAddress,
      },
    } as Partial<PlatformAdminUser>);

    this.loggingService.logSecurityEvent(
      "platform_admin_bootstrap_completed",
      "high",
      {
        adminId: savedAdmin.id,
        email: normalizedEmail,
        ipAddress,
        userAgent,
      },
    );

    return this.issueSession(savedAdmin, ipAddress, userAgent, "password");
  }

  async login(
    dto: PlatformAdminLoginDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<PlatformAdminAuthResponseDto> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const emailBlindIndex =
      computePlatformAdminEmailBlindIndex(normalizedEmail);
    const admin = emailBlindIndex
      ? await this.platformAdminUserRepository.findOne({
          where: { emailBlindIndex },
        })
      : null;

    if (!admin) {
      this.loggingService.logAuthEvent("login_failed", {
        authScope: "platform_admin",
        email: normalizedEmail,
        ipAddress,
        userAgent,
      });

      throw new UnauthorizedException("Невірний email або пароль");
    }

    this.assertAdminCanAuthenticate(admin, ipAddress, userAgent);

    const validPassword = await verifyPassword(
      dto.password,
      admin.salt,
      admin.passwordHash,
    );

    if (!validPassword) {
      await this.handleFailedPassword(admin, ipAddress, userAgent);
      throw new UnauthorizedException("Невірний email або пароль");
    }

    if (admin.mfaEnabled) {
      const mfaToken = await this.platformAdminJwtService.generateMfaToken({
        admin_id: admin.id,
        email: admin.email,
      });

      this.loggingService.logAuthEvent("mfa_required", {
        authScope: "platform_admin",
        adminId: admin.id,
        ipAddress,
        userAgent,
      });

      return {
        mfaRequired: true,
        mfaToken,
        mfaTokenExpiresIn:
          this.platformAdminJwtService.getMfaTokenExpiresInSeconds(),
      };
    }

    return this.issueSession(admin, ipAddress, userAgent, "password");
  }

  async verifyMfa(
    dto: PlatformAdminVerifyMfaDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<PlatformAdminAuthResponseDto> {
    const payload = await this.platformAdminJwtService.verifyMfaToken(
      dto.mfaToken,
    );

    const admin = await this.platformAdminUserRepository.findOne({
      where: { id: payload.admin_id },
    });

    if (!admin) {
      throw new UnauthorizedException("Platform admin user not found");
    }

    this.assertAdminCanAuthenticate(admin, ipAddress, userAgent);

    if (!admin.mfaEnabled) {
      throw new UnauthorizedException("MFA is not enabled for this account");
    }

    const mfaValid = await this.verifyMfaCode(admin, dto.code);
    if (!mfaValid) {
      this.loggingService.logSecurityEvent(
        "platform_admin_mfa_failed",
        "high",
        {
          adminId: admin.id,
          ipAddress,
          userAgent,
        },
      );
      throw new UnauthorizedException("Невірний MFA код");
    }

    this.loggingService.logAuthEvent("mfa_verified", {
      authScope: "platform_admin",
      adminId: admin.id,
      ipAddress,
      userAgent,
    });

    return this.issueSession(admin, ipAddress, userAgent, "mfa");
  }

  async setupMfa(adminId: string): Promise<PlatformAdminMfaSetupResponseDto> {
    const admin = await this.platformAdminUserRepository.findOne({
      where: { id: adminId },
    });

    if (!admin) {
      throw new UnauthorizedException("Platform admin user not found");
    }

    if (admin.mfaEnabled) {
      throw new ConflictException("MFA is already enabled for this account");
    }

    const secret = generateTotpSecret();
    const backupCodes = generateMfaBackupCodes();
    const issuer = this.configService.get<string>(
      "PLATFORM_ADMIN_MFA_ISSUER",
      "Law Organizer Platform Admin",
    );
    const label = admin.email;
    const otpauthUrl = await this.generateOtpAuthUrl(secret, issuer, label);
    const qrCodeDataUrl = await this.generateQrCodeDataUrl(otpauthUrl);

    await this.platformAdminUserRepository.update(admin.id, {
      mfaSecret: secret,
      mfaBackupCodes: backupCodes,
      metadata: {
        ...(admin.metadata || {}),
        mfaSetupIssuedAt: new Date().toISOString(),
      },
    });

    this.loggingService.logSecurityEvent(
      "platform_admin_mfa_setup_started",
      "medium",
      {
        adminId: admin.id,
      },
    );

    return {
      issuer,
      label,
      secret,
      otpauthUrl,
      qrCodeDataUrl,
      backupCodes,
    };
  }

  async confirmMfa(
    adminId: string,
    dto: PlatformAdminConfirmMfaDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<PlatformAdminAuthResponseDto> {
    const admin = await this.platformAdminUserRepository.findOne({
      where: { id: adminId },
    });

    if (!admin) {
      throw new UnauthorizedException("Platform admin user not found");
    }

    if (admin.mfaEnabled) {
      throw new ConflictException("MFA is already enabled for this account");
    }

    if (!admin.mfaSecret) {
      throw new ConflictException(
        "MFA setup must be started before confirmation",
      );
    }

    const validCode = await this.validateTotpCode(admin.mfaSecret, dto.code);
    if (!validCode) {
      this.loggingService.logSecurityEvent(
        "platform_admin_mfa_setup_failed",
        "high",
        {
          adminId,
          ipAddress,
          userAgent,
        },
      );
      throw new UnauthorizedException("Невірний MFA код");
    }

    await this.platformAdminUserRepository.update(admin.id, {
      mfaEnabled: true,
      metadata: {
        ...(admin.metadata || {}),
        mfaSetupConfirmedAt: new Date().toISOString(),
      },
    });

    await this.revokeAllSessions(admin.id, "platform_admin_mfa_enabled");

    this.loggingService.logSecurityEvent("platform_admin_mfa_enabled", "high", {
      adminId: admin.id,
      ipAddress,
      userAgent,
    });

    const freshAdmin = await this.platformAdminUserRepository.findOne({
      where: { id: admin.id },
    });

    if (!freshAdmin) {
      throw new UnauthorizedException("Platform admin user not found");
    }

    return this.issueSession(freshAdmin, ipAddress, userAgent, "mfa");
  }

  async refreshToken(
    dto: PlatformAdminRefreshTokenDto,
  ): Promise<PlatformAdminRefreshResponseDto> {
    const payload = await this.platformAdminJwtService.verifyRefreshToken(
      dto.refreshToken,
    );

    const refreshTokenEntity =
      await this.platformAdminRefreshTokenRepository.findOne({
        where: { token: dto.refreshToken },
      });

    if (!refreshTokenEntity) {
      this.loggingService.logSecurityEvent(
        "platform_admin_invalid_refresh_token",
        "medium",
        { adminId: payload.admin_id },
      );
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (refreshTokenEntity.revokedAt) {
      throw new UnauthorizedException("Refresh token revoked");
    }

    if (refreshTokenEntity.expiresAt < new Date()) {
      throw new UnauthorizedException("Refresh token expired");
    }

    const admin = await this.platformAdminUserRepository.findOne({
      where: { id: payload.admin_id },
    });

    if (!admin || admin.status !== PlatformAdminStatus.ACTIVE) {
      throw new UnauthorizedException("Platform admin user is not active");
    }

    const deviceId = payload.device_id;
    const accessToken = await this.platformAdminJwtService.generateAccessToken({
      admin_id: admin.id,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions || [],
      mfa_level: admin.mfaEnabled ? "mfa" : "password",
    });

    const refreshToken =
      await this.platformAdminJwtService.generateRefreshToken({
        admin_id: admin.id,
        token_id: generateUuid(),
        device_id: deviceId,
      });

    await this.platformAdminRefreshTokenRepository.update(
      { id: refreshTokenEntity.id },
      { revokedAt: new Date() },
    );

    await this.platformAdminRefreshTokenRepository.save({
      platformAdminUserId: admin.id,
      token: refreshToken,
      deviceInfo: refreshTokenEntity.deviceInfo,
      ipAddress: refreshTokenEntity.ipAddress,
      userAgent: refreshTokenEntity.userAgent,
      expiresAt: this.getRefreshTokenExpiryDate(),
      replacedBy: refreshTokenEntity.id,
    });

    this.loggingService.logAuthEvent("token_refresh", {
      authScope: "platform_admin",
      adminId: admin.id,
      deviceId,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.platformAdminJwtService.getAccessTokenExpiresInSeconds(),
    };
  }

  async logout(
    adminId: string,
    accessToken: string | undefined,
    dto?: PlatformAdminLogoutDto,
  ): Promise<void> {
    if (dto?.refreshToken) {
      await this.platformAdminRefreshTokenRepository.update(
        {
          token: dto.refreshToken,
          platformAdminUserId: adminId,
        },
        { revokedAt: new Date() },
      );
    }

    if (accessToken) {
      const decoded =
        this.platformAdminJwtService.decodeToken<PlatformAdminJwtPayload>(
          accessToken,
        );

      if (decoded?.jti && decoded?.exp) {
        await this.platformAdminRevokedAccessTokenRepository.save({
          jti: decoded.jti,
          platformAdminUserId: adminId,
          expiresAt: new Date(decoded.exp * 1000),
          reason: dto?.mfaReason || "platform_admin_logout",
        });
      }
    }

    this.loggingService.logAuthEvent("logout", {
      authScope: "platform_admin",
      adminId,
    });
  }

  async getCurrentAdmin(adminId: string): Promise<PlatformAdminProfileDto> {
    const admin = await this.platformAdminUserRepository.findOne({
      where: { id: adminId },
    });

    if (!admin) {
      throw new UnauthorizedException("Platform admin user not found");
    }

    return this.mapAdminProfile(admin);
  }

  async revokeAllSessions(adminId: string, reason: string): Promise<void> {
    await this.platformAdminRefreshTokenRepository.update(
      { platformAdminUserId: adminId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );

    await this.platformAdminUserRepository.update(adminId, {
      sessionInvalidBefore: new Date(),
    });

    this.loggingService.logSecurityEvent(
      "platform_admin_sessions_revoked",
      "high",
      {
        adminId,
        reason,
      },
    );
  }

  private assertAdminCanAuthenticate(
    admin: PlatformAdminUser,
    ipAddress: string,
    userAgent: string,
  ): void {
    if (admin.status !== PlatformAdminStatus.ACTIVE) {
      this.loggingService.logSecurityEvent(
        "platform_admin_login_blocked_inactive",
        "high",
        {
          adminId: admin.id,
          status: admin.status,
          ipAddress,
          userAgent,
        },
      );

      throw new ForbiddenException("Platform admin account is not active");
    }

    if (admin.lockedUntil && admin.lockedUntil > new Date()) {
      this.loggingService.logSecurityEvent(
        "platform_admin_login_blocked_locked",
        "high",
        {
          adminId: admin.id,
          lockedUntil: admin.lockedUntil.toISOString(),
          ipAddress,
          userAgent,
        },
      );

      throw new UnauthorizedException(
        "Забагато невдалих спроб. Акаунт тимчасово заблоковано.",
      );
    }
  }

  private async handleFailedPassword(
    admin: PlatformAdminUser,
    ipAddress: string,
    userAgent: string,
  ): Promise<void> {
    await this.platformAdminUserRepository.increment(
      { id: admin.id },
      "failedLoginAttempts",
      1,
    );

    const updatedAdmin = await this.platformAdminUserRepository.findOne({
      where: { id: admin.id },
    });

    if ((updatedAdmin?.failedLoginAttempts || 0) >= 5) {
      const lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      await this.platformAdminUserRepository.update(admin.id, {
        lockedUntil,
      });

      this.loggingService.logSecurityEvent(
        "platform_admin_account_locked",
        "high",
        {
          adminId: admin.id,
          ipAddress,
          userAgent,
          lockedUntil: lockedUntil.toISOString(),
        },
      );
      return;
    }

    this.loggingService.logAuthEvent("login_failed", {
      authScope: "platform_admin",
      adminId: admin.id,
      ipAddress,
      userAgent,
      failedAttempts: updatedAdmin?.failedLoginAttempts || 1,
    });
  }

  private async issueSession(
    admin: PlatformAdminUser,
    ipAddress: string,
    userAgent: string,
    mfaLevel: "password" | "mfa",
  ): Promise<PlatformAdminAuthResponseDto> {
    const deviceId = generateDeviceFingerprint(userAgent, ipAddress);

    await this.platformAdminUserRepository.update(admin.id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress,
    });

    const accessToken = await this.platformAdminJwtService.generateAccessToken({
      admin_id: admin.id,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions || [],
      mfa_level: mfaLevel,
    });

    const refreshToken =
      await this.platformAdminJwtService.generateRefreshToken({
        admin_id: admin.id,
        token_id: generateUuid(),
        device_id: deviceId,
      });

    await this.platformAdminRefreshTokenRepository.save({
      platformAdminUserId: admin.id,
      token: refreshToken,
      deviceInfo: { userAgent, ipAddress, deviceId },
      ipAddress,
      userAgent,
      expiresAt: this.getRefreshTokenExpiryDate(),
    });

    await this.limitRefreshTokens(admin.id);

    this.loggingService.logAuthEvent("login", {
      authScope: "platform_admin",
      adminId: admin.id,
      ipAddress,
      userAgent,
      deviceId,
      mfaLevel,
    });

    const freshAdmin = await this.platformAdminUserRepository.findOne({
      where: { id: admin.id },
    });

    return {
      mfaRequired: false,
      accessToken,
      refreshToken,
      expiresIn: this.platformAdminJwtService.getAccessTokenExpiresInSeconds(),
      admin: this.mapAdminProfile(freshAdmin || admin),
    };
  }

  private async verifyMfaCode(
    admin: PlatformAdminUser,
    code: string,
  ): Promise<boolean> {
    if (!admin.mfaSecret) {
      return false;
    }

    if (await this.validateTotpCode(admin.mfaSecret, code)) {
      return true;
    }

    if (admin.mfaBackupCodes?.includes(code)) {
      const updatedBackupCodes = admin.mfaBackupCodes.filter(
        (item) => item !== code,
      );
      await this.platformAdminUserRepository.update(admin.id, {
        mfaBackupCodes: updatedBackupCodes,
      });

      this.loggingService.logSecurityEvent(
        "platform_admin_backup_code_used",
        "medium",
        {
          adminId: admin.id,
          remainingCodes: updatedBackupCodes.length,
        },
      );

      return true;
    }

    return false;
  }

  private async validateTotpCode(
    secret: string,
    code: string,
  ): Promise<boolean> {
    const { TOTP } = await import("otpauth");
    const totp = new TOTP({
      secret,
      digits: 6,
      period: 30,
    });

    const delta = totp.validate({ token: code, window: 2 });
    return delta !== null;
  }

  private async limitRefreshTokens(
    adminId: string,
    maxTokens: number = 5,
  ): Promise<void> {
    const tokens = await this.platformAdminRefreshTokenRepository.find({
      where: {
        platformAdminUserId: adminId,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: "DESC" },
    });

    if (tokens.length <= maxTokens) {
      return;
    }

    const staleTokens = tokens.slice(maxTokens);

    await Promise.all(
      staleTokens.map((token) =>
        this.platformAdminRefreshTokenRepository.update(token.id, {
          revokedAt: new Date(),
        }),
      ),
    );
  }

  private getRefreshTokenExpiryDate(): Date {
    const rawExpiry = this.configService.get<string>(
      "PLATFORM_ADMIN_JWT_REFRESH_TOKEN_EXPIRY",
      "7d",
    );
    const amount = rawExpiry.match(/^(\d+)([dhm])$/i);

    if (!amount) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const value = Number(amount[1]);
    const unit = amount[2].toLowerCase();
    const multiplier =
      unit === "d"
        ? 24 * 60 * 60 * 1000
        : unit === "h"
          ? 60 * 60 * 1000
          : 60 * 1000;

    return new Date(Date.now() + value * multiplier);
  }

  private mapAdminProfile(admin: PlatformAdminUser): PlatformAdminProfileDto {
    return {
      id: admin.id,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      role: admin.role,
      permissions: admin.permissions || [],
      mfaEnabled: admin.mfaEnabled,
      status: admin.status,
      lastLoginAt: admin.lastLoginAt?.toISOString(),
    };
  }

  private getBootstrapToken(): string | null {
    return (
      this.configService
        .get<string>("PLATFORM_ADMIN_BOOTSTRAP_TOKEN")
        ?.trim() || null
    );
  }

  private async generateOtpAuthUrl(
    secret: string,
    issuer: string,
    label: string,
  ): Promise<string> {
    const { TOTP } = await import("otpauth");
    const totp = new TOTP({
      issuer,
      label,
      secret,
      digits: 6,
      period: 30,
    });

    return totp.toString();
  }

  private async generateQrCodeDataUrl(payload: string): Promise<string> {
    const QRCode = await import("qrcode");
    return QRCode.toDataURL(payload, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 240,
    });
  }
}
