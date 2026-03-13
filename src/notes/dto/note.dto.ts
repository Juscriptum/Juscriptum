import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { DATA_ACCESS_SCOPES } from "../../common/security/access-control";

const toOptionalTrimmedString = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

const toOptionalBoolean = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value === "true";
  }

  return Boolean(value);
};

export class CreateNoteDto {
  @IsOptional()
  @Transform(toOptionalTrimmedString)
  @IsString()
  title?: string;

  @IsOptional()
  @Transform(toOptionalTrimmedString)
  @IsString()
  content?: string;

  @IsOptional()
  @Transform(toOptionalTrimmedString)
  @IsString()
  clientId?: string;

  @IsOptional()
  @Transform(toOptionalTrimmedString)
  @IsString()
  caseId?: string;

  @IsOptional()
  @Transform(toOptionalTrimmedString)
  @IsString()
  userId?: string;

  @IsOptional()
  @Transform(toOptionalTrimmedString)
  @IsString()
  assignedUserId?: string;

  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  pinned?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsIn(DATA_ACCESS_SCOPES)
  accessScope?: (typeof DATA_ACCESS_SCOPES)[number];

  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateNoteDto {
  @IsOptional()
  @Transform(toOptionalTrimmedString)
  @IsString()
  title?: string;

  @IsOptional()
  @Transform(toOptionalTrimmedString)
  @IsString()
  content?: string;

  @IsOptional()
  @Transform(toOptionalTrimmedString)
  @IsString()
  clientId?: string;

  @IsOptional()
  @Transform(toOptionalTrimmedString)
  @IsString()
  caseId?: string;

  @IsOptional()
  @Transform(toOptionalTrimmedString)
  @IsString()
  userId?: string;

  @IsOptional()
  @Transform(toOptionalTrimmedString)
  @IsString()
  assignedUserId?: string;

  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  pinned?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsIn(DATA_ACCESS_SCOPES)
  accessScope?: (typeof DATA_ACCESS_SCOPES)[number];

  @IsOptional()
  metadata?: Record<string, any>;
}

export class NoteFiltersDto {
  @IsOptional()
  @Transform(toOptionalTrimmedString)
  @IsString()
  clientId?: string;

  @IsOptional()
  @Transform(toOptionalTrimmedString)
  @IsString()
  caseId?: string;

  @IsOptional()
  @Transform(toOptionalTrimmedString)
  @IsString()
  userId?: string;

  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  pinned?: boolean;

  @IsOptional()
  @Transform(toOptionalTrimmedString)
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsIn(["createdAt", "updatedAt", "title"])
  sortBy?: "createdAt" | "updatedAt" | "title";

  @IsOptional()
  @IsIn(["ASC", "DESC"])
  sortOrder?: "ASC" | "DESC";
}
