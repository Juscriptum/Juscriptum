import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
} from "class-validator";

/**
 * Simple Register DTO - Email and Password only
 */
export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}

/**
 * Register Organization DTO (Full registration)
 */
export class RegisterOrganizationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  legalForm?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d{8}$/, { message: "EDRPOU must be 8 digits" })
  edrpou?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d{10,12}$/, { message: "Tax number must be 10-12 digits" })
  taxNumber?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  address?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  city?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  region?: string;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  phone?: string;

  @IsEmail()
  email: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  subscriptionPlan?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  patronymic?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  position?: string;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  @Matches(/^\d{10,12}$/, { message: "Bar number must be 10-12 digits" })
  barNumber?: string;
}

/**
 * Complete Registration DTO (Email verification)
 */
export class CompleteRegistrationDto {
  @IsString()
  token: string;
}
