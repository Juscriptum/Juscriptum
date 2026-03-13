import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
} from "class-validator";

/**
 * Login DTO
 */
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @IsString()
  @MaxLength(6)
  @IsOptional()
  mfaCode?: string;
}

/**
 * Login Response DTO
 */
export class LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    tenantId: string;
    emailVerified: boolean;
    mfaEnabled: boolean;
  };
  organization: {
    id: string;
    name: string;
    subscriptionPlan: string;
    subscriptionStatus: string;
    trialEndAt?: string;
  };
}
