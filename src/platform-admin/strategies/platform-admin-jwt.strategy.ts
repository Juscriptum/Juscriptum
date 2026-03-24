import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PlatformAdminUser } from "../../database/entities/PlatformAdminUser.entity";
import { PlatformAdminRevokedAccessToken } from "../../database/entities/PlatformAdminRevokedAccessToken.entity";
import { PlatformAdminStatus } from "../../database/entities/enums/platform-admin.enum";
import { PlatformAdminJwtPayload } from "../interfaces/platform-admin-jwt.interface";

@Injectable()
export class PlatformAdminJwtStrategy extends PassportStrategy(
  Strategy,
  "platform-admin-jwt",
) {
  constructor(
    configService: ConfigService,
    @InjectRepository(PlatformAdminUser)
    private readonly platformAdminUserRepository: Repository<PlatformAdminUser>,
    @InjectRepository(PlatformAdminRevokedAccessToken)
    private readonly revokedAccessTokenRepository: Repository<PlatformAdminRevokedAccessToken>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>("PLATFORM_ADMIN_JWT_SECRET") ||
        "platform-admin-dev-only-secret-not-for-production",
    });
  }

  async validate(
    payload: PlatformAdminJwtPayload & { jti?: string; iat?: number },
  ): Promise<PlatformAdminJwtPayload> {
    if (
      payload.scope !== "platform_admin" ||
      payload.token_type !== "access" ||
      !payload.admin_id
    ) {
      throw new UnauthorizedException("Invalid platform admin token");
    }

    if (payload.jti) {
      const revokedToken = await this.revokedAccessTokenRepository.findOne({
        where: { jti: payload.jti },
      });

      if (revokedToken) {
        throw new UnauthorizedException(
          "Platform admin access token has been revoked",
        );
      }
    }

    const admin = await this.platformAdminUserRepository.findOne({
      where: { id: payload.admin_id },
    });

    if (!admin) {
      throw new UnauthorizedException("Platform admin user not found");
    }

    if (admin.status !== PlatformAdminStatus.ACTIVE) {
      throw new UnauthorizedException("Platform admin user is not active");
    }

    if (
      admin.lastPasswordChangeAt &&
      payload.iat &&
      payload.iat * 1000 < admin.lastPasswordChangeAt.getTime()
    ) {
      throw new UnauthorizedException(
        "Platform admin access token is no longer valid after password change",
      );
    }

    if (
      admin.sessionInvalidBefore &&
      payload.iat &&
      payload.iat * 1000 < admin.sessionInvalidBefore.getTime()
    ) {
      throw new UnauthorizedException(
        "Platform admin access token is no longer valid after session invalidation",
      );
    }

    return {
      admin_id: admin.id,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions || [],
      scope: "platform_admin",
      token_type: "access",
      mfa_level: payload.mfa_level,
      jti: payload.jti,
      iat: payload.iat,
      exp: payload.exp,
    };
  }
}
