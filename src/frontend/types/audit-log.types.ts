export interface AuditLogItem {
  id: string;
  tenantId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  changedFields?: string[] | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogQuery {
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogResponse {
  data: AuditLogItem[];
  total: number;
  page: number;
  limit: number;
}
