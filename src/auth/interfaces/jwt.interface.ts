import type { Request } from "express";

/**
 * JWT Payload interface
 */
export interface JwtPayload {
  user_id: string;
  tenant_id: string;
  role: string;
  subscription_plan: string;
  email: string;
  jti?: string; // JWT ID for revocation
  iat?: number; // Issued at
  exp?: number; // Expires at
}

/**
 * Refresh Token Payload
 */
export interface RefreshTokenPayload {
  user_id: string;
  tenant_id: string;
  token_id: string;
  device_id: string;
  iat?: number;
  exp?: number;
}

/**
 * Authenticated Request Interface
 */
export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
  deviceId?: string;
}

/**
 * Security Configuration
 */
export const SecurityConfig = {
  // JWT
  JWT_ACCESS_TOKEN_EXPIRY: "15m", // 15 minutes
  JWT_REFRESH_TOKEN_EXPIRY: "7d", // 7 days
  JWT_ALGORITHM: "HS256", // Use RS256 for enterprise

  // Password
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  PASSWORD_SALT_ROUNDS: 12,
  PASSWORD_RESET_EXPIRY: "1h",
  PASSWORD_MAX_HISTORY: 5,

  // Rate Limiting
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_ATTEMPTS: 5,
  RATE_LIMIT_BAN_DURATION: 15 * 60 * 1000, // 15 minutes

  // MFA
  MFA_TOTP_DIGITS: 6,
  MFA_TOTP_PERIOD: 30, // seconds
  MFA_TOTP_WINDOW: 2, // ±2 periods

  // Session
  MAX_REFRESH_TOKENS_PER_USER: 5,
  MAX_CONCURRENT_SESSIONS: 10,

  // Lockout
  MAX_FAILED_LOGIN_ATTEMPTS: 5,
  ACCOUNT_LOCKOUT_DURATION: 30 * 60 * 1000, // 30 minutes

  // Encryption
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  ENCRYPTION_ALGORITHM: "aes-256-gcb",
};
