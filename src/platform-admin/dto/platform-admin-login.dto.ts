import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class PlatformAdminBootstrapStatusDto {
  bootstrapRequired: boolean;
  bootstrapEnabled: boolean;
  hasPlatformAdmins: boolean;
}

export class PlatformAdminBootstrapDto {
  @IsString()
  @MinLength(24)
  @MaxLength(512)
  bootstrapToken: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password: string;
}

export class PlatformAdminLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}

export class PlatformAdminVerifyMfaDto {
  @IsString()
  mfaToken: string;

  @IsString()
  @MaxLength(32)
  code: string;
}

export class PlatformAdminRefreshTokenDto {
  @IsString()
  refreshToken: string;
}

export class PlatformAdminLogoutDto {
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  mfaReason?: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class PlatformAdminMfaSetupResponseDto {
  issuer: string;
  label: string;
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

export class PlatformAdminConfirmMfaDto {
  @IsString()
  @MaxLength(32)
  code: string;
}

export class PlatformAdminProfileDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  mfaEnabled: boolean;
  status: string;
  lastLoginAt?: string;
}

export class PlatformAdminAuthResponseDto {
  mfaRequired: boolean;
  mfaToken?: string;
  mfaTokenExpiresIn?: number;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  admin?: PlatformAdminProfileDto;
}

export class PlatformAdminRefreshResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
