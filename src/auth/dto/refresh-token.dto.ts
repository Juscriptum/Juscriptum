import { IsString, IsOptional, IsObject } from "class-validator";

/**
 * Refresh Token DTO
 */
export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

/**
 * Refresh Token Response DTO
 */
export class RefreshTokenResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Logout DTO
 */
export class LogoutDto {
  @IsString()
  @IsOptional()
  refreshToken?: string;

  @IsObject()
  @IsOptional()
  deviceInfo?: Record<string, any>;
}
