import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { RefreshTokenPayload } from "../interfaces/jwt.interface";
import { RefreshToken } from "../../database/entities/RefreshToken.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

/**
 * Refresh Token Strategy
 */
@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, "refresh") {
  constructor(
    configService: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField("refreshToken"),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_REFRESH_SECRET"),
    });
  }

  async validate(
    payload: RefreshTokenPayload & { iat: number; exp: number },
  ): Promise<RefreshTokenPayload> {
    // Find refresh token in database
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token: payload.token_id },
    });

    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token not found");
    }

    if (refreshToken.revokedAt) {
      throw new UnauthorizedException("Refresh token revoked");
    }

    if (refreshToken.expiresAt < new Date()) {
      throw new UnauthorizedException("Refresh token expired");
    }

    return {
      user_id: payload.user_id,
      tenant_id: payload.tenant_id,
      token_id: payload.token_id,
      device_id: payload.device_id,
    };
  }
}
