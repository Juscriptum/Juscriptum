import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { JwtService as NestJwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { JwtPayload, RefreshTokenPayload } from "../interfaces/jwt.interface";
import { SecurityConfig } from "../interfaces/jwt.interface";
import { generateUuid } from "../../common/utils/crypto.util";

/**
 * JWT Service
 */
@Injectable()
export class JwtService {
  constructor(
    private readonly jwtService: NestJwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate access token
   */
  async generateAccessToken(
    payload: Omit<JwtPayload, "jti" | "iat" | "exp">,
  ): Promise<string> {
    const jwtPayload: JwtPayload = {
      ...payload,
      jti: generateUuid(),
    };

    return this.jwtService.sign(jwtPayload, {
      expiresIn: this.configService.get<string>(
        "JWT_ACCESS_TOKEN_EXPIRY",
        SecurityConfig.JWT_ACCESS_TOKEN_EXPIRY,
      ),
    });
  }

  /**
   * Generate refresh token
   */
  async generateRefreshToken(
    payload: Omit<RefreshTokenPayload, "iat" | "exp">,
  ): Promise<string> {
    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>(
        "JWT_REFRESH_TOKEN_EXPIRY",
        SecurityConfig.JWT_REFRESH_TOKEN_EXPIRY,
      ),
    });
  }

  /**
   * Verify access token
   */
  async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch (error) {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      return this.jwtService.verify<RefreshTokenPayload>(token);
    } catch (error) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }

  /**
   * Decode token without verification (for JTI extraction)
   */
  decodeToken(token: string): JwtPayload | RefreshTokenPayload | null {
    try {
      return this.jwtService.decode(token) as
        | JwtPayload
        | RefreshTokenPayload
        | null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get token expiration time
   */
  getTokenExpiry(token: string): number | null {
    const decoded = this.decodeToken(token);
    return decoded?.exp || null;
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }

    return Date.now() >= decoded.exp * 1000;
  }

  /**
   * Get time until token expiration (in seconds)
   */
  getTimeUntilExpiration(token: string): number | null {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return null;
    }

    const expirationTime = decoded.exp * 1000;
    const remainingTime = Math.max(0, expirationTime - Date.now());

    return Math.floor(remainingTime / 1000);
  }
}
