import { IsString } from "class-validator";

/**
 * Verify Email DTO
 */
export class VerifyEmailDto {
  @IsString()
  token: string;
}

/**
 * Resend Verification Email DTO
 */
export class ResendVerificationEmailDto {
  @IsString()
  email: string;
}
