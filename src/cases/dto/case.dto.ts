import {
  IsEnum,
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsNumber,
  Min,
  Max,
  ValidateNested,
  IsArray,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DataAccessScope } from "../../common/security/access-control";

/**
 * Case Types (Ukrainian legal categories)
 */
export type CaseType =
  | "judicial_case"
  | "criminal_proceeding"
  | "enforcement_proceeding"
  | "contract_work"
  | "consultation_case"
  | "corporate_case"
  | "registration_case"
  | "administrative_appeal"
  | "mediation_negotiation"
  | "compliance_audit";

/**
 * Case Priority
 */
export type CasePriority = "low" | "medium" | "high" | "urgent";

/**
 * Case Status (Ukrainian terminology)
 * draft -> Чернетка
 * active -> В роботі
 * on_hold -> Призупинено
 * closed -> Завершено
 * archived -> Архів
 */
export type CaseStatus = "draft" | "active" | "on_hold" | "closed" | "archived";

/**
 * Create Case DTO
 */
export class CreateCaseDto {
  @ApiPropertyOptional({
    example: "001/001",
    description: "Internal case number, generated automatically",
  })
  @IsOptional()
  @IsString()
  caseNumber?: string;

  @ApiPropertyOptional({
    example: "757/12345/23-ц",
    description: "Court registry case number imported from registry CSV",
  })
  @IsOptional()
  @IsString()
  registryCaseNumber?: string;

  @ApiProperty({
    enum: [
      "judicial_case",
      "criminal_proceeding",
      "enforcement_proceeding",
      "contract_work",
      "consultation_case",
      "corporate_case",
      "registration_case",
      "administrative_appeal",
      "mediation_negotiation",
      "compliance_audit",
    ],
  })
  @IsEnum([
    "judicial_case",
    "criminal_proceeding",
    "enforcement_proceeding",
    "contract_work",
    "consultation_case",
    "corporate_case",
    "registration_case",
    "administrative_appeal",
    "mediation_negotiation",
    "compliance_audit",
  ])
  caseType: CaseType;

  @ApiProperty({ description: "Client UUID" })
  @IsUUID()
  clientId: string;

  @ApiProperty({ description: "Assigned lawyer UUID" })
  @IsUUID()
  assignedLawyerId: string;

  @ApiPropertyOptional({ description: "Case title/subject" })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: "Case description/essence" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ["low", "medium", "high", "urgent"] })
  @IsEnum(["low", "medium", "high", "urgent"])
  priority: CasePriority;

  @ApiPropertyOptional({ description: "Case start date (filing date)" })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: "Case end date" })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: "Deadline date" })
  @IsOptional()
  @IsDateString()
  deadlineDate?: string;

  @ApiPropertyOptional({ description: "Estimated/claim amount" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  estimatedAmount?: number;

  @ApiPropertyOptional({ description: "Court fee (судовий збір)" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  courtFee?: number;

  @ApiPropertyOptional({ description: "Court name" })
  @IsOptional()
  @IsString()
  courtName?: string;

  @ApiPropertyOptional({ description: "Court address" })
  @IsOptional()
  @IsString()
  courtAddress?: string;

  @ApiPropertyOptional({ description: "Judge name" })
  @IsOptional()
  @IsString()
  judgeName?: string;

  @ApiPropertyOptional({ description: "Proceeding stage (стадія розгляду)" })
  @IsOptional()
  @IsString()
  proceedingStage?: string;

  @ApiPropertyOptional({ description: "Plaintiff name (Позивач/Заявник)" })
  @IsOptional()
  @IsString()
  plaintiffName?: string;

  @ApiPropertyOptional({ description: "Defendant name (Відповідач/Боржник)" })
  @IsOptional()
  @IsString()
  defendantName?: string;

  @ApiPropertyOptional({ description: "Third parties (Треті особи)" })
  @IsOptional()
  @IsString()
  thirdParties?: string;

  @ApiPropertyOptional({ description: "Internal notes" })
  @IsOptional()
  @IsString()
  internalNotes?: string;

  @ApiPropertyOptional({ description: "Client notes" })
  @IsOptional()
  @IsString()
  clientNotes?: string;

  @ApiPropertyOptional({ description: "Additional metadata" })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ enum: ["private", "assigned", "tenant"] })
  @IsOptional()
  @IsEnum(["private", "assigned", "tenant"])
  accessScope?: DataAccessScope;
}

/**
 * Update Case DTO
 */
export class UpdateCaseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  caseNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  registryCaseNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum([
    "judicial_case",
    "criminal_proceeding",
    "enforcement_proceeding",
    "contract_work",
    "consultation_case",
    "corporate_case",
    "registration_case",
    "administrative_appeal",
    "mediation_negotiation",
    "compliance_audit",
  ])
  caseType?: CaseType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedLawyerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(["low", "medium", "high", "urgent"])
  priority?: CasePriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(["draft", "active", "on_hold", "closed", "archived"])
  status?: CaseStatus;

  @ApiPropertyOptional({ enum: ["private", "assigned", "tenant"] })
  @IsOptional()
  @IsEnum(["private", "assigned", "tenant"])
  accessScope?: DataAccessScope;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  nextHearingDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  deadlineDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  estimatedAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  paidAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  courtFee?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courtName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courtAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  judgeName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  proceedingStage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  plaintiffName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  defendantName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thirdParties?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  internalNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * Case Filters DTO
 */
export class CaseFiltersDto {
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  assignedLawyerId?: string;

  @IsOptional()
  @IsEnum([
    "judicial_case",
    "criminal_proceeding",
    "enforcement_proceeding",
    "contract_work",
    "consultation_case",
    "corporate_case",
    "registration_case",
    "administrative_appeal",
    "mediation_negotiation",
    "compliance_audit",
  ])
  caseType?: CaseType;

  @IsOptional()
  @IsEnum(["low", "medium", "high", "urgent"])
  priority?: CasePriority;

  @IsOptional()
  @IsEnum(["draft", "active", "on_hold", "closed", "archived"])
  status?: CaseStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @IsOptional()
  @IsDateString()
  startDateTo?: string;

  @IsOptional()
  @IsDateString()
  deadlineFrom?: string;

  @IsOptional()
  @IsDateString()
  deadlineTo?: string;

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
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: "ASC" | "DESC";
}

/**
 * Add Timeline Event DTO
 */
export class AddTimelineEventDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum([
    "created",
    "updated",
    "status_change",
    "document_added",
    "event_added",
    "note",
    "payment",
    "other",
  ])
  eventType:
    | "created"
    | "updated"
    | "status_change"
    | "document_added"
    | "event_added"
    | "note"
    | "payment"
    | "other";

  @IsOptional()
  metadata?: Record<string, any>;
}
