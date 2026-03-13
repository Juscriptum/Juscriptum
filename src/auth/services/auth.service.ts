import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, IsNull, QueryRunner } from "typeorm";
import { User } from "../../database/entities/User.entity";
import { Organization } from "../../database/entities/Organization.entity";
import { RefreshToken } from "../../database/entities/RefreshToken.entity";
import { RevokedAccessToken } from "../../database/entities/RevokedAccessToken.entity";
import { Subscription } from "../../database/entities/Subscription.entity";
import {
  SubscriptionPlan,
  SubscriptionStatus,
  SubscriptionProvider,
  UserRole,
  UserStatus,
  AuditAction,
} from "../../database/entities/enums/subscription.enum";
import { JwtPayload, RefreshTokenPayload } from "../interfaces/jwt.interface";
import { LoginDto, LoginResponseDto } from "../dto/login.dto";
import { RegisterDto, RegisterOrganizationDto } from "../dto/register.dto";
import {
  RefreshTokenDto,
  RefreshTokenResponseDto,
  LogoutDto,
} from "../dto/refresh-token.dto";
import {
  ForgotPasswordDto,
  ResetPasswordDto,
} from "../dto/forgot-password.dto";
import { VerifyEmailDto } from "../dto/verify-email.dto";
import { JwtService } from "./jwt.service";
import {
  generateSalt,
  hashPassword,
  verifyPassword,
  generateToken,
  generateUuid,
  generateDeviceFingerprint,
  generateTotpSecret,
  generateMfaBackupCodes,
} from "../../common/utils/crypto.util";
import { validatePasswordStrength } from "../../common/utils/validation.util";
import { AuditService } from "./audit.service";
import { LoggingService } from "../../common/logging";
import { computeEmailBlindIndex } from "../../common/security/pii-protection";

/**
 * Auth Service
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(RevokedAccessToken)
    private readonly revokedAccessTokenRepository: Repository<RevokedAccessToken>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
    private readonly loggingService: LoggingService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Register organization with admin user
   */
  async registerOrganization(
    dto: RegisterOrganizationDto,
  ): Promise<{ organizationId: string; userId: string }> {
    // Validate password strength
    const passwordValidation = validatePasswordStrength(dto.password);
    if (!passwordValidation.valid) {
      this.loggingService.logAuthEvent("login_failed", {
        email: dto.email,
        reason: "Password too weak",
      });
      throw new ConflictException(
        "Password too weak: " + passwordValidation.errors.join(", "),
      );
    }

    this.loggingService.debug("Starting organization registration", {
      email: dto.email,
      organizationName: dto.name,
    });

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create organization
      const organizationData = {
        name: dto.name,
        legalForm: (dto.legalForm ?? "sole_proprietor") as
          | "sole_proprietor"
          | "llc"
          | "joint_stock"
          | "partnership"
          | "other",
        edrpou: dto.edrpou,
        taxNumber: dto.taxNumber,
        address: dto.address,
        city: dto.city,
        region: dto.region,
        phone: dto.phone,
        email: dto.email,
        website: dto.website,
        subscriptionPlan: (dto.subscriptionPlan ||
          SubscriptionPlan.BASIC) as SubscriptionPlan,
        subscriptionStatus: SubscriptionStatus.TRIALING,
        trialEndAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
        maxUsers: dto.subscriptionPlan === SubscriptionPlan.BASIC ? 1 : 5,
        status: "active" as const,
        settings: {},
        metadata: {},
      };
      const organization = queryRunner.manager.create(
        Organization,
        organizationData,
      );

      const savedOrganization = await queryRunner.manager.save(organization);

      // Create subscription record
      const subscription = queryRunner.manager.create(Subscription, {
        tenantId: savedOrganization.id,
        provider: SubscriptionProvider.WAYFORPAY,
        plan: (dto.subscriptionPlan ||
          SubscriptionPlan.BASIC) as SubscriptionPlan,
        status: SubscriptionStatus.TRIALING,
        trialStartAt: new Date(),
        trialEndAt: savedOrganization.trialEndAt ?? undefined,
        currency: "UAH",
        metadata: {},
      });

      await queryRunner.manager.save(subscription);

      // Create admin user
      const salt = await generateSalt();
      const passwordHash = await hashPassword(dto.password, salt);
      const pendingUserId = generateUuid();

      await this.applyRlsSessionContext(queryRunner, {
        tenantId: savedOrganization.id,
        userId: pendingUserId,
        role: UserRole.ORGANIZATION_OWNER,
      });

      const user = queryRunner.manager.create(User, {
        id: pendingUserId,
        tenantId: savedOrganization.id,
        firstName: dto.firstName,
        lastName: dto.lastName,
        patronymic: dto.patronymic,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        salt,
        role: UserRole.ORGANIZATION_OWNER,
        status: UserStatus.PENDING,
        position: dto.position,
        barNumber: dto.barNumber,
        emailVerified: false,
        emailVerificationToken: generateToken(),
        lastPasswordChangeAt: new Date(),
      });

      const savedUser = await queryRunner.manager.save(user);

      // Create onboarding progress
      await queryRunner.manager.getRepository("OnboardingProgress").save({
        tenantId: savedOrganization.id,
        userId: savedUser.id,
        step: "organization_details",
        completed: true,
        completedAt: new Date(),
        percentage: 20,
      });

      await queryRunner.manager.getRepository("OnboardingProgress").save({
        tenantId: savedOrganization.id,
        userId: savedUser.id,
        step: "user_profile",
        completed: true,
        completedAt: new Date(),
        percentage: 40,
      });

      await queryRunner.commitTransaction();

      this.loggingService.logBusinessEvent(
        "create",
        "Organization",
        savedOrganization.id,
        {
          tenantId: savedOrganization.id,
          userId: savedUser.id,
          subscriptionPlan: dto.subscriptionPlan,
        },
      );

      // Send verification email
      // await this.emailService.sendVerificationEmail(savedUser.email, savedUser.emailVerificationToken);

      // Log audit
      await this.auditService.log({
        tenantId: savedOrganization.id,
        userId: savedUser.id,
        action: "create",
        entityType: "Organization",
        entityId: savedOrganization.id,
        newValues: savedOrganization,
      });

      return {
        organizationId: savedOrganization.id,
        userId: savedUser.id,
      };
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      this.loggingService.logError(error as Error | string, {
        action: "registerOrganization",
        email: dto.email,
        organizationName: dto.name,
      });
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Registration collects only the minimum bootstrap data:
   * tenant identity + owner identity + credentials.
   * Deeper operational and professional data belongs to onboarding/profile.
   */
  async register(dto: RegisterDto): Promise<LoginResponseDto> {
    // Check if user already exists
    const emailBlindIndex = computeEmailBlindIndex(dto.email, "user_email");
    const existingUser = await this.userRepository.findOne({
      where: { emailBlindIndex: emailBlindIndex ?? undefined },
    });

    if (existingUser) {
      throw new ConflictException("Користувач з таким email вже існує");
    }

    // Validate password
    if (dto.password.length < 8) {
      throw new ConflictException("Пароль має містити мінімум 8 символів");
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create a bootstrap organization. Operational details are completed in onboarding.
      const emailLocalPart = dto.email.split("@")[0]?.trim() || "workspace";
      const organization = queryRunner.manager.create(Organization, {
        name: `Кабінет ${emailLocalPart}`,
        legalForm: "other" as
          | "sole_proprietor"
          | "llc"
          | "joint_stock"
          | "partnership"
          | "other",
        email: dto.email.toLowerCase(),
        subscriptionPlan: SubscriptionPlan.BASIC,
        subscriptionStatus: SubscriptionStatus.TRIALING,
        trialEndAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        maxUsers: 1,
        status: "active",
        settings: {
          profileSplit: {
            registration: ["email"],
            onboarding: [
              "organizationType",
              "firstName",
              "lastName",
              "patronymic",
              "taxId",
              "phonePrimary",
              "phoneSecondary",
              "emailPrimary",
              "emailSecondary",
              "legalEntity",
              "director",
              "legalStatus",
              "bankName",
              "bankMfo",
              "iban",
              "taxSystem",
              "vatPayer",
              "legalAddress",
              "actualSameAsLegal",
              "actualAddress",
              "additionalAddresses",
              "certificateNumber",
              "certificateDate",
              "issuedBy",
              "registryNumber",
              "registryDate",
              "contractNumber",
              "contractWith",
              "position",
              "avatarUrl",
            ],
            profile: ["avatarUrl"],
          },
        },
        metadata: {
          registrationSource: "self_service",
        },
      });

      const savedOrganization = await queryRunner.manager.save(organization);

      // Create user
      const salt = await generateSalt();
      const passwordHash = await hashPassword(dto.password, salt);
      const pendingUserId = generateUuid();

      await this.applyRlsSessionContext(queryRunner, {
        tenantId: savedOrganization.id,
        userId: pendingUserId,
        role: UserRole.ORGANIZATION_OWNER,
      });

      const user = queryRunner.manager.create(User, {
        id: pendingUserId,
        tenantId: savedOrganization.id,
        email: dto.email.toLowerCase(),
        firstName: "Новий",
        lastName: "користувач",
        passwordHash,
        salt,
        role: UserRole.ORGANIZATION_OWNER,
        status: UserStatus.ACTIVE,
        emailVerified: false,
        emailVerificationToken: generateToken(),
        lastPasswordChangeAt: new Date(),
        metadata: {
          profileIncomplete: true,
          profileSplit: {
            registration: ["email"],
            onboarding: [
              "organizationType",
              "firstName",
              "lastName",
              "patronymic",
              "taxId",
              "phonePrimary",
              "phoneSecondary",
              "emailPrimary",
              "emailSecondary",
              "legalEntity",
              "director",
              "legalStatus",
              "bankName",
              "bankMfo",
              "iban",
              "taxSystem",
              "vatPayer",
              "legalAddress",
              "actualSameAsLegal",
              "actualAddress",
              "additionalAddresses",
              "certificateNumber",
              "certificateDate",
              "issuedBy",
              "registryNumber",
              "registryDate",
              "contractNumber",
              "contractWith",
              "position",
              "avatarUrl",
            ],
            profile: ["avatarUrl"],
          },
        },
      });

      const savedUser = await queryRunner.manager.save(user);

      await queryRunner.manager.getRepository("OnboardingProgress").save({
        tenantId: savedOrganization.id,
        userId: savedUser.id,
        step: "organization_details",
        completed: false,
        percentage: 20,
        data: {
          capturedAtRegistration: {
            email: savedUser.email,
          },
          requiredInOnboarding: [
            "organizationType",
            "firstName",
            "lastName",
            "taxId",
            "phonePrimary",
            "legalStatus",
            "bankName",
            "bankMfo",
            "iban",
            "taxSystem",
            "legalAddress",
          ],
        },
      });

      await queryRunner.manager.getRepository("OnboardingProgress").save({
        tenantId: savedOrganization.id,
        userId: savedUser.id,
        step: "user_profile",
        completed: false,
        percentage: 40,
        data: {
          capturedAtRegistration: {
            email: savedUser.email,
          },
          requiredInOnboarding: [
            "firstName",
            "lastName",
            "patronymic",
            "phonePrimary",
            "position",
            "legalEntity",
            "director",
            "actualSameAsLegal",
            "actualAddress",
            "additionalAddresses",
            "certificateNumber",
            "certificateDate",
            "issuedBy",
            "registryNumber",
            "registryDate",
            "contractNumber",
            "contractWith",
          ],
        },
      });

      await queryRunner.commitTransaction();

      // Generate tokens for auto-login
      const accessToken = await this.jwtService.generateAccessToken({
        user_id: savedUser.id,
        tenant_id: savedOrganization.id,
        role: savedUser.role,
        subscription_plan: savedOrganization.subscriptionPlan,
        email: savedUser.email,
      });

      const refreshToken = await this.jwtService.generateRefreshToken({
        user_id: savedUser.id,
        tenant_id: savedOrganization.id,
        token_id: generateUuid(),
        device_id: generateDeviceFingerprint("registration", "0.0.0.0"),
      });

      // Save refresh token
      await this.refreshTokenRepository.save({
        userId: savedUser.id,
        tenantId: savedOrganization.id,
        token: refreshToken,
        deviceInfo: { userAgent: "registration", ipAddress: "0.0.0.0" },
        ipAddress: "0.0.0.0",
        userAgent: "registration",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      this.loggingService.logAuthEvent("login", {
        userId: savedUser.id,
        tenantId: savedOrganization.id,
        email: dto.email,
      });

      return {
        accessToken,
        refreshToken,
        expiresIn: 900, // 15 minutes
        user: {
          id: savedUser.id,
          email: savedUser.email,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          role: savedUser.role,
          tenantId: savedUser.tenantId,
          emailVerified: savedUser.emailVerified,
          mfaEnabled: savedUser.mfaEnabled,
        },
        organization: {
          id: savedOrganization.id,
          name: savedOrganization.name,
          subscriptionPlan: savedOrganization.subscriptionPlan,
          subscriptionStatus: savedOrganization.subscriptionStatus,
          trialEndAt: savedOrganization.trialEndAt?.toISOString(),
        },
      };
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      this.loggingService.logError(error as Error | string, {
        action: "register",
        email: dto.email,
      });
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Login
   */
  async login(
    dto: LoginDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<LoginResponseDto> {
    this.loggingService.debug("Login attempt", { email: dto.email, ipAddress });

    // Find user
    const user = await this.userRepository.findOne({
      where: {
        emailBlindIndex:
          computeEmailBlindIndex(dto.email, "user_email") ?? undefined,
        deletedAt: IsNull(),
      },
      relations: ["organization"],
    });

    if (!user) {
      this.loggingService.logAuthEvent("login_failed", {
        email: dto.email,
        ipAddress,
        userAgent,
        reason: "User not found",
      });

      throw new UnauthorizedException("Невірний email або пароль");
    }

    // Check account status
    if (user.status === UserStatus.SUSPENDED) {
      this.loggingService.logSecurityEvent("login_attempt_suspended", "high", {
        userId: user.id,
        tenantId: user.tenantId,
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException(
        "Акаунт призупинено. Зв'яжіться з підтримкою.",
      );
    }

    if (user.status === UserStatus.DELETED) {
      throw new UnauthorizedException("Акаунт видалено.");
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / (1000 * 60),
      );
      this.loggingService.logSecurityEvent("login_attempt_locked", "medium", {
        userId: user.id,
        tenantId: user.tenantId,
        ipAddress,
        remainingMinutes,
        failedAttempts: user.failedLoginAttempts,
      });
      throw new UnauthorizedException(
        `Акаунт заблоковано на ${remainingMinutes} хвилин.`,
      );
    }

    // Verify password
    const passwordValid = await verifyPassword(
      dto.password,
      user.salt,
      user.passwordHash,
    );

    if (!passwordValid) {
      // Increment failed attempts
      await this.userRepository.increment(
        { id: user.id },
        "failedLoginAttempts",
        1,
      );

      // Lock account if max attempts reached
      const updatedUser = await this.userRepository.findOne({
        where: { id: user.id },
      });
      if (updatedUser && updatedUser.failedLoginAttempts >= 5) {
        const lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        await this.userRepository.update(user.id, { lockedUntil });

        this.loggingService.logSecurityEvent("account_locked", "high", {
          userId: user.id,
          tenantId: user.tenantId,
          ipAddress,
          userAgent,
          failedAttempts: updatedUser?.failedLoginAttempts,
        });

        throw new UnauthorizedException(
          "Забагато невдалих спроб. Акаунт заблоковано на 30 хвилин.",
        );
      }

      // Log failed attempt
      await this.auditService.log({
        tenantId: user.tenantId,
        userId: user.id,
        action: "login",
        entityType: "User",
        ipAddress,
        userAgent,
        metadata: { reason: "Invalid password" },
      });

      this.loggingService.logAuthEvent("login_failed", {
        userId: user.id,
        tenantId: user.tenantId,
        ipAddress,
        userAgent,
        reason: "Invalid password",
        failedAttempts: (updatedUser?.failedLoginAttempts ?? 0) + 1,
      });

      throw new UnauthorizedException("Невірний email або пароль");
    }

    // Verify MFA if enabled
    if (user.mfaEnabled && !dto.mfaCode) {
      this.loggingService.logAuthEvent("mfa_required", {
        userId: user.id,
        tenantId: user.tenantId,
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException(
        "Введіть код двофакторної аутентифікації",
      );
    }

    if (user.mfaEnabled && dto.mfaCode) {
      const mfaValid = await this.verifyMfaCode(user.id, dto.mfaCode);
      if (!mfaValid) {
        this.loggingService.logSecurityEvent("mfa_failed", "medium", {
          userId: user.id,
          tenantId: user.tenantId,
          ipAddress,
          userAgent,
        });
        throw new UnauthorizedException("Невірний MFA код");
      }

      this.loggingService.logAuthEvent("mfa_verified", {
        userId: user.id,
        tenantId: user.tenantId,
        ipAddress,
        userAgent,
      });
    }

    // Reset failed attempts
    await this.userRepository.update(user.id, {
      failedLoginAttempts: 0,
      lockedUntil: undefined,
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress,
    });

    // Generate tokens
    const accessToken = await this.jwtService.generateAccessToken({
      user_id: user.id,
      tenant_id: user.tenantId,
      role: user.role,
      subscription_plan: user.organization.subscriptionPlan,
      email: user.email,
    });

    const refreshToken = await this.jwtService.generateRefreshToken({
      user_id: user.id,
      tenant_id: user.tenantId,
      token_id: generateUuid(),
      device_id: generateDeviceFingerprint(userAgent, ipAddress),
    });

    // Save refresh token
    const deviceId = generateDeviceFingerprint(userAgent, ipAddress);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.refreshTokenRepository.save({
      userId: user.id,
      tenantId: user.tenantId,
      token: refreshToken,
      deviceInfo: { userAgent, ipAddress },
      ipAddress,
      userAgent,
      expiresAt,
    });

    // Limit number of active refresh tokens
    await this.limitRefreshTokens(user.id);

    // Log successful login
    await this.auditService.log({
      tenantId: user.tenantId,
      userId: user.id,
      action: "login",
      entityType: "User",
      entityId: user.id,
      ipAddress,
      userAgent,
    });

    this.loggingService.logAuthEvent("login", {
      userId: user.id,
      tenantId: user.tenantId,
      ipAddress,
      userAgent,
      deviceId,
      mfaEnabled: user.mfaEnabled,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        emailVerified: user.emailVerified,
        mfaEnabled: user.mfaEnabled,
      },
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        subscriptionPlan: user.organization.subscriptionPlan,
        subscriptionStatus: user.organization.subscriptionStatus,
        trialEndAt: user.organization.trialEndAt?.toISOString(),
      },
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(dto: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
    this.loggingService.debug("Token refresh attempt", {
      tokenLength: dto.refreshToken?.length,
    });

    const payload = await this.jwtService.verifyRefreshToken(dto.refreshToken);

    // Find refresh token in database
    const refreshTokenEntity = await this.refreshTokenRepository.findOne({
      where: { token: dto.refreshToken },
    });

    if (!refreshTokenEntity) {
      this.loggingService.logSecurityEvent("invalid_refresh_token", "medium", {
        userId: payload.user_id,
        tenantId: payload.tenant_id,
      });
      throw new UnauthorizedException("Invalid refresh token");
    }

    // Check if token is revoked
    if (refreshTokenEntity.revokedAt) {
      this.loggingService.logSecurityEvent(
        "revoked_refresh_token_used",
        "high",
        {
          userId: refreshTokenEntity.userId,
          tenantId: refreshTokenEntity.tenantId,
          deviceId: payload.device_id,
        },
      );
      throw new UnauthorizedException("Refresh token revoked");
    }

    // Check if token is expired
    if (refreshTokenEntity.expiresAt < new Date()) {
      throw new UnauthorizedException("Refresh token expired");
    }

    // Find user
    const user = await this.userRepository.findOne({
      where: { id: payload.user_id, deletedAt: IsNull() },
      relations: ["organization"],
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    // Generate new tokens
    const newAccessToken = await this.jwtService.generateAccessToken({
      user_id: user.id,
      tenant_id: user.tenantId,
      role: user.role,
      subscription_plan: user.organization.subscriptionPlan,
      email: user.email,
    });

    const newRefreshToken = await this.jwtService.generateRefreshToken({
      user_id: user.id,
      tenant_id: user.tenantId,
      token_id: generateUuid(),
      device_id: payload.device_id,
    });

    // Revoke old refresh token
    await this.refreshTokenRepository.update(
      { id: refreshTokenEntity.id },
      { revokedAt: new Date() },
    );

    // Save new refresh token
    await this.refreshTokenRepository.save({
      userId: user.id,
      tenantId: user.tenantId,
      token: newRefreshToken,
      deviceInfo: refreshTokenEntity.deviceInfo,
      ipAddress: refreshTokenEntity.ipAddress,
      userAgent: refreshTokenEntity.userAgent,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      replacedBy: refreshTokenEntity.id,
    });

    this.loggingService.logAuthEvent("token_refresh", {
      userId: user.id,
      tenantId: user.tenantId,
      deviceId: payload.device_id,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900, // 15 minutes
    };
  }

  /**
   * Logout
   */
  async logout(
    userId: string,
    accessToken?: string,
    dto?: LogoutDto,
  ): Promise<void> {
    this.loggingService.logAuthEvent("logout", { userId });

    if (accessToken) {
      await this.revokeAccessToken(accessToken, "logout");
    }

    if (dto?.refreshToken) {
      await this.refreshTokenRepository.update(
        { token: dto.refreshToken },
        { revokedAt: new Date() },
      );
    }
  }

  /**
   * Logout all devices
   */
  async logoutAllDevices(userId: string): Promise<void> {
    this.loggingService.logAuthEvent("logout_all_devices", { userId });
    await this.invalidateUserSessions(userId, "logout_all");
  }

  /**
   * Forgot password
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    this.loggingService.logAuthEvent("password_reset_requested", {
      email: dto.email,
    });

    const user = await this.userRepository.findOne({
      where: {
        emailBlindIndex:
          computeEmailBlindIndex(dto.email, "user_email") ?? undefined,
        deletedAt: IsNull(),
      },
    });

    if (!user) {
      // Don't reveal if user exists
      this.loggingService.debug(
        "Password reset requested for non-existent user",
        { email: dto.email },
      );
      return;
    }

    // Generate password reset token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.userRepository.update(user.id, {
      passwordResetToken: token,
      passwordResetExpiresAt: expiresAt,
    });

    this.loggingService.logBusinessEvent(
      "create",
      "PasswordResetToken",
      token,
      {
        userId: user.id,
        tenantId: user.tenantId,
        expiresAt,
      },
    );

    // Send password reset email
    // await this.emailService.sendPasswordResetEmail(user.email, token);
  }

  /**
   * Reset password
   */
  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const user = await this.userRepository.findOne({
      where: {
        passwordResetToken: dto.token,
        deletedAt: IsNull(),
      },
    });

    if (!user) {
      this.loggingService.logSecurityEvent(
        "invalid_password_reset_token",
        "medium",
        {
          token: dto.token.substring(0, 10) + "...",
        },
      );
      throw new UnauthorizedException("Invalid or expired token");
    }

    if (
      user.passwordResetExpiresAt &&
      user.passwordResetExpiresAt < new Date()
    ) {
      this.loggingService.logSecurityEvent(
        "expired_password_reset_token",
        "low",
        {
          userId: user.id,
          tenantId: user.tenantId,
        },
      );
      throw new UnauthorizedException("Token expired");
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(dto.newPassword);
    if (!passwordValidation.valid) {
      throw new ConflictException(
        "Password too weak: " + passwordValidation.errors.join(", "),
      );
    }

    // Hash new password
    const salt = await generateSalt();
    const passwordHash = await hashPassword(dto.newPassword, salt);

    // Update user
    await this.userRepository.update(user.id, {
      passwordHash,
      salt,
      passwordResetToken: undefined,
      passwordResetExpiresAt: undefined,
      lastPasswordChangeAt: new Date(),
    });
    await this.invalidateUserSessions(user.id, "password_reset");

    this.loggingService.logBusinessEvent("update", "User", user.id, {
      tenantId: user.tenantId,
      userId: user.id,
      changedFields: ["password"],
    });

    // Log audit
    await this.auditService.log({
      tenantId: user.tenantId,
      userId: user.id,
      action: "update",
      entityType: "User",
      entityId: user.id,
      changedFields: ["password"],
    });
  }

  /**
   * Verify email
   */
  async verifyEmail(dto: VerifyEmailDto): Promise<void> {
    const user = await this.userRepository.findOne({
      where: {
        emailVerificationToken: dto.token,
        deletedAt: IsNull(),
      },
      relations: ["organization"],
    });

    if (!user) {
      this.loggingService.logSecurityEvent(
        "invalid_email_verification_token",
        "low",
        {
          token: dto.token.substring(0, 10) + "...",
        },
      );
      throw new UnauthorizedException("Invalid token");
    }

    await this.userRepository.update(user.id, {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      emailVerificationToken: undefined,
      status: UserStatus.ACTIVE,
    });

    this.loggingService.logBusinessEvent("update", "User", user.id, {
      tenantId: user.tenantId,
      userId: user.id,
      changedFields: ["emailVerified", "status"],
    });

    // Log audit
    await this.auditService.log({
      tenantId: user.tenantId,
      userId: user.id,
      action: "update",
      entityType: "User",
      entityId: user.id,
      changedFields: ["emailVerified"],
    });
  }

  /**
   * Enable MFA
   */
  async enableMfa(
    userId: string,
  ): Promise<{ secret: string; backupCodes: string[] }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    const secret = generateTotpSecret();
    const backupCodes = generateMfaBackupCodes();

    await this.userRepository.update(userId, {
      mfaSecret: secret,
      mfaBackupCodes: backupCodes,
    });

    this.loggingService.logSecurityEvent("mfa_enabled", "low", {
      userId,
      tenantId: user.tenantId,
    });

    return { secret, backupCodes };
  }

  /**
   * Verify MFA code
   */
  private async verifyMfaCode(userId: string, code: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user || !user.mfaSecret) {
      return false;
    }

    // Verify TOTP code
    const totp = require("otpauth").totp;
    const totpInstance = new totp({
      secret: user.mfaSecret,
      digits: 6,
      period: 30,
      window: 2,
    });

    const delta = totpInstance.validate({ token: code });

    // Check backup codes
    if (delta === null && user.mfaBackupCodes?.includes(code)) {
      // Remove used backup code
      const updatedBackupCodes = user.mfaBackupCodes.filter((c) => c !== code);
      await this.userRepository.update(userId, {
        mfaBackupCodes: updatedBackupCodes,
      });

      this.loggingService.logSecurityEvent("mfa_backup_code_used", "low", {
        userId,
        tenantId: user.tenantId,
        remainingCodes: updatedBackupCodes.length,
      });

      return true;
    }

    return delta !== null;
  }

  /**
   * Limit number of active refresh tokens per user
   */
  private async limitRefreshTokens(
    userId: string,
    maxTokens: number = 5,
  ): Promise<void> {
    const tokens = await this.refreshTokenRepository.find({
      where: { userId, revokedAt: IsNull() },
      order: { createdAt: "DESC" },
    });

    if (tokens.length > maxTokens) {
      const tokensToRevoke = tokens.slice(maxTokens);
      for (const token of tokensToRevoke) {
        await this.refreshTokenRepository.update(
          { id: token.id },
          { revokedAt: new Date() },
        );
      }
    }
  }

  private async applyRlsSessionContext(
    queryRunner: QueryRunner,
    context: { tenantId: string; userId: string; role: string },
  ): Promise<void> {
    if (this.dataSource.options.type !== "postgres") {
      return;
    }

    await queryRunner.query(
      `
        SELECT
          set_config('app.current_tenant_id', $1, false),
          set_config('app.current_user_id', $2, false),
          set_config('app.current_user_role', $3, false)
      `,
      [context.tenantId, context.userId, context.role],
    );
  }

  async invalidateUserSessions(
    userId: string,
    reason:
      | "logout_all"
      | "password_reset"
      | "role_change"
      | "membership_change"
      | "security_event" = "security_event",
  ): Promise<void> {
    const invalidBefore = new Date();

    await this.userRepository.update(userId, {
      sessionInvalidBefore: invalidBefore,
    });

    await this.refreshTokenRepository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: invalidBefore },
    );

    this.loggingService.logSecurityEvent(
      "user_sessions_invalidated",
      "medium",
      {
        userId,
        reason,
        invalidBefore,
      },
    );
  }

  private async revokeAccessToken(
    accessToken: string,
    reason: "logout" | "security_event",
  ): Promise<void> {
    const decoded = this.jwtService.decodeToken(accessToken);

    if (
      !decoded ||
      !("jti" in decoded) ||
      !decoded.jti ||
      !decoded.exp ||
      !("user_id" in decoded) ||
      !("tenant_id" in decoded)
    ) {
      return;
    }

    const expiresAt = new Date(decoded.exp * 1000);
    if (expiresAt <= new Date()) {
      return;
    }

    const existingRevocation = await this.revokedAccessTokenRepository.findOne({
      where: { jti: decoded.jti },
    });

    if (existingRevocation) {
      return;
    }

    await this.revokedAccessTokenRepository.save({
      jti: decoded.jti,
      userId: decoded.user_id,
      tenantId: decoded.tenant_id,
      expiresAt,
      reason,
    });
  }
}
