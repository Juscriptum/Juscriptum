import api from "./api";
import { AuditLogQuery, AuditLogResponse } from "../types/audit-log.types";

const buildParams = (query: AuditLogQuery) => {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  return params;
};

export const auditLogService = {
  async getLogs(query: AuditLogQuery = {}): Promise<AuditLogResponse> {
    const params = buildParams(query);
    const suffix = params.toString();
    return api.get<AuditLogResponse>(
      `/audit-logs${suffix ? `?${suffix}` : ""}`,
    );
  },
};

export default auditLogService;
