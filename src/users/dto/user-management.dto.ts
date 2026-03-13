import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import {
  InvitationStatus,
  UserRole,
  UserStatus,
} from "../../database/entities/enums/subscription.enum";

export class CreateInvitationDto {
  @IsEmail()
  email: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  message?: string;
}

export class UpdateMemberDto {
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;
}

export class TeamMemberResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  patronymic?: string;
  email: string;
  phone?: string;
  position?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class InvitationResponseDto {
  id: string;
  email: string;
  role: UserRole;
  status: InvitationStatus;
  message?: string | null;
  expiresAt: Date;
  createdAt: Date;
  invitedBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}
