import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { JwtPayload } from "../interfaces/jwt.interface";
import { User } from "../../database/entities/User.entity";
import { RevokedAccessToken } from "../../database/entities/RevokedAccessToken.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";

/**
 * JWT Strategy for Access Tokens
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RevokedAccessToken)
    private readonly revokedAccessTokenRepository: Repository<RevokedAccessToken>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET"),
    });
  }

  async validate(
    payload: JwtPayload & { jti: string; iat: number; exp: number },
  ): Promise<JwtPayload> {
    if (payload.jti) {
      const revokedToken = await this.revokedAccessTokenRepository.findOne({
        where: { jti: payload.jti },
      });

      if (revokedToken) {
        throw new UnauthorizedException("Access token has been revoked");
      }
    }

    // Verify user still exists and is active
    const user = await this.userRepository.findOne({
      where: {
        id: payload.user_id,
        tenantId: payload.tenant_id,
        deletedAt: IsNull(),
      },
      relations: ["organization"],
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    if (user.status !== "active") {
      throw new UnauthorizedException("User account is not active");
    }

    if (!user.organization) {
      throw new UnauthorizedException("User organization not found");
    }

    if (user.organization.status && user.organization.status !== "active") {
      throw new UnauthorizedException("User organization is not active");
    }

    if (
      user.lastPasswordChangeAt &&
      payload.iat &&
      payload.iat * 1000 < user.lastPasswordChangeAt.getTime()
    ) {
      throw new UnauthorizedException(
        "Access token is no longer valid after password change",
      );
    }

    if (
      user.sessionInvalidBefore &&
      payload.iat &&
      payload.iat * 1000 < user.sessionInvalidBefore.getTime()
    ) {
      throw new UnauthorizedException(
        "Access token is no longer valid after session invalidation",
      );
    }

    return {
      user_id: payload.user_id,
      tenant_id: payload.tenant_id,
      role: user.role,
      subscription_plan: user.organization.subscriptionPlan,
      email: user.email,
    };
  }
}
