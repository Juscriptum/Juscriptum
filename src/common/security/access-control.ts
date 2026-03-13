import { ForbiddenException } from "@nestjs/common";
import { JwtPayload } from "../../auth/interfaces/jwt.interface";

export const DATA_ACCESS_SCOPES = ["private", "assigned", "tenant"] as const;

export type DataAccessScope = (typeof DATA_ACCESS_SCOPES)[number];

export interface AccessControlledRecord {
  accessScope?: DataAccessScope | null;
  createdBy?: string | null;
  assignedUserId?: string | null;
  assignedLawyerId?: string | null;
  uploadedBy?: string | null;
  signedBy?: string | null;
}

export function isElevatedTenantRole(role?: string): boolean {
  return ["super_admin", "organization_owner", "organization_admin"].includes(
    role ?? "",
  );
}

export function assertSameTenant(user: JwtPayload, tenantId: string): void {
  if (!user?.tenant_id || user.tenant_id !== tenantId) {
    throw new ForbiddenException("Невірний tenant context");
  }
}

export function assertCanAssignToUser(
  actor: JwtPayload,
  targetUserId?: string | null,
): void {
  if (!targetUserId || isElevatedTenantRole(actor.role)) {
    return;
  }

  if (targetUserId !== actor.user_id) {
    throw new ForbiddenException(
      "Ви не можете призначати записи іншому користувачу",
    );
  }
}

export function canAccessRecord(
  actor: JwtPayload,
  record: AccessControlledRecord,
): boolean {
  if (isElevatedTenantRole(actor.role)) {
    return true;
  }

  const scope = record.accessScope ?? "assigned";
  const relatedUserIds = [
    record.createdBy,
    record.assignedUserId,
    record.assignedLawyerId,
    record.uploadedBy,
    record.signedBy,
  ].filter(Boolean);

  if (scope === "tenant") {
    return true;
  }

  return relatedUserIds.includes(actor.user_id);
}

export function assertCanAccessRecord(
  actor: JwtPayload,
  record: AccessControlledRecord,
): void {
  if (!canAccessRecord(actor, record)) {
    throw new ForbiddenException(
      "Доступ до запису обмежено політикою ізоляції даних",
    );
  }
}

export function buildScopedQueryCondition(
  alias: string,
  actor?: JwtPayload,
  assignmentColumns: string[] = [],
): { clause: string; parameters: Record<string, string> } | null {
  if (!actor || isElevatedTenantRole(actor.role)) {
    return null;
  }

  const relatedColumns = [`${alias}.createdBy`, ...assignmentColumns].map(
    (column) => `${column} = :scopedUserId`,
  );

  return {
    clause: `(${alias}.accessScope = :tenantAccessScope OR ${relatedColumns.join(" OR ")})`,
    parameters: {
      scopedUserId: actor.user_id,
      tenantAccessScope: "tenant",
    },
  };
}
