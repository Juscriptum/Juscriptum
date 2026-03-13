import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";
import { TrustProviderType } from "../../database/entities/UserIdentity.entity";

export class ProviderCallbackDto {
  @IsEnum(["acsk", "diia", "bankid_nbu", "manual"])
  provider: TrustProviderType;

  @IsEnum(["user_identity", "document_signature"])
  subjectType: "user_identity" | "document_signature";

  @IsUUID()
  subjectId: string;

  @IsEnum(["verified", "failed", "revoked", "retry"])
  event: "verified" | "failed" | "revoked" | "retry";

  @IsOptional()
  @IsString()
  externalVerificationId?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
