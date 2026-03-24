import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService as NestJwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { generateUuid } from "../../common/utils/crypto.util";
import {
  PlatformAdminJwtPayload,
  PlatformAdminMfaTokenPayload,
  PlatformAdminRefreshTokenPayload,
} from "../interfaces/platform-admin-jwt.interface";

@Injectable()
export class PlatformAdminJwtService {
  constructor(
    private readonly jwtService: NestJwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateAccessToken(
    payload: Omit<PlatformAdminJwtPayload, "token_type" | "scope" | "jti">,
  ): Promise<string> {
    return this.jwtService.signAsync({
      ...payload,
      scope: "platform_admin",
      token_type: "access",
      jti: generateUuid(),
    });
  }

  async generateRefreshToken(
    payload: Omit<PlatformAdminRefreshTokenPayload, "token_type" | "scope">,
  ): Promise<string> {
    return this.jwtService.signAsync(
      {
        ...payload,
        scope: "platform_admin",
        token_type: "refresh",
      },
      {
        expiresIn: this.configService.get<string>(
          "PLATFORM_ADMIN_JWT_REFRESH_TOKEN_EXPIRY",
          "7d",
        ),
      },
    );
  }

  async generateMfaToken(
    payload: Omit<PlatformAdminMfaTokenPayload, "token_type" | "scope">,
  ): Promise<string> {
    return this.jwtService.signAsync(
      {
        ...payload,
        scope: "platform_admin",
        token_type: "mfa",
      },
      {
        expiresIn: this.configService.get<string>(
          "PLATFORM_ADMIN_JWT_MFA_TOKEN_EXPIRY",
          "5m",
        ),
      },
    );
  }

  async verifyAccessToken(token: string): Promise<PlatformAdminJwtPayload> {
    const payload = await this.verifyToken<PlatformAdminJwtPayload>(token);

    if (
      payload.scope !== "platform_admin" ||
      payload.token_type !== "access" ||
      !payload.admin_id
    ) {
      throw new UnauthorizedException("Invalid platform admin access token");
    }

    return payload;
  }

  async verifyRefreshToken(
    token: string,
  ): Promise<PlatformAdminRefreshTokenPayload> {
    const payload =
      await this.verifyToken<PlatformAdminRefreshTokenPayload>(token);

    if (
      payload.scope !== "platform_admin" ||
      payload.token_type !== "refresh" ||
      !payload.admin_id
    ) {
      throw new UnauthorizedException("Invalid platform admin refresh token");
    }

    return payload;
  }

  async verifyMfaToken(token: string): Promise<PlatformAdminMfaTokenPayload> {
    const payload = await this.verifyToken<PlatformAdminMfaTokenPayload>(token);

    if (
      payload.scope !== "platform_admin" ||
      payload.token_type !== "mfa" ||
      !payload.admin_id
    ) {
      throw new UnauthorizedException("Invalid platform admin MFA token");
    }

    return payload;
  }

  decodeToken<T>(token: string): T | null {
    try {
      return this.jwtService.decode(token) as T | null;
    } catch {
      return null;
    }
  }

  getAccessTokenExpiresInSeconds(): number {
    return this.parseDuration(
      this.configService.get<string>("PLATFORM_ADMIN_JWT_ACCESS_TOKEN_EXPIRY"),
      15 * 60,
    );
  }

  getMfaTokenExpiresInSeconds(): number {
    return this.parseDuration(
      this.configService.get<string>("PLATFORM_ADMIN_JWT_MFA_TOKEN_EXPIRY"),
      5 * 60,
    );
  }

  private async verifyToken<T extends object>(token: string): Promise<T> {
    try {
      return await this.jwtService.verifyAsync<T>(token);
    } catch {
      throw new UnauthorizedException(
        "Invalid or expired platform admin token",
      );
    }
  }

  private parseDuration(value: string | undefined, fallback: number): number {
    if (!value) {
      return fallback;
    }

    const normalized = value.trim().toLowerCase();
    const match = normalized.match(/^(\d+)([smhd])$/);

    if (!match) {
      const asNumber = Number(normalized);
      return Number.isFinite(asNumber) && asNumber > 0 ? asNumber : fallback;
    }

    const amount = Number(match[1]);
    const unit = match[2];

    switch (unit) {
      case "s":
        return amount;
      case "m":
        return amount * 60;
      case "h":
        return amount * 60 * 60;
      case "d":
        return amount * 60 * 60 * 24;
      default:
        return fallback;
    }
  }
}
