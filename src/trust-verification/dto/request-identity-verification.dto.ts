import { IsEnum, IsObject, IsOptional, IsString } from "class-validator";
import { TrustProviderType } from "../../database/entities/UserIdentity.entity";

export class RequestIdentityVerificationDto {
  @IsEnum(["acsk", "diia", "bankid_nbu"])
  provider: Exclude<TrustProviderType, "manual">;

  @IsString()
  externalSubjectId: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  certificateSerialNumber?: string;

  @IsOptional()
  @IsString()
  certificateIssuer?: string;

  @IsOptional()
  @IsString()
  taxIdHash?: string;

  @IsOptional()
  @IsString()
  assuranceLevel?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
