/**
 * Dashboard Types
 * Type definitions for dashboard data structures
 */

export interface StatCard {
  label: string;
  value: number;
  change: number;
  trend: "up" | "down" | "neutral";
  icon: string;
}

export interface RecentCase {
  id: string;
  caseNumber: string;
  title: string;
  clientName: string;
  status: string;
  priority: string;
  nextHearingDate: string;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  type: string;
  eventDate: string;
  location: string;
  caseNumber: string;
}

export interface ActivityFeedItem {
  id: string;
  userName: string;
  action: string;
  entityType: string;
  entityDescription: string;
  timestamp: string;
}

export interface Task {
  id: string;
  title: string;
  type: "deadline" | "hearing" | "document" | "payment";
  dueDate: string;
  caseNumber: string;
  priority: string;
}

export interface RevenueDataPoint {
  date: string;
  amount: number;
  paidAmount: number;
}

export interface DashboardStats {
  stats: StatCard[];
  recentCases: RecentCase[];
  upcomingEvents: UpcomingEvent[];
  activityFeed: ActivityFeedItem[];
  pendingTasks: Task[];
  revenueData: RevenueDataPoint[];
}

export interface DashboardStatsQuery {
  days?: number;
  startDate?: Date;
  endDate?: Date;
}
