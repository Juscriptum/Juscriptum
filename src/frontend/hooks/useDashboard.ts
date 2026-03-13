import { useState, useEffect, useCallback } from "react";
import { dashboardService } from "../services/dashboard.service";
import { DashboardStats, DashboardStatsQuery } from "../types/dashboard.types";

/**
 * Use Dashboard Hook
 */
export const useDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch dashboard stats
   */
  const fetchStats = useCallback(async (query?: DashboardStatsQuery) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await dashboardService.getStats(query);
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Не вдалося отримати статистику");
      console.error("Dashboard stats error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh dashboard data
   */
  const refresh = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    fetchStats,
    refresh,
  };
};
