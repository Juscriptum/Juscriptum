import api from "./api";
import { DashboardStats, DashboardStatsQuery } from "../types/dashboard.types";

/**
 * Dashboard Service
 */
export const dashboardService = {
  /**
   * Get dashboard statistics
   */
  async getStats(query?: DashboardStatsQuery): Promise<DashboardStats> {
    const params = new URLSearchParams();

    if (query?.days) {
      params.append("days", query.days.toString());
    }
    if (query?.startDate) {
      params.append("startDate", query.startDate.toISOString());
    }
    if (query?.endDate) {
      params.append("endDate", query.endDate.toISOString());
    }

    const queryString = params.toString();
    return api.get<DashboardStats>(
      `/dashboard/stats${queryString ? `?${queryString}` : ""}`,
    );
  },
};
