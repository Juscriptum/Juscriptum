import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import {
  OrganizationStatus,
  SubscriptionPlan,
  SubscriptionStatus,
} from "../../database/entities/enums/subscription.enum";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class PlatformAdminDashboardAlertDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string;

  @ApiProperty({ enum: ["medium", "high", "critical"] })
  severity: "medium" | "high" | "critical";

  @ApiProperty()
  message: string;

  @ApiPropertyOptional()
  organizationId?: string;

  @ApiPropertyOptional()
  organizationName?: string;

  @ApiProperty()
  createdAt: string;
}

export class PlatformAdminOrganizationTotalsDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  active: number;

  @ApiProperty()
  suspended: number;

  @ApiProperty()
  provisioning: number;

  @ApiProperty()
  trialing: number;

  @ApiProperty()
  pastDue: number;
}

export class PlatformAdminUserTotalsDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  active: number;

  @ApiProperty()
  locked: number;

  @ApiProperty()
  organizationsWithoutOwnerMfa: number;
}

export class PlatformAdminMonitoringSummaryDto {
  @ApiProperty()
  readinessStatus: string;

  @ApiProperty()
  databaseStatus: string;

  @ApiProperty()
  redisStatus: string;

  @ApiProperty()
  authStatus: string;

  @ApiProperty()
  billingStatus: string;

  @ApiProperty()
  trustVerificationStatus: string;

  @ApiProperty()
  malwareScanningStatus: string;

  @ApiProperty()
  outboxStatus: string;

  @ApiProperty()
  trustVerificationDue: number;

  @ApiProperty()
  trustVerificationFailed: number;

  @ApiProperty()
  malwareScanningDue: number;

  @ApiProperty()
  malwareScanningFailed: number;

  @ApiProperty()
  infectedLast24h: number;

  @ApiProperty()
  outboxPending: number;

  @ApiProperty()
  outboxDeadLetterRisk: number;
}

export class PlatformAdminDashboardSummaryDto {
  @ApiProperty()
  generatedAt: string;

  @ApiProperty({ type: PlatformAdminOrganizationTotalsDto })
  organizations: PlatformAdminOrganizationTotalsDto;

  @ApiProperty({ type: PlatformAdminUserTotalsDto })
  users: PlatformAdminUserTotalsDto;

  @ApiProperty()
  storageBytes: number;

  @ApiProperty()
  pendingMalwareScans: number;

  @ApiProperty()
  infectedDocuments: number;

  @ApiProperty({ type: PlatformAdminMonitoringSummaryDto })
  monitoring: PlatformAdminMonitoringSummaryDto;

  @ApiProperty({ type: [PlatformAdminDashboardAlertDto] })
  alerts: PlatformAdminDashboardAlertDto[];
}

export class PlatformAdminOrganizationOwnerDto {
  @ApiPropertyOptional()
  id?: string;

  @ApiProperty()
  fullName: string;

  @ApiPropertyOptional()
  emailMasked?: string | null;

  @ApiProperty()
  mfaEnabled: boolean;

  @ApiPropertyOptional()
  lastLoginAt?: string | null;
}

export class PlatformAdminOrganizationSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  status: string;

  @ApiProperty({ enum: SubscriptionPlan })
  subscriptionPlan: SubscriptionPlan;

  @ApiProperty({ enum: SubscriptionStatus })
  subscriptionStatus: SubscriptionStatus;

  @ApiProperty({ type: PlatformAdminOrganizationOwnerDto })
  owner: PlatformAdminOrganizationOwnerDto;

  @ApiProperty()
  usersCount: number;

  @ApiProperty()
  activeUsersCount: number;

  @ApiProperty()
  storageBytes: number;

  @ApiPropertyOptional()
  lastActivityAt?: string | null;

  @ApiProperty({ type: [String] })
  riskFlags: string[];

  @ApiProperty()
  createdAt: string;
}

export class PlatformAdminOrganizationListResponseDto {
  @ApiProperty({ type: [PlatformAdminOrganizationSummaryDto] })
  items: PlatformAdminOrganizationSummaryDto[];

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;
}

export class PlatformAdminOrganizationBillingDto {
  @ApiProperty({ enum: SubscriptionPlan })
  subscriptionPlan: SubscriptionPlan;

  @ApiProperty({ enum: SubscriptionStatus })
  subscriptionStatus: SubscriptionStatus;

  @ApiPropertyOptional()
  provider?: string | null;

  @ApiPropertyOptional()
  amountCents?: number | null;

  @ApiPropertyOptional()
  currency?: string | null;

  @ApiPropertyOptional()
  trialEndAt?: string | null;

  @ApiPropertyOptional()
  currentPeriodEndAt?: string | null;

  @ApiProperty()
  cancelAtPeriodEnd: boolean;

  @ApiPropertyOptional()
  lastSyncedAt?: string | null;
}

export class PlatformAdminOrganizationSecurityDto {
  @ApiProperty()
  organizationMfaRequired: boolean;

  @ApiProperty()
  ownerMfaEnabled: boolean;

  @ApiProperty()
  ownersWithoutMfa: number;

  @ApiProperty()
  mfaEnabledUsersCount: number;

  @ApiProperty()
  lockedUsersCount: number;

  @ApiProperty()
  suspendedUsersCount: number;
}

export class PlatformAdminOrganizationOpsDto {
  @ApiProperty()
  documentsCount: number;

  @ApiProperty()
  storageBytes: number;

  @ApiProperty()
  pendingMalwareScans: number;

  @ApiProperty()
  infectedDocuments: number;

  @ApiProperty()
  auditEntriesLast30d: number;

  @ApiPropertyOptional()
  lastActivityAt?: string | null;
}

export class PlatformAdminOrganizationDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  legalForm: string;

  @ApiPropertyOptional()
  city?: string | null;

  @ApiPropertyOptional()
  region?: string | null;

  @ApiProperty()
  country: string;

  @ApiPropertyOptional()
  customDomain?: string | null;

  @ApiPropertyOptional()
  organizationEmailMasked?: string | null;

  @ApiProperty()
  maxUsers: number;

  @ApiProperty()
  auditRetentionDays: number;

  @ApiProperty({ type: PlatformAdminOrganizationOwnerDto })
  owner: PlatformAdminOrganizationOwnerDto;

  @ApiProperty({ type: PlatformAdminOrganizationBillingDto })
  billing: PlatformAdminOrganizationBillingDto;

  @ApiProperty({ type: PlatformAdminOrganizationSecurityDto })
  security: PlatformAdminOrganizationSecurityDto;

  @ApiProperty({ type: PlatformAdminOrganizationOpsDto })
  ops: PlatformAdminOrganizationOpsDto;

  @ApiProperty({ type: [String] })
  riskFlags: string[];

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class PlatformAdminOrganizationUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiPropertyOptional()
  emailMasked?: string | null;

  @ApiProperty()
  role: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  mfaEnabled: boolean;

  @ApiProperty()
  emailVerified: boolean;

  @ApiPropertyOptional()
  lastLoginAt?: string | null;

  @ApiPropertyOptional()
  lockedUntil?: string | null;
}

export class PlatformAdminOrganizationsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: OrganizationStatus })
  @IsOptional()
  @IsEnum(OrganizationStatus)
  status?: OrganizationStatus;

  @ApiPropertyOptional({ enum: SubscriptionPlan })
  @IsOptional()
  @IsEnum(SubscriptionPlan)
  plan?: SubscriptionPlan;

  @ApiPropertyOptional({ enum: SubscriptionStatus })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  subscriptionStatus?: SubscriptionStatus;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 10;
}
