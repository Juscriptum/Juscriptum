import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";

export type OrganizationType = "SELF_EMPLOYED" | "FOP" | "LEGAL_ENTITY";
export type LegalStatus = "LAWYER" | "ADVOCATE" | "ADVOCATE_BPD";
export type TaxSystem = "non_profit" | "general" | "simplified" | "other";

const phoneRegex = /^\+380\d{9}$/;
const taxIdRegex = /^\d{10}$/;
const bankMfoRegex = /^\d{6}$/;
const ibanRegex = /^UA\d{27}$/;

export class AddressDto {
  @IsString()
  @MaxLength(100)
  @IsOptional()
  region?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  city?: string;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  cityCode?: string;

  @IsString()
  @MaxLength(150)
  @IsOptional()
  street?: string;

  @IsString()
  @MaxLength(30)
  @IsOptional()
  building?: string;

  @IsString()
  @MaxLength(30)
  @IsOptional()
  unit?: string;

  @IsString()
  @MaxLength(30)
  @IsOptional()
  apartment?: string;
}

export class LegalEntityDto {
  @IsString()
  @MaxLength(100)
  @IsOptional()
  legalForm?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  legalEntityName?: string;

  @IsString()
  @Matches(/^\d{8}$/, { message: "EDRPOU must be 8 digits" })
  @IsOptional()
  edrpou?: string;

  @IsEnum(["non_profit", "general", "simplified", "other"])
  @IsOptional()
  taxSystem?: TaxSystem;
}

export class DirectorDto {
  @IsBoolean()
  @IsOptional()
  sameAsUser?: boolean;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  firstName?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  lastName?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  middleName?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  position?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  actingBasis?: string;
}

/**
 * Update Profile DTO
 */
export class UpdateProfileDto {
  @IsEnum(["SELF_EMPLOYED", "FOP", "LEGAL_ENTITY"])
  @IsOptional()
  organizationType?: OrganizationType;

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
  @MaxLength(100)
  @IsOptional()
  middleName?: string;

  @IsString()
  @MaxLength(20)
  @Matches(taxIdRegex, { message: "Tax ID must be 10 digits" })
  @IsOptional()
  taxId?: string;

  @IsString()
  @MaxLength(20)
  @Matches(phoneRegex, { message: "Phone must match +380XXXXXXXXX" })
  @IsOptional()
  phonePrimary?: string;

  @IsArray()
  @ArrayMaxSize(5)
  @Matches(phoneRegex, {
    each: true,
    message: "Secondary phone must match +380XXXXXXXXX",
  })
  @IsOptional()
  phoneSecondary?: string[];

  @IsEmail()
  @MaxLength(255)
  @IsOptional()
  emailPrimary?: string;

  @IsArray()
  @ArrayMaxSize(5)
  @IsEmail({}, { each: true })
  @IsOptional()
  emailSecondary?: string[];

  @IsEnum(["LAWYER", "ADVOCATE", "ADVOCATE_BPD"])
  @IsOptional()
  legalStatus?: LegalStatus;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  position?: string;

  @IsString()
  @MaxLength(150)
  @IsOptional()
  bankName?: string;

  @IsString()
  @Matches(bankMfoRegex, { message: "Bank MFO must be 6 digits" })
  @IsOptional()
  bankMfo?: string;

  @IsString()
  @Matches(ibanRegex, { message: "IBAN must match UA + 27 digits" })
  @IsOptional()
  iban?: string;

  @IsEnum(["non_profit", "general", "simplified", "other"])
  @IsOptional()
  taxSystem?: TaxSystem;

  @IsBoolean()
  @IsOptional()
  vatPayer?: boolean;

  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  legalAddress?: AddressDto;

  @IsBoolean()
  @IsOptional()
  actualSameAsLegal?: boolean;

  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  actualAddress?: AddressDto;

  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  @IsOptional()
  additionalAddresses?: AddressDto[];

  @ValidateNested()
  @Type(() => DirectorDto)
  @IsOptional()
  director?: DirectorDto;

  @ValidateNested()
  @Type(() => LegalEntityDto)
  @IsOptional()
  legalEntity?: LegalEntityDto;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  certificateNumber?: string;

  @IsDateString()
  @IsOptional()
  certificateDate?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  issuedBy?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  registryNumber?: string;

  @IsDateString()
  @IsOptional()
  registryDate?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  contractNumber?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  contractWith?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}

/**
 * Change Password DTO
 */
export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: "Password must contain lowercase, uppercase and number",
  })
  newPassword: string;
}

/**
 * Profile Response DTO
 */
export class ProfileResponseDto {
  id: string;
  email: string;
  organizationType?: OrganizationType;
  firstName: string;
  lastName: string;
  patronymic?: string;
  middleName?: string;
  taxId?: string;
  phone?: string;
  phonePrimary?: string;
  phoneSecondary?: string[];
  emailPrimary?: string;
  emailSecondary?: string[];
  legalStatus?: LegalStatus;
  position?: string;
  bankName?: string;
  bankMfo?: string;
  iban?: string;
  taxSystem?: TaxSystem;
  vatPayer?: boolean;
  legalAddress?: AddressDto;
  actualSameAsLegal?: boolean;
  actualAddress?: AddressDto;
  additionalAddresses?: AddressDto[];
  director?: DirectorDto;
  legalEntity?: LegalEntityDto;
  certificateNumber?: string;
  certificateDate?: string;
  issuedBy?: string;
  registryNumber?: string;
  registryDate?: string;
  contractNumber?: string;
  contractWith?: string;
  avatarUrl?: string;
  role: string;
  tenantId: string;
  emailVerified: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
